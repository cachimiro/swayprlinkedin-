import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Copy, ExternalLink } from "lucide-react";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please sign in</div>;
  }

  const { data: tasks } = await supabase
    .from("messages")
    .select(`
      *,
      contacts (
        full_name,
        profile_url,
        headline,
        company_name
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["pending", "scheduled"])
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LinkedIn Tasks</h1>
        <p className="text-muted-foreground">
          Manual LinkedIn outreach tasks from your campaigns
        </p>
      </div>

      {!tasks || tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending tasks</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              LinkedIn assist tasks will appear here when you create campaigns with LinkedIn outreach steps
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task: any) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {task.contacts?.full_name || "Unknown Contact"}
                    </CardTitle>
                    <CardDescription>
                      {task.contacts?.headline || "No headline"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {task.contacts?.profile_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={task.contacts.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Message</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(task.personalized_content || task.message_content);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {task.personalized_content || task.message_content}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase
                        .from("messages")
                        .update({ status: "sent" })
                        .eq("id", task.id);
                      window.location.reload();
                    }}
                  >
                    Mark as Sent
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      await supabase
                        .from("messages")
                        .update({
                          scheduled_at: tomorrow.toISOString(),
                        })
                        .eq("id", task.id);
                      window.location.reload();
                    }}
                  >
                    Snooze
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
