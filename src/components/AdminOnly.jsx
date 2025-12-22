import { Navigate } from "react-router-dom";

export default function AdminOnly({ role, children }) {
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
