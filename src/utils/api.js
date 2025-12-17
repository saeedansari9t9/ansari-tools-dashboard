import axios from "axios";

/**
 * Auto detect API base URL
 * - env (Vercel / Prod)
 * - localhost (dev)
 * - fallback (prod)
 */
const inferBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocal) return "http://localhost:5000/api";
  }

  return "https://ansari-tools-server.vercel.app/api";
};

// 🔹 AXIOS INSTANCE
export const API = axios.create({
  baseURL: inferBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 AUTO ATTACH JWT TOKEN
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= AUTH =================
export const signupUser = (data) => API.post("/auth/signup", data);
export const loginUser  = (data) => API.post("/auth/login", data);

// ================= TOOLS =================
export const getTools = () => API.get("/tools");
export const addTool = (data) => API.post("/tools", data);
export const deleteTool = (id) => API.delete(`/tools/${id}`);

// ================= USERS =================
export const getUsers = () => API.get("/users");
