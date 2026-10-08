import axiosClient from './axiosClient';

export const registerUser = (payload) =>
  axiosClient.post('/auth/register', payload).then((res) => res.data);

export const loginUser = (payload) =>
  axiosClient.post('/auth/login', payload).then((res) => res.data);

export const getCurrentUser = () =>
  axiosClient.get('/auth/me').then((res) => res.data);

export const updatePreferences = (preferences) =>
  axiosClient.patch('/auth/preferences', { preferences }).then((res) => res.data);

export const updateHomeLocation = (coordinates) =>
  axiosClient.patch('/auth/home-location', { coordinates }).then((res) => res.data);

export const getSearchHistory = () =>
  axiosClient.get('/auth/search-history').then((res) => res.data);

export const addLocalArea = (payload) =>
  axiosClient.post('/auth/local-areas', payload).then((res) => res.data);

export const removeLocalArea = (areaId) =>
  axiosClient.delete(`/auth/local-areas/${areaId}`).then((res) => res.data);