import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from app.models.chat import ChatRequest, ChatResponse
from app.models.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    ActionLogCreate,
    TicketResolveRequest,
    TicketReassignRequest,
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
from app.models.users import (
    CampusUser,
    LoginRequest,
    LoginResponse,
    UserUpdateRequest,
    TechnicianCreateRequest,
    TechnicianUpdateRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    ALL_SPECIALIZATIONS,
)

from app.services.ai_service import ai_service
from app.services.ticket_service import ticket_service
from app.services.status_service import status_service
from app.services.kb_service import kb_service
from app.services.analytics_service import analytics_service
from app.services.users_service import users_service
from app.services.diagnostics_service import diagnostics_service
from app.services.auth_service import auth_service
from app.services.auth_deps import (
    get_current_user,
    get_current_user_optional,
    require_roles,
    require_host,
    require_technician_or_host,
)
from app.database import db

# Load environment variables
_backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(_backend_env):
    load_dotenv(dotenv_path=_backend_env)
else:
    load_dotenv()

app = FastAPI(
    title="CampusFix IT Platform — Backend API",
    description="University Helpdesk & Autonomous IT Incident Resolver Backend Service with Secure Authentication and RBAC",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.on_event("startup")
def on_startup():
    """Initializes Neon PostgreSQL connection and seeds baseline schemas."""
    connected = db.initialize()
    if connected:
        users_service.sync_to_db()
        ticket_service.sync_to_db()
        kb_service.sync_to_db()


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

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


# --- Root & Health Endpoints ---


@app.get("/")
def read_root():
    """Root endpoint: serves frontend SPA if built, otherwise API directory."""
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return {
        "name": "CampusFix IT Platform API",
        "tagline": "University Helpdesk & Incident Resolver",
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health",
        "auth": "/api/auth/login",
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
    db_status = db.health_check()
    return {
        "status": "ok",
        "message": "CampusFix IT Platform backend service is healthy and operational.",
        "service": "CampusFix IT Backend",
        "version": "1.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_ready": bool(os.getenv("OPENROUTER_API_KEY")),
        "model": os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b"),
        "database": {
            "connected": db_status.get("connected", False),
            "engine": db_status.get("engine", "In-Memory Resilience Mode"),
            "latency_ms": db_status.get("latency_ms"),
        },
    }


# --- Authentication & Authorization Endpoints ---


@app.post(
    "/api/auth/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate User, Technician, or Host with JWT token generation",
)
def login(login_data: LoginRequest):
    """
    Authenticates user credentials against backend-hashed passwords.
    Validates technician specialization and role requirements.
    Returns secure signed JWT Bearer token and sanitized user profile.
    """
    user, err = users_service.authenticate(
        username=login_data.username,
        password=login_data.password,
        specialization=login_data.specialization,
        role=login_data.role,
    )
    if err or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=err or "Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT access token with user claims and session specialization
    token = auth_service.create_access_token(
        user=user,
        specialization=login_data.specialization or user.specialization,
    )

    return LoginResponse(
        token=token,
        token_type="Bearer",
        user=user,
        expires_in=604800,
    )


@app.get(
    "/api/auth/me",
    response_model=CampusUser,
    status_code=status.HTTP_200_OK,
    summary="Get profile of currently authenticated user",
)
def get_current_user_profile(current_user: CampusUser = Depends(get_current_user)):
    """Returns the validated identity and permissions of the currently authenticated token bearer."""
    return current_user


@app.post(
    "/api/auth/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password for currently authenticated user or Host",
)
def change_password(
    data: ChangePasswordRequest,
    current_user: CampusUser = Depends(get_current_user),
):
    """Allows authenticated users (including Host/Admin) to change their password securely."""
    if len(data.new_password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 4 characters long.",
        )

    success, err = users_service.change_user_password(
        user_id=current_user.id,
        current_password=data.current_password,
        new_password=data.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or "Unable to change password. Current password incorrect.",
        )

    return {
        "status": "success",
        "message": f"Password updated successfully for account '{current_user.name}'.",
    }


@app.get(
    "/api/auth/specializations",
    status_code=status.HTTP_200_OK,
    summary="List available technician specializations",
)
def get_specializations():
    """Returns official campus technician specializations."""
    return {
        "specializations": ALL_SPECIALIZATIONS,
    }


# --- AI Chat Support Endpoint ---


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
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query across ticket ID, title, description, or netid"),
    assigned_technician: Optional[str] = Query(None, description="Filter by assigned technician"),
    specialization: Optional[str] = Query(None, description="Filter by technician specialization"),
):
    """Returns a list of campus IT incident tickets sorted newest first."""
    return ticket_service.list_tickets(
        status=status,
        category=category,
        search=search,
        assigned_technician=assigned_technician,
        specialization=specialization,
    )


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
    "/api/tickets/{ticket_id}/close",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Officially close and archive an IT incident",
)
def close_ticket(ticket_id: str, notes: Optional[Dict[str, Any]] = None):
    """Marks ticket as Closed, finalized, and archives the incident in the audit ledger."""
    close_notes = notes.get("notes") if notes and isinstance(notes, dict) else None
    ticket = ticket_service.close_ticket(ticket_id, close_notes)
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
    summary="Escalate an incident to target specialization, senior tech, or Host/Admin",
)
def escalate_ticket(ticket_id: str, escalation_info: EscalationDetails):
    """Escalates an incident with routing reason, assigned tier, target specialization, and dispatch details."""
    ticket = ticket_service.escalate_ticket(ticket_id, escalation_info)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


