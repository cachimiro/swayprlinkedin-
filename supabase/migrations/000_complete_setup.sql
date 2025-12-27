-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE connection_degree AS ENUM ('first', 'second', 'third', 'unknown');
CREATE TYPE email_status AS ENUM ('unknown', 'verified', 'risky', 'invalid', 'bounced');
CREATE TYPE lead_status AS ENUM ('new', 'queued', 'contacted', 'replied', 'interested', 'not_interested', 'do_not_contact');
CREATE TYPE campaign_channel AS ENUM ('email_only', 'linkedin_assist', 'mixed');
CREATE TYPE enrollment_state AS ENUM ('active', 'paused', 'completed', 'stopped');
CREATE TYPE message_channel AS ENUM ('email', 'linkedin_task');
CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'completed_task');
CREATE TYPE event_type AS ENUM ('reply', 'bounce', 'complaint', 'unsubscribe');
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    plan_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    domain TEXT,
    size_range TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    industry TEXT,
    location TEXT,
    linkedin_profile_url TEXT,
    connection_degree connection_degree DEFAULT 'unknown',
    email TEXT,
    email_status email_status DEFAULT 'unknown',
    source TEXT,
    tags TEXT[] DEFAULT '{}',
    status lead_status DEFAULT 'new',
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email),
    UNIQUE(workspace_id, linkedin_profile_url)
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel campaign_channel NOT NULL DEFAULT 'email_only',
    target_industries TEXT[] DEFAULT '{}',
    filters_json JSONB DEFAULT '{}',
    daily_send_limit INTEGER DEFAULT 200,
    sending_window_start TIME,
    sending_window_end TIME,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequences table
CREATE TABLE sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    steps_json JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign enrollments table
CREATE TABLE campaign_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    state enrollment_state NOT NULL DEFAULT 'active',
    current_step_index INTEGER DEFAULT 0,
    next_action_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, lead_id)
);

-- Outbound messages table
CREATE TABLE outbound_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    channel message_channel NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status message_status NOT NULL DEFAULT 'queued',
    provider_message_id TEXT,
    metadata_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound events table
CREATE TABLE inbound_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel message_channel NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    type event_type NOT NULL,
    payload_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppression list table
CREATE TABLE suppression_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- Create indexes
CREATE INDEX idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_companies_workspace_id ON companies(workspace_id);
CREATE INDEX idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX idx_campaign_enrollments_next_action ON campaign_enrollments(next_action_at) WHERE state = 'active';
CREATE INDEX idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX idx_campaign_enrollments_lead_id ON campaign_enrollments(lead_id);
CREATE INDEX idx_outbound_messages_workspace_id ON outbound_messages(workspace_id);
CREATE INDEX idx_outbound_messages_provider_id ON outbound_messages(provider_message_id);
CREATE INDEX idx_outbound_messages_lead_id ON outbound_messages(lead_id);
CREATE INDEX idx_inbound_events_workspace_id ON inbound_events(workspace_id);
CREATE INDEX idx_suppression_list_email ON suppression_list(email);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they own or are members of" ON workspaces
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete their workspaces" ON workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for workspace_members
CREATE POLICY "Users can view members of their workspaces" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
            AND (workspaces.owner_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM workspace_members wm2
                         WHERE wm2.workspace_id = workspaces.id
                         AND wm2.user_id = auth.uid()))
        )
    );

CREATE POLICY "Workspace owners and admins can add members" ON workspace_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
            AND (workspaces.owner_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM workspace_members wm2
                         WHERE wm2.workspace_id = workspaces.id
                         AND wm2.user_id = auth.uid()
                         AND wm2.role IN ('owner', 'admin')))
        )
    );

