import axiosClient from './axiosClient';

export const getQueries = (placeId) =>
  axiosClient.get(`/queries/place/${placeId}`).then((res) => res.data);

export const createQuery = (placeId, text) =>
  axiosClient.post(`/queries/place/${placeId}`, { text }).then((res) => res.data);

export const replyToQuery = (queryId, text) =>
  axiosClient.post(`/queries/${queryId}/replies`, { text }).then((res) => res.data);

export const deleteQuery = (queryId) =>
  axiosClient.delete(`/queries/${queryId}`).then((res) => res.data);
