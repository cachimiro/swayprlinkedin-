import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Event-Sourced Dashboard Stats API
 * 
 * All metrics are computed from outreach_events table.
 * No counters, no derived state - everything is recomputable.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Get user from custom auth cookie
    const userId = cookieStore.get("user_id")?.value;

    console.log('Dashboard stats - Auth check:', {
      hasUserId: !!userId,
      userId: userId,
      cookies: cookieStore.getAll().map(c => c.name)
    });

    if (!userId) {
      console.error('Dashboard stats - No user_id cookie');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client with service role for data access
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );

    // Get workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({
        kpis: {
          todaySends: 0,
          dailyLimit: 120,
          repliesNeedingAction: 0,
          replyRate: 0,
          systemStatus: "Paused",
          systemStatusReason: "No workspace found",
        },
        nextActions: [{
          priority: 1,
          title: "Complete workspace setup",
          action: "setup",
          url: "/dashboard/settings",
        }],
        campaignSnapshots: [],
        systemHealth: {
          lastLinkedInAction: null,
          cooldownActive: false,
          errorsLast24h: 0,
          captchaDetected: false,
          automationMethod: "Manual",
        },
      });
    }

    const workspaceId = workspace.id;

    // Use the event-sourced function to get all KPIs
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_dashboard_stats', { p_workspace_id: workspaceId });

    if (statsError) {
      console.error("Stats error:", statsError);
      throw statsError;
    }

    const stats = statsData || {
      todays_sends: 0,
      daily_limit: 120,
      replies_needing_action: 0,
      reply_rate: 0,
      system_status: 'Paused',
      system_status_reason: 'No data',
    };

    // Get account health from view
    const { data: healthData } = await supabase
      .from('v_account_health')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const health = healthData || {
      last_linkedin_action: null,
      cooldown_active: false,
      errors_last_24h: 0,
      captcha_detected: false,
    };

    // Get user settings for automation method
    const { data: settings } = await supabase
      .from('user_settings')
      .select('execution_mode')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    // Get campaign snapshots from view
    const { data: campaigns } = await supabase
      .from('v_campaign_snapshot_today')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(5);

    const campaignSnapshots = (campaigns || []).map(c => ({
      id: c.campaign_id,
      name: c.campaign_name,
      status: c.status,
      queueRemaining: c.queue_remaining,
      todaySends: c.sends_today,
      repliesToday: c.replies_today,
    }));

    // Build next actions based on rules
    const nextActions = [];

    // Rule: No contacts
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    if (!leadsCount || leadsCount === 0) {
      nextActions.push({
        priority: 1,
        title: "Import contacts to unlock campaigns",
        action: "import_contacts",
        url: "/dashboard/leads",
      });
    }

    // Rule: No daily send cap configured
    if (!stats.daily_limit || stats.daily_limit === 0) {
      nextActions.push({
        priority: 2,
        title: "Configure daily send limit",
        action: "configure_limit",
        url: "/dashboard/settings",
      });
    }

    // Rule: Replies needing action
    if (stats.replies_needing_action > 0) {
      nextActions.push({
        priority: 3,
        title: `${stats.replies_needing_action} ${stats.replies_needing_action === 1 ? 'reply' : 'replies'} waiting review`,
        action: "review_replies",
        url: "/dashboard/inbox",
      });
    }

    // Rule: Campaign paused with active enrollments
    const { data: pausedCampaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .eq('is_active', false)
      .limit(1);

    if (pausedCampaigns && pausedCampaigns.length > 0) {
      const campaign = pausedCampaigns[0];
      const { count: enrollments } = await supabase
        .from('campaign_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('state', 'active');

      if (enrollments && enrollments > 0) {
        nextActions.push({
          priority: 4,
          title: `Campaign "${campaign.name}" paused with ${enrollments} active enrollments`,
          action: "resume_campaign",
          url: `/dashboard/campaigns/${campaign.id}`,
        });
      }
    }

    // Rule: Follow-ups scheduled today
    const { count: followupsToday } = await supabase
      .from('outreach_events')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'followup_scheduled')
      .gte('event_timestamp', new Date().toISOString().split('T')[0]);

    if (followupsToday && followupsToday > 0) {
      nextActions.push({
        priority: 5,
        title: `${followupsToday} follow-ups scheduled today`,
        action: "view_followups",
        url: "/dashboard/tasks",
      });
    }

    // Calculate send percentage for status
    const sendPercentage = stats.daily_limit > 0 
      ? (stats.todays_sends / stats.daily_limit) * 100 
      : 0;

    return NextResponse.json({
      kpis: {
        todaySends: stats.todays_sends,
        dailyLimit: stats.daily_limit,
        repliesNeedingAction: stats.replies_needing_action,
        replyRate: stats.reply_rate,
        systemStatus: stats.system_status,
        systemStatusReason: stats.system_status_reason,
        sendPercentage,
      },
      nextActions: nextActions.sort((a, b) => a.priority - b.priority).slice(0, 5),
      campaignSnapshots,
      systemHealth: {
        lastLinkedInAction: health.last_linkedin_action,
        cooldownActive: health.cooldown_active,
        errorsLast24h: health.errors_last_24h,
        captchaDetected: health.captcha_detected,
        automationMethod: settings?.execution_mode || "Manual",
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
