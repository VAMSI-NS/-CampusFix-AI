# CampusFix IT Platform — University Helpdesk & Incident Resolver

> **Enterprise University IT Incident Management & Autonomous AI Diagnostic Specialist**
> Powered by **NVIDIA Nemotron 3 Ultra** (`nvidia/nemotron-3-ultra-550b-a55b`) & **Neon PostgreSQL**

[![Live Demo](https://img.shields.io/badge/Live_Website-GitHub_Pages-22c55e?style=for-the-badge&logo=github)](https://vamsi-ns.github.io/-CampusFix-AI/)
[![Vignan Satellite Map](https://img.shields.io/badge/Vignan_Map-Satellite_Geodata-3b82f6?style=for-the-badge&logo=googlemaps)](https://vamsi-ns.github.io/-CampusFix-AI/#/map)
[![Repository](https://img.shields.io/badge/GitHub-Repository-8b5cf6?style=for-the-badge&logo=github)](https://github.com/VAMSI-NS/-CampusFix-AI)

🌐 **Live Application URL**: [https://vamsi-ns.github.io/-CampusFix-AI/](https://vamsi-ns.github.io/-CampusFix-AI/)

CampusFix IT Platform is an enterprise-grade university IT service management system. It bridges interactive, step-by-step conversational diagnosis for students with Kanban incident triage, verified high-resolution aerial satellite campus mapping, service health telemetry, curated knowledge base documentation, administrative operations, and executive SLA reporting.

---

## 🏛️ Platform Architecture & Capabilities

```
CAMPUSFIX-AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI server & route handlers
│   │   ├── models/                  # Pydantic schemas
│   │   │   ├── analytics.py         # KPIs, charts, and report models
│   │   │   ├── chat.py              # ChatMessage & ChatResponse
│   │   │   ├── diagnostics.py       # Infrastructure probe models
│   │   │   ├── knowledge_base.py    # KB article schemas & search
│   │   │   ├── service_status.py    # Campus service health & announcements
│   │   │   ├── ticket.py            # Incident dossier, actions taken & escalation
│   │   │   └── users.py             # User & staff roles
│   │   └── services/                # Business logic services
│   │       ├── ai_service.py        # OpenRouter client (NVIDIA Nemotron 3 Ultra)
│   │       ├── analytics_service.py # Live KPI & chart calculations
│   │       ├── diagnostics_service.py # Telemetry & DB storage checks
│   │       ├── kb_service.py        # Knowledge base CRUD & seed articles
│   │       ├── status_service.py    # Campus network & service telemetry
│   │       ├── ticket_service.py    # Ticket lifecycle state manager
│   │       └── users_service.py     # Staff & technician roster
│   ├── venv/                        # Python virtual environment
│   ├── .env                         # Server-side secrets (OPENROUTER_API_KEY)
│   ├── .env.example                 # Environment configuration template
│   ├── requirements.txt             # Python dependencies
│   ├── run.py                       # Development server runner
│   └── test_e2e.py                  # Automated API integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx   # Operations Hub (Overview, Tickets, AI Analytics, Network, Users, DB, Settings)
│   │   │   ├── CampusStatusPanel.tsx# Live service status & maintenance bulletins
│   │   │   ├── ChatInterface.tsx    # Interactive AI Specialist with voice UI & screenshot upload
│   │   │   ├── HealthDashboard.tsx  # Telemetry & endpoint health checks
│   │   │   ├── HostReports.tsx      # Executive Reports portal (Strictly READ-ONLY)
│   │   │   ├── IncidentWorkspace.tsx# Dual-pane workbench & incident dossier
│   │   │   ├── KnowledgeBase.tsx    # University IT procedures & Admin CRUD
│   │   │   ├── LandingPage.tsx      # Hero triage search, metrics banner & feature cards
│   │   │   ├── TicketBoard.tsx      # Kanban board with drag-and-drop & filters
│   │   │   └── TicketHistory.tsx    # Filterable incident directory
│   │   ├── types/
│   │   │   └── chat.ts              # TypeScript interfaces for full platform
│   │   ├── App.css                  # Enterprise design system, cards & chart styles
│   │   ├── App.tsx                  # Main shell with role switching & theme toggle
│   │   ├── index.css                # CSS custom property tokens (Light & Dark theme)
│   │   └── main.tsx                 # React root entrypoint
│   ├── index.html                   # HTML document template
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json                # TypeScript compiler configuration
│   └── vite.config.ts               # Vite bundler configuration & proxy
└── README.md
```

---

## 🚀 Core Platform Features

### 1. Landing Page & Hero Triage
- Headline: *"Your Campus IT Support, Resolved Faster."*
- Large issue input bar with instant jump to Incident Resolver.
- Track ticket modal (`INC-2026-XXXX`).
- Sample operational metrics: 95% Issues Resolved, Avg Response 2 min, 5000+ Students Supported.
- Dark / Light theme toggle.

### 2. Incident Resolver Workbench
- Authentic Tier-1 university IT support technician persona.
- Step-by-step diagnostic workflow: `Diagnosing → Troubleshooting → Verification → Resolved / Escalated`.
- Dynamic contextual quick reply chips, message copying, and conversation reset.
- Voice input UI simulation / speech recognition.
- Error screenshot upload UI.
- Action logging directly into the active incident dossier.

### 3. Ticketing System (Kanban Board)
- 4 Kanban columns: `OPEN`, `IN PROGRESS`, `RESOLVED`, `ESCALATED`.
- Native drag-and-drop state progression with backend synchronization.
- Filter by Priority (Critical, High, Medium, Low), Category (9 campus domains), and Technician.
- Dossier inspection modal with problem synopsis, action audit trail, technician notes, and escalation details.

### 4. Knowledge Base
- 9 university IT categories: Wi-Fi, Password, Canvas / LMS, Printing, Software, VPN, Email, MFA / Duo, ResNet.
- Instant search and category filtering.
- Article reader with Markdown formatting, helpful upvoting, and copyable commands.
- Admin controls to create, edit, and delete documentation.

### 5. Campus Service Status
- Live health indicators for Eduroam, Canvas, Duo, PaperCut, ResNet, NetID, Computer Labs, and VPN.
- Statuses: `Operational`, `Degraded`, `Partial Outage`, `Major Outage`.
- Active incidents count, latency metrics, and scheduled maintenance bulletins.

### 6. Admin Operations Dashboard
- 8 specialized administrative sections:
  1. **Overview**: Live ticket queue, resolution efficiency KPIs, and interactive SVG charts (Priority Donut, 7-Day Resolution Line, Department Breakdown).
  2. **Tickets**: Full tabular management with status and technician reassignment.
  3. **AI Analytics**: Nemotron reasoning metrics, autonomous resolution ratio, and confidence scores.
  4. **Knowledge Base**: Article publishing and review.
  5. **Network Status**: RADIUS cluster, DNS, and SSO IdP telemetry probes.
  6. **Users**: Staff and student directory with status and skills.
  7. **Database**: In-memory record counters, table sizes, and integrity audits.
  8. **Settings**: SLA target thresholds, helpdesk hours, and AI escalation rules.

### 7. Host / Management Reports (Strictly READ-ONLY)
- Strict read-only enforcement (Host cannot modify tickets, users, KB, DB, or settings).
- Date range selector (Last 7 Days, Last 30 Days, This Semester, Year to Date).
- Department and category filtering.
- One-click CSV and JSON export.

---

## 🛠️ API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and AI engine health check |
| `POST` | `/api/chat` | AI diagnostic chat powered by NVIDIA Nemotron 3 Ultra |
| `GET` | `/api/tickets` | List incident tickets with search and filters |
| `POST` | `/api/tickets` | Create new IT incident ticket |
| `PATCH` | `/api/tickets/{id}` | Update ticket status, priority, or notes |
| `POST` | `/api/tickets/{id}/action` | Log diagnostic action to ticket audit trail |
| `POST` | `/api/tickets/{id}/resolve` | Formally resolve ticket with synopsis |
| `POST` | `/api/tickets/{id}/escalate` | Escalate ticket to Tier-2 / Tech Bar walkup |
| `GET` | `/api/status` | Campus infrastructure telemetry and bulletins |
| `GET` | `/api/kb` | Search and list knowledge base articles |
| `POST` | `/api/kb` | Create new knowledge base article (Admin) |
| `PUT` | `/api/kb/{id}` | Update knowledge base article (Admin) |
| `DELETE` | `/api/kb/{id}` | Delete knowledge base article (Admin) |
| `GET` | `/api/analytics/graphs` | Analytics charts and department breakdowns |
| `GET` | `/api/reports` | Executive management reports (Host) |
| `GET` | `/api/users` | Staff and technician directory |
| `GET` | `/api/diagnostics/probes` | Infrastructure diagnostic probes |
| `GET` | `/api/admin/database` | Database storage and table telemetry |

---

## 🚀 Running the Platform

### Backend
```bash
cd backend
.\venv\Scripts\Activate.ps1   # Windows PowerShell
python run.py                 # Runs on http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm run dev                   # Runs on http://localhost:5173
```
