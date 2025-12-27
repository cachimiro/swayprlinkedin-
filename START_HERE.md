# 👋 START HERE

## ⚠️ Got "column workspace_id does not exist" Error?

Your database has tables with wrong structure.

**Use this file:** [FRESH_START.md](FRESH_START.md) ⭐

⚠️ **WARNING:** This deletes all data and starts fresh!

---

## ⚡ Quick Setup

**Choose your path:**

### Option A: Fresh Start (Recommended)
- **File:** [FRESH_START.md](FRESH_START.md)
- **Deletes:** All existing data
- **Result:** Clean, working setup
- **Use if:** You're getting schema errors

### Option B: Keep Existing Data
- **File:** [CHECK_YOUR_SCHEMA.md](CHECK_YOUR_SCHEMA.md)
- **Keeps:** All existing data
- **Result:** Custom migration for your schema
- **Use if:** You have important data to keep

---

## 📋 The Setup

### ✅ Already Done (Code is Ready)

- Event-sourced dashboard architecture
- All API endpoints
- Helper libraries
- Testing tools
- Complete documentation

### ⚠️ You Need to Do (5 Minutes)

**Apply database migration:**

1. Open: **https://supabase.com/dashboard**
2. Select project: **ipdeablmyrfzogkjtbms**
3. Click: **SQL Editor** → **New Query**
4. Copy file: `supabase/migrations/000_complete_setup.sql`
5. Paste and click **Run**

**Done!** ✅

---

## 🎯 Quick Links

### Setup Guides
- **[README_SETUP.md](README_SETUP.md)** - Step-by-step with screenshots
- **[QUICK_SETUP.md](QUICK_SETUP.md)** - Fastest way (one file)
- **[APPLY_ALL_MIGRATIONS.md](APPLY_ALL_MIGRATIONS.md)** - Apply migrations individually

### Documentation
- **[EVENT_SOURCED_ARCHITECTURE.md](EVENT_SOURCED_ARCHITECTURE.md)** - How it works
- **[SETUP_EVENT_SOURCING.md](SETUP_EVENT_SOURCING.md)** - Usage guide
- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - What was built

---

## 🚀 After Setup

### Test Dashboard

Visit: **https://3000--019b3d42-f855-7b98-a2df-9df8f79c0c22.eu-central-1-01.gitpod.dev/dashboard**

You'll see:
- Today's Sends: 0 / 120
- Replies Requiring Action: 0
- Reply Rate: 0%
- System Status: Paused

**This is correct!** No events logged yet.

### Optional: Generate Test Data

```bash
# Get workspace ID (sign in first, then run in Supabase SQL Editor):
SELECT id FROM workspaces WHERE owner_id = auth.uid();

# Generate test events:
npx tsx scripts/generate-test-events.ts <workspace_id>
```

Dashboard will show realistic data:
- Today's Sends: 20-60
- Replies Requiring Action: 3
- Reply Rate: ~15%
- System Status: Healthy

---

## 📊 What You Get

### Operational Dashboard
- **Today's Sends** - Color coded (green/amber/red)
- **Replies Requiring Action** - Pulses when > 0
- **Reply Rate (7 days)** - Percentage only
- **System Status** - One word (Healthy/Throttled/Paused/Error)

### Next Actions Panel
Dynamic, priority-ordered actions:
- Import contacts to unlock campaigns
- Configure daily send limit
- Review X replies
- Campaign paused with active enrollments

### System Health Panel
Only shows when issues exist:
- Last LinkedIn action
- Cooldown status
- Errors in 24h
- Captcha detection

### Campaign Execution Snapshot
Today-only metrics per campaign:
- Status (Running/Paused)
- Queue remaining
- Today's sends
- Replies today

---

## 🎓 Key Concepts

### Event-Sourced Architecture

**Every metric is computed from events, not counters.**

**Before (Wrong):**
```typescript
// ❌ Counters can drift
await supabase.from("campaigns").update({ 
  messages_sent: messages_sent + 1 
});
```

**After (Correct):**
```typescript
// ✅ Events are immutable truth
await logEvent({
  workspace_id: workspaceId,
  event_type: "message_sent",
  campaign_id: campaignId,
  lead_id: leadId
});
// Metrics computed automatically from events
```

### Benefits

✅ **Recomputable** - All metrics from events
✅ **Auditable** - Complete history
✅ **Testable** - Inject events, verify metrics
✅ **Debuggable** - Trace every metric
✅ **Correct** - No counter drift

---

## 🆘 Need Help?

### Common Issues

**"relation workspaces does not exist"**
→ You need to apply the migration first (see above)

**Dashboard shows "Unauthorized"**
→ Sign in to the app first

**Dashboard shows all zeros**
→ This is correct! Generate test data or start using the app

### Documentation

- Setup: `README_SETUP.md`
- Architecture: `EVENT_SOURCED_ARCHITECTURE.md`
- Usage: `SETUP_EVENT_SOURCING.md`

---

## ✅ Summary

**What you need to do:**
1. Apply migration: `supabase/migrations/000_complete_setup.sql`
2. Visit dashboard
3. Done!

**Optional:**
- Generate test data
- Validate metrics
- Read documentation

**The dashboard is event-sourced and ready to use!** 🎉
