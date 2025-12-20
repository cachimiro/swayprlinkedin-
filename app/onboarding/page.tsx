"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OnboardingPage() {
  const [step, setStep] = useState<"workspace" | "email" | "complete">("workspace");
  const [workspaceName, setWorkspaceName] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
      } else {
        setUserId(user.id);
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          owner_id: userId,
          name: workspaceName,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add owner as workspace member
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: userId,
          role: "owner",
        });

      if (memberError) throw memberError;

      // Store workspace ID in localStorage for later use
      localStorage.setItem("currentWorkspaceId", workspace.id);

      setStep("email");
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipEmail = () => {
    router.push("/dashboard");
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real app, you'd save this to a settings table
      // For now, we'll just store it in localStorage
      localStorage.setItem("resendApiKey", resendApiKey);
      
      setStep("complete");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  if (step === "complete") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">All set!</CardTitle>
            <CardDescription>
              Redirecting you to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to OutreachOS</CardTitle>
          <CardDescription>
            Let&apos;s get you set up in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={step} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workspace" disabled={step !== "workspace"}>
                1. Workspace
              </TabsTrigger>
              <TabsTrigger value="email" disabled={step !== "email"}>
                2. Email Provider
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="space-y-4 mt-6">
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input
                    id="workspaceName"
                    type="text"
                    placeholder="My Company"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    This is where you&apos;ll manage your outreach campaigns
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Workspace"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-6">
              <form onSubmit={handleSaveEmail} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="resendApiKey">Resend API Key</Label>
                  <Input
                    id="resendApiKey"
                    type="password"
                    placeholder="re_..."
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleSkipEmail}
                  >
                    Skip for now
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
