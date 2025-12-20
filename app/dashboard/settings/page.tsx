import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace and integrations
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              Manage your workspace settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input id="workspaceName" placeholder="My Company" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Provider</CardTitle>
            <CardDescription>
              Configure your email sending provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resendKey">Resend API Key</Label>
              <Input
                id="resendKey"
                type="password"
                placeholder="re_..."
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  resend.com/api-keys
                </a>
              </p>
            </div>
            <Button>Save API Key</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sending Limits</CardTitle>
            <CardDescription>
              Configure daily sending limits and windows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Send Limit</Label>
              <Input
                id="dailyLimit"
                type="number"
                defaultValue="200"
                min="1"
                max="1000"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of emails to send per day
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="windowStart">Sending Window Start</Label>
                <Input
                  id="windowStart"
                  type="time"
                  defaultValue="09:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="windowEnd">Sending Window End</Label>
                <Input
                  id="windowEnd"
                  type="time"
                  defaultValue="17:00"
                />
              </div>
            </div>
            <Button>Save Limits</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppression List</CardTitle>
            <CardDescription>
              Manage emails that should not receive outreach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suppressEmail">Add Email to Suppression List</Label>
              <div className="flex gap-2">
                <Input
                  id="suppressEmail"
                  type="email"
                  placeholder="email@example.com"
                />
                <Button>Add</Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              No suppressed emails yet
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
