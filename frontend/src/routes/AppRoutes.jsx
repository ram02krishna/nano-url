import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import ProtectedUrl from "../pages/ProtectedUrl";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import Settings from "../pages/Settings";
import LinkStatus from "../pages/LinkStatus";
import { useAuth } from "../context/AuthContext";

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />

      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
      />

      <Route
        path="/forgot-password"
        element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />}
      />

      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard />
          ) : (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        }
      />

      <Route
        path="/settings"
        element={
          user ? (
            <Settings />
          ) : (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        }
      />

      <Route path="/p/:shortCode" element={<ProtectedUrl />} />
      <Route path="/status/:reason" element={<LinkStatus />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
