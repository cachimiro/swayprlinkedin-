# 🚀 Setup Instructions - Start Here

## ⚡ Quick Setup (5 Minutes)

### What You Need to Do

**Apply ONE database migration file** - that's it!

---

## Step-by-Step

### 1️⃣ Open Supabase Dashboard

Go to: **https://supabase.com/dashboard**

Select your project: **ipdeablmyrfzogkjtbms**

### 2️⃣ Open SQL Editor

Click **SQL Editor** in the left sidebar

Click **New Query** button

### 3️⃣ Copy Migration File

In your code editor, open:
```
supabase/migrations/000_complete_setup.sql
```

**Select all** (Ctrl+A / Cmd+A) and **copy** (Ctrl+C / Cmd+C)

### 4️⃣ Paste and Run

In Supabase SQL Editor:
- **Paste** the SQL (Ctrl+V / Cmd+V)
- Click **Run** button (or press Ctrl+Enter)
- Wait 10-15 seconds

You should see: **"Success. No rows returned"**

### 5️⃣ Test Dashboard

Visit: **https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard**

You should see the operational dashboard (showing zeros - no events yet)

---

## ✅ What This Sets Up

- ✅ All database tables
- ✅ Event-sourced architecture
- ✅ Dashboard KPI calculations
- ✅ Security policies
- ✅ Helper functions

---

## 🎯 Optional: Add Test Data

Want to see the dashboard with realistic data?

### Get Your Workspace ID

Sign in to the app first, then run this in Supabase SQL Editor:

```sql
SELECT id FROM workspaces WHERE owner_id = auth.uid();
```

Copy the workspace ID (looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Generate Test Events

In your terminal:

```bash
npx tsx scripts/generate-test-events.ts <workspace_id>
```

This creates:
- 7 days of message history (~100 messages)
- ~15% reply rate
- 3 unclassified replies
- 20-60 messages sent today

### Refresh Dashboard

Reload the dashboard and you'll see:
- Today's Sends: 20-60
- Replies Requiring Action: 3
- Reply Rate: ~15%
- System Status: Healthy

---

## 📚 Documentation

- **Quick Setup**: `QUICK_SETUP.md` (this file)
- **Complete Architecture**: `EVENT_SOURCED_ARCHITECTURE.md`
- **Usage Guide**: `SETUP_EVENT_SOURCING.md`
- **All Migrations**: `APPLY_ALL_MIGRATIONS.md`

---

## 🆘 Troubleshooting

### Error: "relation already exists"

**This is OK!** Some tables might already exist. The migration will skip them.

### Error: "permission denied"

Make sure you're using the **Supabase Dashboard SQL Editor**, not psql or another tool.

### Dashboard shows "Unauthorized"

1. Sign in to the app first
2. Then visit the dashboard
3. A workspace will be created automatically

### Dashboard shows all zeros

This is correct! No events have been logged yet. Either:
- Generate test data (see above)
- Start using the app and events will be logged automatically

---

## 🎉 That's It!

**One file:** `supabase/migrations/000_complete_setup.sql`

**One action:** Copy → Paste → Run in Supabase SQL Editor

**Done!** The dashboard is event-sourced and ready to use.

---

## What's Next?

1. **Use the dashboard** - It's fully operational
2. **Generate test data** - See realistic metrics
3. **Start logging events** - When you send messages, log events
4. **Validate metrics** - Run `npx tsx scripts/validate-metrics.ts <workspace_id>`

See `SETUP_COMPLETE.md` for complete details.
