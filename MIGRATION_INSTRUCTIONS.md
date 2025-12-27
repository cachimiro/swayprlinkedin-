# Apply Event-Sourced Migration

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **ipdeablmyrfzogkjtbms**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 2: Copy Migration SQL

Open this file in your editor:
```
supabase/migrations/004_event_sourced_model.sql
```

Copy the ENTIRE contents (it's about 400 lines).

### Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for execution (should take 5-10 seconds)
4. You should see "Success. No rows returned"

### Step 4: Verify Migration

Run this query to verify:

```sql
SELECT COUNT(*) FROM outreach_events;
```

Expected result: `0` (table exists but is empty)

### Step 5: Update Dashboard

The dashboard code is already updated to use the event-sourced API.

Just refresh your browser at:
```
https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard
```

## What This Migration Does

✅ Creates `outreach_events` table (single source of truth)
✅ Creates `user_settings` table (configuration)
✅ Creates 6 SQL views for KPI calculations:
   - `v_todays_sends`
   - `v_replies_requiring_action`
   - `v_reply_rate_7d`
   - `v_system_status`
   - `v_account_health`
   - `v_campaign_snapshot_today`
✅ Creates helper functions:
   - `log_outreach_event()`
   - `get_dashboard_stats()`
✅ Sets up RLS policies for security

## After Migration

### Option A: Use Empty Dashboard

The dashboard will work immediately but show zeros (no events yet).

### Option B: Generate Test Data

To see the dashboard with realistic data:

1. Get your workspace ID:
```sql
SELECT id FROM workspaces WHERE owner_id = auth.uid();
```

2. Run test data generator:
```bash
npx tsx scripts/generate-test-events.ts <workspace_id>
```

This creates:
- 7 days of message history
- ~15% reply rate
- 3 unclassified replies
- 20-60 messages sent today

### Option C: Start Using Events

When you send messages in your app, log events:

```typescript
import { logEvent } from "@/lib/events";

await logEvent({
  workspace_id: workspaceId,
  event_type: "message_sent",
  campaign_id: campaignId,
  lead_id: leadId
});
```

## Troubleshooting

### Error: "relation already exists"

This means the migration was already applied. You're good to go!

### Error: "permission denied"

Make sure you're using the SQL Editor in Supabase Dashboard (not psql).

### Error: "function does not exist"

Some functions might fail if they reference tables that don't exist yet.
This is OK - the important tables and views will be created.

### Dashboard shows "No workspace found"

1. Sign in to the app
2. The workspace will be created automatically
3. Refresh the dashboard

## Validation

To verify everything is working:

```bash
# Check migration applied
npx tsx scripts/validate-metrics.ts <workspace_id>
```

Expected output:
```
✓ ALL METRICS VALIDATED SUCCESSFULLY
```

## Need Help?

Check these files:
- `EVENT_SOURCED_ARCHITECTURE.md` - Complete documentation
- `SETUP_EVENT_SOURCING.md` - Usage guide
- `supabase/migrations/004_event_sourced_model.sql` - The migration

## Summary

1. ✅ Copy SQL from `supabase/migrations/004_event_sourced_model.sql`
2. ✅ Paste into Supabase SQL Editor
3. ✅ Click Run
4. ✅ Refresh dashboard
5. ✅ Done!

The dashboard is now event-sourced and ready to use.
