import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProduction } from "../../context/ProductionContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import "./AppShell.css";

export function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentProjectId, mobileMenuOpen, closeMobileMenu } = useProduction();

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Reset currentProjectId when route changes to /projects (unless it's a detail route)
  useEffect(() => {
    if (location.pathname.startsWith("/projects")) {
      const segments = location.pathname.split("/");
      if (segments.length === 2) {
        setCurrentProjectId(null);
      } else if (segments.length === 3 && segments[2]) {
        setCurrentProjectId(segments[2]);
      }
    } else if (location.pathname.startsWith("/shots")) {
      const segments = location.pathname.split("/");
      if (segments.length === 3 && segments[2]) {
        setCurrentProjectId(null);
      }
    }
  }, [location.pathname, setCurrentProjectId]);

  // Clean full-screen presentation for Login page
  if (location.pathname === "/login") {
    return <div className="appshell-login-fullscreen">{children}</div>;
  }

  return (
    <div className={`appshell ${mobileMenuOpen ? "mobile-drawer-open" : ""}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      <main className="main-content">
        <TopBar />
        <section className="page-container">{children}</section>
      </main>
    </div>
  );
}