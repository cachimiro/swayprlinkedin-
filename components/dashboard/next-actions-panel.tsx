"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

interface NextAction {
  priority: number;
  title: string;
  action: string;
  url: string;
}

interface NextActionsPanelProps {
  actions: NextAction[];
}

export function NextActionsPanel({ actions }: NextActionsPanelProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Next Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div
              key={action.action}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-sm font-medium">{action.title}</p>
              </div>
              <Link href={action.url}>
                <Button size="sm" variant="ghost" className="gap-1">
                  Action
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
