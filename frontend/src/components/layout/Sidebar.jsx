import { NavLink, useNavigate } from "react-router-dom";
import { useProduction } from "../../context/ProductionContext";
import {
  LayoutDashboard,
  FolderKanban,
  GitMerge,
  Film,
  CheckSquare,
  Box,
  MessageSquareCheck,
  History,
  HeartPulse,
  LogOut,
  X,
  LogIn,
  ShieldCheck,
} from "lucide-react";

export function Sidebar() {
  const navigate = useNavigate();
  const {
    role,
    currentUser,
    logout,
    reviews,
    tasks,
    mobileMenuOpen,
    closeMobileMenu,
  } = useProduction();

  const pendingReviewCount = reviews.filter(
    (r) => r.status === "Pending Review"
  ).length;

  const myTasksCount = tasks.filter(
    (t) => t.artistId === currentUser?.id && t.status !== "Completed"
  ).length;

  const currentUserName = currentUser?.name || "Guest";
  const currentUserTitle = currentUser?.title || "Studio Member";
  const userInitials = currentUser?.avatar || "SP";
  const userColor = currentUser?.color || "#f59e0b";

  function handleLogout() {
    logout();
    closeMobileMenu();
    navigate("/login");
  }

  const NAV = [
    {
      group: "Architecture & Workspace",
      items: [
        {
          path: "/dashboard",
          label: role === "artist" ? `${currentUser?.name?.split(" ")[0]}'s Desk` : role === "director" ? "Director Desk" : "Studio Dashboard",
          key: "dashboard",
          icon: LayoutDashboard,
        },
        {
          path: "/architecture",
          label: "Architecture & Flow (Slide 5 & 7)",
          key: "architecture",
          icon: GitMerge,
        },
      ],
    },
    {
      group: "Production Tracking",
      items: [
        {
          path: "/projects",
          label: "Projects",
          key: "projects",
          icon: FolderKanban,
        },
        {
          path: "/workflow",
          label: "Workflow Board",
          key: "workflow",
          icon: GitMerge,
        },
        {
          path: "/shots",
          label: "Shot Catalog",
          key: "shots",
          icon: Film,
        },
        {
          path: "/tasks",
          label: role === "artist" ? `My Tasks` : "Tasks",
          key: "tasks",
          icon: CheckSquare,
          badge: role === "artist" && myTasksCount > 0 ? myTasksCount : null,
        },
      ],
    },
    {
      group: "Pipeline, DCC & VCS",
      items: [
        {
          path: "/assets",
          label: "Asset Library",
          key: "assets",
          icon: Box,
        },
        {
          path: "/git-lfs",
          label: "Git + Git LFS (VCS)",
          key: "git-lfs",
          icon: FolderKanban,
        },
      ],
    },
    {
      group: "Review & Audit",
      items: [
        {
          path: "/reviews",
          label: role === "director" ? "Kitsu Approvals" : "Kitsu Reviews",
          key: "reviews",
          icon: MessageSquareCheck,
          badge: pendingReviewCount > 0 ? pendingReviewCount : null,
          badgeTone: role === "director" ? "accent" : "muted",
        },
        {
          path: "/activity",
          label: "Activity Feed",
          key: "activity",
          icon: History,
        },
      ],
    },
    ...(role !== "artist"
      ? [
          {
            group: "Diagnostics",
            items: [
              {
                path: "/health",
                label: "Pipeline Health",
                key: "health",
                icon: HeartPulse,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-logo">SP</div>
        <div className="brand-text">
          <h2>Studio Pulse</h2>
          <p>Production Suite</p>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-menu">
        {NAV.map((group) => (
          <div key={group.group} className="sidebar-group">
            <p className="sidebar-group-label">{group.group}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `menu-item ${isActive ? "active" : ""}`
                  }
                >
                  <span className="menu-icon">
                    <Icon size={16} />
                  </span>
                  <span className="menu-label">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`sidebar-badge ${
                        item.badgeTone === "accent" ? "accent" : ""
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="sidebar-bottom">
        {currentUser ? (
          <div className="user-profile-row">
            <div className="user-profile">
              <div
                className="user-avatar"
                style={{ background: userColor, color: "#120e06" }}
              >
                {userInitials}
              </div>
              <div className="user-profile-meta">
                <strong title={currentUserName}>{currentUserName}</strong>
                <p title={currentUserTitle}>{currentUser.roleName}</p>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="sidebar-login-btn"
            onClick={() => {
              closeMobileMenu();
              navigate("/login");
            }}
          >
            <LogIn size={15} /> <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
}