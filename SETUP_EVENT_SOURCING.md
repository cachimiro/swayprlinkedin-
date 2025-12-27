# Setup Event-Sourced Dashboard

## Quick Start

### 1. Apply Database Migration

```bash
# Connect to your Supabase database
psql $DATABASE_URL -f supabase/migrations/004_event_sourced_model.sql
```

Or via Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor**
4. Click **New Query**
5. Copy/paste contents of `supabase/migrations/004_event_sourced_model.sql`
6. Click **Run**

### 2. Update Dashboard to Use New API

Change the dashboard to use the event-sourced API:

```typescript
// In app/dashboard/page.tsx
// Change from:
const response = await fetch("/api/dashboard/stats");

// To:
const response = await fetch("/api/dashboard/stats-v2");
```

### 3. Generate Test Data (Optional)

```bash
# Get your workspace ID from Supabase
# Then generate test events:
npx tsx scripts/generate-test-events.ts <workspace_id>
```

This creates:
- 7 days of message history
- ~15% reply rate
- 3 unclassified replies
- 20-60 messages sent today

### 4. Validate Metrics

```bash
npx tsx scripts/validate-metrics.ts <workspace_id>
```

Expected output:
```
1. Validating Today's Sends...
  DB Value: 37
  Replay Value: 37
  ✓ MATCH

2. Validating Replies Requiring Action...
  DB Value: 3
  Replay Value: 3
  ✓ MATCH

3. Validating 7-Day Reply Rate...
  DB Value: 15%
  Replay Value: 15%
  ✓ MATCH

4. Validating System Status...
  DB Status: Healthy
  ✓ Status derived from events

✓ ALL METRICS VALIDATED SUCCESSFULLY
```

## What Changed

### Before (Counter-Based)
```typescript
// ❌ Wrong approach
await supabase
  .from("campaigns")
  .update({ messages_sent: messages_sent + 1 })
  .eq("id", campaignId);
```

### After (Event-Sourced)
```typescript
// ✅ Correct approach
import { logEvent } from "@/lib/events";

await logEvent({
  workspace_id: workspaceId,
  campaign_id: campaignId,
  lead_id: leadId,
  event_type: "message_sent",
  metadata: { subject: "Hello" }
});

// Metrics are computed from events automatically
```

## Using Events in Your Code

### Log a Message Sent

```typescript
import { logEvent } from "@/lib/events";

await logEvent({
  workspace_id: workspaceId,
  campaign_id: campaignId,
  lead_id: leadId,
  event_type: "message_sent",
  metadata: {
    subject: "Introduction",
    provider: "resend",
    message_id: "msg_123"
  }
});
```

### Log a Reply Received

```typescript
await logEvent({
  workspace_id: workspaceId,
  campaign_id: campaignId,
  lead_id: leadId,
  event_type: "reply_received",
  metadata: {
    body: "Thanks for reaching out!",
    received_at: new Date().toISOString()
  }
});
```

### Log Reply Classification

```typescript
await logEvent({
  workspace_id: workspaceId,
  lead_id: leadId,
  event_type: "reply_classified",
  metadata: {
    classification: "interested",
    classified_by: userId
  }
});
```

### Log Automation Throttle

```typescript
await logEvent({
  workspace_id: workspaceId,
  event_type: "automation_throttled",
  metadata: {
    reason: "Daily limit reached",
    limit: 120
  }
});
```

### Log Captcha Detection

```typescript
await logEvent({
  workspace_id: workspaceId,
  event_type: "captcha_detected",
  metadata: {
    url: "https://linkedin.com/...",
    detected_at: new Date().toISOString()
  }
});
```

## Querying Events

### Get All Events for a Workspace

```typescript
import { getEvents } from "@/lib/events";

const events = await getEvents(workspaceId);
```

### Get Today's Sent Messages

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const events = await getEvents(workspaceId, {
  eventType: "message_sent",
  startDate: today
});
```

### Get Unclassified Replies

```typescript
const replies = await getEvents(workspaceId, {
  eventType: "reply_received"
});

const classified = await getEvents(workspaceId, {
  eventType: "reply_classified"
});

const classifiedLeadIds = new Set(classified.map(e => e.lead_id));
const unclassified = replies.filter(r => !classifiedLeadIds.has(r.lead_id));
```

## Dashboard Views

All KPIs use these SQL views:

- `v_todays_sends` - Today's message count
- `v_replies_requiring_action` - Unprocessed replies
- `v_reply_rate_7d` - 7-day reply rate
- `v_system_status` - System health status
- `v_account_health` - Account health metrics
- `v_campaign_snapshot_today` - Today's campaign metrics

You can query these directly:

```sql
SELECT * FROM v_todays_sends WHERE workspace_id = '<workspace_id>';
SELECT * FROM v_replies_requiring_action WHERE workspace_id = '<workspace_id>';
SELECT * FROM v_reply_rate_7d WHERE workspace_id = '<workspace_id>';
```

## Troubleshooting

### Metrics Don't Match

Run validation:
```bash
npx tsx scripts/validate-metrics.ts <workspace_id>
```

If validation fails, check:
1. Are events being logged correctly?
2. Are timestamps correct?
3. Are workspace_id/campaign_id/lead_id set properly?

### No Data Showing

1. Check if events exist:
```sql
SELECT COUNT(*) FROM outreach_events WHERE workspace_id = '<workspace_id>';
```

2. Generate test data:
```bash
npx tsx scripts/generate-test-events.ts <workspace_id>
```

3. Verify views are working:
```sql
SELECT * FROM v_todays_sends WHERE workspace_id = '<workspace_id>';
```

### Dashboard Shows 401 Error

1. Make sure you're signed in
2. Check workspace exists:
```sql
SELECT * FROM workspaces WHERE owner_id = '<user_id>';
```

3. If no workspace, one will be created automatically on first dashboard load

## Migration Checklist

- [ ] Apply database migration
- [ ] Update dashboard API endpoint
- [ ] Generate test data
- [ ] Validate metrics
- [ ] Update message sending code to log events
- [ ] Update reply handling code to log events
- [ ] Test dashboard with real data
- [ ] Remove old counter-based code

## Next Steps

1. **Integrate with Message Sending**
   - Log `message_queued` when adding to queue
   - Log `message_sent` when successfully sent
   - Log `message_failed` on errors

2. **Integrate with Reply Handling**
   - Log `reply_received` when reply comes in
   - Log `reply_classified` when user processes it

3. **Add Automation Events**
   - Log `automation_throttled` when hitting limits
   - Log `captcha_detected` when captcha appears
   - Log `campaign_paused` when pausing campaigns

4. **Monitor & Validate**
   - Run validation script daily
   - Check event counts match expectations
   - Verify metrics are accurate

## Support

See `EVENT_SOURCED_ARCHITECTURE.md` for complete documentation.

For questions or issues, check:
- Event types: `outreach_event_type` enum
- Views: `v_*` views in migration
- Helper functions: `lib/events.ts`
- Validation: `scripts/validate-metrics.ts`
