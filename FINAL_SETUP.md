# ✅ Final Setup - Use This File

## The Issue

You got "relation campaigns already exists" because some tables are already set up.

## The Solution

Use this migration file instead - it only adds the event-sourced parts:

```
supabase/migrations/005_event_model_only.sql
```

This file:
- ✅ Skips tables that already exist
- ✅ Only adds event-sourced tables and views
- ✅ Uses `CREATE IF NOT EXISTS` for safety

---

## Step-by-Step

### 1. Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard**
2. Select project: **ipdeablmyrfzogkjtbms**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### 2. Copy This File

Open in your editor:
```
supabase/migrations/005_event_model_only.sql
```

**Copy the entire file** (about 350 lines)

### 3. Paste and Run

1. Paste into Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait 5-10 seconds
4. Should see: **"Success. No rows returned"**

### 4. Verify

Run this to check:

```sql
SELECT COUNT(*) FROM outreach_events;
```

Expected: `0` (table exists but empty)

### 5. Done! ✅

Visit dashboard:
```
https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard
```

---

## What This Adds

✅ `outreach_events` table (single source of truth)
✅ `user_settings` table (configuration)
✅ 6 SQL views for KPI calculations:
   - `v_todays_sends`
   - `v_replies_requiring_action`
   - `v_reply_rate_7d`
   - `v_system_status`
   - `v_account_health`
   - `v_campaign_snapshot_today`
✅ Helper functions:
   - `log_outreach_event()`
   - `get_dashboard_stats()`
✅ RLS policies for security

---

## Optional: Generate Test Data

After migration, generate realistic test data:

```bash
# 1. Get your workspace ID (sign in first)
# Run in Supabase SQL Editor:
SELECT id FROM workspaces WHERE owner_id = auth.uid();

# 2. Generate test events
npx tsx scripts/generate-test-events.ts <workspace_id>
```

This creates:
- 7 days of message history
- ~15% reply rate
- 3 unclassified replies
- 20-60 messages sent today

---

## Troubleshooting

### "type outreach_event_type already exists"

This is OK! The migration will skip it and continue.

### "relation outreach_events already exists"

This is OK! The migration uses `CREATE IF NOT EXISTS`.

### Dashboard shows "Unauthorized"

1. Sign in to the app first
2. Then visit the dashboard
3. A workspace will be created automatically

---

## Summary

**Use this file:**
```
supabase/migrations/005_event_model_only.sql
```

**Action:**
Copy → Paste → Run in Supabase SQL Editor

**Done!** The dashboard is event-sourced and ready to use.
