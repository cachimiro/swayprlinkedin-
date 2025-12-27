import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Dashboard stats - Auth error:", authError?.message || "No user");
      
      // Return empty state for unauthenticated users
      return NextResponse.json({
        kpis: {
          todaySends: 0,
          dailyLimit: 120,
          repliesNeedingAction: 0,
          replyRate: 0,
          systemStatus: "Paused" as const,
          systemStatusReason: "Not authenticated",
        },
        nextActions: [{
          priority: 1,
          title: "Sign in to view dashboard",
          action: "signin",
          url: "/auth/signin",
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

    console.log("Dashboard stats - Authenticated user:", user.id);

    // Get user's workspace (or create one if it doesn't exist)
    let { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!workspace) {
      console.log("No workspace found, creating one...");
      
      // First ensure profile exists
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
        }, {
          onConflict: "id",
        });

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      // Create workspace for user
      const { data: newWorkspace, error: createError } = await supabase
        .from("workspaces")
        .insert({
          owner_id: user.id,
          name: "My Workspace",
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Failed to create workspace:", createError);
        
        // Return empty state if workspace creation fails
        return NextResponse.json({
          kpis: {
            todaySends: 0,
            dailyLimit: 120,
            repliesNeedingAction: 0,
            replyRate: 0,
            systemStatus: "Paused" as const,
            systemStatusReason: "Workspace setup required",
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

      workspace = newWorkspace;
    }

    const workspaceId = workspace.id;
    console.log("Using workspace:", workspaceId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get today's sends
    const { count: todaySends } = await supabase
      .from("outbound_messages")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", today.toISOString())
      .in("status", ["sent", "delivered", "opened", "clicked"]);

    // Get daily send limit from active campaigns
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("daily_send_limit")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true);

    const dailyLimit = campaigns?.reduce((sum, c) => sum + (c.daily_send_limit || 0), 0) || 120;

    // Get replies requiring action (last 7 days, type = 'reply')
    const { count: repliesNeedingAction } = await supabase
      .from("inbound_events")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("type", "reply")
      .gte("created_at", sevenDaysAgo.toISOString());

    // Get 7-day reply rate
    const { count: sentLast7Days } = await supabase
      .from("outbound_messages")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .in("status", ["sent", "delivered", "opened", "clicked"]);

    const { count: repliesLast7Days } = await supabase
      .from("inbound_events")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("type", "reply")
      .gte("created_at", sevenDaysAgo.toISOString());

    const replyRate = sentLast7Days && sentLast7Days > 0
      ? Math.round((repliesLast7Days || 0) / sentLast7Days * 100)
      : 0;

    // System status logic
    let systemStatus: "Healthy" | "Throttled" | "Paused" | "Error" = "Healthy";
    let systemStatusReason = "";

    // Check if any campaigns are active
    const { count: activeCampaigns } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("is_active", true);

    if (!activeCampaigns || activeCampaigns === 0) {
      systemStatus = "Paused";
      systemStatusReason = "No active campaigns";
    } else if (todaySends && todaySends >= dailyLimit * 0.9) {
      systemStatus = "Throttled";
      systemStatusReason = "Approaching daily send limit";
    }

    // Get next actions
    const nextActions = [];

    // Check for contacts
    const { count: contactsCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    if (!contactsCount || contactsCount === 0) {
      nextActions.push({
        priority: 1,
        title: "Import contacts to unlock campaigns",
        action: "import_contacts",
        url: "/dashboard/leads",
      });
    }

    // Check for daily send limit configuration
    if (dailyLimit === 0) {
      nextActions.push({
        priority: 2,
        title: "Configure daily send limit",
        action: "configure_limit",
        url: "/dashboard/settings",
      });
    }

    // Check for replies needing action
    if (repliesNeedingAction && repliesNeedingAction > 0) {
      nextActions.push({
        priority: 3,
        title: `${repliesNeedingAction} ${repliesNeedingAction === 1 ? 'reply' : 'replies'} waiting review`,
        action: "review_replies",
        url: "/dashboard/inbox",
      });
    }

    // Check for paused campaigns with enrollments
    const { data: pausedCampaigns } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .eq("is_active", false);

    if (pausedCampaigns && pausedCampaigns.length > 0) {
      for (const campaign of pausedCampaigns.slice(0, 1)) {
        const { count: enrollments } = await supabase
          .from("campaign_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .eq("state", "active");

        if (enrollments && enrollments > 0) {
          nextActions.push({
            priority: 4,
            title: `Campaign "${campaign.name}" paused with ${enrollments} active enrollments`,
            action: "resume_campaign",
            url: `/dashboard/campaigns/${campaign.id}`,
          });
          break;
        }
      }
    }

    // Get active campaigns for today
    const { data: activeCampaignsData } = await supabase
      .from("campaigns")
      .select("id, name, is_active, daily_send_limit")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .limit(5);

    const campaignSnapshots = await Promise.all(
      (activeCampaignsData || []).map(async (campaign) => {
        const { count: queueRemaining } = await supabase
          .from("campaign_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .eq("state", "active");

        const { count: todaySendsForCampaign } = await supabase
          .from("outbound_messages")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .gte("created_at", today.toISOString());

        const { count: repliesToday } = await supabase
          .from("inbound_events")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("type", "reply")
          .gte("created_at", today.toISOString());

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.is_active ? "Running" : "Paused",
          queueRemaining: queueRemaining || 0,
          todaySends: todaySendsForCampaign || 0,
          repliesToday: repliesToday || 0,
        };
      })
    );

    return NextResponse.json({
      kpis: {
        todaySends: todaySends || 0,
        dailyLimit,
        repliesNeedingAction: repliesNeedingAction || 0,
        replyRate,
        systemStatus,
        systemStatusReason,
      },
      nextActions: nextActions.sort((a, b) => a.priority - b.priority).slice(0, 5),
      campaignSnapshots,
      systemHealth: {
        lastLinkedInAction: null, // TODO: Implement when LinkedIn integration is active
        cooldownActive: false,
        errorsLast24h: 0,
        captchaDetected: false,
        automationMethod: "Manual",
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
