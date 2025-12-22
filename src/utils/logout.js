import { API } from "./api";

export const logoutAll = async () => {
  try {
    await API.post("/logout", {}, { withCredentials: true });
  } catch (e) {
    // ignore
  } finally {
    localStorage.clear();
    sessionStorage.clear();
  }
};
