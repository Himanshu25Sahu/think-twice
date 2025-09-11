import api from './api';

export const userService = {
  // Get user profile
  getMyProfile: async () => {
    const response = await api.get('/user/my-profile');
    return response.data;
  },

  // Update user profile

};