import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, TrendingUp, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please sign in</div>;
  }

  // Get stats
  const { count: contactsCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: campaignsCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: sentCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["sent", "delivered"]);

  const { count: repliesCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "replied");

  const stats = [
    {
      title: "Total Contacts",
      value: contactsCount || 0,
      icon: Users,
      description: "LinkedIn connections",
    },
    {
      title: "Active Campaigns",
      value: campaignsCount || 0,
      icon: Mail,
      description: "Running outreach campaigns",
    },
    {
      title: "Messages Sent",
      value: sentCount || 0,
      icon: TrendingUp,
      description: "Total outbound messages",
    },
    {
      title: "Replies Received",
      value: repliesCount || 0,
      icon: CheckCircle,
      description: "Inbound responses",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your outreach performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
