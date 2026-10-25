import api from "./api";

export const createShortUrlFree = (data) => api.post("/shorten-free", data);
export const createShortUrl = (data) => api.post("/shorten", data);

export const getUserUrls = () => api.get("/codes");
export const getOverview = () => api.get("/stats");
export const updateUrl = (id, data) => api.patch(`/${id}`, data);
export const deleteUrl = (id) => api.delete(`/${id}`);

export const getUrlAnalytics = (id, days = 30) => api.get(`/${id}/analytics`, { params: { days } });
export const exportClicksCsv = (id) => api.get(`/${id}/export`, { responseType: "blob" });

export const checkAlias = (code, signal) => api.get(`/check-alias/${encodeURIComponent(code)}`, { signal });

export const verifyPassword = (shortCode, data) => api.post(`/verify-password/${shortCode}`, data);
