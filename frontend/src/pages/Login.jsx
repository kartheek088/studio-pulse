import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import {
  ShieldCheck,
  Eye,
  Palette,
  Briefcase,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Key,
  HardDrive,
  MessageSquareCheck,
  CheckCircle2,
  Tv,
  GitMerge,
} from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, currentUser, login } = useProduction();

  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || "nv");
  const [emailInput, setEmailInput] = useState(currentUser?.email || "nv@studiopulse.io");
  const [passwordInput, setPasswordInput] = useState("••••••••");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const userList = Object.values(users || {});

  function handleSelectPersona(u) {
    setSelectedUserId(u.id);
    setEmailInput(u.email);
    setPasswordInput("••••••••");
    setErrorMsg("");
  }

  function handlePerformLogin(e) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      try {
        const targetId = selectedUserId;
        const loggedUser = login(targetId);
        setIsSubmitting(false);
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } catch (err) {
        setIsSubmitting(false);
        setErrorMsg("Failed to authenticate session. Please try again.");
      }
    }, 350);
  }

  return (
    <div className="login-page-container">
      <div className="login-backdrop-glow" />

      <div className="login-card-shell">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-box">
            <span className="login-logo-text">SP</span>
          </div>
          <div className="login-brand-title-wrap">
            <h1>Studio Pulse 2.0</h1>
            <p className="login-brand-sub">Pipeline Management & Collaborative Production Engine</p>
          </div>
          <div className="login-dept-pill">
            <span>Department of Computer Science and Design</span>
            <span className="slide-badge">Slide 5 & 7 Architecture</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="login-info-banner">
          <div className="banner-icon">
            <GitMerge size={18} />
          </div>
          <div className="banner-text">
            <strong>Individual Access & Role-Based Permissions</strong>
            <p>
              Select your persona below to access your assigned shots, DCC tasks (Blender/Unreal), Git LFS asset locks, or Kitsu review queues.
            </p>
          </div>
        </div>

        {/* Persona Selector Grid */}
        <div className="persona-selection-section">
          <div className="section-label-row">
            <span className="section-label-tag">STEP 1: SELECT YOUR STUDIO PROFILE</span>
            <span className="section-count-tag">{userList.length} Team Members</span>
          </div>

          <div className="persona-grid">
            {userList.map((u) => {
              const isSelected = selectedUserId === u.id;
              const isLead = u.role === "productionLead";
              const isDir = u.role === "director";

              return (
                <div
                  key={u.id}
                  className={`persona-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectPersona(u)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="persona-card-header">
                    <div
                      className="persona-avatar-circle"
                      style={{ background: u.color, color: "#120e06" }}
                    >
                      {u.avatar}
                    </div>
                    <div className="persona-identity">
                      <strong className="persona-name">{u.name}</strong>
                      <span className="persona-title">{u.title}</span>
                    </div>
                    {isSelected && (
                      <div className="persona-check-badge">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>

                  <div className="persona-dept-badge-row">
                    <span className={`role-pill role-${u.role}`}>
                      {isLead ? (
                        <Briefcase size={11} />
                      ) : isDir ? (
                        <Eye size={11} />
                      ) : (
                        <Palette size={11} />
                      )}
                      {u.roleName}
                    </span>
                    <span className="dcc-tag-pill" style={{ fontSize: "10px" }}>
                      {u.dcc.split("+")[0].trim()}
                    </span>
                  </div>

                  <p className="persona-accessible-desc">{u.accessibleSummary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sign-in Form */}
        <form className="login-form-box" onSubmit={handlePerformLogin}>
          <div className="section-label-row">
            <span className="section-label-tag">STEP 2: CONFIRM CREDENTIALS & SIGN IN</span>
          </div>

          <div className="login-inputs-grid">
            <div className="form-group-custom">
              <label className="input-label-custom">
                <Mail size={13} /> Studio Email
              </label>
              <input
                type="email"
                className="form-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@studiopulse.io"
                required
              />
            </div>

            <div className="form-group-custom">
              <label className="input-label-custom">
                <Key size={13} /> Passcode
              </label>
              <input
                type="password"
                className="form-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

          <div className="login-submit-row">
            <button
              type="submit"
              className="btn-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Authenticating Workspace...</span>
              ) : (
                <>
                  <span>
                    Sign In as <strong>{users[selectedUserId]?.name}</strong> ({users[selectedUserId]?.roleName})
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="login-footer-credits">
          <span>Connected Pipeline Architecture: Storyboard Pro → Unreal Engine 5.4 → Blender 4.2 → Sequencer → Unreal + Kitsu</span>
        </div>
      </div>
    </div>
  );
}
