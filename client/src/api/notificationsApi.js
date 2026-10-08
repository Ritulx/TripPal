import axiosClient from './axiosClient';

export const getNotifications = () =>
  axiosClient.get('/notifications').then((res) => res.data);

export const markNotificationRead = (id) =>
  axiosClient.patch(`/notifications/${id}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  axiosClient.patch('/notifications/read-all').then((res) => res.data);
