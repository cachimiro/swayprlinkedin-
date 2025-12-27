"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "linkedin_connected") {
      setMessage({ type: "success", text: "LinkedIn connected successfully!" });
    } else if (error) {
      setMessage({ type: "error", text: "Failed to connect LinkedIn. Please try again." });
    }
  }, [searchParams]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace and integrations
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>LinkedIn Integration</CardTitle>
            <CardDescription>
              Connect your LinkedIn account to sync contacts and enable outreach features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect LinkedIn to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Import your LinkedIn connections</li>
                <li>Sync contact profile data</li>
                <li>Use LinkedIn Assist Mode for outreach</li>
              </ul>
            </div>
            <Link href="/api/auth/linkedin/connect">
              <Button>Connect LinkedIn</Button>
            </Link>
          </CardContent>
        </Card>

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
