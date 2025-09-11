import api from './api';

export const decisionService = {
  // Create a new decision
  createDecision: async (decisionData) => {
    const response = await api.post('/decisions', decisionData);
    return response.data;
  },

  // Get user's decisions
  getMyDecisions: async (params = {}) => {
    const response = await api.get('/decisions/my', { params });
    return response.data;
  },

  // Get public decisions
  getPublicDecisions: async (params = {}) => {
    const response = await api.get('/decisions/public', { params });
    return response.data;
  },

  // Get single decision
  getDecision: async (id) => {
    const response = await api.get(`/decisions/${id}`);
    return response.data;
  },

  // Update decision
  updateDecision: async (id, updateData) => {
    const response = await api.post(`/decisions/${id}`, updateData);
    return response.data;
  },

  // Delete decision
  deleteDecision: async (id) => {
    const response = await api.delete(`/decisions/${id}`);
    return response.data;
  },

  // Like/unlike decision
  toggleLike: async (id) => {
    const response = await api.post(`/decisions/${id}/like`);
    return response.data;
  },

  // Add comment
  addComment: async (id, comment) => {
    const response = await api.post(`/decisions/${id}/comment`, { text: comment });
    return response.data;
  },

  // Enable poll
  enablePoll: async (id) => {
    const response = await api.put(`/decisions/${id}/poll/enable`);
    return response.data;
  },

  // Vote on poll
 votePoll: async (decisionId, optionId) => {
    const response = await api.post(`/decisions/${decisionId}/poll/vote`, { optionId });
    return response.data;
  },
  // Get decision analytics
  getAnalytics: async (userId) => {
    const response = await api.get(`/decisions/analytics/${userId}`);
    return response.data;
  },

  // Get decisions for review
  getReviewDecisions: async (params = {}) => {
    const response = await api.get('/decisions/review', { params });
    return response.data;
  },
};