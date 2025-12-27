# Event-Sourced Dashboard Architecture

## Core Principle

**Every dashboard metric is derived from raw events, not counters.**

No `increment += 1` logic. Everything is recomputable from source data.

## Event Model

### Single Source of Truth: `outreach_events`

Every row = one atomic event.

```sql
CREATE TABLE outreach_events (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    campaign_id UUID,
    lead_id UUID,
    event_type outreach_event_type NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ
);
```

### Event Types

```typescript
type OutreachEventType =
  | "message_queued"      // Message added to send queue
  | "message_sent"        // Message successfully sent
  | "message_failed"      // Message failed to send
  | "reply_received"      // Reply received from lead
  | "reply_classified"    // Reply processed/classified
  | "followup_scheduled"  // Follow-up scheduled
  | "followup_sent"       // Follow-up sent
  | "campaign_paused"     // Campaign paused
  | "campaign_resumed"    // Campaign resumed
  | "automation_throttled"// Automation throttled
  | "automation_resumed"  // Automation resumed
  | "captcha_detected"    // Captcha detected
  | "manual_action_required"; // Manual action needed
```

**Rule:** If it didn't generate an event, it doesn't exist.

## KPI Calculations

### 1. Today's Sends

**Definition:** Messages successfully sent today.

**Query:**
```sql
SELECT COUNT(*) 
FROM outreach_events
WHERE event_type = 'message_sent'
  AND event_timestamp >= CURRENT_DATE
  AND workspace_id = ?
```

**Status Color:**
- < 70% of daily cap → Green
- 70-90% → Amber
- > 90% → Red

**View:** `v_todays_sends`

### 2. Replies Requiring Action

**Definition:** Replies received that have not been processed.

**Logic:**
- `event_type = 'reply_received'`
- No corresponding `reply_classified` OR `manual_action_required`
- Timestamp irrelevant (always live)

**This is a queue size, not a count of replies.**

**Query:**
```sql
SELECT COUNT(DISTINCT lead_id)
FROM outreach_events
WHERE event_type = 'reply_received'
  AND lead_id NOT IN (
    SELECT DISTINCT lead_id 
    FROM outreach_events 
    WHERE event_type IN ('reply_classified', 'manual_action_required')
  )
  AND workspace_id = ?
```

**View:** `v_replies_requiring_action`

### 3. Reply Rate (7 Days)

**Definition:** Replies ÷ messages sent over last 7 days.

**Logic:**
1. Get all messages sent in last 7 days
2. Get all replies from those leads after their first message
3. Calculate: `(replies / messages_sent) * 100`

**Important:** Replies outside the window do not count.

**Query:**
```sql
WITH sent_last_7d AS (
  SELECT workspace_id, lead_id, MIN(event_timestamp) as first_message_at
  FROM outreach_events
  WHERE event_type = 'message_sent'
    AND event_timestamp >= NOW() - INTERVAL '7 days'
  GROUP BY workspace_id, lead_id
),
replies_last_7d AS (
  SELECT e.workspace_id, e.lead_id
  FROM outreach_events e
  INNER JOIN sent_last_7d s ON e.lead_id = s.lead_id
  WHERE e.event_type = 'reply_received'
    AND e.event_timestamp >= s.first_message_at
  GROUP BY e.workspace_id, e.lead_id
)
SELECT 
  ROUND((COUNT(DISTINCT r.lead_id)::NUMERIC / COUNT(DISTINCT s.lead_id)::NUMERIC) * 100) as reply_rate_pct
FROM sent_last_7d s
LEFT JOIN replies_last_7d r ON s.lead_id = r.lead_id
WHERE s.workspace_id = ?
```

**View:** `v_reply_rate_7d`

### 4. System Status

**Derived, never manually set.**

**Rules (priority order):**
1. If `captcha_detected` in last 24h → **Error**
2. If `automation_throttled` without `automation_resumed` → **Throttled**
3. If all campaigns paused → **Paused**
4. Else → **Healthy**

**One status only. No ambiguity.**

**View:** `v_system_status`

## Next Actions Engine

Rule-based, not static content.

### Example Rules

```typescript
// Rule 1: No contacts
if (contacts.count === 0) {
  return {
    priority: 1,
    title: "Import contacts to unlock campaigns",
    action: "import_contacts",
    url: "/dashboard/leads"
  };
}

// Rule 2: No daily send cap
if (daily_send_cap === null) {
  return {
    priority: 2,
    title: "Set daily sending limit",
    action: "configure_limit",
    url: "/dashboard/settings"
  };
}

// Rule 3: Replies needing action
if (replies_needing_action > 0) {
  return {
    priority: 3,
    title: `${replies_needing_action} replies waiting review`,
    action: "review_replies",
    url: "/dashboard/inbox"
  };
}

// Rule 4: Campaign paused with enrollments
if (campaign.paused && enrollments > 0) {
  return {
    priority: 4,
    title: `Campaign "${name}" paused with ${enrollments} active enrollments`,
    action: "resume_campaign",
    url: `/dashboard/campaigns/${id}`
  };
}

// Rule 5: Follow-ups scheduled today
if (followups_today > 0) {
  return {
    priority: 5,
    title: `${followups_today} follow-ups due today`,
    action: "view_followups",
    url: "/dashboard/tasks"
  };
}
```

