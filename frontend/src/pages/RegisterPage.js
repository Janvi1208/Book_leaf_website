import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const user = await register(name, email, password);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/author/books");
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again.",
      );
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>BookLeaf</h1>
        <p>
          Create your author account and start managing books, royalties, and
          support tickets.
        </p>
        <div className="login-decorative">
          <div className="login-feature">
            <div className="login-feature-dot" />
            Setup author dashboard quickly
          </div>
          <div className="login-feature">
            <div className="login-feature-dot" />
            Track royalty earnings in real time
          </div>
          <div className="login-feature">
            <div className="login-feature-dot" />
            Submit tickets with AI-assisted categorization
          </div>
          <div className="login-feature">
            <div className="login-feature-dot" />
            Stay connected with admin support
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card">
          <h2>Create an account</h2>
          <p>Register as an author to access BookLeaf.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-gold"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
              }}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div style={{ marginTop: "16px", fontSize: "14px" }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
