"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminConfirmUsers() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Use service role key to access auth.users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const confirmAllUsers = async () => {
    setLoading(true);
    setResult({ status: "Working..." });

    try {
      // This won't work with anon key, need service role
      // But we can show instructions
      setResult({
        status: "Instructions",
        message: "You need to run this SQL in Supabase Dashboard → SQL Editor:",
        sql: `-- Confirm all existing users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Create trigger to auto-confirm new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
      });
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin: Confirm Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Confirm All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will show you the SQL to run in Supabase to confirm all users and auto-confirm future users.
          </p>
          
          <Button onClick={confirmAllUsers} disabled={loading}>
            Show SQL Instructions
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-semibold mb-2">{result.status}</h3>
              {result.message && <p className="text-sm mb-2">{result.message}</p>}
              {result.sql && (
                <pre className="text-xs overflow-auto bg-black text-green-400 p-4 rounded">
                  {result.sql}
                </pre>
              )}
              {result.error && (
                <p className="text-sm text-red-600">{result.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle>Alternative: Disable Email Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://supabase.com/dashboard" target="_blank" className="text-primary underline">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong></li>
            <li>Uncheck <strong>"Confirm email"</strong></li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
