import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/author/books");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  }

  function fillDemo(role) {
    if (role === "admin") {
      setEmail("admin@bookleaf.com");
      setPassword("admin123");
    } else if (role === "author1") {
      setEmail("arjun@example.com");
      setPassword("author123");
    } else {
      setEmail("kavya@example.com");
      setPassword("author123");
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>BookLeaf</h1>
        <p>
          The author support portal for managing your books, royalties, and
          queries — all in one place.
        </p>
        <div className="login-decorative">
          <div className="login-feature">
            <div className="login-feature-dot" />
            Track royalty earnings in real time
          </div>
          <div className="login-feature">
            <div className="login-feature-dot" />
            AI-powered support ticket resolution
          </div>
          <div className="login-feature">
            <div className="login-feature-dot" />
            Book status and distribution tracking
          </div>
          <div className="login-feature">
            <div className="login-feature-dot" />
            Direct communication with our team
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card">
          <h2>Welcome back</h2>
          <p>Sign in to your BookLeaf account</p>

          <div className="demo-creds">
            <strong>Demo accounts —</strong>{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                fillDemo("admin");
              }}
            >
              Admin
            </a>
            {" · "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                fillDemo("author1");
              }}
            >
              Author 1
            </a>
            {" · "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                fillDemo("author2");
              }}
            >
              Author 2
            </a>
            <br />
            <span style={{ fontSize: "12px" }}>
              Password: <code>admin123</code> or <code>author123</code>
            </span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div style={{ marginTop: "16px", fontSize: "14px" }}>
            Don’t have an account? <Link to="/register">Register now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
