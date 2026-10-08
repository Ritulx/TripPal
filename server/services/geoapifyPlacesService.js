const axios = require('axios');
const { Place, Category } = require('../models');

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const PLACES_URL = 'https://api.geoapify.com/v2/places';

// Maps our internal Category slugs to Geoapify's official category strings
// (verified against https://apidocs.geoapify.com/docs/places/ supported categories).
const CATEGORY_GEOAPIFY_MAP = {
  restaurants: 'catering.restaurant',
  grocery: 'commercial.supermarket',
  barbers: 'service.beauty.hairdresser',
  florists: 'commercial.florist',
  hardware: 'commercial.houseware_and_hardware.hardware_and_tools',
  bakeries: 'commercial.food_and_drink.bakery',
};

const buildAddress = (props = {}) => {
  return props.formatted || props.address_line2 || props.address_line1 || '';
};

/** Given a feature's `categories` array, finds which internal slug it maps to. */
const resolveSlugFromFeature = (featureCategories = [], fallbackSlug) => {
  const matched = featureCategories.find((c) => Object.values(CATEGORY_GEOAPIFY_MAP).includes(c));
  if (matched) {
    return Object.keys(CATEGORY_GEOAPIFY_MAP).find((s) => CATEGORY_GEOAPIFY_MAP[s] === matched);
  }
  return fallbackSlug || null;
};

/**
 * Main ingestion entrypoint — pulls places from Geoapify's Places API within
 * a radius, for either one category or all mapped categories combined into
 * a single comma-separated request (Geoapify supports multi-category queries
 * natively), and upserts them into our Place collection. Paginates up to
 * maxPages * pageSize results to stay comfortably within the free daily quota.
 */
const ingestPlaces = async ({ lat, lng, radiusMeters, categorySlug }) => {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('GEOAPIFY_API_KEY is not configured');
  }

  const slugsToFetch = categorySlug ? [categorySlug] : Object.keys(CATEGORY_GEOAPIFY_MAP);
  const geoapifyCategories = slugsToFetch
    .map((slug) => CATEGORY_GEOAPIFY_MAP[slug])
    .filter(Boolean)
    .join(',');

  if (!geoapifyCategories) return 0;

  const r = Math.min(radiusMeters, 40000); // 40km hard cap per SRS 3.5
  const categoryCache = {};
  const pageSize = 100;
  const maxPages = 3; // caps a single search at 300 places ingested, well within quota

  let totalIngested = 0;
  let offset = 0;

  for (let page = 0; page < maxPages; page++) {
    let data;
    try {
      const { data: resData } = await axios.get(PLACES_URL, {
        params: {
          categories: geoapifyCategories,
          filter: `circle:${lng},${lat},${r}`,
          limit: pageSize,
          offset,
          apiKey: GEOAPIFY_API_KEY,
        },
        timeout: 20000,
      });
      data = resData;
    } catch (err) {
      console.error(`[Geoapify] Request failed: ${err.response?.status || ''} ${err.message}`);
      break; // stop paginating on error, but keep whatever we already ingested
    }

    const features = data.features || [];
    if (features.length === 0) break;

    for (const feature of features) {
      const props = feature.properties || {};
      if (!props.name || !props.place_id) continue;

      const slug = resolveSlugFromFeature(props.categories, categorySlug);
      if (!slug) continue;

      let categoryId = categoryCache[slug];
      if (!categoryId) {
        const categoryDoc = await Category.findOne({ slug });
        if (!categoryDoc) continue;
        categoryId = categoryDoc._id;
        categoryCache[slug] = categoryId;
      }

      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length !== 2) continue;

      await Place.findOneAndUpdate(
        { externalId: props.place_id },
        {
          name: props.name,
          category: categoryId,
          address: buildAddress(props),
          location: { type: 'Point', coordinates: coords },
          source: 'geoapify',
          externalId: props.place_id,
          phone: props.contact?.phone || '',
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      totalIngested += 1;
    }

    if (features.length < pageSize) break; // last page reached
    offset += pageSize;
  }

  return totalIngested;
};

module.exports = { ingestPlaces, CATEGORY_GEOAPIFY_MAP };