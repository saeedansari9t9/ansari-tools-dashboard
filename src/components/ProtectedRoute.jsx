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
