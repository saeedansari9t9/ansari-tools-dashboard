import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminMe } from "../utils/api"; // ensure export exists

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); 
  // "loading" | "admin" | "user" | "none"

  useEffect(() => {
    // 1) Try admin cookie first
    adminMe()
      .then((res) => {
        if (res.data?.ok) {
          setStatus("admin");
        } else {
          // 2) fallback to user token
          const token = localStorage.getItem("token");
          setStatus(token ? "user" : "none");
        }
      })
      .catch(() => {
        const token = localStorage.getItem("token");
        setStatus(token ? "user" : "none");
      });
  }, []);

  if (status === "loading") return null; // loader optional
  if (status === "none") return <Navigate to="/login" replace />;

  // ✅ Pass role to children (layout/sidebar)
  return typeof children === "function" ? children(status) : children;
}
