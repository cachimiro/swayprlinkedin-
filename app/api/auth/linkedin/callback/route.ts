import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("LinkedIn OAuth error from provider:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=linkedin_auth_failed`
    );
  }

  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`
    );
  }

  try {
    // Get current user from Supabase session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("No authenticated user:", authError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`
      );
    }

    console.log("LinkedIn callback - userId:", user.id);
    console.log("LinkedIn callback - code:", code?.substring(0, 10) + "...");
    console.log("LinkedIn callback - client_id:", process.env.LINKEDIN_CLIENT_ID);
    console.log("LinkedIn callback - redirect_uri:", `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    console.log("Access token received successfully");

    // Get LinkedIn profile using userinfo endpoint (OpenID Connect)
    const profileResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log("Profile data:", profileResponse.data);

    const linkedinId = profileResponse.data.sub; // OpenID Connect uses 'sub' for user ID

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Update user with LinkedIn data using service role client
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        linkedin_id: linkedinId,
        access_token,
        token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update user:", updateError);
      throw updateError;
    }

    console.log("LinkedIn connected successfully for user:", user.id);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=linkedin_connected`
    );
  } catch (error: any) {
    console.error("LinkedIn OAuth error:", error.response?.data || error.message);
    console.error("Full error:", JSON.stringify(error.response?.data || error, null, 2));
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=linkedin_auth_error`
    );
  }
}
