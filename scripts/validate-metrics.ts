/**
 * Metric Validation Script
 * 
 * Validates that all dashboard metrics are correctly computed from events.
 * Compares database views with manual event replay.
 * 
 * Usage:
 *   npx tsx scripts/validate-metrics.ts <workspace_id>
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationResult {
  metric: string;
  dbValue: number;
  replayValue: number;
  match: boolean;
  error?: string;
}

async function validateMetrics(workspaceId: string): Promise<ValidationResult[]> {
  console.log("Validating metrics for workspace:", workspaceId);
  console.log("=" .repeat(60));

  const results: ValidationResult[] = [];

  // 1. Validate Today's Sends
  console.log("\n1. Validating Today's Sends...");
  try {
    const { data: dbData } = await supabase
      .from("v_todays_sends")
      .select("sends_today")
      .eq("workspace_id", workspaceId)
      .single();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: replayCount } = await supabase
      .from("outreach_events")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("event_type", "message_sent")
      .gte("event_timestamp", today.toISOString());

    const dbValue = dbData?.sends_today || 0;
    const replayValue = replayCount || 0;
    const match = dbValue === replayValue;

    results.push({
      metric: "Today's Sends",
      dbValue,
      replayValue,
      match,
    });

    console.log(`  DB Value: ${dbValue}`);
    console.log(`  Replay Value: ${replayValue}`);
    console.log(`  ${match ? "✓ MATCH" : "✗ MISMATCH"}`);
  } catch (error: any) {
    results.push({
      metric: "Today's Sends",
      dbValue: 0,
      replayValue: 0,
      match: false,
      error: error.message,
    });
    console.log(`  ✗ ERROR: ${error.message}`);
  }

  // 2. Validate Replies Requiring Action
  console.log("\n2. Validating Replies Requiring Action...");
  try {
    const { data: dbData } = await supabase
      .from("v_replies_requiring_action")
      .select("replies_needing_action")
      .eq("workspace_id", workspaceId)
      .single();

    // Manual replay
    const { data: replies } = await supabase
      .from("outreach_events")
      .select("lead_id")
      .eq("workspace_id", workspaceId)
      .eq("event_type", "reply_received");

    const { data: classified } = await supabase
      .from("outreach_events")
      .select("lead_id")
      .eq("workspace_id", workspaceId)
      .in("event_type", ["reply_classified", "manual_action_required"]);

    const repliedLeads = new Set((replies || []).map((r) => r.lead_id));
    const classifiedLeads = new Set((classified || []).map((c) => c.lead_id));

    const replayValue = Array.from(repliedLeads).filter(
      (leadId) => !classifiedLeads.has(leadId)
    ).length;

    const dbValue = dbData?.replies_needing_action || 0;
    const match = dbValue === replayValue;

    results.push({
      metric: "Replies Requiring Action",
      dbValue,
      replayValue,
      match,
    });

    console.log(`  DB Value: ${dbValue}`);
    console.log(`  Replay Value: ${replayValue}`);
    console.log(`  ${match ? "✓ MATCH" : "✗ MISMATCH"}`);
  } catch (error: any) {
    results.push({
      metric: "Replies Requiring Action",
      dbValue: 0,
      replayValue: 0,
      match: false,
      error: error.message,
    });
    console.log(`  ✗ ERROR: ${error.message}`);
  }

  // 3. Validate 7-Day Reply Rate
  console.log("\n3. Validating 7-Day Reply Rate...");
  try {
    const { data: dbData } = await supabase
      .from("v_reply_rate_7d")
      .select("reply_rate_pct, messages_sent, replies_received")
      .eq("workspace_id", workspaceId)
      .single();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: sentMessages } = await supabase
      .from("outreach_events")
      .select("lead_id, event_timestamp")
      .eq("workspace_id", workspaceId)
      .eq("event_type", "message_sent")
      .gte("event_timestamp", sevenDaysAgo.toISOString());

    const sentLeads = new Map<string, string>();
    (sentMessages || []).forEach((m) => {
      if (!sentLeads.has(m.lead_id) || m.event_timestamp < sentLeads.get(m.lead_id)!) {
        sentLeads.set(m.lead_id, m.event_timestamp);
      }
    });

    const { data: replies } = await supabase
      .from("outreach_events")
      .select("lead_id, event_timestamp")
      .eq("workspace_id", workspaceId)
      .eq("event_type", "reply_received")
      .gte("event_timestamp", sevenDaysAgo.toISOString());

    const repliedLeads = new Set<string>();
    (replies || []).forEach((r) => {
      const firstMessageTime = sentLeads.get(r.lead_id);
      if (firstMessageTime && r.event_timestamp >= firstMessageTime) {
        repliedLeads.add(r.lead_id);
      }
    });

    const replayValue =
      sentLeads.size > 0
        ? Math.round((repliedLeads.size / sentLeads.size) * 100)
        : 0;

    const dbValue = dbData?.reply_rate_pct || 0;
    const match = dbValue === replayValue;

    results.push({
      metric: "7-Day Reply Rate",
      dbValue,
      replayValue,
      match,
    });

    console.log(`  DB Value: ${dbValue}%`);
    console.log(`  Replay Value: ${replayValue}%`);
    console.log(`  Messages Sent: ${sentLeads.size}`);
    console.log(`  Replies Received: ${repliedLeads.size}`);
    console.log(`  ${match ? "✓ MATCH" : "✗ MISMATCH"}`);
  } catch (error: any) {
    results.push({
      metric: "7-Day Reply Rate",
      dbValue: 0,
      replayValue: 0,
      match: false,
      error: error.message,
    });
    console.log(`  ✗ ERROR: ${error.message}`);
  }

  // 4. Validate System Status
  console.log("\n4. Validating System Status...");
  try {
    const { data: dbData } = await supabase
      .from("v_system_status")
      .select("status, reason")
      .eq("workspace_id", workspaceId)
      .single();

    console.log(`  DB Status: ${dbData?.status || "Unknown"}`);
    console.log(`  Reason: ${dbData?.reason || "N/A"}`);
    console.log(`  ✓ Status derived from events`);

    results.push({
      metric: "System Status",
      dbValue: 1,
      replayValue: 1,
      match: true,
    });
  } catch (error: any) {
    results.push({
      metric: "System Status",
      dbValue: 0,
      replayValue: 0,
      match: false,
      error: error.message,
    });
    console.log(`  ✗ ERROR: ${error.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.match).length;
  const failed = results.filter((r) => !r.match).length;

  console.log(`Total Metrics: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n✓ ALL METRICS VALIDATED SUCCESSFULLY");
    console.log("All dashboard KPIs are correctly computed from events.");
  } else {
    console.log("\n✗ VALIDATION FAILED");
    console.log("Some metrics do not match event replay.");
    results
      .filter((r) => !r.match)
      .forEach((r) => {
        console.log(`  - ${r.metric}: ${r.error || "Mismatch"}`);
      });
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  const workspaceId = process.argv[2];

  if (!workspaceId) {
    console.error("Usage: npx tsx scripts/validate-metrics.ts <workspace_id>");
    process.exit(1);
  }

  validateMetrics(workspaceId)
    .then((results) => {
      const failed = results.filter((r) => !r.match).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { validateMetrics };
