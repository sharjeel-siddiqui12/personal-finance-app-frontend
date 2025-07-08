import React, { createContext, useState, useEffect, useContext } from "react";
import {
  login as authServiceLogin,
  register as authServiceRegister,
  getCurrentUser as authServiceGetCurrentUser,
  refreshToken as authServiceRefreshToken,
  // logout as authServiceLogout, // If you have a backend logout
} from "../services/authService"; // Ensure this path is correct

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizeUserObject = (userObj) => {
    if (!userObj) return null;

    const normalized = { ...userObj }; // Create a new object to avoid mutating the original

    // Normalize Role
    let roleValue = normalized.role || normalized.ROLE;
    if (typeof roleValue === "string") {
      normalized.role = roleValue.toLowerCase();
      if (
        normalized.ROLE &&
        normalized.role !== normalized.ROLE.toLowerCase()
      ) {
        delete normalized.ROLE;
      }
    } else {
      console.warn(
        "[AuthContext] User object role is missing or not a string:",
        userObj
      );
      // normalized.role = 'user'; // Optionally default if role is critical and missing
    }

    // Normalize ID
    let idValue = normalized.id || normalized.USER_ID || normalized.user_id;
    if (idValue !== undefined) {
      normalized.id = idValue; // Standardize to 'id'
      if (
        normalized.USER_ID &&
        String(normalized.id) !== String(normalized.USER_ID)
      )
        delete normalized.USER_ID;
      if (
        normalized.user_id &&
        String(normalized.id) !== String(normalized.user_id)
      )
        delete normalized.user_id;
    } else {
      console.warn("[AuthContext] User object ID is missing:", userObj);
    }

    // Normalize Username/Name
    let nameValue =
      normalized.name || normalized.USERNAME || normalized.username;
    if (typeof nameValue === "string") {
      normalized.name = nameValue; // Standardize to 'name'
      if (normalized.USERNAME && normalized.name !== normalized.USERNAME)
        delete normalized.USERNAME;
      if (normalized.username && normalized.name !== normalized.username)
        delete normalized.username;
    } else {
      console.warn(
        "[AuthContext] User object name/username is missing or not a string:",
        userObj
      );
    }
    // Ensure email is present
    if (!normalized.email && normalized.EMAIL) {
      normalized.email = normalized.EMAIL;
      if (normalized.EMAIL) delete normalized.EMAIL;
    }

    console.log("[AuthContext] Normalized User Object:", normalized);
    return normalized;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("[AuthContext] Initializing auth...");
      setLoading(true); // Ensure loading is true at the start
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Basic token expiry check (client-side)
          const tokenParts = token.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expirationTime = payload.exp * 1000;
            if (Date.now() >= expirationTime) {
              console.log(
                "[AuthContext] Token expired on client, attempting refresh."
              );
              // Attempt refresh or clear session
              await attemptRefreshToken(); // Renamed for clarity
            } else {
              console.log(
                "[AuthContext] Token seems valid, fetching current user for initialization."
              );
              let user = await authServiceGetCurrentUser();
              setCurrentUser(normalizeUserObject(user));
            }
          } else {
            console.warn(
              "[AuthContext] Invalid token format found in localStorage."
            );
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setCurrentUser(null);
          }
        } else {
          console.log("[AuthContext] No token found during initialization.");
          setCurrentUser(null); // Explicitly set to null if no token
        }
      } catch (error) {
        console.error("[AuthContext] Error during auth initialization:", error);
        // If getCurrentUser fails (e.g. 401), it might throw.
        // This could also be a place to attempt token refresh if error indicates token expiry.
        if (
          error.response &&
          error.response.status === 401 &&
          localStorage.getItem("refreshToken")
        ) {
          console.log(
            "[AuthContext] Attempting refresh due to 401 on initial user fetch."
          );
          await attemptRefreshToken();
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const attemptRefreshToken = async () => {
    console.log("[AuthContext] Attempting to refresh token...");
    const refreshTokenValue = localStorage.getItem("refreshToken");
    if (!refreshTokenValue) {
      console.log(
        "[AuthContext] No refresh token available for refresh attempt."
      );
      localStorage.removeItem("token"); // Clear main token too
      setCurrentUser(null);
      return;
    }
    try {
      const response = await authServiceRefreshToken(refreshTokenValue);
      localStorage.setItem("token", response.token);
      // After refreshing token, fetch the user details again
      let user = await authServiceGetCurrentUser();
      setCurrentUser(normalizeUserObject(user));
      console.log("[AuthContext] Token refreshed, user set.");
    } catch (error) {
      console.error("[AuthContext] Failed to refresh token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setCurrentUser(null);
    }
  };

  const handleLogin = async (email, password) => {
    console.log("[AuthContext] Attempting login...");
    try {
      setError("");
      const response = await authServiceLogin(email, password);
      localStorage.setItem("token", response.token);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      // response.user from AuthController login is already mostly normalized (role is lowercase)
      // but we run it through normalizeUserObject for full consistency (e.g. for ID, name)
      setCurrentUser(normalizeUserObject(response.user));
      console.log("[AuthContext] Login successful.");
      return response.user; // Return original response.user or normalized one? For consistency, maybe normalized.
    } catch (error) {
      console.error("[AuthContext] Login failed:", error);
      setError(error.message || "Failed to log in");
      throw error;
    }
  };

  const handleRegister = async (userData) => {
    console.log("[AuthContext] Attempting registration...");
    try {
      setError("");
      const response = await authServiceRegister(userData);
      localStorage.setItem("token", response.token);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      // response.user from AuthController register is already mostly normalized
      setCurrentUser(normalizeUserObject(response.user));
      console.log("[AuthContext] Registration successful.");
      return response.user;
    } catch (error) {
      console.error("[AuthContext] Registration failed:", error);
      setError(error.message || "Failed to register");
      throw error;
    }
  };

  const handleLogout = () => {
    console.log("[AuthContext] Logging out...");
    // await authServiceLogout(); // If you have a backend logout
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
