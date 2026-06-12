import axios from "axios";

const inferBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---------- USER AUTH ----------
export const signupUser = (data) => API.post("/auth/signup", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/user/me");
export const getMyTools = () => API.get("/user/my-tools");

// ---------- ADMIN AUTH (SSO COOKIE) ----------
export const adminMe = () => API.get("/admins/me");
export const adminLogout = () => API.post("/admins/logout");

// USERS
export const getAllUsers = (params) => API.get("/user", { params }); // ✅ adjust if needed
export const deleteUser = (id) => API.delete(`/user/${id}`);         // ✅ adjust if needed
export const createUser = (data) => API.post("/user", data);
export const updateUser = (id, data) => API.put(`/user/${id}`, data); // optional
export const resetUserPassword = (id, data) => API.post(`/user/${id}/reset-password`, data);

// TOOLS
export const getAllTools = (params) => API.get("/admin/tools", { params }); // ✅ adjust if needed
export const createTool = (data) => API.post("/admin/tools", data);         // ✅ adjust if needed
export const updateTool = (id, data) => API.put(`/admin/tools/${id}`, data); // ✅ adjust if needed
export const deleteTool = (id) => API.delete(`/admin/tools/${id}`);
export const getToolCookies = (slug) => API.get(`/user/tools/${slug}/cookies`);
export const getUsersWithTools = () => API.get("/admin/users-with-tools");
export const getTutorial = () => API.get("/user/tutorial");
export const updateTutorial = (data) => API.put("/user/tutorial", data);    