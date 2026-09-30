# Studio Pulse 2.0

> **Connected VFX & Animation Production Management Platform**

Studio Pulse is an end-to-end studio production tracking and collaboration suite engineered for real-time VFX, 3D animation, and virtual production workflows. It integrates linear stage pipelines, Git + Git LFS binary asset version control, real-time Unreal Engine viewport previews, and Kitsu review workflows with timecoded director annotations.

---

## 🌟 Key Features

- **Linear Production Pipeline**:
  - Full support for 5-stage sequential workflows: Pre-production (Storyboard Pro) → Real-Time Previz (Unreal Engine) → Asset Production (Blender) → Animation/Layout (Blender Sequencer) → Render & Review (Unreal Engine + Kitsu).
- **Git + Git LFS Version Tracking**:
  - Direct version control for large DCC binary files (`.blend`, `.uasset`, textures, and EXR sequences) with exclusive file locking (`git-lfs lock`) to prevent concurrency collisions.
- **Kitsu Creative Review Integration**:
  - Timecoded director critique, frame-by-frame annotations, visual revision history, and one-click stage gating approvals.
- **Real-Time Previz Viewport**:
  - In-app interactive 3D camera controls, playblasts, and direct commit/review actions.
- **Role-Based Access Control (RBAC)**:
  - 8 distinct individual production personas across 3 key tiers:
    - **Artists**: Individual assigned work queues, DCC scene commits, and playblast submission.
    - **Creative Directors**: Executive review desk, frame annotations, and final picture sign-off.
    - **Production Leads**: Studio-wide capacity oversight, asset unblocking, and pipeline gating.
- **Clean & Minimalist Modern UI**:
  - Clutter-free design with responsive segmented controls, clean KPI metrics, and mobile-optimized layouts.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Installation
Install dependencies for both server and client:
```bash
npm run install:all
```

### 3. Run Development Environment
Start both the backend API server (`http://localhost:4000`) and the Vite frontend dev server (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1: Backend Server
npm run dev:server

# Terminal 2: Frontend Client
npm run dev:frontend
```

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Pure CSS Design System
- **Backend**: Node.js, Express, File-based Persistent Store with Seed Data
- **Version Control System**: Git + Git LFS simulation and tracking
- **Review System**: Kitsu REST API compatibility layer

---

## 🌐 Deploying to Vercel & Render

### 1. Deploy Backend on Render (Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/kartheek088/studio-pulse.git`.
3. Configure the settings:
   - **Name**: `studio-pulse-api`
   - **Root Directory**: Leave blank (or `server`)
   - **Runtime**: `Node`
   - **Build Command**: `npm install --prefix server` (or `npm install` if root directory is set to `server`)
   - **Start Command**: `node server/index.js` (or `node index.js` if root directory is set to `server`)
4. Click **Create Web Service**. Once deployed, copy your Render URL (e.g. `https://studio-pulse-api.onrender.com`).

### 2. Deploy Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository: `https://github.com/kartheek088/studio-pulse.git`.
3. In **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Render URL (e.g., `https://studio-pulse-api.onrender.com`)
4. Click **Deploy**. Vercel will build using the included `vercel.json` and deploy with full client-side routing.

---

## 📄 License
MIT License
