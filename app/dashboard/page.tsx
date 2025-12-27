"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/dashboard/kpi-card";
import { SystemStatusBadge } from "@/components/dashboard/system-status-badge";
import { NextActionsPanel } from "@/components/dashboard/next-actions-panel";
import { SystemHealthPanel } from "@/components/dashboard/system-health-panel";
import { CampaignSnapshotView } from "@/components/dashboard/campaign-snapshot";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Send, MessageSquare, TrendingUp, Activity } from "lucide-react";

interface DashboardStats {
  kpis: {
    todaySends: number;
    dailyLimit: number;
    repliesNeedingAction: number;
    replyRate: number;
    systemStatus: "Healthy" | "Throttled" | "Paused" | "Error";
    systemStatusReason: string;
  };
  nextActions: Array<{
    priority: number;
    title: string;
    action: string;
    url: string;
  }>;
  campaignSnapshots: Array<{
    id: string;
    name: string;
    status: "Running" | "Paused" | "Completed";
    queueRemaining: number;
    todaySends: number;
    repliesToday: number;
  }>;
  systemHealth: {
    lastLinkedInAction: string | null;
    cooldownActive: boolean;
    errorsLast24h: number;
    captchaDetected: boolean;
    automationMethod: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Use event-sourced API
        const response = await fetch("/api/dashboard/stats-v2");
        
        if (!response.ok) {
          throw new Error("Failed to load dashboard stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        console.error("Error loading dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Failed to load dashboard. Please refresh the page.
        </div>
      </div>
    );
  }

  const { kpis, nextActions, campaignSnapshots, systemHealth } = stats;

  // Calculate send percentage for color coding
  const sendPercentage = kpis.dailyLimit > 0 
    ? (kpis.todaySends / kpis.dailyLimit) * 100 
    : 0;

  const sendStatus = 
    sendPercentage >= 90 ? "critical" : 
    sendPercentage >= 70 ? "warning" : 
    "healthy";

  return (
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Command Centre</h1>
        <p className="text-muted-foreground">
          Operational status and actions
        </p>
      </div>

      {/* Top KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Sends"
          value={`${kpis.todaySends} / ${kpis.dailyLimit}`}
          status={sendStatus}
          icon={Send}
          onClick={() => router.push("/dashboard/campaigns")}
        />
        
        <KPICard
          title="Replies Requiring Action"
          value={kpis.repliesNeedingAction}
          status={kpis.repliesNeedingAction > 0 ? "warning" : "neutral"}
          icon={MessageSquare}
          pulse={kpis.repliesNeedingAction > 0}
          onClick={() => router.push("/dashboard/inbox")}
        />
        
        <KPICard
          title="Reply Rate (7 days)"
          value={`${kpis.replyRate}%`}
          subtitle={kpis.replyRate > 0 ? "Replies ÷ Messages sent" : "No data yet"}
          icon={TrendingUp}
          status="neutral"
        />
        
        <div className="flex items-center">
          <div className="w-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              System Status
            </p>
            <SystemStatusBadge 
              status={kpis.systemStatus} 
              reason={kpis.systemStatusReason}
            />
          </div>
        </div>
      </div>

      {/* Next Actions Panel */}
      {nextActions.length > 0 && (
        <NextActionsPanel actions={nextActions} />
      )}

      {/* System Health Panel */}
      <SystemHealthPanel health={systemHealth} />

      {/* Campaign Execution Snapshot */}
      {campaignSnapshots.length > 0 && (
        <CampaignSnapshotView campaigns={campaignSnapshots} />
      )}
    </div>
  );
}
