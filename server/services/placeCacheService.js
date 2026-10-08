const { PlaceCache } = require('../models');
const { buildCacheKey, kmToMeters } = require('../utils/geoUtils');
const { ingestPlaces } = require('./geoapifyPlacesService');

const CACHE_TTL_DAYS = 7; // matches SRS §8.3 Mitigation for R-01 (adapted to Mongo TTL, no Redis needed)

const ensureAreaIngested = async ({ lat, lng, radiusKm, categorySlug, forceRefresh = false }) => {
  const { cacheKey, gridLat, gridLng, radiusBucketKm } = buildCacheKey({
    lat,
    lng,
    radiusKm,
    categorySlug: categorySlug || 'all',
  });

  if (!forceRefresh) {
    const existingCache = await PlaceCache.findOne({ cacheKey });
    if (existingCache) {
      return { fromCache: true, placesIngested: existingCache.placesIngested, error: null };
    }
  }

  if (!process.env.GEOAPIFY_API_KEY) {
    // Graceful degradation per SRS Risk R-03 — no key configured, rely on
    // whatever is already in the local database (manual/crowdsourced places).
    return {
      fromCache: false,
      placesIngested: 0,
      error: 'GEOAPIFY_API_KEY not configured — showing local/crowdsourced results only',
    };
  }

  try {
    const placesIngested = await ingestPlaces({
      lat,
      lng,
      radiusMeters: kmToMeters(radiusBucketKm),
      categorySlug,
    });

    await PlaceCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        gridLat,
        gridLng,
        radiusBucketKm,
        categorySlug: categorySlug || 'all',
        placesIngested,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
      { upsert: true }
    );

    return { fromCache: false, placesIngested, error: null };
  } catch (err) {
    console.error(`[PlaceCacheService] Geoapify ingestion failed: ${err.message}`);
    return {
      fromCache: false,
      placesIngested: 0,
      error: `Live data fetch failed — showing local/crowdsourced results only (${err.message})`,
    };
  }
};

module.exports = { ensureAreaIngested, CACHE_TTL_DAYS };