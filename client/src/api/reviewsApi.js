import axiosClient from './axiosClient';

export const createReview = (payload) =>
  axiosClient.post('/reviews', payload).then((res) => res.data);

export const getReviewsForPlace = (placeId, page = 1) =>
  axiosClient
    .get(`/reviews/place/${placeId}`, { params: { page } })
    .then((res) => res.data);

export const updateReview = (id, payload) =>
  axiosClient.patch(`/reviews/${id}`, payload).then((res) => res.data);

export const deleteReview = (id) =>
  axiosClient.delete(`/reviews/${id}`).then((res) => res.data);

export const getMyReviews = () =>
  axiosClient.get('/reviews/mine').then((res) => res.data);