-- Helper function to check workspace access
CREATE OR REPLACE FUNCTION has_workspace_access(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspaces
        WHERE id = workspace_uuid
        AND (owner_id = auth.uid() OR
             EXISTS (SELECT 1 FROM workspace_members
                     WHERE workspace_id = workspace_uuid
                     AND user_id = auth.uid()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for companies
CREATE POLICY "Users can view companies in their workspaces" ON companies
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create companies in their workspaces" ON companies
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can update companies in their workspaces" ON companies
    FOR UPDATE USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can delete companies in their workspaces" ON companies
    FOR DELETE USING (has_workspace_access(workspace_id));

-- RLS Policies for leads
CREATE POLICY "Users can view leads in their workspaces" ON leads
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create leads in their workspaces" ON leads
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can update leads in their workspaces" ON leads
    FOR UPDATE USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can delete leads in their workspaces" ON leads
    FOR DELETE USING (has_workspace_access(workspace_id));

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns in their workspaces" ON campaigns
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create campaigns in their workspaces" ON campaigns
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can update campaigns in their workspaces" ON campaigns
    FOR UPDATE USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can delete campaigns in their workspaces" ON campaigns
    FOR DELETE USING (has_workspace_access(workspace_id));

-- RLS Policies for sequences
CREATE POLICY "Users can view sequences in their workspaces" ON sequences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = sequences.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can create sequences in their workspaces" ON sequences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = sequences.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can update sequences in their workspaces" ON sequences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = sequences.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can delete sequences in their workspaces" ON sequences
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = sequences.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

-- RLS Policies for campaign_enrollments
CREATE POLICY "Users can view enrollments in their workspaces" ON campaign_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_enrollments.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can create enrollments in their workspaces" ON campaign_enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_enrollments.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can update enrollments in their workspaces" ON campaign_enrollments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_enrollments.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can delete enrollments in their workspaces" ON campaign_enrollments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_enrollments.campaign_id
            AND has_workspace_access(campaigns.workspace_id)
        )
    );

-- RLS Policies for outbound_messages
CREATE POLICY "Users can view messages in their workspaces" ON outbound_messages
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create messages in their workspaces" ON outbound_messages
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can update messages in their workspaces" ON outbound_messages
    FOR UPDATE USING (has_workspace_access(workspace_id));

-- RLS Policies for inbound_events
CREATE POLICY "Users can view events in their workspaces" ON inbound_events
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create events in their workspaces" ON inbound_events
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- RLS Policies for suppression_list
CREATE POLICY "Users can view suppression list in their workspaces" ON suppression_list
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can add to suppression list in their workspaces" ON suppression_list
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can delete from suppression list in their workspaces" ON suppression_list
    FOR DELETE USING (has_workspace_access(workspace_id));
-- Auto-confirm all existing users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Create function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the user immediately
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- Add password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- Event-Sourced Outreach Model
-- Single source of truth for all dashboard metrics

-- Create event type enum
CREATE TYPE outreach_event_type AS ENUM (
    'message_queued',
    'message_sent',
    'message_failed',
    'reply_received',
    'reply_classified',
    'followup_scheduled',
    'followup_sent',
    'campaign_paused',
    'campaign_resumed',
    'automation_throttled',
    'automation_resumed',
    'captcha_detected',
    'manual_action_required'
);

-- Single source of truth: outreach_events
CREATE TABLE outreach_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    event_type outreach_event_type NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_outreach_events_workspace_id ON outreach_events(workspace_id);
CREATE INDEX idx_outreach_events_type ON outreach_events(event_type);
CREATE INDEX idx_outreach_events_timestamp ON outreach_events(event_timestamp);
CREATE INDEX idx_outreach_events_campaign_id ON outreach_events(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_outreach_events_lead_id ON outreach_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_outreach_events_workspace_type_timestamp ON outreach_events(workspace_id, event_type, event_timestamp);

-- User settings table for configuration (not counters)
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    daily_send_cap INTEGER DEFAULT 120,
    execution_mode TEXT DEFAULT 'Manual',
    sending_window_start TIME,
    sending_window_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their workspaces" ON outreach_events
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create events in their workspaces" ON outreach_events
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can view settings in their workspaces" ON user_settings
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can update settings in their workspaces" ON user_settings
    FOR ALL USING (has_workspace_access(workspace_id));

-- ============================================================================
-- VIEWS: KPI CALCULATIONS (Event-Sourced)
-- ============================================================================

-- View: Today's Sends per Workspace
CREATE OR REPLACE VIEW v_todays_sends AS
SELECT 
    workspace_id,
    COUNT(*) as sends_today
FROM outreach_events
WHERE 
    event_type = 'message_sent'
    AND event_timestamp >= CURRENT_DATE
    AND event_timestamp < CURRENT_DATE + INTERVAL '1 day'
GROUP BY workspace_id;

-- View: Replies Requiring Action (Queue Size)
CREATE OR REPLACE VIEW v_replies_requiring_action AS
SELECT 
    workspace_id,
    COUNT(DISTINCT lead_id) as replies_needing_action
FROM outreach_events
WHERE 
    event_type = 'reply_received'
    AND lead_id NOT IN (
        SELECT DISTINCT lead_id 
        FROM outreach_events 
        WHERE event_type IN ('reply_classified', 'manual_action_required')
        AND lead_id IS NOT NULL
    )
GROUP BY workspace_id;

-- View: 7-Day Reply Rate
CREATE OR REPLACE VIEW v_reply_rate_7d AS
WITH sent_last_7d AS (
    SELECT 
        workspace_id,
        lead_id,
        MIN(event_timestamp) as first_message_at
    FROM outreach_events
    WHERE 
        event_type = 'message_sent'
        AND event_timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY workspace_id, lead_id
),
replies_last_7d AS (
    SELECT 
        e.workspace_id,
        e.lead_id
    FROM outreach_events e
    INNER JOIN sent_last_7d s ON e.workspace_id = s.workspace_id AND e.lead_id = s.lead_id
    WHERE 
        e.event_type = 'reply_received'
        AND e.event_timestamp >= s.first_message_at
    GROUP BY e.workspace_id, e.lead_id
)
SELECT 
    s.workspace_id,
    COUNT(DISTINCT s.lead_id) as messages_sent,
    COUNT(DISTINCT r.lead_id) as replies_received,
    CASE 
        WHEN COUNT(DISTINCT s.lead_id) > 0 
        THEN ROUND((COUNT(DISTINCT r.lead_id)::NUMERIC / COUNT(DISTINCT s.lead_id)::NUMERIC) * 100)
        ELSE 0 
    END as reply_rate_pct
FROM sent_last_7d s
LEFT JOIN replies_last_7d r ON s.workspace_id = r.workspace_id AND s.lead_id = r.lead_id
GROUP BY s.workspace_id;

-- View: System Status (Derived from Events)
CREATE OR REPLACE VIEW v_system_status AS
WITH recent_events AS (
    SELECT 
        workspace_id,
        event_type,
        MAX(event_timestamp) as last_occurrence
    FROM outreach_events
    WHERE event_timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY workspace_id, event_type
),
active_campaigns AS (
    SELECT 
        workspace_id,
        COUNT(*) as active_count
    FROM campaigns
    WHERE is_active = true
    GROUP BY workspace_id
)
SELECT 
    w.id as workspace_id,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM recent_events 
            WHERE workspace_id = w.id 
            AND event_type = 'captcha_detected'
        ) THEN 'Error'
        WHEN EXISTS (
            SELECT 1 FROM recent_events 
            WHERE workspace_id = w.id 
            AND event_type = 'automation_throttled'
            AND NOT EXISTS (
                SELECT 1 FROM recent_events r2
                WHERE r2.workspace_id = w.id
                AND r2.event_type = 'automation_resumed'
                AND r2.last_occurrence > recent_events.last_occurrence
            )
        ) THEN 'Throttled'
        WHEN COALESCE(ac.active_count, 0) = 0 THEN 'Paused'
        ELSE 'Healthy'
    END as status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM recent_events 
            WHERE workspace_id = w.id 
            AND event_type = 'captcha_detected'
        ) THEN 'Captcha detected in last 24h'
        WHEN EXISTS (
            SELECT 1 FROM recent_events 
            WHERE workspace_id = w.id 
            AND event_type = 'automation_throttled'
        ) THEN 'Automation throttled'
        WHEN COALESCE(ac.active_count, 0) = 0 THEN 'No active campaigns'
        ELSE 'All systems operational'
    END as reason
