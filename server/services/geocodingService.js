const axios = require('axios');

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';

/**
 * Server-side proxy to Geoapify's Geocoding Autocomplete API. This MUST stay
 * server-side — calling it directly from the frontend would bundle
 * GEOAPIFY_API_KEY into client-side JS, exactly what Step 15's production
 * checklist warned against.
 */
const searchLocations = async (text) => {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('GEOAPIFY_API_KEY is not configured');
  }
  if (!text || text.trim().length < 3) {
    return [];
  }

  const { data } = await axios.get(AUTOCOMPLETE_URL, {
    params: {
      text: text.trim(),
      format: 'json',
      limit: 6,
      apiKey: GEOAPIFY_API_KEY,
    },
    timeout: 10000,
  });

  const rows = data.results || [];
  return rows
    .filter((r) => r.lat && r.lon)
    .map((r) => ({
      placeId: r.place_id,
      formatted: r.formatted,
      lat: r.lat,
      lng: r.lon,
    }));
};

module.exports = { searchLocations };