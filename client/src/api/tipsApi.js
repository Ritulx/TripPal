import axiosClient from './axiosClient';

export const createTip = (payload) =>
  axiosClient.post('/tips', payload).then((res) => res.data);

export const getTipsForPlace = (placeId) =>
  axiosClient.get(`/tips/place/${placeId}`).then((res) => res.data);

export const voteTip = (id, direction) =>
  axiosClient.patch(`/tips/${id}/vote`, { direction }).then((res) => res.data);

export const flagTip = (id) =>
  axiosClient.patch(`/tips/${id}/flag`).then((res) => res.data);

export const deleteTip = (id) =>
  axiosClient.delete(`/tips/${id}`).then((res) => res.data);

export const getMyTips = () =>
  axiosClient.get('/tips/mine').then((res) => res.data);