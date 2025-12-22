import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./pages/DashboardLayout";
// import Tutorials from "./pages/Tutorials"; // agar file nahi bani to temporarily hata do

import ProtectedRoute from "./components/ProtectedRoute";
import AssignTool from "./pages/AssignTool";
import AllUsers from "./pages/AllUsers";
import AllTools from "./pages/AllTools";
import AdminOnly from "./components/AdminOnly";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* PROTECTED ROUTES (User Dashboard Area) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {(role) => (
                <DashboardLayout role={role}>
                  <Dashboard role={role} />
                </DashboardLayout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assign-tool"
          element={
            <ProtectedRoute>
              {(role) =>
                role === "admin" ? (
                  <DashboardLayout role={role}>
                    <AssignTool />
                  </DashboardLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              {(role) => (
                <DashboardLayout role={role}>
                  <AdminOnly role={role}>
                    <AllUsers />
                  </AdminOnly>
                </DashboardLayout>
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tools"
          element={
            <ProtectedRoute>
              {(role) => (
                <DashboardLayout role={role}>
                  <AdminOnly role={role}>
                    <AllTools />
                  </AdminOnly>
                </DashboardLayout>
              )}
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