FROM workspaces w
LEFT JOIN active_campaigns ac ON ac.workspace_id = w.id
LEFT JOIN recent_events ON recent_events.workspace_id = w.id;

-- View: Account Health Metrics
CREATE OR REPLACE VIEW v_account_health AS
SELECT 
    workspace_id,
    MAX(CASE WHEN event_type = 'message_sent' THEN event_timestamp END) as last_linkedin_action,
    EXISTS (
        SELECT 1 FROM outreach_events e2
        WHERE e2.workspace_id = outreach_events.workspace_id
        AND e2.event_type = 'automation_throttled'
        AND e2.event_timestamp >= NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (
            SELECT 1 FROM outreach_events e3
            WHERE e3.workspace_id = e2.workspace_id
            AND e3.event_type = 'automation_resumed'
            AND e3.event_timestamp > e2.event_timestamp
        )
    ) as cooldown_active,
    COUNT(CASE 
        WHEN event_type IN ('message_failed', 'captcha_detected') 
        AND event_timestamp >= NOW() - INTERVAL '24 hours'
        THEN 1 
    END) as errors_last_24h,
    EXISTS (
        SELECT 1 FROM outreach_events e2
        WHERE e2.workspace_id = outreach_events.workspace_id
        AND e2.event_type = 'captcha_detected'
        AND e2.event_timestamp >= NOW() - INTERVAL '24 hours'
    ) as captcha_detected
