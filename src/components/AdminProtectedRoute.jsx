import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminMe } from "../utils/api"; // path adjust

export default function AdminProtectedRoute({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    adminMe()
      .then((res) => setOk(!!res.data?.ok))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return null; // loader optional
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}
