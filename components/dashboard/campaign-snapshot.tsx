"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CampaignSnapshot {
  id: string;
  name: string;
  status: "Running" | "Paused" | "Completed";
  queueRemaining: number;
  todaySends: number;
  repliesToday: number;
}

interface CampaignSnapshotViewProps {
  campaigns: CampaignSnapshot[];
}

export function CampaignSnapshotView({ campaigns }: CampaignSnapshotViewProps) {
  if (campaigns.length === 0) {
    return null;
  }

  const statusConfig = {
    Running: {
      icon: Play,
      className: "bg-green-100 text-green-800 border-green-300",
    },
    Paused: {
      icon: Pause,
      className: "bg-gray-100 text-gray-800 border-gray-300",
    },
    Completed: {
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-800 border-blue-300",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Campaigns Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const { icon: Icon, className } = statusConfig[campaign.status];
            
            return (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <Badge variant="outline" className={cn("gap-1", className)}>
                      <Icon className="h-3 w-3" />
                      {campaign.status}
                    </Badge>
                    <span className="font-medium">{campaign.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Queue</div>
                      <div className="font-bold tabular-nums">{campaign.queueRemaining}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Today's Sends</div>
                      <div className="font-bold tabular-nums">{campaign.todaySends}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Replies</div>
                      <div className="font-bold tabular-nums">{campaign.repliesToday}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
