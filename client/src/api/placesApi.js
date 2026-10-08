import axiosClient from './axiosClient';

export const searchNearbyPlaces = ({ lat, lng, radiusKm, category, keyword, refresh }) =>
  axiosClient
    .get('/places/search', {
      params: { lat, lng, radiusKm, category, keyword, refresh },
    })
    .then((res) => res.data);

export const getPlaceById = (id) =>
  axiosClient.get(`/places/${id}`).then((res) => res.data);

export const getScoreBreakdown = (id, keyword) =>
  axiosClient
    .get(`/places/${id}/score-breakdown`, { params: { keyword } })
    .then((res) => res.data);

export const searchLocations = (text) =>
  axiosClient.get('/places/geocode/search', { params: { text } }).then((res) => res.data);