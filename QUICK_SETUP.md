# ⚡ Quick Setup - One File, One Click

## The Fastest Way

I've combined all 4 migrations into one file for you.

### Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **ipdeablmyrfzogkjtbms**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy This File

Open this file:
```
supabase/migrations/000_complete_setup.sql
```

**Copy the ENTIRE file** (769 lines)

### Step 3: Paste and Run

1. Paste into Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait 10-15 seconds
4. You should see "Success. No rows returned"

### Step 4: Verify

Run this quick check:

```sql
SELECT COUNT(*) FROM outreach_events;
```

Expected: `0` (table exists but empty)

### Step 5: Done!

Visit dashboard:
```
https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard
```

---

## What This Sets Up

✅ All database tables (workspaces, profiles, leads, campaigns, etc.)
✅ Event-sourced model (outreach_events, user_settings)
✅ SQL views for KPI calculations
✅ Helper functions
✅ Row-level security policies
✅ Auto-confirm users for development

---

## Optional: Add Test Data

After setup, generate realistic test data:

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

### "relation already exists"

Some tables might already exist. That's OK! The migration will skip them.

### "permission denied"

Make sure you're using the Supabase Dashboard SQL Editor (not psql or another tool).

### Dashboard shows errors

1. Make sure you're signed in
2. Refresh the page
3. Check browser console for errors

---

## Summary

**One file to rule them all:**
```
supabase/migrations/000_complete_setup.sql
```

**One action:**
Copy → Paste → Run

**Done!** 🎉

The dashboard is now event-sourced and ready to use.
