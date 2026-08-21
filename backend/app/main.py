import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.models.chat import ChatRequest, ChatResponse
from app.models.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    ActionLogCreate,
    TicketResolveRequest,
    EscalationDetails,
)
from app.models.service_status import SystemStatusResponse
from app.models.knowledge_base import (
    KBArticle,
    KBArticleCreate,
    KBArticleUpdate,
    KBSearchResponse,
)
from app.models.analytics import (
    KPIStats,
    AnalyticsGraphsResponse,
    ReportSummaryResponse,
)
from app.models.diagnostics import DiagnosticsReportResponse
from app.models.users import CampusUser

from app.services.ai_service import ai_service
from app.services.ticket_service import ticket_service
from app.services.status_service import status_service
from app.services.kb_service import kb_service
from app.services.analytics_service import analytics_service
from app.services.users_service import users_service
from app.services.diagnostics_service import diagnostics_service

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CampusFix IT Platform — Backend API",
    description="University Helpdesk & Autonomous IT Incident Resolver Backend Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS origins (allowing frontend dev server)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Allow custom CORS origins from env
custom_origins = os.getenv("CORS_ORIGINS")
if custom_origins:
    origins.extend([origin.strip() for origin in custom_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Root endpoint providing service overview."""
    return {
        "name": "CampusFix IT Platform API",
        "tagline": "University Helpdesk & Incident Resolver",
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health",
        "chat": "/api/chat",
        "tickets": "/api/tickets",
        "status_panel": "/api/status",
        "knowledge_base": "/api/kb",
        "analytics": "/api/analytics/graphs",
        "reports": "/api/reports",
    }


@app.get("/api/health")
def health_check():
    """
    Health check endpoint for frontend and monitoring.
    Confirms backend server is operational and responsive.
    """
    return {
        "status": "ok",
        "message": "CampusFix IT Platform backend service is healthy and operational.",
        "service": "CampusFix IT Backend",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_ready": bool(os.getenv("OPENROUTER_API_KEY")),
        "model": os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b"),
    }


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with CampusFix Autonomous IT Support Agent",
)
async def chat_with_agent(request: ChatRequest):
    """
    Processes student IT support conversation and generates diagnostic/troubleshooting
    responses powered by NVIDIA Nemotron 3 Ultra via OpenRouter.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message list cannot be empty.",
        )

    try:
        response = await ai_service.generate_response(request.messages)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Service processing error: {str(e)}",
        )


# --- Incident / Ticket Management Endpoints ---


@app.get(
    "/api/tickets",
    response_model=List[TicketResponse],
    status_code=status.HTTP_200_OK,
    summary="List all IT incidents with optional filtering",
)
def get_tickets(
    status: Optional[str] = Query(None, description="Filter by status (New, Diagnosing, Waiting for Student, Resolved, Escalated, Open, In Progress, Closed)"),
    category: Optional[str] = Query(None, description="Filter by category (Eduroam Wi-Fi, Canvas / SSO, Duo MFA, PaperCut Printing, Dorm ResNet, NetID / Password, Lab / Computer Access)"),
    search: Optional[str] = Query(None, description="Search query across ticket ID, title, description, or netid"),
):
    """Returns a list of campus IT incident tickets sorted newest first."""
    return ticket_service.list_tickets(status=status, category=category, search=search)


@app.post(
    "/api/tickets",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campus IT incident ticket",
)
def create_ticket(ticket_data: TicketCreate):
    """Registers a new IT incident with auto-generated INC ID and initializes diagnostic state."""
    return ticket_service.create_ticket(ticket_data)


@app.get(
    "/api/tickets/{ticket_id}",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve single IT incident by ID or ticket number",
)
def get_ticket(ticket_id: str):
    """Fetches full dossier and audit logs for a specific incident."""
    ticket = ticket_service.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


@app.patch(
    "/api/tickets/{ticket_id}",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Update incident status, priority, category, or technician notes",
)
def update_ticket(ticket_id: str, update_data: TicketUpdate):
    """Updates incident fields, progresses diagnostic stage, or appends technician notes."""
    ticket = ticket_service.update_ticket(ticket_id, update_data)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


