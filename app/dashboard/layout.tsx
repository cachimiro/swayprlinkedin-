import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Check if user exists in users table, create if not
  const { data: existingUser, error: checkError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingUser && !checkError) {
    // Create user record
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        linkedin_id: `user_${Date.now()}`,
      });

    if (insertError) {
      console.error("Error creating user record:", insertError);
      // Don't block - user might already exist
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
