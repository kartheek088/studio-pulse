import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  KeyRound,
  Check,
  Copy,
  Sparkles,
  UserCheck,
} from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, login, loginWithCredentials } = useProduction();

  const [emailInput, setEmailInput] = useState("nv@studiopulse.io");
  const [passwordInput, setPasswordInput] = useState("lead2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [copiedId, setCopiedId] = useState(null);
  const [loadedUser, setLoadedUser] = useState("Nishanth V.");

  const formRef = useRef(null);
  const userList = Object.values(users || {});

  const filteredUsers = userList.filter((u) => {
    if (filterRole === "All") return true;
    if (filterRole === "lead") return u.role === "productionLead";
    if (filterRole === "director") return u.role === "director";
    if (filterRole === "artist") return u.role === "artist";
    return true;
  });

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
      setErrorMsg(err.message || "Invalid credentials. Please verify email and passcode.");
      setIsSubmitting(false);
    }
  }

  function handleAutofill(u) {
    setEmailInput(u.email);
    setPasswordInput(u.password || `${u.id}2026`);
    setLoadedUser(u.name);
    setErrorMsg("");
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleDirectLogin(u) {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      login(u.id);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch {
      setErrorMsg("Failed to sign in.");
      setIsSubmitting(false);
    }
  }

  function handleCopyCredentials(u) {
    const text = `Email: ${u.email}\nPassword: ${u.password || `${u.id}2026`}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="login-page-clean">
      <div className="login-card-clean">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-mark">SP</div>
          <h1>Sign In to Studio Pulse</h1>
          <p className="login-subtitle">
            Enter your credentials to access your individual production desk
          </p>
        </div>

        {errorMsg && (
          <div className="login-error-alert" role="alert">
            {errorMsg}
          </div>
        )}

        {/* ── Email & Password Authentication Form ── */}
        <form ref={formRef} className="login-cred-form" onSubmit={handleSubmit}>
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
            <div className="login-field-label-row">
              <label className="login-field-label">Account Passcode</label>
              {loadedUser && (
                <span className="login-loaded-indicator">
                  Active Seat: <strong>{loadedUser}</strong>
                </span>
              )}
            </div>
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

        {/* ── Separate Logins Directory for Each Person ── */}
        <div className="individual-logins-section">
          <div className="individual-logins-header">
            <div>
              <h3>Individual Personnel Logins</h3>
              <p>Separate login credentials for each studio seat</p>
            </div>
            <div className="login-seat-count-tag">
              <KeyRound size={12} />
              <span>{userList.length} Accounts</span>
            </div>
          </div>

          {/* Role Filter Chips */}
          <div className="login-filter-row">
            <button
              type="button"
              className={`login-filter-chip ${filterRole === "All" ? "active" : ""}`}
              onClick={() => setFilterRole("All")}
            >
              All ({userList.length})
            </button>
            <button
              type="button"
              className={`login-filter-chip ${filterRole === "lead" ? "active" : ""}`}
              onClick={() => setFilterRole("lead")}
            >
              Supervisor (1)
            </button>
            <button
              type="button"
              className={`login-filter-chip ${filterRole === "director" ? "active" : ""}`}
              onClick={() => setFilterRole("director")}
            >
              Director (1)
            </button>
            <button
              type="button"
              className={`login-filter-chip ${filterRole === "artist" ? "active" : ""}`}
              onClick={() => setFilterRole("artist")}
            >
              Artists (6)
            </button>
          </div>

          {/* Individual Login Cards */}
          <div className="person-credentials-grid">
            {filteredUsers.map((u) => {
              const pass = u.password || `${u.id}2026`;
              const isLead = u.role === "productionLead";
              const isDir = u.role === "director";
              const isCurrent = emailInput.toLowerCase() === u.email.toLowerCase();

              return (
                <div
                  key={u.id}
                  className={`person-cred-card ${isCurrent ? "selected-seat" : ""}`}
                >
                  <div className="person-cred-card-top">
                    <div
                      className="person-cred-avatar"
                      style={{ background: u.color, color: "#111827" }}
                    >
                      {u.avatar}
                    </div>
                    <div className="person-cred-identity">
                      <div className="person-cred-name-row">
                        <span className="person-cred-name">{u.name}</span>
                        <span
                          className={`login-role-tag ${
                            isLead ? "lead" : isDir ? "director" : "artist"
                          }`}
                        >
                          {isLead ? "Supervisor" : isDir ? "Director" : "Artist"}
                        </span>
                      </div>
                      <span className="person-cred-dept">{u.dept}</span>
                    </div>
                  </div>

                  <div className="person-cred-values">
                    <div className="cred-row">
                      <span className="cred-label">Email:</span>
                      <code className="cred-code">{u.email}</code>
                    </div>
                    <div className="cred-row">
                      <span className="cred-label">Password:</span>
                      <code className="cred-code">{pass}</code>
                    </div>
                  </div>

                  <div className="person-cred-actions">
                    <button
                      type="button"
                      className="btn-fill-cred"
                      onClick={() => handleAutofill(u)}
                      title="Load into email & password fields above"
                    >
                      <UserCheck size={12} />
                      <span>Use Credentials</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-sign"
                      onClick={() => handleDirectLogin(u)}
                      title="Sign in directly as this user"
                    >
                      <span>Sign In</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Studio Footer */}
        <div className="login-card-footer">
          <span>Studio Pulse 2.0 · Production Suite</span>
          <span>Authorized Access Only</span>
        </div>
      </div>
    </div>
  );
}
