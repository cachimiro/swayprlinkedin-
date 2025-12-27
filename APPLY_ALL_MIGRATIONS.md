# Apply All Migrations - Complete Setup

## The Issue

The `workspaces` table doesn't exist because the initial schema hasn't been applied yet.

## Solution: Apply ALL Migrations in Order

You need to apply all 4 migrations in sequence:

### Step 1: Go to Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **ipdeablmyrfzogkjtbms**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Apply Migration 1 - Initial Schema

Copy/paste this entire file:
```
supabase/migrations/001_initial_schema.sql
```

Click **Run**

Wait for "Success. No rows returned"

### Step 3: Apply Migration 2 - Auto Confirm Users

Click **New Query** again

Copy/paste this entire file:
```
supabase/migrations/002_auto_confirm_users.sql
```

Click **Run**

### Step 4: Apply Migration 3 - Add Password Column

Click **New Query** again

Copy/paste this entire file:
```
supabase/migrations/003_add_password_column.sql
```

Click **Run**

### Step 5: Apply Migration 4 - Event-Sourced Model

Click **New Query** again

Copy/paste this entire file:
```
supabase/migrations/004_event_sourced_model.sql
```

Click **Run**

---

## Alternative: Apply All at Once

You can also apply all migrations in one go:

1. Click **New Query**
2. Copy/paste ALL FOUR files in order:
   - First: `001_initial_schema.sql`
   - Then: `002_auto_confirm_users.sql`
   - Then: `003_add_password_column.sql`
   - Finally: `004_event_sourced_model.sql`
3. Click **Run**

---

## Verify Setup

After applying all migrations, run this query:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'workspaces',
  'profiles', 
  'leads',
  'campaigns',
  'outreach_events',
  'user_settings'
)
ORDER BY table_name;
```

Expected result: All 6 tables listed

---

## Then Test Dashboard

1. Sign in to the app
2. Visit: [https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard](https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard)
3. Dashboard should load (showing zeros - no events yet)

---

## Generate Test Data (Optional)

After migrations are applied:

```bash
# Get your workspace ID
# Sign in first, then run this in Supabase SQL Editor:
SELECT id FROM workspaces WHERE owner_id = auth.uid();

# Then generate test events:
npx tsx scripts/generate-test-events.ts <workspace_id>
```

---

## Summary

**Apply these 4 files in order via Supabase SQL Editor:**

1. ✅ `supabase/migrations/001_initial_schema.sql`
2. ✅ `supabase/migrations/002_auto_confirm_users.sql`
3. ✅ `supabase/migrations/003_add_password_column.sql`
4. ✅ `supabase/migrations/004_event_sourced_model.sql`

**Then you're done!**
