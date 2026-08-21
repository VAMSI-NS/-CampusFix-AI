# Implementation Plan: CampusFix AI - Stage 1 (Initial Setup & Health Check)

Establish the foundational project structure for **CampusFix AI (Autonomous Campus IT Support Agent)** with a clean separation between backend and frontend, a health check API, and an interactive connection verification dashboard.

## User Review Required

> [!NOTE]
> This is Stage 1 of the CampusFix AI project. No complex AI reasoning, database connections, or simulated tools will be enabled yet. The focus is solely on a clean, scalable, and verifiable scaffold.

- **Frontend Tech**: React + TypeScript + Vite with light-theme design system.
- **Backend Tech**: FastAPI + Uvicorn with CORS and `/api/health` endpoint.
- **Vite Proxy**: Configured so frontend calls `/api/*` seamlessly during development.

---

## Proposed Changes

```
CAMPUSFIX-AI/
├── .gitignore
├── README.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── .env.example
    └── src/
        ├── App.css
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        └── vite-env.d.ts
```

### Root Files

#### [NEW] [.gitignore](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/.gitignore)
- Git ignore patterns for Node (`node_modules`, `dist`, `.env`), Python (`__pycache__`, `.venv`, `venv`, `*.pyc`), OS files, IDE config.

#### [NEW] [README.md](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/README.md)
- Complete documentation including project overview, tech stack, prerequisites, step-by-step guide for running backend and frontend, and testing instructions.

---

### Backend (Python FastAPI)

#### [NEW] [requirements.txt](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/backend/requirements.txt)
- `fastapi`, `uvicorn[standard]`, `pydantic`, `python-dotenv`, `httpx`.

#### [NEW] [main.py](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/backend/app/main.py)
- FastAPI application with CORS middleware, root route (`/`), and `/api/health` endpoint returning system status, timestamp, and metadata.

#### [NEW] [run.py](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/backend/run.py)
- Convenient runner script to start the Uvicorn server on `http://127.0.0.1:8000`.

#### [NEW] [.env.example](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/backend/.env.example)
- Sample environment variables template.

---

### Frontend (React + TypeScript + Vite)

#### [NEW] [package.json](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/frontend/package.json)
- React 18/19, TypeScript, Lucide icons, Vite, `@vitejs/plugin-react`.

#### [NEW] [vite.config.ts](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/frontend/vite.config.ts)
- Vite config configured with development proxy to forward `/api` requests to `http://localhost:8000`.

#### [NEW] [index.html](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/frontend/index.html)
- Modern typography (Inter/Plus Jakarta Sans via Google Fonts), responsive viewport, clean title and favicon.

#### [NEW] [src/index.css](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/frontend/src/index.css) & [src/App.css](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/frontend/src/App.css)
- Premium, light-mode design system with soft gradients, card glassmorphism/elevations, sleek typography, badges, and responsive layout.

#### [NEW] [src/App.tsx](file:///c:/Users/karthik/Desktop/CAMPUSFIX-AI/frontend/src/App.tsx)
- Connection verification dashboard displaying:
  - Real-time Backend Health Connection Status (Connected / Connecting / Disconnected).
  - Ping latency / response payload viewer from `GET /api/health`.
  - Manual "Test Connection" button.
  - CampusFix AI Architecture & Roadmap card preview.

---

## Verification Plan

### Automated / CLI Verification
1. **Backend Verification**:
   - Create Python venv and install requirements: `pip install -r backend/requirements.txt`.
   - Run backend server and execute HTTP request to `http://127.0.0.1:8000/api/health` using `curl` or Python script.
2. **Frontend Verification**:
   - Install npm dependencies: `npm install` inside `frontend/`.
   - Run Vite build check: `npm run build` to ensure zero TypeScript or bundling errors.
   - Run Vite dev server: `npm run dev`.

### Manual / Browser Verification
- Open the web application in browser at `http://localhost:5173`.
- Verify the connection status badge changes to active green "Connected".
- Click "Test Connection" and verify dynamic response timestamp & payload updates seamlessly.