@app.post(
    "/api/tickets/{ticket_id}/reassign",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Host / Admin reassigns a ticket to another technician",
)
def reassign_ticket(
    ticket_id: str,
    req: TicketReassignRequest,
    current_user: Optional[CampusUser] = Depends(get_current_user_optional),
):
    """Reassigns an escalated or stuck ticket to a new active technician, resetting status to Diagnosing."""
    actor_name = current_user.name if current_user else "Host / Admin"
    ticket = ticket_service.reassign_technician(
        ticket_id=ticket_id,
        new_technician=req.new_technician,
        reassignment_notes=req.reassignment_notes,
        actor=actor_name,
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident ticket '{ticket_id}' not found.",
        )
    return ticket


# --- Host Technician Management Endpoints (Strict RBAC Protected) ---


@app.get(
    "/api/technicians",
    response_model=List[CampusUser],
    status_code=status.HTTP_200_OK,
    summary="List all technician accounts with live status and workloads (Host & Tech)",
)
def get_technicians(current_user: CampusUser = Depends(require_technician_or_host)):
    """Returns directory of all registered technicians with specializations and workloads."""
    return users_service.list_technicians()


@app.post(
    "/api/technicians",
    response_model=CampusUser,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new technician account (Host Only)",
)
def create_technician(
    data: TechnicianCreateRequest,
    current_user: CampusUser = Depends(require_host),
):
    """Host endpoint to register and provision a new campus IT technician with secure hashed credentials."""
    user, err = users_service.create_technician(data)
    if err or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or "Failed to create technician.",
        )
    return user


@app.get(
    "/api/technicians/{tech_id}",
    response_model=CampusUser,
    status_code=status.HTTP_200_OK,
    summary="Get single technician profile by ID or username",
)
def get_technician_by_id(
    tech_id: str,
    current_user: CampusUser = Depends(require_technician_or_host),
):
    """Retrieves technician profile information and assignment details."""
    tech = users_service.get_technician(tech_id)
    if not tech:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Technician '{tech_id}' not found.",
        )
    return tech


@app.put(
    "/api/technicians/{tech_id}",
    response_model=CampusUser,
    status_code=status.HTTP_200_OK,
    summary="Update technician profile, specialization, active status, or details (Host Only)",
)
def update_technician(
    tech_id: str,
    data: TechnicianUpdateRequest,
    current_user: CampusUser = Depends(require_host),
):
    """Host endpoint to edit technician details, change specialization, or toggle active/inactive status."""
    tech, err = users_service.update_technician(tech_id, data)
    if err or not tech:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or f"Technician '{tech_id}' not found.",
        )
    return tech


@app.post(
    "/api/technicians/{tech_id}/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset a technician's password (Host Only)",
)
def reset_technician_password(
    tech_id: str,
    data: ResetPasswordRequest,
    current_user: CampusUser = Depends(require_host),
):
    """Host endpoint to reset a technician's password."""
    if len(data.new_password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long.",
        )

    success, err = users_service.reset_technician_password(tech_id, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or f"Technician '{tech_id}' not found.",
        )
    return {
        "status": "success",
        "message": f"Password reset successfully for technician '{tech_id}'.",
    }


# --- User Directory Endpoints ---


