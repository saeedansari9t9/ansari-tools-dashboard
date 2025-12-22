import { Navigate } from "react-router-dom";

export default function UserProtectedRoute({ children }) {
  const token = localStorage.getItem("token"); // user token
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
