import api from "./api.js";

export const analyticsService = {
  // Get analytics for the current user
  getAnalytics: async () => {
    const response = await api.get(`/analytics/get-analytics`);
    return response.data;
  },
}; 