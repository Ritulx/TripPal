import axiosClient from './axiosClient';

export const getCategories = () =>
  axiosClient.get('/categories').then((res) => res.data);