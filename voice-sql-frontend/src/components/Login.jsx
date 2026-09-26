import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

const API_BASE = "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    setLoading(true);
    setError("");

    const response = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: credentialResponse.credential,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Google login failed."
      );
    }

    const token = data.token;

    if (!token) {
      throw new Error(
        "Google login succeeded, but no authentication token was received."
      );
    }

    const userData = data.user;

    login(token, userData);

    navigate("/dashboard", {
      replace: true,
    });

  } catch (err) {
    console.error("Google login error:", err);

    setError(
      err.message || "Unable to login with Google. Please try again."
    );

  } finally {
    setLoading(false);
  }
};

const handleGoogleError = () => {
  setError("Google login was unsuccessful. Please try again.");
};

  /* ================= ANIMATIONS ================= */

  useEffect(() => {
    function buildBars(container, count, minH, maxH) {
      if (!container) return;

      // Prevent duplicate bars during React development/StrictMode
      container.innerHTML = "";

      const frag = document.createDocumentFragment();

      for (let i = 0; i < count; i++) {
        const bar = document.createElement("div");
        bar.className = "bar";

        const h = minH + Math.random() * (maxH - minH);

        bar.style.height = `${h}px`;
        bar.style.animationDuration = `${0.9 + Math.random() * 0.9}s`;
        bar.style.animationDelay = `${Math.random() * 1.2}s`;

        frag.appendChild(bar);
      }

      container.appendChild(frag);
    }

    buildBars(
      document.getElementById("wave-left"),
      16,
      6,
      54
    );

    buildBars(
      document.getElementById("wave-right"),
      16,
      6,
      54
    );

    const tabs = document.getElementById("tabs");
    const tabSignin = document.getElementById("tab-signin");
    const underline = document.getElementById("tab-underline");

    function placeUnderline(el) {
      if (!tabs || !el || !underline) return;

      const tabRect = tabs.getBoundingClientRect();
      const r = el.getBoundingClientRect();

      underline.style.left = `${r.left - tabRect.left}px`;
      underline.style.width = `${r.width}px`;
    }

    const timer = setTimeout(() => {
      placeUnderline(tabSignin);
    }, 50);

    const handleResize = () => {
      placeUnderline(tabSignin);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* ================= FORM HANDLING ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  /* ================= LOGIN ================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Invalid email or password."
        );
      }

      /*
       * Support common backend token formats:
       *
       * { token: "..." }
       * { access_token: "..." }
       */
      const token = data.token || data.access_token;

      if (!token) {
        throw new Error(
          "Login successful, but no authentication token was received."
        );
      }

      const userData =
        data.user ||
        data.user_data ||
        {
          id: data.user_id,
          user_id: data.user_id,
          name: data.name,
          email: data.email || form.email,
        };

      // Save authentication information
      login(token, userData);

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= LEFT PANEL ================= */}

      <div className="left-panel">

        <h1 className="headline">
          VoiceSQL <span className="accent">AI</span>
        </h1>

        <div className="tagline">
          Your Database, On Command
        </div>

        <p className="subtext">
          Convert speech to executable SQL queries in real-time.
        </p>

        <div className="hero-stage">

          <div className="floor"></div>

          <div className="tag tag-sql-left">SQL</div>
          <div className="tag tag-select">SELECT</div>
          <div className="tag tag-where">WHERE</div>
          <div className="tag tag-join">JOIN</div>
          <div className="tag tag-key">KEY</div>
          <div className="tag tag-sql-right">SQL</div>

          <div
            className="wave-row left"
            id="wave-left"
          ></div>

          <div
            className={`mic-ring ${loading ? "listening" : ""}`}
            id="mic-ring"
          >
            <svg
              className="mic-icon"
              viewBox="0 0 512 512"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="micGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#8ff2df"
                  />

                  <stop
                    offset="100%"
                    stopColor="#2ddcc9"
                  />
                </linearGradient>
              </defs>

              <path
                d="M256 0C207.4 0 168 39.4 168 88V264C168 312.6 207.4 352 256 352C304.6 352 344 312.6 344 264V88C344 39.4 304.6 0 256 0Z"
                fill="url(#micGrad)"
              />

              <path
                d="M424 216C424 313.2 353.6 388 256 388C158.4 388 88 313.2 88 216H120C120 296 174.4 356 256 356C337.6 356 392 296 392 216H424Z"
                fill="url(#micGrad)"
              />

              <path
                d="M232 432H280V480H232V432Z"
                fill="url(#micGrad)"
              />

              <path
                d="M176 480H336V512H176V480Z"
                fill="url(#micGrad)"
              />
            </svg>
          </div>

          <div
            className="wave-row right"
            id="wave-right"
          ></div>

          <div className="listen-status">
            {loading ? "Signing in…" : "Ready"}
          </div>

        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}

      <div className="right-panel">

        <form
          className="card"
          onSubmit={handleLogin}
        >

          {/* ================= BADGE ================= */}

          <div className="badge-wrap">

            <div className="badge-tick"></div>

            <div className="badge">

              <svg
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="6"
                  y="10"
                  width="12"
                  height="10"
                  rx="2.5"
                  fill="#2ddcc9"
                />

                <path
                  d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"
                  stroke="#8ff2df"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />

                <circle
                  cx="12"
                  cy="14.5"
                  r="1.4"
                  fill="#0e332f"
                />
              </svg>

            </div>

            <div className="badge-tick"></div>

          </div>

          {/* ================= TABS ================= */}

          <div
            className="tabs"
            id="tabs"
          >

            <button
              type="button"
              className="tab active"
              id="tab-signin"
            >
              SIGN IN
            </button>

            <button
              type="button"
              className="tab"
              onClick={() => navigate("/signup")}
            >
              CREATE ACCOUNT
            </button>

            <div
              className="tab-underline"
              id="tab-underline"
            ></div>

          </div>

          {/* ================= ERROR ================= */}

          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}

          <div className="auth-form active">

            <div className="field">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your Email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />

            </div>

            <div className="field">
              <label htmlFor="password">Password</label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁" : "👁"}
                </button>
              </div>
            </div>

            {/* ================= LOGIN BUTTON ================= */}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in&nbsp; →
                </>
              )}
            </button>

            {/* ================= GOOGLE DIVIDER ================= */}

            <div className="google-divider">
              <span>Or continue with</span>
            </div>

            {/* ================= GOOGLE BUTTON ================= */}

            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                theme="outline"
                size="large"
                width="100%"
              />
            </div>

            {/* ================= SIGNUP LINK ================= */}

            <div className="link-row">

              Don't have an account?{" "}

              <button
                type="button"
                className="switch-link"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}

export default Login;