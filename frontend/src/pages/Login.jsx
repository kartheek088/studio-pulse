import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import {
  Users,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Palette,
  Film,
  Check,
} from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, login } = useProduction();

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") === "credentials" ? "credentials" : "team";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filterRole, setFilterRole] = useState("All"); // "All" | "lead" | "director" | "artist"
  const [emailInput, setEmailInput] = useState("nv@studiopulse.io");
  const [passwordInput, setPasswordInput] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedLoadingId, setSelectedLoadingId] = useState(null);

  const userList = Object.values(users || {});

  const filteredUsers = userList.filter((u) => {
    if (filterRole === "All") return true;
    if (filterRole === "lead") return u.role === "productionLead";
    if (filterRole === "director") return u.role === "director";
    if (filterRole === "artist") return u.role === "artist";
    return true;
  });

  function performLogin(userId) {
    setIsSubmitting(true);
    setSelectedLoadingId(userId);
    setErrorMsg("");

    setTimeout(() => {
      try {
        login(userId);
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } catch (err) {
        setIsSubmitting(false);
        setSelectedLoadingId(null);
        setErrorMsg("Failed to authenticate session.");
      }
    }, 200);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    // Match by email or fallback to first matching user
    const matched = userList.find(
      (u) => u.email.toLowerCase() === emailInput.trim().toLowerCase()
    );
    if (matched) {
      performLogin(matched.id);
    } else {
      performLogin("nv");
    }
  }

  function handleQuickAutofill(u) {
    setEmailInput(u.email);
    setPasswordInput("studiopass2026");
    setErrorMsg("");
  }

  return (
    <div className="login-page-clean">
      <div className="login-card-clean">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-mark">SP</div>
          <h1>Sign in to Studio Pulse</h1>
          <p className="login-subtitle">
            Collaborative Production Management & Pipeline Suite
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="login-tab-bar">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === "team" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("team");
              setErrorMsg("");
            }}
          >
            <Users size={14} /> Team Directory ({userList.length})
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === "credentials" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("credentials");
              setErrorMsg("");
            }}
          >
            <KeyRound size={14} /> Direct Sign In
          </button>
        </div>

        {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

        {/* TAB 1: Team Directory (Clean One-Click Studio Seats) */}
        {activeTab === "team" && (
          <div className="login-team-tab">
            {/* Filter Chips */}
            <div className="login-filter-row">
              <button
                type="button"
                className={`login-filter-chip ${filterRole === "All" ? "active" : ""}`}
                onClick={() => setFilterRole("All")}
              >
                All Seats ({userList.length})
              </button>
              <button
                type="button"
                className={`login-filter-chip ${filterRole === "lead" ? "active" : ""}`}
                onClick={() => setFilterRole("lead")}
              >
                Supervisor
              </button>
              <button
                type="button"
                className={`login-filter-chip ${filterRole === "director" ? "active" : ""}`}
                onClick={() => setFilterRole("director")}
              >
                Director
              </button>
              <button
                type="button"
                className={`login-filter-chip ${filterRole === "artist" ? "active" : ""}`}
                onClick={() => setFilterRole("artist")}
              >
                Artists (6)
              </button>
            </div>

            {/* Members List */}
            <div className="login-member-list">
              {filteredUsers.map((u) => {
                const isSelected = selectedLoadingId === u.id;
                const isLead = u.role === "productionLead";
                const isDir = u.role === "director";

                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`login-member-row ${isSelected ? "active" : ""}`}
                    onClick={() => performLogin(u.id)}
                    disabled={isSubmitting}
                  >
                    <div className="login-member-left">
                      <div
                        className="login-member-avatar"
                        style={{ background: u.color, color: "#111" }}
                      >
                        {u.avatar}
                      </div>
                      <div className="login-member-info">
                        <div className="login-member-name-row">
                          <span className="login-member-name">{u.name}</span>
                          <span
                            className={`login-role-tag ${
                              isLead ? "lead" : isDir ? "director" : "artist"
                            }`}
                          >
                            {isLead ? "Supervisor" : isDir ? "Director" : "Artist"}
                          </span>
                        </div>
                        <div className="login-member-title">{u.title}</div>
                      </div>
                    </div>

                    <div className="login-member-right">
                      <span className="login-dcc-badge">
                        {u.dcc.split("+")[0].trim()}
                      </span>
                      <ArrowRight size={14} className="login-sign-in-arrow" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Direct Sign In Form */}
        {activeTab === "credentials" && (
          <form className="login-cred-form" onSubmit={handleFormSubmit}>
            <div className="login-form-field">
              <label className="login-field-label">Studio Email</label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input
                  type="email"
                  className="login-clean-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@studiopulse.io"
                  required
                />
              </div>
            </div>

            <div className="login-form-field">
              <label className="login-field-label">
                <span>Passcode</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Default: Any</span>
              </label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-clean-input"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password view"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Quick Autofill Presets */}
            <div className="login-quick-presets">
              <div className="preset-label">Quick autofill studio credentials:</div>
              <div className="preset-chips-row">
                <button
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => handleQuickAutofill(users.nv)}
                >
                  Supervisor (Nishanth)
                </button>
                <button
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => handleQuickAutofill(users.director)}
                >
                  Director (K. Rathore)
                </button>
                <button
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => handleQuickAutofill(users.saswat)}
                >
                  Artist (Saswat)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-clean-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Connecting..."
              ) : (
                <>
                  <span>Sign In to Desk</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Understated Studio Footer */}
        <div className="login-card-footer">
          <span>Studio Pulse 2.0 · Dept. of Computer Science & Design</span>
          <span>Authorized Personnel</span>
        </div>
      </div>
    </div>
  );
}
