import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LinkedInSetupHelp() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/api/auth/linkedin/callback`;

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">LinkedIn App Setup</h1>

        <Card className="border-blue-500 border-2">
          <CardHeader>
            <CardTitle className="text-xl text-blue-600">
              Step 1: Add Redirect URL to LinkedIn App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              You need to add this exact URL to your LinkedIn app:
            </p>
            
            <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm break-all">
              {redirectUrl}
            </div>

            <div className="space-y-3">
              <p className="font-semibold">How to add it:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Go to:{" "}
                  <a
                    href="https://www.linkedin.com/developers/apps"
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    LinkedIn Developers
                  </a>
                </li>
                <li>Click on your app (OutreachOS)</li>
                <li>Go to the <strong>Auth</strong> tab</li>
                <li>
                  Under <strong>OAuth 2.0 settings</strong>, find{" "}
                  <strong>Redirect URLs</strong>
                </li>
                <li>Click <strong>Add redirect URL</strong></li>
                <li>
                  Paste the URL above (copy it exactly):
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <code className="text-black">{redirectUrl}</code>
                  </div>
                </li>
                <li>Click <strong>Update</strong></li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500 border-2">
          <CardHeader>
            <CardTitle className="text-xl text-green-600">
              Step 2: Verify Your Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold">Client ID:</p>
              <div className="p-3 bg-muted rounded font-mono text-sm">
                {process.env.LINKEDIN_CLIENT_ID || "Not set"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Client Secret:</p>
              <div className="p-3 bg-muted rounded font-mono text-sm">
                {process.env.LINKEDIN_CLIENT_SECRET
                  ? "••••••••••••••••"
                  : "Not set"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Redirect URL:</p>
              <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                {redirectUrl}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Test Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>After adding the redirect URL:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to Settings page</li>
              <li>Click &quot;Connect LinkedIn&quot;</li>
              <li>Authorize the app</li>
              <li>You&apos;ll be redirected back with success!</li>
            </ol>
            <a href="/dashboard/settings">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Go to Settings
              </button>
            </a>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-500">
          <CardHeader>
            <CardTitle>Common Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold">
                &quot;Redirect URI mismatch&quot;
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure the URL in LinkedIn app matches EXACTLY (including
                https/http, no trailing slash)
              </p>
            </div>
            <div>
              <p className="font-semibold">&quot;Invalid client&quot;</p>
              <p className="text-sm text-muted-foreground">
                Double-check your Client ID and Secret in .env.local
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
