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
