"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemHealth {
  lastLinkedInAction: string | null;
  cooldownActive: boolean;
  errorsLast24h: number;
  captchaDetected: boolean;
  automationMethod: string;
}

interface SystemHealthPanelProps {
  health: SystemHealth;
}

export function SystemHealthPanel({ health }: SystemHealthPanelProps) {
  const hasIssues =
    health.cooldownActive ||
    health.errorsLast24h > 0 ||
    health.captchaDetected;

  // Hide if healthy
  if (!hasIssues && !health.lastLinkedInAction) {
    return null;
  }

  return (
    <Card className={cn("border-2", hasIssues && "border-amber-500")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className={cn("h-5 w-5", hasIssues ? "text-amber-600" : "text-green-600")} />
          Account Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {health.lastLinkedInAction && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last LinkedIn Action
              </div>
              <span className="font-medium">{health.lastLinkedInAction}</span>
            </div>
          )}

          {health.cooldownActive && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Cooldown Status
              </div>
              <span className="font-medium text-amber-600">Active</span>
            </div>
          )}

          {health.errorsLast24h > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Errors (24h)
              </div>
              <span className="font-medium text-red-600">{health.errorsLast24h}</span>
            </div>
          )}

          {health.captchaDetected && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Captcha Detected
              </div>
              <span className="font-medium text-red-600">Yes</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              Automation Method
            </div>
            <span className="font-medium">{health.automationMethod}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