@app.get(
    "/api/users",
    response_model=List[CampusUser],
    status_code=status.HTTP_200_OK,
    summary="List IT staff and users (Admin & Host)",
)
def list_users(
    role: Optional[str] = Query(None, description="Filter by role (student, technician, host, admin)"),
    current_user: Optional[CampusUser] = Depends(get_current_user_optional),
):
    """Returns directory of technicians, staff administrators, and students."""
    return users_service.list_users(role=role)


@app.patch(
    "/api/users/{user_id}/status",
    response_model=CampusUser,
    status_code=status.HTTP_200_OK,
    summary="Update user / technician status",
)
def update_user_status(
    user_id: str,
    status_val: str = Query(..., description="Status (active, away, offline)"),
    current_user: CampusUser = Depends(require_technician_or_host),
):
    """Updates technician availability status."""
    user = users_service.update_user_status(user_id, status_val)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )
    return user


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
    category: Optional[str] = Query(None, description="Filter by category"),
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
    summary="Create new knowledge base article (Staff/Host)",
)
def create_kb_article(
    data: KBArticleCreate,
    current_user: Optional[CampusUser] = Depends(get_current_user_optional),
):
    """Endpoint to publish a new IT help procedure."""
    return kb_service.create_article(data)


@app.put(
    "/api/kb/{article_id}",
    response_model=KBArticle,
    status_code=status.HTTP_200_OK,
    summary="Update knowledge base article (Staff/Host)",
)
def update_kb_article(
    article_id: str,
    data: KBArticleUpdate,
    current_user: Optional[CampusUser] = Depends(get_current_user_optional),
):
    """Endpoint to edit existing IT documentation."""
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
    summary="Delete knowledge base article (Staff/Host)",
)
def delete_kb_article(
    article_id: str,
    current_user: Optional[CampusUser] = Depends(get_current_user_optional),
):
    """Endpoint to remove an obsolete help article."""
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


# --- Analytics & Reports Endpoints ---


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
    summary="Get comprehensive analytics charts and breakdowns",
)
def get_analytics_graphs(current_user: Optional[CampusUser] = Depends(get_current_user_optional)):
    """Provides chart datasets: Priority donut, resolution trend, department breakdown, technician workloads."""
    return analytics_service.get_graphs_overview()


@app.get(
    "/api/reports",
    response_model=ReportSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get management reports summary (Host / Executive)",
)
def get_reports_summary(
    date_range: Optional[str] = Query("Last 30 Days", description="Date range"),
    department: Optional[str] = Query("All", description="Filter by department"),
    category: Optional[str] = Query("All", description="Filter by category"),
    current_user: Optional[CampusUser] = Depends(get_current_user_optional),
):
    """Returns executive incident metrics and SLA performance for Host review."""
    return analytics_service.get_report_summary(date_range=date_range, department=department, category=category)


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
    summary="Get database storage and record counts",
)
def get_database_overview(current_user: Optional[CampusUser] = Depends(get_current_user_optional)):
    """Returns table record counts, schema version, and storage telemetry."""
    return diagnostics_service.get_database_overview()


@app.post(
    "/api/admin/reset-data",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Reset system data (Purge tickets and restore clean fresh state)",
)
def reset_system_data(current_user: Optional[CampusUser] = Depends(get_current_user_optional)):
    """Wipes all custom tickets and resets database to a fresh clean state."""
    ticket_res = ticket_service.reset_data()
    users_res = users_service.reset_data()
    return {
        "status": "success",
        "message": "System data successfully purged and restored to fresh clean state.",
        "tickets": ticket_res,
        "users": users_res,
    }


# --- Single Page Application (SPA) Fallback Route ---


@app.get("/{full_path:path}")
async def serve_spa_or_file(full_path: str):
    """
    Catch-all route to serve static assets or fallback to index.html for client-side routing.
    Ensures that visiting /resolver, /tickets, /kb, /admin, /reports directly does not return 404.
    """
    if full_path.startswith("api/") or full_path == "api" or full_path in ["docs", "redoc", "openapi.json"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API endpoint '/{full_path}' not found.",
        )

    # Check for direct file match in dist (e.g. favicon.ico, vite.svg, etc.)
    target_file = os.path.join(frontend_dist, full_path)
    if os.path.isfile(target_file):
        return FileResponse(target_file)

    # SPA Fallback to index.html
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Resource '/{full_path}' not found.",
    )
