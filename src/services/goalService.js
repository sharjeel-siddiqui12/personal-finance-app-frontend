import api from './api';

export const goalsApi = {
  getGoals: () => api.get('/goals'),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (data) => api.post('/goals', data),
  updateGoal: (id, data) => api.put(`/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  allocateToGoal: (data) => api.post('/goals/allocate', data)
};