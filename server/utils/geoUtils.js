const EARTH_RADIUS_KM = 6378.1;

/** Converts kilometers to radians — needed for $centerSphere-style queries. */
const kmToRadians = (km) => km / EARTH_RADIUS_KM;

/** Converts kilometers to meters — needed for $geoNear maxDistance / Google API radius params. */
const kmToMeters = (km) => km * 1000;

/**
 * Haversine great-circle distance between two [lng, lat] points, in km.
 * Used as a fallback/manual distance check outside of aggregation pipelines.
 */
const haversineDistanceKm = ([lng1, lat1], [lng2, lat2]) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Rounds a coordinate to a grid cell roughly `stepKm` wide, used to build
 * cache keys so nearby searches share a cache entry instead of each
 * triggering a separate Google API call.
 */
const roundToGrid = (value, stepDeg = 0.045) => {
  return Math.round(value / stepDeg) * stepDeg;
};

/** Rounds a radius up to the nearest 5km bucket (5, 10, 15 ... 40) for cache-key stability. */
const bucketRadius = (radiusKm) => {
  return Math.min(40, Math.ceil(radiusKm / 5) * 5);
};

/**
 * Builds a deterministic cache key from a search's rough location + radius + category.
 */
const buildCacheKey = ({ lat, lng, radiusKm, categorySlug = 'all' }) => {
  const gridLat = roundToGrid(lat);
  const gridLng = roundToGrid(lng);
  const bucket = bucketRadius(radiusKm);
  return {
    cacheKey: `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}_${bucket}_${categorySlug}`,
    gridLat,
    gridLng,
    radiusBucketKm: bucket,
  };
};

module.exports = {
  kmToRadians,
  kmToMeters,
  haversineDistanceKm,
  roundToGrid,
  bucketRadius,
  buildCacheKey,
};