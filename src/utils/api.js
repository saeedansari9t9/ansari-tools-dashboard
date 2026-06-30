import axios from "axios";

const inferBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    envUrl = envUrl.trim();
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }

  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocal) return "http://localhost:5000/api";
  }

  return "https://api.ansaritools.com/api";
};

export const API = axios.create({
  baseURL: inferBaseUrl(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // ✅ for admin cookie
});

// ✅ USER TOKEN attach (for user login)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // user token
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Handle 401 Unauthorized globally (e.g. session expired on password reset)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const code = error.response.data?.code;

      // Session expired or invalidated
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }

      // Account locked — redirect to login with locked flag
      if (status === 403 && code === "ACCOUNT_LOCKED") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?locked=1";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ---------- USER AUTH ----------
export const signupUser = (data) => API.post("/auth/signup", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const logoutUser = () => API.post("/auth/logout");
export const getMe = () => API.get("/user/me");
export const getMyTools = () => API.get("/user/my-tools");
export const changePassword = (data) => API.post("/user/change-password", data);
export const updateProfile = (data) => API.put("/user/update-profile", data);

// ---------- ADMIN AUTH (SSO COOKIE) ----------
export const adminMe = () => API.get("/admins/me");
export const adminLogout = () => API.post("/admins/logout");

// USERS
export const getAllUsers = (params) => API.get("/user", { params });
export const deleteUser = (id) => API.delete(`/user/${id}`);
export const createUser = (data) => API.post("/user", data);
export const updateUser = (id, data) => API.put(`/user/${id}`, data);
export const resetUserPassword = (id, data) => API.post(`/user/${id}/reset-password`, data);
export const getUserLogs = (params) => API.get("/user/logs", { params });
export const unlockUser = (id) => API.post(`/user/${id}/unlock`);
export const lockUser = (id, reason) => API.post(`/user/${id}/lock`, { reason });
export const clearSession = (id) => API.post(`/user/${id}/clear-session`);

// TOOLS
export const getAllTools = (params) => API.get("/admin/tools", { params }); // ✅ adjust if needed
export const createTool = (data) => API.post("/admin/tools", data);         // ✅ adjust if needed
export const updateTool = (id, data) => API.put(`/admin/tools/${id}`, data); // ✅ adjust if needed
export const deleteTool = (id) => API.delete(`/admin/tools/${id}`);
export const getToolCookies = (slug) => API.get(`/user/tools/${slug}/cookies`);
export const getUsersWithTools = () => API.get("/admin/users-with-tools");
export const getTutorial = () => API.get("/user/tutorial");
export const updateTutorial = (data) => API.put("/user/tutorial", data);    
export const uploadExtension = (formData) =>
  API.post("/admin/upload-extension", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });