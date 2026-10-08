import axiosClient from './axiosClient';

export const getReplies = (tipId) =>
  axiosClient.get(`/tips/${tipId}/replies`).then((res) => res.data);

export const createReply = (tipId, text) =>
  axiosClient.post(`/tips/${tipId}/replies`, { text }).then((res) => res.data);

export const deleteReply = (tipId, replyId) =>
  axiosClient.delete(`/tips/${tipId}/replies/${replyId}`).then((res) => res.data);

export const voteReply = (tipId, replyId, direction) =>
  axiosClient
    .patch(`/tips/${tipId}/replies/${replyId}/vote`, { direction })
    .then((res) => res.data);
