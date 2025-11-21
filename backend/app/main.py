"""
Minimal FastAPI scaffold for the SwayPR LinkedIn outreach automation service.
This provides initial endpoints for contact sync (stubbed), segmentation,
and campaign scheduling to demonstrate early progress.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, validator

from .state import get_state, ScheduleWindow, schedule_campaign_for_contacts

app = FastAPI(title="SwayPR Outreach", version="0.1.0")


@app.get("/", response_class=HTMLResponse)
async def index() -> str:
    state = get_state()
    contacts_loaded = len(state.contacts)
    segment_count = len(state.segments()) if contacts_loaded else 0

    return f"""
    <html>
      <head><title>SwayPR Outreach Preview</title></head>
      <body>
        <h1>SwayPR Outreach Preview</h1>
        <p>Use this lightweight preview to exercise the stubbed FastAPI backend.</p>
        <ul>
          <li><a href=\"/docs\">Open Swagger UI</a> for interactive exploration.</li>
          <li><a href=\"/redoc\">View ReDoc</a> for reference-style docs.</li>
        </ul>
        <h2>Quickstart</h2>
        <ol>
          <li>POST <code>/contacts/sync</code> to load mock contacts.</li>
          <li>GET <code>/segments</code> to see grouped industries/locations.</li>
          <li>POST <code>/campaigns</code> with contact IDs and a template to preview scheduled messages.</li>
        </ol>
        <p>Current in-memory snapshot: {contacts_loaded} contact(s), {segment_count} segment(s). Refresh after syncing contacts.</p>
      </body>
    </html>
    """


class Contact(BaseModel):
    id: str = Field(..., description="LinkedIn URN or identifier")
    first_name: str
    last_name: str
    headline: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None


class ContactSyncRequest(BaseModel):
    token_hint: Optional[str] = Field(
        None,
        description="Placeholder for the LinkedIn access token. The current implementation uses stub data.",
    )


class ScheduleRequest(BaseModel):
    name: str
    contact_ids: List[str]
    template_body: str = Field(..., description="Message template with placeholders like {first_name}")
    per_day: int = Field(..., ge=1, le=50)
    timezone: str = Field("UTC", description="IANA timezone for scheduling")
    window_start: str = Field("09:00", regex=r"^\d{2}:\d{2}$")
    window_end: str = Field("17:00", regex=r"^\d{2}:\d{2}$")
    days: List[str] = Field(
        default_factory=lambda: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        description="Days of week for sending",
    )
    random_delay_minutes: List[int] = Field(
        default_factory=lambda: [15, 30], description="Min/max random delay between sends in minutes"
    )

    @validator("random_delay_minutes")
    def _validate_delay(cls, value: List[int]) -> List[int]:
        if len(value) != 2 or value[0] <= 0 or value[1] < value[0]:
            raise ValueError("random_delay_minutes must be [min, max] with min > 0 and max >= min")
        return value


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/contacts/sync", response_model=List[Contact])
async def sync_contacts(payload: ContactSyncRequest) -> List[Contact]:
    state = get_state()
    synced_contacts = state.sync_contacts_stub()
    return [Contact(**c) for c in synced_contacts]


@app.get("/segments")
async def list_segments() -> list:
    state = get_state()
    return state.segments()


@app.post("/campaigns")
async def schedule_campaign(request: ScheduleRequest) -> dict:
    state = get_state()
    missing = [cid for cid in request.contact_ids if cid not in state.contacts]
    if missing:
        raise HTTPException(status_code=400, detail={"missing_contacts": missing})

    window = ScheduleWindow(
        window_start=request.window_start,
        window_end=request.window_end,
        days=request.days,
        timezone=request.timezone,
        per_day=request.per_day,
        random_delay_minutes=tuple(request.random_delay_minutes),
    )
    schedule = schedule_campaign_for_contacts(
        contacts=[state.contacts[cid] for cid in request.contact_ids],
        window=window,
        template=request.template_body,
    )
    campaign_id = state.save_campaign(request.name, schedule)
    return {"campaign_id": campaign_id, "scheduled_messages": schedule}
