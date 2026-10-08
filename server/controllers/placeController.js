const mongoose = require('mongoose');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Place, Category, SearchQuery, LocalTip, Review } = require('../models');
const { ensureAreaIngested } = require('../services/placeCacheService');
const { kmToMeters } = require('../utils/geoUtils');
const { getPlaceSignals } = require('../services/reviewAggregationService');
const { computeLocalScore } = require('../services/scoringService');
const { searchLocations: geocodeAutocomplete } = require('../services/geocodingService');



/**
 * @route   GET /api/places/search?lat=&lng=&radiusKm=&category=&keyword=&refresh=
 * @access  Public
 */
const searchNearby = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm);
  const { category, keyword, refresh } = req.query;
  const trimmedKeyword = keyword && keyword.trim() ? keyword.trim() : null;

  let categorySlug = null;
  if (category) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) throw new AppError('Category not found', 404);
    categorySlug = categoryDoc.slug;
  }

  const ingestionResult = await ensureAreaIngested({
    lat,
    lng,
    radiusKm,
    categorySlug,
    forceRefresh: refresh === 'true' || refresh === true,
  });

  const matchStage = { isActive: true };
  if (category) matchStage.category = new mongoose.Types.ObjectId(category);
  // NOTE: We do NOT filter by keyword here — keyword matching is done in a
  // post-filter step below so that tips whose text contains the keyword also
  // surface the place (even if the keyword isn't yet in aggregatedTags).

  const geoPlaces = await Place.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: kmToMeters(radiusKm),
        spherical: true,
        query: matchStage,
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
      },
    },
    { $limit: 150 },
    {
      $project: {
        name: 1,
        address: 1,
        location: 1,
        avgRating: 1,
        reviewCount: 1,
        aggregatedTags: 1,
        source: 1,
        distanceKm: 1,
        category: { _id: 1, name: 1, slug: 1, icon: 1 },
      },
    },
  ]);

  let geoResults = geoPlaces;

  // Keyword post-filter: keep places where the keyword appears in name,
  // aggregatedTags, OR in any approved local tip's text for that place.
  // This ensures tips written before auto-tagging still make their place
  // discoverable (e.g. searching "buldak" finds a place whose tip mentions it).
  // matchedSnippetsByPlace: Map<placeId string, Array<{type,author,text}>>
  const matchedSnippetsByPlace = new Map();

  if (trimmedKeyword) {
    const safeKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const kwRegex = new RegExp(safeKeyword, 'i');
    const tipPlaceIds = geoPlaces.map((p) => p._id);

    // --- Tips matching the keyword ---
    const matchingTips = await LocalTip.find(
      { place: { $in: tipPlaceIds }, status: 'approved', tipText: { $regex: safeKeyword, $options: 'i' } },
      { place: 1, tipText: 1, local: 1 }
    )
      .populate('local', 'name')
      .lean();

    const placeIdsWithMatchingTip = new Set(matchingTips.map((t) => t.place.toString()));
    matchingTips.forEach((tip) => {
      const key = tip.place.toString();
      if (!matchedSnippetsByPlace.has(key)) matchedSnippetsByPlace.set(key, []);
      const snippets = matchedSnippetsByPlace.get(key);
      if (snippets.length < 2) {
        snippets.push({
          type: 'tip',
          author: tip.local?.name || 'A local',
          text: tip.tipText,
        });
      }
    });

    // --- Reviews matching the keyword (fill remaining slots up to 2 per place) ---
    const matchingReviews = await Review.find(
      { place: { $in: tipPlaceIds }, text: { $regex: safeKeyword, $options: 'i' } },
      { place: 1, text: 1, user: 1, authorName: 1 }
    )
      .populate('user', 'name')
      .lean();

    const placeIdsWithMatchingReview = new Set(matchingReviews.map((r) => r.place.toString()));
    matchingReviews.forEach((rev) => {
      const key = rev.place.toString();
      if (!matchedSnippetsByPlace.has(key)) matchedSnippetsByPlace.set(key, []);
      const snippets = matchedSnippetsByPlace.get(key);
      if (snippets.length < 2) {
        snippets.push({
          type: 'review',
          author: rev.user?.name || rev.authorName || 'A visitor',
          text: rev.text,
        });
      }
    });

    geoResults = geoPlaces.filter(
      (p) =>
        kwRegex.test(p.name) ||
        (p.aggregatedTags || []).some((tag) => kwRegex.test(tag)) ||
        placeIdsWithMatchingTip.has(p._id.toString()) ||
        placeIdsWithMatchingReview.has(p._id.toString())
    );
  }

  if (geoResults.length === 0) {
    res.status(200).json({
      success: true,
      count: 0,
      dataSource: {
        fromCache: ingestionResult.fromCache,
        newlyIngested: ingestionResult.placesIngested,
        warning: ingestionResult.error,
      },
      places: [],
    });
    return;
  }

  const placeIds = geoResults.map((p) => p._id);
  const signals = await getPlaceSignals(placeIds, trimmedKeyword);

  const scoredPlaces = geoResults.map((place) => {
    const sig = signals[place._id.toString()] || {
      totalReviews: 0,
      positiveMatchedReviews: 0,
      totalTips: 0,
    };

    const localScore = computeLocalScore(place.avgRating, place.reviewCount);

    return {
      ...place,
      score: {
        localScore,
        keywordMatchedReviews: sig.positiveMatchedReviews,
        totalTips: sig.totalTips,
      },
      matchedSnippets: matchedSnippetsByPlace.get(place._id.toString()) || [],
    };
  });

  scoredPlaces.sort((a, b) => {
    if (b.score.localScore !== a.score.localScore) return b.score.localScore - a.score.localScore;
    return a.distanceKm - b.distanceKm;
  });

  const finalPlaces = scoredPlaces.slice(0, 60);

  await SearchQuery.create({
    user: req.user?._id || null,
    radius: radiusKm,
    keyword: trimmedKeyword || '',
    category: category || null,
    location: { type: 'Point', coordinates: [lng, lat] },
    resultCount: finalPlaces.length,
  });

  res.status(200).json({
    success: true,
    count: finalPlaces.length,
    dataSource: {
      fromCache: ingestionResult.fromCache,
      newlyIngested: ingestionResult.placesIngested,
      warning: ingestionResult.error,
    },
    places: finalPlaces,
  });
});

const getPlaceById = asyncHandler(async (req, res) => {
  const place = await Place.findOne({ _id: req.params.id, isActive: true }).populate(
    'category',
    'name slug icon'
  );
  if (!place) throw new AppError('Place not found', 404);

  res.status(200).json({ success: true, place });
});

const getScoreBreakdown = asyncHandler(async (req, res) => {
  const place = await Place.findOne({ _id: req.params.id, isActive: true });
  if (!place) throw new AppError('Place not found', 404);

  const localScore = computeLocalScore(place.avgRating, place.reviewCount);

  res.status(200).json({
    success: true,
    place: { id: place._id, name: place.name },
    variables: {
      avgRating: place.avgRating || 0,
      reviewCount: place.reviewCount || 0,
      reviewAnchor: 10,
    },
    results: {
      localScore,
    },
  });
});

/**
 * @route   GET /api/places/geocode/search?text=
 * @access  Public
 * Thin proxy to Geoapify Autocomplete, used by the frontend's location
 * search bar so visitors can type-and-select instead of click-dropping a pin.
 */
const searchLocations = asyncHandler(async (req, res) => {
  const { text } = req.query;
  const results = await geocodeAutocomplete(text);
  res.status(200).json({ success: true, results });
});

module.exports = { searchNearby, getPlaceById, getScoreBreakdown, searchLocations };