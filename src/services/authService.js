import api from "./api";

export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Registration failed";
    throw new Error(errorMessage);
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Login failed";
    throw new Error(errorMessage);
  }
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me"); // Assuming 'api' is your axios instance
    if (response.data && response.data.success) {
      return response.data.data; // This should be the user object with { USER_ID, USERNAME, ROLE, ... }
    }
    throw new Error("Failed to get current user or unsuccessful response");
  } catch (error) {
    console.error("Error in authService.getCurrentUser:", error);
    throw error; // Re-throw to be caught by AuthContext
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post("/auth/refresh-token", { refreshToken });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Token refresh failed";
    throw new Error(errorMessage);
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Request failed";
    throw new Error(errorMessage);
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Password reset failed";
    throw new Error(errorMessage);
  }
};
