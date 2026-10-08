import axiosClient from './axiosClient';

export const getSystemStats = () => axiosClient.get('/admin/system/stats').then((r) => r.data);

export const getFlaggedTips = (status = 'flagged') =>
  axiosClient.get('/admin/tips', { params: { status } }).then((r) => r.data);

export const moderateTip = (id, action) =>
  axiosClient.patch(`/admin/tips/${id}/moderate`, { action }).then((r) => r.data);

export const getSuspiciousReviews = () =>
  axiosClient.get('/admin/reviews/flagged').then((r) => r.data);

export const purgeReview = (id) => axiosClient.delete(`/admin/reviews/${id}`).then((r) => r.data);

export const getAllCategoriesAdmin = () =>
  axiosClient.get('/admin/categories').then((r) => r.data);

export const createCategory = (payload) =>
  axiosClient.post('/admin/categories', payload).then((r) => r.data);

export const updateCategory = (id, payload) =>
  axiosClient.patch(`/admin/categories/${id}`, payload).then((r) => r.data);

export const getPendingLocalAreas = () =>
  axiosClient.get('/admin/users/pending-local-areas').then((r) => r.data);

export const verifyLocalArea = (userId, areaId) =>
  axiosClient.patch(`/admin/users/${userId}/local-areas/${areaId}/verify`).then((r) => r.data);

export const rejectLocalArea = (userId, areaId) =>
  axiosClient.patch(`/admin/users/${userId}/local-areas/${areaId}/reject`).then((r) => r.data);

export const deactivateUser = (id) =>
  axiosClient.patch(`/admin/users/${id}/deactivate`).then((r) => r.data);