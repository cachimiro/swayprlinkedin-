"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugAuth() {
  const [authState, setAuthState] = useState<any>(null);
  const [userRecord, setUserRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    
    // Check Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    setAuthState({
      user: user,
      error: authError,
      isAuthenticated: !!user,
    });

    // Check users table
    if (user) {
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserRecord({
        data: userRecord,
        error: userError,
        exists: !!userRecord,
      });
    }

    setLoading(false);
  };

  const createUserRecord = async () => {
    if (!authState?.user) return;

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authState.user.id,
        email: authState.user.email,
        full_name: authState.user.user_metadata?.full_name || authState.user.email?.split("@")[0] || "User",
        linkedin_id: `user_${Date.now()}`,
      })
      .select();

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert("User record created!");
      checkAuth();
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Auth Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Supabase Auth Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users Table Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(userRecord, null, 2)}
          </pre>
          
          {authState?.isAuthenticated && !userRecord?.exists && (
            <Button onClick={createUserRecord}>
              Create User Record Manually
            </Button>
          )}
        </CardContent>
      </Card>

      {authState?.isAuthenticated && userRecord?.exists && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <p className="text-green-600 font-semibold">
              ✅ Everything looks good! You should be able to access the dashboard.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = "/dashboard"}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
