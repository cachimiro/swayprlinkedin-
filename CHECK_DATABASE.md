# Check Your Database First

## Run This Query

Before applying any migration, let's see what tables you have.

**In Supabase SQL Editor, run:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## Based on Results:

### If You See NO Tables (or only auth tables)

**Use this file:**
```
supabase/migrations/000_complete_setup.sql
```

This sets up everything from scratch.

### If You See SOME Tables (like campaigns, leads, etc.)

**Use this file:**
```
supabase/migrations/005_event_model_only.sql
```

This only adds event-sourced parts.

### If You See "workspaces" Table

**Use this file:**
```
supabase/migrations/005_event_model_only.sql
```

### If You See NO "workspaces" Table

**Use this file:**
```
supabase/migrations/000_complete_setup.sql
```

---

## Quick Decision Tree

Run the query above, then:

**Result: 0-5 tables** → Use `000_complete_setup.sql`

**Result: 10+ tables** → Use `005_event_model_only.sql`

**Result: Error or confused** → Use `000_complete_setup.sql` (safest)

---

## Apply Migration

Once you know which file to use:

1. Open Supabase SQL Editor
2. Copy the entire migration file
3. Paste and click Run
4. Wait for "Success"

---

## Still Getting Errors?

Share the output of this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

And I'll tell you exactly which file to use.
