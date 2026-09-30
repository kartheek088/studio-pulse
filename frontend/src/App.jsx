import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProductionProvider } from "./context/ProductionContext";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { ArchitectureFlow } from "./pages/ArchitectureFlow";
import { GitLfs } from "./pages/GitLfs";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Workflow } from "./pages/Workflow";
import { Shots } from "./pages/Shots";
import { ShotDetail } from "./pages/ShotDetail";
import { Tasks } from "./pages/Tasks";
import { Assets } from "./pages/Assets";
import { Reviews } from "./pages/Reviews";
import { Activity } from "./pages/Activity";
import { ProductionHealth } from "./pages/ProductionHealth";
import { Login } from "./pages/Login";
import "./App.css";

function App() {
  return (
    <ProductionProvider>
      <Router>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/architecture" element={<ArchitectureFlow />} />
            <Route path="/git-lfs" element={<GitLfs />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/shots" element={<Shots />} />
            <Route path="/shots/:shotId" element={<ShotDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/health" element={<ProductionHealth />} />
          </Routes>
        </AppShell>
      </Router>
    </ProductionProvider>
  );
}

export default App;