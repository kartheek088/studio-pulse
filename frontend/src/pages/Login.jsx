import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithCredentials } = useProduction();

  const [emailInput, setEmailInput] = useState("nv@studiopulse.io");
  const [passwordInput, setPasswordInput] = useState("lead2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (loginWithCredentials) {
        loginWithCredentials(emailInput, passwordInput);
      } else {
        login(emailInput);
      }
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your email and passcode.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page-clean">
      <div className="login-card-clean" style={{ maxWidth: "440px" }}>
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-mark">SP</div>
          <h1>Sign In to Studio Pulse</h1>
          <p className="login-subtitle">
            Enter your credentials to access your production desk
          </p>
        </div>

        {errorMsg && (
          <div className="login-error-alert" role="alert">
            {errorMsg}
          </div>
        )}

        {/* ── Email & Password Authentication Form ── */}
        <form className="login-cred-form" onSubmit={handleSubmit}>
          <div className="login-form-field">
            <label className="login-field-label">Studio Email Address</label>
            <div className="login-input-wrap">
              <Mail size={15} className="login-input-icon" />
              <input
                type="email"
                className="login-clean-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@studiopulse.io"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-form-field">
            <label className="login-field-label">Account Passcode</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="login-clean-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-clean-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Sign In to Production Desk</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Studio Footer */}
        <div className="login-card-footer">
          <span>Studio Pulse 2.0 · Production Suite</span>
          <span>Authorized Access Only</span>
        </div>
      </div>
    </div>
  );
}
