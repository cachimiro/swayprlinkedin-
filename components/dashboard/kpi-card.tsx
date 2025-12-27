import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "healthy" | "warning" | "critical" | "neutral";
  icon?: LucideIcon;
  onClick?: () => void;
  pulse?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  status = "neutral",
  icon: Icon,
  onClick,
  pulse = false,
}: KPICardProps) {
  const statusColors = {
    healthy: "border-green-500 bg-green-50 dark:bg-green-950",
    warning: "border-amber-500 bg-amber-50 dark:bg-amber-950",
    critical: "border-red-500 bg-red-50 dark:bg-red-950",
    neutral: "border-border bg-card",
  };

  const textColors = {
    healthy: "text-green-700 dark:text-green-300",
    warning: "text-amber-700 dark:text-amber-300",
    critical: "text-red-700 dark:text-red-300",
    neutral: "text-foreground",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 border-2",
        statusColors[status],
        onClick && "cursor-pointer hover:shadow-md",
        pulse && "animate-pulse"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={cn("text-3xl font-bold tabular-nums", textColors[status])}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <Icon className={cn("h-5 w-5 mt-1", textColors[status])} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
