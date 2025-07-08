import axios from "axios";
export { goalsApi } from "./goalService.js";

const API_URL = "/api";

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not retried already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          // Attempt to refresh the token
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem("token", token);

          // Retry the original request with the new token
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout the user
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Transaction API
export const transactionsApi = {
  getAll: (params) => api.get("/transactions", { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post("/transactions", data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  delete: (id, options = {}) => {
    return api.delete(`/categories/${id}`, options);
  },
};

// Budgets API
export const budgetsApi = {
  getAll: () => api.get("/budgets"),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post("/budgets", data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Reports API
export const reportsApi = {
  getMonthly: (month, year) =>
    api.get("/reports/monthly", { params: { month, year } }),
  getByDateRange: (startDate, endDate) =>
    api.get("/reports/range", { params: { startDate, endDate } }),
  downloadPdf: (startDate, endDate) =>
    api.get("/reports/download/pdf", {
      params: { startDate, endDate },
      responseType: "blob",
    }),
  downloadCsv: (startDate, endDate) =>
    api.get("/reports/download/csv", {
      params: { startDate, endDate },
      responseType: "blob",
    }),
};

// User API
export const usersApi = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data) => api.put("/users/me", data),
  changePassword: (data) => api.put("/users/password", data),
  // Admin only
  getAllUsers: () => api.get("/users"), // Changed from /admin/users
  getUserById: (id) => api.get(`/users/${id}`), // Changed from /admin/users/:id
  // For updating user role as used in AdminPanel.jsx
  updateUserRole: (id, roleData) => api.put(`/users/${id}/role`, roleData), // More specific for role
  deleteUser: (id) => api.delete(`/users/${id}`), // Changed from /admin/users/:id
  // If you have a generic admin update for other user fields, ensure backend route exists
  // For now, AdminPanel.jsx uses updateUser for role changes, so updateUserRole is more accurate.
  // If AdminPanel.jsx's usersApi.updateUser is solely for roles, you might rename it there too.
  // Or, if usersApi.updateUser is intended for more general updates by admin,
  // ensure a PUT /api/users/:id route exists in backend for admins.
  // For now, assuming AdminPanel's use of usersApi.updateUser is for role:
  updateUser: (id, data) => {
    if (data && typeof data.role !== "undefined") {
      return api.put(`/users/${id}/role`, { role: data.role });
    }
    // Handle other types of user updates by admin if necessary,
    // ensuring backend has a corresponding PUT /users/:id endpoint for admins.
    // For now, this will only handle role updates based on AdminPanel.jsx usage.
    console.warn(
      "usersApi.updateUser called without role, ensure backend supports general update or use updateUserRole for roles."
    );
    // Fallback to a general update path if you have one, otherwise this might error or do nothing.
    return api.put(`/users/${id}`, data); // This path needs a corresponding admin route in backend if used for general updates
  },
};

// Dashboard API
// Add these methods to your dashboardApi object if they don't already exist

// Fix the dashboard API endpoints by removing the duplicate /api prefix
export const dashboardApi = {
  getSummary: () => api.get("/dashboard/summary"),
  getIncomeVsExpense: () => api.get("/dashboard/income-vs-expense"),
  getSpendingByCategory: () => api.get("/dashboard/spending-by-category"),
  getTrends: () => api.get("/dashboard/trends"),
  // If you need the admin stats endpoint:
  getStats: () => api.get("/transactions/admin/stats"), // Changed from /dashboard/stats
  getBudgetVsActual: () => api.get("/budgets/vs-actual"),
};

export default api;
