import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
  
  console.log("LinkedIn connect - clientId:", clientId);
  console.log("LinkedIn connect - redirectUri:", redirectUri);
  
  if (!clientId) {
    return NextResponse.json(
      { error: "LinkedIn Client ID not configured" },
      { status: 500 }
    );
  }

  // Updated scopes for LinkedIn API v2
  const scope = "openid profile email";
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

  console.log("Redirecting to:", authUrl);

  return NextResponse.redirect(authUrl);
}