@app.post(
    "/api/tickets/{ticket_id}/action",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Append a diagnostic action log item to an incident",
)
def log_ticket_action(ticket_id: str, action_data: ActionLogCreate):
    """Appends an executed diagnostic test or remediation step to the incident action log."""
    ticket = ticket_service.add_action_log(
        ticket_id=ticket_id,
        action=action_data.action,
        result=action_data.result,
        actor=action_data.actor or "technician",
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


@app.post(
    "/api/tickets/{ticket_id}/resolve",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark an incident as Resolved with resolution details",
)
def resolve_ticket(ticket_id: str, req: TicketResolveRequest):
    """Resolves an incident, sets diagnostic progress to 100%, and records resolution synopsis."""
    ticket = ticket_service.resolve_ticket(ticket_id, req.resolution_details)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


@app.post(
    "/api/tickets/{ticket_id}/escalate",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Escalate an incident to Tier-2 / Tech Bar walkup",
)
def escalate_ticket(ticket_id: str, escalation_info: EscalationDetails):
    """Escalates an incident with routing reason, assigned tier, and Tech Bar walkup dispatch details."""
    ticket = ticket_service.escalate_ticket(ticket_id, escalation_info)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


# --- Campus Infrastructure Service Status ---


@app.get(
    "/api/status",
    response_model=SystemStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get live campus IT service health and announcements",
)
def get_campus_status():
    """Returns real-time status, uptime %, and latency for all campus services and active maintenance bulletins."""
    return status_service.get_system_status()


# --- Knowledge Base Endpoints ---


@app.get(
    "/api/kb",
    response_model=KBSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search & list campus IT knowledge base articles",
)
def list_kb_articles(
    category: Optional[str] = Query(None, description="Filter by category (Wi-Fi, Password, Canvas / LMS, Printing, Software, VPN, Email, MFA / Duo, ResNet)"),
    search: Optional[str] = Query(None, description="Keyword search in title, tags, or content"),
):
    """Retrieves published knowledge base articles matching search/category criteria."""
    return kb_service.list_articles(category=category, search=search)


@app.get(
    "/api/kb/{article_id}",
    response_model=KBArticle,
    status_code=status.HTTP_200_OK,
    summary="Get single knowledge base article by ID or slug",
)
def get_kb_article(article_id: str):
    """Retrieves full markdown content for a knowledge article."""
    article = kb_service.get_article(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge article '{article_id}' not found.",
        )
    return article


@app.post(
    "/api/kb",
    response_model=KBArticle,
    status_code=status.HTTP_201_CREATED,
    summary="Create new knowledge base article (Admin)",
)
def create_kb_article(data: KBArticleCreate):
    """Admin endpoint to publish a new IT help procedure."""
    return kb_service.create_article(data)


@app.put(
    "/api/kb/{article_id}",
    response_model=KBArticle,
    status_code=status.HTTP_200_OK,
    summary="Update knowledge base article (Admin)",
)
def update_kb_article(article_id: str, data: KBArticleUpdate):
    """Admin endpoint to edit existing IT documentation."""
    article = kb_service.update_article(article_id, data)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge article '{article_id}' not found.",
        )
    return article


@app.delete(
    "/api/kb/{article_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete knowledge base article (Admin)",
)
def delete_kb_article(article_id: str):
    """Admin endpoint to remove an obsolete help article."""
    success = kb_service.delete_article(article_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge article '{article_id}' not found.",
        )
    return {"status": "deleted", "article_id": article_id}


@app.post(
    "/api/kb/{article_id}/helpful",
    response_model=KBArticle,
    status_code=status.HTTP_200_OK,
    summary="Increment helpful upvote for article",
)
def vote_kb_article_helpful(article_id: str):
    """Registers user helpful feedback on IT guide."""
    article = kb_service.vote_helpful(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge article '{article_id}' not found.",
        )
    return article


# --- Analytics & Reports Endpoints (Admin & Host) ---


@app.get(
    "/api/analytics/kpis",
    response_model=KPIStats,
    status_code=status.HTTP_200_OK,
    summary="Get live IT Helpdesk KPIs",
)
def get_analytics_kpis():
    """Computes real-time resolution rates, ticket volumes, and AI efficiency metrics."""
    return analytics_service.get_kpis()


@app.get(
    "/api/analytics/graphs",
    response_model=AnalyticsGraphsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get comprehensive analytics charts and breakdowns (Admin)",
)
def get_analytics_graphs():
    """Provides chart datasets: Priority donut, resolution trend, department breakdown, technician workloads."""
    return analytics_service.get_graphs_overview()


@app.get(
    "/api/reports",
    response_model=ReportSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get management reports summary (Host Role - Read Only)",
)
def get_reports_summary(
    date_range: Optional[str] = Query("Last 30 Days", description="Date range (Last 7 Days, Last 30 Days, This Semester, Year to Date)"),
    department: Optional[str] = Query("All", description="Filter by department"),
    category: Optional[str] = Query("All", description="Filter by category"),
):
    """Returns executive incident metrics and SLA performance for Host read-only review."""
    return analytics_service.get_report_summary(date_range=date_range, department=department, category=category)


# --- User & Technician Roster Endpoints ---


@app.get(
    "/api/users",
    response_model=List[CampusUser],
    status_code=status.HTTP_200_OK,
    summary="List IT staff and users (Admin)",
)
def list_users(role: Optional[str] = Query(None, description="Filter by role (student, technician, admin, host)")):
    """Returns directory of technicians, staff administrators, and students."""
    return users_service.list_users(role=role)


@app.patch(
    "/api/users/{user_id}/status",
    response_model=CampusUser,
    status_code=status.HTTP_200_OK,
    summary="Update technician status (Admin)",
)
def update_user_status(user_id: str, status_val: str = Query(..., description="Status (active, away, offline)")):
    """Updates technician availability status."""
    user = users_service.update_user_status(user_id, status_val)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )
    return user


# --- Diagnostics & Database Telemetry Endpoints ---


@app.get(
    "/api/diagnostics/probes",
    response_model=DiagnosticsReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute diagnostic health probes across campus infrastructure",
)
def run_diagnostics_probes():
    """Runs telemetry probes for RADIUS, DNS, SSO, OpenRouter AI, and database storage."""
    return diagnostics_service.get_probes_report()


@app.get(
    "/api/admin/database",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get database storage and record counts (Admin)",
)
def get_database_overview():
    """Returns table record counts, schema version, and storage telemetry."""
    return diagnostics_service.get_database_overview()
