"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, TrendingUp, CheckCircle } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    contactsCount: 0,
    campaignsCount: 0,
    sentCount: 0,
    repliesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get current user
        const response = await fetch("/api/auth/me");
        const { user } = await response.json();
        
        if (!user) return;

        // Get stats
        const [contacts, campaigns, sent, replies] = await Promise.all([
          supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["sent", "delivered"]),
          supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "replied"),
        ]);

        setStats({
          contactsCount: contacts.count || 0,
          campaignsCount: campaigns.count || 0,
          sentCount: sent.count || 0,
          repliesCount: replies.count || 0,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [supabase]);

  const statsData = [
    {
      title: "Total Contacts",
      value: stats.contactsCount,
      icon: Users,
      description: "LinkedIn connections",
    },
    {
      title: "Active Campaigns",
      value: stats.campaignsCount,
      icon: Mail,
      description: "Running outreach campaigns",
    },
    {
      title: "Messages Sent",
      value: stats.sentCount,
      icon: TrendingUp,
      description: "Total outbound messages",
    },
    {
      title: "Replies Received",
      value: stats.repliesCount,
      icon: CheckCircle,
      description: "Inbound responses",
    },
  ];

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your outreach performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Import your contacts</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with your LinkedIn connections or Sales Navigator exports
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">2. Create a campaign</h3>
            <p className="text-sm text-muted-foreground">
              Set up email sequences or LinkedIn assist tasks to reach out to your leads
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">3. Track your results</h3>
            <p className="text-sm text-muted-foreground">
              Monitor opens, clicks, replies, and manage your outreach pipeline
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
