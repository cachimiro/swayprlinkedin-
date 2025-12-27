import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;

    // Create profile
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
    });

    // Create workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .insert({
        owner_id: user.id,
        name: `${fullName}'s Workspace`,
      })
      .select()
      .single();

    console.log('Signup - Created user and workspace:', { userId: user.id, workspaceId: workspace?.id });

    // Sign in the user to get session
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 500 });
    }

    // Set session cookies
    const response = NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: fullName 
      } 
    });

    // Set Supabase auth cookies
    if (sessionData.session) {
      response.cookies.set("sb-access-token", sessionData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // Also set user_id for compatibility
    response.cookies.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
