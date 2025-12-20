"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [result, setResult] = useState<any>(null);
  const supabase = createClient();

  const testSignup = async () => {
    setResult({ status: "loading..." });

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setResult({ error: "Auth error", details: authError });
        return;
      }

      setResult({ status: "Auth user created", user: authData.user });

      // Step 2: Create user in users table
      if (authData.user) {
        const userData = {
          id: authData.user.id,
          email: email,
          full_name: fullName || "Test User",
          linkedin_id: `user_${Date.now()}`,
        };

        setResult({ status: "Attempting to insert user...", userData });

        const { data: insertData, error: insertError } = await supabase
          .from("users")
          .insert(userData)
          .select();

        if (insertError) {
          setResult({ 
            error: "Insert error", 
            details: insertError,
            code: insertError.code,
            message: insertError.message,
            hint: insertError.hint
          });
        } else {
          setResult({ success: true, data: insertData });
        }
      }
    } catch (err: any) {
      setResult({ error: "Caught error", details: err.message });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Signup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Button onClick={testSignup} className="w-full">
            Test Signup
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
