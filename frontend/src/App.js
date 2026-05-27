import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthorBooks from "./pages/author/AuthorBooks";
import AuthorTickets from "./pages/author/AuthorTickets";
import SubmitTicket from "./pages/author/SubmitTicket";
import TicketDetail from "./pages/author/TicketDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminBooks from "./pages/admin/AdminBooks";

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/author/books"}
        replace
      />
    );
  }
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={user.role === "admin" ? "/admin/dashboard" : "/author/books"}
      replace
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Author routes */}
          <Route
            path="/author/books"
            element={
              <RequireRole role="author">
                <AuthorBooks />
              </RequireRole>
            }
          />
          <Route
            path="/author/tickets"
            element={
              <RequireRole role="author">
                <AuthorTickets />
              </RequireRole>
            }
          />
          <Route
            path="/author/tickets/:id"
            element={
              <RequireRole role="author">
                <TicketDetail />
              </RequireRole>
            }
          />
          <Route
            path="/author/submit"
            element={
              <RequireRole role="author">
                <SubmitTicket />
              </RequireRole>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <RequireRole role="admin">
                <AdminTickets />
              </RequireRole>
            }
          />
          <Route
            path="/admin/tickets/:id"
            element={
              <RequireRole role="admin">
                <TicketDetail />
              </RequireRole>
            }
          />
          <Route
            path="/admin/books"
            element={
              <RequireRole role="admin">
                <AdminBooks />
              </RequireRole>
            }
          />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