**Only top 5 shown.**

## Account Health Panel

Derived entirely from events.

### Metrics

**Last LinkedIn Action:**
```sql
SELECT MAX(event_timestamp)
FROM outreach_events
WHERE event_type = 'message_sent'
  AND workspace_id = ?
```

**Cooldown Active:**
```sql
EXISTS (
  SELECT 1 FROM outreach_events
  WHERE event_type = 'automation_throttled'
    AND event_timestamp >= NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM outreach_events e2
      WHERE e2.event_type = 'automation_resumed'
        AND e2.event_timestamp > outreach_events.event_timestamp
    )
)
```

**Errors (24h):**
```sql
SELECT COUNT(*)
FROM outreach_events
WHERE event_type IN ('message_failed', 'captcha_detected')
  AND event_timestamp >= NOW() - INTERVAL '24 hours'
  AND workspace_id = ?
```

**If all green → panel hidden.**

**View:** `v_account_health`

## Campaign Execution Snapshot

Per campaign, **today only**.

### Metrics

**Today's Sends:**
```sql
SELECT COUNT(*)
FROM outreach_events
WHERE event_type = 'message_sent'
  AND event_timestamp >= CURRENT_DATE
  AND campaign_id = ?
```

**Queue Remaining:**
```sql
SELECT COUNT(*)
FROM campaign_enrollments
WHERE campaign_id = ?
  AND state = 'active'
```

**Replies Today:**
```sql
SELECT COUNT(DISTINCT lead_id)
FROM outreach_events
WHERE event_type = 'reply_received'
  AND event_timestamp >= CURRENT_DATE
  AND campaign_id = ?
```

**Status:** Derived from latest campaign event.

**No historical totals allowed here.**

**View:** `v_campaign_snapshot_today`

## API Endpoints

### GET /api/dashboard/stats-v2

Returns all dashboard KPIs computed from events.

**Response:**
```typescript
{
  kpis: {
    todaySends: number;
    dailyLimit: number;
    repliesNeedingAction: number;
    replyRate: number;
    systemStatus: "Healthy" | "Throttled" | "Paused" | "Error";
    systemStatusReason: string;
    sendPercentage: number;
  };
  nextActions: Array<{
    priority: number;
    title: string;
    action: string;
    url: string;
  }>;
  campaignSnapshots: Array<{
    id: string;
    name: string;
    status: "Running" | "Paused" | "Completed";
    queueRemaining: number;
    todaySends: number;
    repliesToday: number;
  }>;
  systemHealth: {
    lastLinkedInAction: string | null;
    cooldownActive: boolean;
    errorsLast24h: number;
    captchaDetected: boolean;
    automationMethod: string;
  };
}
```

## Helper Functions

### Log Event

```typescript
import { logEvent } from "@/lib/events";

await logEvent({
  workspace_id: workspaceId,
  campaign_id: campaignId,
  lead_id: leadId,
  event_type: "message_sent",
  metadata: { subject: "Hello" }
});
```

### Get Events

```typescript
import { getEvents } from "@/lib/events";

const events = await getEvents(workspaceId, {
  eventType: "message_sent",
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  limit: 100
});
```

### Replay Events

```typescript
import { replayEvents } from "@/lib/events";

const metrics = await replayEvents(workspaceId);
console.log(metrics);
// { todaySends: 37, repliesNeedingAction: 3, replyRate: 15 }
```

## Testing & Validation

### Generate Test Events

```bash
npx tsx scripts/generate-test-events.ts <workspace_id>
```

Generates realistic test events:
- 7 days of message history
- ~15% reply rate
- Some unclassified replies
- Today's sends

### Validate Metrics

```bash
npx tsx scripts/validate-metrics.ts <workspace_id>
```

Validates that all dashboard metrics match event replay:
- Today's Sends
- Replies Requiring Action
- 7-Day Reply Rate
- System Status

**If validation fails, the system is wrong.**

## Hard Rules

1. ❌ No counters stored on rows
2. ❌ No derived numbers written to DB
3. ❌ No "trust the UI" calculations
4. ✅ Everything traceable to raw events
5. ✅ All metrics recomputable from events
6. ✅ Event replay must match database views

## Migration

To apply the event-sourced model:

```bash
# Apply migration
psql $DATABASE_URL < supabase/migrations/004_event_sourced_model.sql

# Generate test data
npx tsx scripts/generate-test-events.ts <workspace_id>

# Validate metrics
npx tsx scripts/validate-metrics.ts <workspace_id>
```

## Benefits

1. **Debuggable:** Every metric traces to specific events
2. **Auditable:** Complete history of all actions
3. **Replayable:** Can recompute metrics at any time
4. **Testable:** Inject events, verify metrics
5. **Correct:** No drift between counters and reality

## What This Prevents

- ❌ Wrong metrics
- ❌ Ghost sends
- ❌ Fake reply rates
- ❌ Impossible debugging
- ❌ Counter drift
- ❌ Lost data

## Summary

**If you can't replay events and get the same metrics, the system is broken.**

This architecture ensures:
- All metrics are correct
- All metrics are auditable
- All metrics are recomputable
- No hidden state
- No counter drift
