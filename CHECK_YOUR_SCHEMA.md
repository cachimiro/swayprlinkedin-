# Check Your Database Schema

## Run These Queries

Before we proceed, let's see what you actually have.

**In Supabase SQL Editor, run these queries one by one:**

### 1. What tables exist?

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 2. What columns does workspaces have?

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'workspaces'
ORDER BY ordinal_position;
```

### 3. What columns does campaigns have?

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'campaigns'
ORDER BY ordinal_position;
```

### 4. What columns does leads have?

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads'
ORDER BY ordinal_position;
```

---

## Share the Results

Copy the output of these queries and share them with me.

Then I'll create a migration that works with YOUR exact schema.

---

## Quick Alternative

If you want to start completely fresh:

### Option A: Drop Everything and Start Over

```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then use: `supabase/migrations/999_complete_safe_setup.sql`

### Option B: Tell Me Your Schema

Run the queries above and share the results.
