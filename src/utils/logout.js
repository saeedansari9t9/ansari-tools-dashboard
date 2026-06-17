import { API, logoutUser } from "./api";

export const logoutAll = async () => {
  const role = localStorage.getItem("role");

  if (role === "admin") {
    try {
      // Also clear admin cookie
      await API.post("/admins/logout", {}, { withCredentials: true });
    } catch (e) {
      // ignore
    }
  } else {
    try {
      // ✅ Clear sessionToken on server so user can login fresh on next visit
      await logoutUser();
    } catch (e) {
      // ignore network errors during logout
    }
  }

  localStorage.clear();
  sessionStorage.clear();
};
