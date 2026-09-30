import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProduction } from "../../context/ProductionContext";
import { NewProjectModal } from "../projects/NewProjectModal";
import {
  Briefcase,
  Palette,
  Eye,
  ChevronDown,
  ShieldCheck,
  Menu,
  LogOut,
  UserCheck,
  ExternalLink,
  LogIn,
  FolderPlus,
} from "lucide-react";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    users,
    switchUser,
    logout,
    toggleMobileMenu,
    createProject,
  } = useProduction();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleMeta = getRoleMeta(currentUser?.role || "productionLead");
  const userList = Object.values(users || {});

  function handleSelectUser(userId) {
    switchUser(userId);
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        <div className="topbar-meta-row">
          <span className="topbar-breadcrumb">STUDIO PULSE</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-section">{getPageSection(location.pathname)}</span>
        </div>
      </div>

      <div className="topbar-right">
        {currentUser && (
          <button
            type="button"
            className="topbar-new-project-btn"
            onClick={() => setIsNewProjectOpen(true)}
            title="Create a new production project"
          >
            <FolderPlus size={14} />
            <span>New Project</span>
          </button>
        )}

        {/* User Profile & Persona Switcher */}
        {currentUser ? (
          <div className="role-switcher-container" ref={menuRef}>
            <button
              type="button"
              className="role-selector-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
            >
              <div
                className="role-avatar-circle"
                style={{ background: currentUser.color || "#f59e0b", color: "#120e06" }}
              >
                {currentUser.avatar}
              </div>
              <div className="role-info-text">
                <span className="role-current-name">{currentUser.name}</span>
                <span className="role-subtext">{currentUser.roleName}</span>
              </div>
              <ChevronDown size={14} className={`role-chevron ${menuOpen ? "open" : ""}`} />
            </button>

            {menuOpen && (
              <div className="role-dropdown-menu">
                <div className="dropdown-section">
                  <div className="dropdown-header-user">
                    <div className="dropdown-header-top">
                      <strong className="dropdown-user-name">{currentUser.name}</strong>
                      <span className={`role-pill role-${currentUser.role}`}>
                        {currentUser.roleName}
                      </span>
                    </div>
                    <span className="dropdown-user-email">{currentUser.email}</span>
                  </div>
                </div>

                <div className="dropdown-section dropdown-section-border">
                  <span className="dropdown-section-title">Switch Active Seat</span>
                  <div className="user-switch-list">
                    {userList.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        className={`dropdown-item artist-item ${currentUser.id === u.id ? "active" : ""}`}
                        onClick={() => handleSelectUser(u.id)}
                      >
                        <span
                          className="artist-avatar"
                          style={{ background: u.color, color: "#120e06", fontWeight: 700 }}
                        >
                          {u.avatar}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong>{u.name}</strong>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{u.roleName}</span>
                          </div>
                          <small style={{ color: "var(--text-secondary)" }}>{u.dept}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dropdown-section dropdown-section-border">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    <UserCheck size={15} className="dropdown-icon" />
                    <div>
                      <strong>Full Login Portal</strong>
                      <small>Go to login screen with credential manager</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} className="dropdown-icon" />
                    <div>
                      <strong style={{ color: "var(--danger)" }}>Sign Out</strong>
                      <small>End current session</small>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="btn-topbar-login"
            onClick={() => navigate("/login")}
          >
            <LogIn size={14} /> <span>Sign In</span>
          </button>
        )}
      </div>

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={createProject}
      />
    </header>
  );
}

function getPageSection(pathname) {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname === "/architecture") return "Architecture & DFD";
  if (pathname === "/git-lfs") return "Git + Git LFS";
  if (pathname === "/projects") return "Projects";
  if (pathname.startsWith("/projects/")) return "Project Detail";
  if (pathname === "/workflow") return "Workflow";
  if (pathname === "/shots") return "Shots";
  if (pathname.startsWith("/shots/")) return "Shot Detail";
  if (pathname === "/tasks") return "Tasks";
  if (pathname === "/assets") return "Assets";
  if (pathname === "/reviews") return "Reviews";
  if (pathname === "/activity") return "Activity";
  if (pathname === "/health") return "Health";
  if (pathname === "/login") return "Sign In";
  return "Overview";
}

function getRoleMeta(role) {
  switch (role) {
    case "artist":
      return { name: "Artist", icon: <Palette size={15} /> };
    case "director":
      return { name: "Director", icon: <Eye size={15} /> };
    default:
      return { name: "Production Lead", icon: <Briefcase size={15} /> };
  }
}