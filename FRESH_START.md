# 🔄 Fresh Start - Clean Setup

## The Issue

Your database has tables with a different structure than expected.

## The Solution

Start completely fresh with a clean schema.

**⚠️ WARNING: This will delete ALL existing data in your database!**

---

## Use This File

```
supabase/migrations/998_fresh_start.sql
```

**What it does:**
1. Drops ALL existing tables
2. Drops ALL existing views
3. Drops ALL existing functions
4. Drops ALL existing types
5. Creates everything fresh with the correct structure

---

## Steps (5 Minutes)

### 1. Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard**
2. Select project: **ipdeablmyrfzogkjtbms**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### 2. Copy This File

Open in your editor:
```
supabase/migrations/998_fresh_start.sql
```

**Copy the entire file**

### 3. Paste and Run

1. Paste into Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait 10-15 seconds
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

## After Migration

### Sign Up Again

Since all data was deleted, you'll need to:
1. Sign up for a new account
2. Sign in
3. Visit dashboard

### Generate Test Data

```bash
# Get your workspace ID (sign in first, then run in Supabase SQL Editor):
SELECT id FROM workspaces WHERE owner_id = auth.uid();

# Generate test events:
npx tsx scripts/generate-test-events.ts <workspace_id>
```

---

## What This Creates

✅ All base tables with correct structure
✅ Event-sourced tables (outreach_events, user_settings)
✅ All SQL views for KPIs
✅ All helper functions
✅ All RLS policies
✅ Clean, working schema

---

## Alternative: Keep Existing Data

If you want to keep your existing data, you need to:

1. Run the queries in `CHECK_YOUR_SCHEMA.md`
2. Share the output with me
3. I'll create a custom migration for your specific schema

---

## Summary

**File:** `supabase/migrations/998_fresh_start.sql`

**⚠️ WARNING:** Deletes all data!

**Action:** Copy → Paste → Run in Supabase SQL Editor

**Result:** Clean, working event-sourced dashboard

**Then:** Sign up again and generate test data
