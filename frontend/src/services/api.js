import axios from "axios";
import { getToken } from "../utils/token";

const api = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// If the session token is rejected, tell the app so it can sign the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const sentToken = !!error?.config?.headers?.Authorization;
    if (status === 401 && sentToken && !error.config.url?.includes("/verify-password/")) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