FROM outreach_events
GROUP BY workspace_id;

-- View: Campaign Execution Snapshot (Today Only)
CREATE OR REPLACE VIEW v_campaign_snapshot_today AS
WITH today_sends AS (
    SELECT 
        campaign_id,
        COUNT(*) as sends_today
    FROM outreach_events
    WHERE 
        event_type = 'message_sent'
        AND event_timestamp >= CURRENT_DATE
        AND campaign_id IS NOT NULL
    GROUP BY campaign_id
),
today_replies AS (
    SELECT 
        e.campaign_id,
        COUNT(DISTINCT e.lead_id) as replies_today
    FROM outreach_events e
    WHERE 
        e.event_type = 'reply_received'
        AND e.event_timestamp >= CURRENT_DATE
        AND e.campaign_id IS NOT NULL
    GROUP BY e.campaign_id
),
queue_remaining AS (
    SELECT 
        campaign_id,
        COUNT(*) as queued
    FROM campaign_enrollments
    WHERE state = 'active'
    GROUP BY campaign_id
)
SELECT 
    c.id as campaign_id,
    c.workspace_id,
    c.name as campaign_name,
    c.is_active,
    CASE 
        WHEN c.is_active THEN 'Running'
        ELSE 'Paused'
    END as status,
    COALESCE(q.queued, 0) as queue_remaining,
    COALESCE(s.sends_today, 0) as sends_today,
    COALESCE(r.replies_today, 0) as replies_today
FROM campaigns c
LEFT JOIN today_sends s ON s.campaign_id = c.id
LEFT JOIN today_replies r ON r.campaign_id = c.id
LEFT JOIN queue_remaining q ON q.campaign_id = c.id
WHERE c.is_active = true;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Log an outreach event
CREATE OR REPLACE FUNCTION log_outreach_event(
    p_workspace_id UUID,
    p_event_type outreach_event_type,
    p_campaign_id UUID DEFAULT NULL,
    p_lead_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO outreach_events (
        workspace_id,
        campaign_id,
        lead_id,
        event_type,
        metadata
    ) VALUES (
        p_workspace_id,
        p_campaign_id,
        p_lead_id,
        p_event_type,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get dashboard stats for workspace
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_workspace_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'todays_sends', COALESCE(ts.sends_today, 0),
        'daily_limit', COALESCE(us.daily_send_cap, 120),
        'replies_needing_action', COALESCE(ra.replies_needing_action, 0),
        'reply_rate', COALESCE(rr.reply_rate_pct, 0),
        'system_status', COALESCE(ss.status, 'Paused'),
        'system_status_reason', COALESCE(ss.reason, 'Unknown')
    ) INTO v_result
    FROM workspaces w
    LEFT JOIN v_todays_sends ts ON ts.workspace_id = w.id
    LEFT JOIN v_replies_requiring_action ra ON ra.workspace_id = w.id
    LEFT JOIN v_reply_rate_7d rr ON rr.workspace_id = w.id
    LEFT JOIN v_system_status ss ON ss.workspace_id = w.id
    LEFT JOIN user_settings us ON us.workspace_id = w.id
    WHERE w.id = p_workspace_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE outreach_events IS 'Single source of truth for all outreach metrics. Every dashboard KPI is derived from events in this table.';
COMMENT ON FUNCTION log_outreach_event IS 'Helper function to log outreach events. Use this instead of direct INSERT.';
COMMENT ON FUNCTION get_dashboard_stats IS 'Get all dashboard KPIs for a workspace. All metrics are computed from events.';
