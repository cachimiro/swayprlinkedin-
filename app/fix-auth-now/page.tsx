import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FixAuthNow() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-red-600">⚠️ Fix Authentication Now</h1>
        
        <Card className="border-red-500 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">The Problem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              You&apos;re getting a <strong>400 error</strong> when trying to sign in because Supabase requires email confirmation.
            </p>
            <p className="text-lg font-semibold text-red-600">
              You MUST do ONE of the following to fix this:
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500 border-2">
          <CardHeader>
            <CardTitle className="text-xl text-green-600">✅ Solution 1: Disable Email Confirmation (EASIEST - 30 seconds)</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-lg">
              <li>Open a new tab and go to: <a href="https://supabase.com/dashboard/project/ipdeablmyrfzogkjtbms" target="_blank" className="text-blue-600 underline font-mono">https://supabase.com/dashboard/project/ipdeablmyrfzogkjtbms</a></li>
              <li>Click <strong>Authentication</strong> in the left sidebar</li>
              <li>Click <strong>Providers</strong></li>
              <li>Click on <strong>Email</strong></li>
              <li>Find the checkbox that says <strong>&quot;Confirm email&quot;</strong></li>
              <li><strong className="text-red-600">UNCHECK IT</strong></li>
              <li>Click <strong>Save</strong> at the bottom</li>
              <li>Come back here and try signing in again</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-blue-500 border-2">
          <CardHeader>
            <CardTitle className="text-xl text-blue-600">✅ Solution 2: Run SQL (If you can&apos;t change settings)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-lg">
              <li>Open a new tab and go to: <a href="https://supabase.com/dashboard/project/ipdeablmyrfzogkjtbms/sql/new" target="_blank" className="text-blue-600 underline font-mono">https://supabase.com/dashboard/project/ipdeablmyrfzogkjtbms/sql/new</a></li>
              <li>Copy the SQL below</li>
              <li>Paste it in the SQL Editor</li>
              <li>Click <strong>Run</strong> (or press F5)</li>
              <li>Come back and try signing in</li>
            </ol>

            <div className="mt-4">
              <p className="font-semibold mb-2">Copy this SQL:</p>
              <pre className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`-- Fix all existing users (confirm their emails)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Auto-confirm all future users
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify it worked
SELECT email, email_confirmed_at FROM auth.users;`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-500">
          <CardHeader>
            <CardTitle>After Running the Fix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg">1. <strong>Hard refresh</strong> your browser: <code className="bg-gray-200 px-2 py-1 rounded">Ctrl + Shift + R</code> (Windows) or <code className="bg-gray-200 px-2 py-1 rounded">Cmd + Shift + R</code> (Mac)</p>
            <p className="text-lg">2. Go to <a href="/auth/signin" className="text-blue-600 underline">/auth/signin</a></p>
            <p className="text-lg">3. Try signing in with your email and password</p>
            <p className="text-lg">4. Should work! ✅</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Why This Happens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              By default, Supabase requires users to click a confirmation link in their email before they can sign in. 
              Since you want simple email/password login without email verification, you need to disable this feature.
            </p>
          </CardContent>
        </Card>

        <div className="text-center pt-8">
          <p className="text-2xl font-bold">👆 Please do ONE of the solutions above 👆</p>
          <p className="text-lg text-muted-foreground mt-2">Then come back and try signing in</p>
        </div>
      </div>
    </div>
  );
}
