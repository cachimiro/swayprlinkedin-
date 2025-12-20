export type ConnectionDegree = "first" | "second" | "third" | "unknown";
export type EmailStatus = "unknown" | "verified" | "risky" | "invalid" | "bounced";
export type LeadStatus = "new" | "queued" | "contacted" | "replied" | "interested" | "not_interested" | "do_not_contact";
export type CampaignChannel = "email_only" | "linkedin_assist" | "mixed";
export type EnrollmentState = "active" | "paused" | "completed" | "stopped";
export type MessageChannel = "email" | "linkedin_task";
export type MessageStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed" | "completed_task";
export type EventType = "reply" | "bounce" | "complaint" | "unsubscribe";
export type WorkspaceRole = "owner" | "admin" | "member";

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  timezone: string;
  plan_tier: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface Company {
  id: string;
  workspace_id: string;
  name: string;
  industry: string | null;
  domain: string | null;
  size_range: string | null;
  location: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  workspace_id: string;
  company_id: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  industry: string | null;
  location: string | null;
  linkedin_profile_url: string | null;
  connection_degree: ConnectionDegree;
  email: string | null;
  email_status: EmailStatus;
  source: string | null;
  tags: string[];
  status: LeadStatus;
  last_contacted_at: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  channel: CampaignChannel;
  target_industries: string[];
  filters_json: Record<string, any>;
  daily_send_limit: number;
  sending_window_start: string | null;
  sending_window_end: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SequenceStep {
  step_type: "email" | "manual_linkedin_task";
  delay_days: number;
  subject_template?: string;
  body_template: string;
}

export interface Sequence {
  id: string;
  campaign_id: string;
  name: string;
  steps_json: SequenceStep[];
  created_at: string;
}

export interface CampaignEnrollment {
  id: string;
  campaign_id: string;
  lead_id: string;
  sequence_id: string;
  state: EnrollmentState;
  current_step_index: number;
  next_action_at: string | null;
  created_at: string;
}

export interface OutboundMessage {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  lead_id: string;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  provider_message_id: string | null;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface InboundEvent {
  id: string;
  workspace_id: string;
  channel: MessageChannel;
  lead_id: string | null;
  type: EventType;
  payload_json: Record<string, any>;
  created_at: string;
}

export interface SuppressionListEntry {
  id: string;
  workspace_id: string;
  email: string;
  reason: string | null;
  created_at: string;
}
