import api from "./api";

export const loginUser = (data) => api.post("/user/login", data);
export const registerUser = (data) => api.post("/user/signup", data);
export const verifyEmail = (data) => api.post("/user/verify-email", data);
export const resendOtp = (data) => api.post("/user/resend-otp", data);
export const forgotPassword = (data) => api.post("/user/forgot-password", data);
export const resetPassword = (data) => api.post("/user/reset-password", data);
export const changePassword = (data) => api.post("/user/change-password", data);
export const getMe = () => api.get("/user/me");
