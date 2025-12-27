-- Event-Sourced Model Only
-- This migration only adds the event-sourced tables and views
-- It assumes the base schema (workspaces, campaigns, leads, etc.) already exists

-- Create event type enum (skip if exists)
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create outreach_events table (skip if exists)
CREATE TABLE IF NOT EXISTS outreach_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    event_type outreach_event_type NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (skip if exist)
CREATE INDEX IF NOT EXISTS idx_outreach_events_workspace_id ON outreach_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_type ON outreach_events(event_type);
CREATE INDEX IF NOT EXISTS idx_outreach_events_timestamp ON outreach_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_outreach_events_campaign_id ON outreach_events(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_events_lead_id ON outreach_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_events_workspace_type_timestamp ON outreach_events(workspace_id, event_type, event_timestamp);

-- Create user_settings table (skip if exists)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    daily_send_cap INTEGER DEFAULT 120,
    execution_mode TEXT DEFAULT 'Manual',
    sending_window_start TIME,
    sending_window_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view events in their workspaces" ON outreach_events;
DROP POLICY IF EXISTS "Users can create events in their workspaces" ON outreach_events;
DROP POLICY IF EXISTS "Users can view settings in their workspaces" ON user_settings;
DROP POLICY IF EXISTS "Users can update settings in their workspaces" ON user_settings;

-- Create RLS policies
CREATE POLICY "Users can view events in their workspaces" ON outreach_events
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create events in their workspaces" ON outreach_events
    FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY "Users can view settings in their workspaces" ON user_settings
    FOR SELECT USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can update settings in their workspaces" ON user_settings
    FOR ALL USING (has_workspace_access(workspace_id));

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_todays_sends;
DROP VIEW IF EXISTS v_replies_requiring_action;
DROP VIEW IF EXISTS v_reply_rate_7d;
DROP VIEW IF EXISTS v_system_status;
DROP VIEW IF EXISTS v_account_health;
DROP VIEW IF EXISTS v_campaign_snapshot_today;

-- View: Today's Sends per Workspace
CREATE VIEW v_todays_sends AS
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
CREATE VIEW v_replies_requiring_action AS
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
CREATE VIEW v_reply_rate_7d AS
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
CREATE VIEW v_system_status AS
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
CREATE VIEW v_account_health AS
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
CREATE VIEW v_campaign_snapshot_today AS
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

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS log_outreach_event(UUID, outreach_event_type, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);

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

-- Add comments
COMMENT ON TABLE outreach_events IS 'Single source of truth for all outreach metrics. Every dashboard KPI is derived from events in this table.';
COMMENT ON FUNCTION log_outreach_event IS 'Helper function to log outreach events. Use this instead of direct INSERT.';
COMMENT ON FUNCTION get_dashboard_stats IS 'Get all dashboard KPIs for a workspace. All metrics are computed from events.';
