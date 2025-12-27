/**
 * Test Event Generator
 * 
 * Generates realistic test events to validate dashboard metrics.
 * Run this to inject test data and verify all KPIs compute correctly.
 * 
 * Usage:
 *   npx tsx scripts/generate-test-events.ts <workspace_id>
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EventType =
  | "message_queued"
  | "message_sent"
  | "message_failed"
  | "reply_received"
  | "reply_classified"
  | "followup_scheduled"
  | "followup_sent"
  | "campaign_paused"
  | "campaign_resumed"
  | "automation_throttled"
  | "automation_resumed"
  | "captcha_detected"
  | "manual_action_required";

interface TestEvent {
  workspace_id: string;
  campaign_id?: string;
  lead_id?: string;
  event_type: EventType;
  event_timestamp: string;
  metadata?: Record<string, any>;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

async function generateTestEvents(workspaceId: string) {
  console.log("Generating test events for workspace:", workspaceId);

  // Get or create test campaign
  let { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .single();

  if (!campaign) {
    console.log("Creating test campaign...");
    const { data: newCampaign } = await supabase
      .from("campaigns")
      .insert({
        workspace_id: workspaceId,
        name: "Test Campaign",
        channel: "email_only",
        is_active: true,
        daily_send_limit: 120,
      })
      .select("id")
      .single();
    campaign = newCampaign;
  }

  const campaignId = campaign?.id;

  // Get or create test leads
  let { data: leads } = await supabase
    .from("leads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(20);

  if (!leads || leads.length === 0) {
    console.log("Creating test leads...");
    const testLeads = Array.from({ length: 20 }, (_, i) => ({
      workspace_id: workspaceId,
      full_name: `Test Lead ${i + 1}`,
      email: `test${i + 1}@example.com`,
      status: "new",
    }));

    const { data: newLeads } = await supabase
      .from("leads")
      .insert(testLeads)
      .select("id");

    leads = newLeads || [];
  }

  const leadIds = leads.map((l) => l.id);

  console.log(`Using ${leadIds.length} leads`);

  const events: TestEvent[] = [];

  // Generate events for last 7 days
  for (let day = 0; day < 7; day++) {
    const messagesPerDay = Math.floor(Math.random() * 20) + 10;

    for (let i = 0; i < messagesPerDay; i++) {
      const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
      const timestamp = randomDate(day);

      // Message sent
      events.push({
        workspace_id: workspaceId,
        campaign_id: campaignId,
        lead_id: leadId,
        event_type: "message_sent",
        event_timestamp: timestamp,
        metadata: { subject: `Test message ${i}` },
      });

      // 15% chance of reply
      if (Math.random() < 0.15) {
        const replyTime = new Date(timestamp);
        replyTime.setHours(replyTime.getHours() + Math.floor(Math.random() * 24));

        events.push({
          workspace_id: workspaceId,
          campaign_id: campaignId,
          lead_id: leadId,
          event_type: "reply_received",
          event_timestamp: replyTime.toISOString(),
          metadata: { body: "Thanks for reaching out!" },
        });

        // 50% chance reply is classified
        if (Math.random() < 0.5) {
          const classifyTime = new Date(replyTime);
          classifyTime.setMinutes(classifyTime.getMinutes() + 30);

          events.push({
            workspace_id: workspaceId,
            campaign_id: campaignId,
            lead_id: leadId,
            event_type: "reply_classified",
            event_timestamp: classifyTime.toISOString(),
            metadata: { classification: "interested" },
          });
        }
      }

      // 2% chance of failure
      if (Math.random() < 0.02) {
        events.push({
          workspace_id: workspaceId,
          campaign_id: campaignId,
          lead_id: leadId,
          event_type: "message_failed",
          event_timestamp: timestamp,
          metadata: { error: "Bounce" },
        });
      }
    }
  }

  // Add some today events
  const todayMessages = Math.floor(Math.random() * 40) + 20;
  for (let i = 0; i < todayMessages; i++) {
    const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
    const now = new Date();
    now.setHours(Math.floor(Math.random() * 12) + 8); // 8am-8pm

    events.push({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      lead_id: leadId,
      event_type: "message_sent",
      event_timestamp: now.toISOString(),
      metadata: { subject: `Today's message ${i}` },
    });
  }

  // Add a few unclassified replies
  for (let i = 0; i < 3; i++) {
    const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
    events.push({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      lead_id: leadId,
      event_type: "reply_received",
      event_timestamp: randomDate(Math.floor(Math.random() * 3)),
      metadata: { body: "Unclassified reply" },
    });
  }

  console.log(`Inserting ${events.length} events...`);

  const { error } = await supabase.from("outreach_events").insert(events);

  if (error) {
    console.error("Error inserting events:", error);
    process.exit(1);
  }

  console.log("✓ Test events generated successfully!");
  console.log("\nExpected metrics:");
  console.log(`- Today's sends: ~${todayMessages}`);
  console.log(`- Replies needing action: ~3`);
  console.log(`- 7-day reply rate: ~15%`);
  console.log("\nVerify at: /dashboard");
}

// Run if called directly
if (require.main === module) {
  const workspaceId = process.argv[2];

  if (!workspaceId) {
    console.error("Usage: npx tsx scripts/generate-test-events.ts <workspace_id>");
    process.exit(1);
  }

  generateTestEvents(workspaceId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { generateTestEvents };
