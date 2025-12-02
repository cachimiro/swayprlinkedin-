# SwayPR LinkedIn Outreach Automation

A feasibility and implementation plan for a custom LinkedIn outreach automation tool that schedules warm, personalized messages
from the SwayPR LinkedIn account while tracking responses. The design favors official LinkedIn APIs when available and falls back
to browser automation only if necessary. Supabase serves as the data and auth backend for the standalone web/desktop app.

## Objectives
- Authenticate as the SwayPR LinkedIn account and access 1st-degree connections.
- Categorize contacts by industry and location for targeted messaging.
- Compose personalized message templates with placeholders (e.g., `{first_name}`, `{company}`).
- Schedule controlled outreach (e.g., ~10 messages per weekday with randomized intervals).
- Log sends and monitor replies, including simple sentiment tagging.
- Maintain safety by adhering to LinkedIn limits and pausing on errors or restrictions.

## Architecture Overview
- **Frontend:** Web UI (React/Vue) with optional Electron wrapper for desktop distribution.
- **Backend/API:** Node.js or Python service (or Supabase Edge Functions) handling LinkedIn API calls, scheduling, and webhook-style polling for replies.
- **Database:** Supabase Postgres for contacts, campaigns, templates, send logs, and reply tracking; Supabase Auth for LinkedIn OAuth token storage if desired.
- **Scheduler/Jobs:** Cron-like worker to drip sends, enforce rate limits, and retry on transient failures.

## LinkedIn Integration Strategy
1. **Primary:** Register a LinkedIn App, use OAuth2 to obtain tokens with `r_1st_connections` and messaging scopes. Implement token refresh and secure storage (Supabase secrets/kv or encrypted DB column).
2. **Messaging:** Use LinkedIn Messages API to send individual messages (max 10 recipients per call) with per-contact personalization. Randomize delays (e.g., 15–30 minutes) and cap daily volume.
3. **Data:** Use Connections + Profile APIs (with projection) to fetch names, headlines, location, and industry/company info. If industry is missing, infer via company industry codes or headline keywords.
4. **Fallback:** If required scopes are denied, support a headless browser automation path (Puppeteer/Selenium) with strict throttling, human-like timing, and compliance safeguards. Clearly gate this behind an admin setting with warning copy.

## Data Model (Supabase)
- `contacts`: `id` (LinkedIn URN), `first_name`, `last_name`, `headline`, `company`, `industry`, `location`, `last_refreshed_at`.
- `segments`: derived materialized view or table mapping `industry` + `location` to contact counts.
- `templates`: `id`, `name`, `body`, `placeholders`, `industry_filter`, `location_filter`.
- `campaigns`: `id`, `segment_criteria`, `template_id`, `status`, `schedule` (days, window, per-day cap, random delay bounds).
- `messages`: `id`, `campaign_id`, `contact_id`, `personalized_body`, `scheduled_for`, `sent_at`, `status`, `error`.
- `replies`: `id`, `contact_id`, `campaign_id`, `received_at`, `snippet`, `sentiment` (positive/neutral/negative), `linked_message_id`.

## Core Workflows
1. **Contact Sync**
   - OAuth login as SwayPR account; fetch connections with projection for name/location.
   - Fetch/infer industry via profile/company data; store/update contacts; backfill missing fields asynchronously.
   - Re-sync on schedule (e.g., nightly) to catch new connections or changes.

2. **Segmentation**
   - Group contacts by `industry` and `location` (country/region buckets). UI lists counts per segment with filters and search.

3. **Template Management**
   - Create/edit templates with placeholders. Provide preview per sample contact. Validate required placeholders.

4. **Campaign Scheduling & Send**
   - User picks segment + template, defines cadence (e.g., 10/day, Mon–Fri, 9am–5pm, 15–30 min randomness).
   - System generates `messages` rows with scheduled timestamps; job runner dispatches one-by-one via API.
   - Implement backoff on API errors, pause campaign on rate-limit/abuse signals, and log every send.

5. **Reply Monitoring**
   - Poll LinkedIn inbox (API or automation) for threads with messaged contacts; mark replies and store snippets.
   - Optional sentiment/intent tagging (keyword rules or lightweight NLP); surface notifications in UI and via email.

6. **Prospecting Extension (Optional)**
   - Use LinkedIn search/Sales Navigator (API or scraped results) to find 2nd-degree prospects by industry/location.
   - Automate limited connection invites (e.g., 5/day) with notes; on acceptance, move to normal messaging flow.

## Safety & Compliance
- Keep volume conservative (≤10 DMs/day, ≤50/week) with randomized intervals and weekday-only sends.
- Only user-triggered campaigns; no unsolicited bulk blasts.
- Store tokens securely; audit logs for admin review. Allow quick "panic pause" for all sends.
- Clearly document ToS risks of non-API automation; prefer official endpoints whenever possible.

## Implementation Phases
1. **Foundation:** LinkedIn OAuth, Supabase schema, minimal UI scaffold, contact sync job.
2. **Segmentation & Templates:** Industry/location grouping, template CRUD with preview.
3. **Scheduling & Sending:** Job runner with throttling, send logging, campaign controls/pause/resume.
4. **Replies & Analytics:** Inbox polling, sentiment tagging, dashboard metrics (send volume, reply rate, positive reply rate).
5. **Prospecting (Optional):** Search + invite workflow and post-acceptance messaging.

## Desktop Packaging (Optional)
Wrap the web app in Electron for Mac/Windows distribution, reusing the same frontend and calling the backend API.

## Testing Checklist
- Unit: template rendering, industry/location classification, scheduler timing math.
- Integration: OAuth flow, API send/poll cycles, DB migrations.
- Safety drills: rate-limit simulation, paused campaigns, invalid token handling.
- Staging run with a small contact subset to validate LinkedIn behavior before full rollout.

## Getting Started (initial backend scaffold)
A minimal FastAPI backend is available to demonstrate contact sync, segmentation, and scheduling logic with stubbed data.

1. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Run the API locally:
   ```bash
   uvicorn app.main:app --reload
   ```

3. Preview the API in your browser:
   - Open http://localhost:8000/ for a lightweight preview page showing snapshot counts and quickstart steps.
   - Open the automatically generated docs at http://localhost:8000/docs to exercise endpoints without writing code.
   - The redoc view is also available at http://localhost:8000/redoc if you prefer a reference-style layout.

4. Quick verification via cURL/HTTPie:
   ```bash
   # Health check
   http GET :8000/health

   # Sync mock contacts (returns counts for ingest/updated)
   http POST :8000/contacts/sync

   # Inspect grouped segments
   http GET :8000/segments

   # Create a sample campaign
   http POST :8000/campaigns \
     contact_ids:='["urn:li:person:1","urn:li:person:2"]' \
     template:='Hello {first_name}, checking in from SwayPR.'
   ```

5. Sample workflow via HTTP:
   - `POST /contacts/sync` to populate mock contacts.
   - `GET /segments` to view industry/location groupings.
   - `POST /campaigns` with contact IDs and a template to see generated send times and personalized bodies.

This scaffold keeps state in memory; persistence, OAuth, and LinkedIn API wiring will be added next.
