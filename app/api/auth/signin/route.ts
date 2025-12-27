import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Sign in with Supabase Auth
    const { data: sessionData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !sessionData.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = sessionData.user;

    console.log('Signin - User authenticated:', { userId: user.id, email: user.email });

    // Create session response
    const response = NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.user_metadata?.full_name 
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
    console.error('Signin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}
