import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">OutreachOS</h1>
        <p className="text-xl text-muted-foreground">
          Run outreach campaigns using your LinkedIn network data and email
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/auth/signin">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
