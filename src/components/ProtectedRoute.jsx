import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminMe, getMe } from "../utils/api";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); 
  // "loading" | "admin" | "user" | "none"

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role") || "user";

    // 1) If user has a token in localStorage, verify via getMe()
    if (token) {
      getMe()
        .then((res) => {
          const userRole = res.data?.role || savedRole;
          setStatus(userRole);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setStatus("none");
        });
      return;
    }

    // 2) Fallback: check for website admin SSO cookie
    adminMe()
      .then((res) => {
        if (res.data?.ok) {
          setStatus("admin");
        } else {
          setStatus("none");
        }
      })
      .catch(() => {
        setStatus("none");
      });
  }, []);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "4px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (status === "none") return <Navigate to="/login" replace />;

  // ✅ Pass role to children (layout/sidebar)
  return typeof children === "function" ? children(status) : children;
}
