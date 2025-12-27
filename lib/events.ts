/**
 * Event-Sourced Outreach Events
 * 
 * All dashboard metrics are derived from these events.
 * No counters, no derived state - everything is recomputable.
 */

import { createClient } from "@/lib/supabase/client";

export type OutreachEventType =
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

export interface OutreachEvent {
  id?: string;
  workspace_id: string;
  campaign_id?: string | null;
  lead_id?: string | null;
  event_type: OutreachEventType;
  event_timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an outreach event
 * This is the ONLY way to record outreach activity
 */
export async function logEvent(event: OutreachEvent): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("outreach_events")
    .insert({
      workspace_id: event.workspace_id,
      campaign_id: event.campaign_id,
      lead_id: event.lead_id,
      event_type: event.event_type,
      event_timestamp: event.event_timestamp || new Date().toISOString(),
      metadata: event.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log event:", error);
    return null;
  }

  return data.id;
}

/**
 * Log multiple events in a batch
 */
export async function logEvents(events: OutreachEvent[]): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("outreach_events")
    .insert(
      events.map((event) => ({
        workspace_id: event.workspace_id,
        campaign_id: event.campaign_id,
        lead_id: event.lead_id,
        event_type: event.event_type,
        event_timestamp: event.event_timestamp || new Date().toISOString(),
        metadata: event.metadata || {},
      }))
    );

  if (error) {
    console.error("Failed to log events:", error);
    return false;
  }

  return true;
}

/**
 * Get events for a workspace
 */
export async function getEvents(
  workspaceId: string,
  filters?: {
    eventType?: OutreachEventType;
    campaignId?: string;
    leadId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<OutreachEvent[]> {
  const supabase = createClient();

  let query = supabase
    .from("outreach_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("event_timestamp", { ascending: false });

  if (filters?.eventType) {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters?.campaignId) {
    query = query.eq("campaign_id", filters.campaignId);
  }

  if (filters?.leadId) {
    query = query.eq("lead_id", filters.leadId);
  }

  if (filters?.startDate) {
    query = query.gte("event_timestamp", filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte("event_timestamp", filters.endDate.toISOString());
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to get events:", error);
    return [];
  }

  return data || [];
}

/**
 * Replay events to recompute metrics
 * This validates that all metrics are correctly derived from events
 */
export async function replayEvents(
  workspaceId: string,
  startDate?: Date
): Promise<{
  todaySends: number;
  repliesNeedingAction: number;
  replyRate: number;
}> {
  const events = await getEvents(workspaceId, {
    startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute today's sends
  const todaySends = events.filter(
    (e) =>
      e.event_type === "message_sent" &&
      new Date(e.event_timestamp!) >= today
  ).length;

  // Compute replies needing action
  const repliedLeads = new Set(
    events
      .filter((e) => e.event_type === "reply_received")
      .map((e) => e.lead_id)
  );

  const classifiedLeads = new Set(
    events
      .filter(
        (e) =>
          e.event_type === "reply_classified" ||
          e.event_type === "manual_action_required"
      )
      .map((e) => e.lead_id)
  );

  const repliesNeedingAction = Array.from(repliedLeads).filter(
    (leadId) => !classifiedLeads.has(leadId)
  ).length;

  // Compute 7-day reply rate
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sentLeads = new Set(
    events
      .filter(
        (e) =>
          e.event_type === "message_sent" &&
          new Date(e.event_timestamp!) >= sevenDaysAgo
      )
      .map((e) => e.lead_id)
  );

  const repliedInWindow = events.filter(
    (e) =>
      e.event_type === "reply_received" &&
      sentLeads.has(e.lead_id) &&
      new Date(e.event_timestamp!) >= sevenDaysAgo
  );

  const replyRate =
    sentLeads.size > 0
      ? Math.round((repliedInWindow.length / sentLeads.size) * 100)
      : 0;

  return {
    todaySends,
    repliesNeedingAction,
    replyRate,
  };
}
