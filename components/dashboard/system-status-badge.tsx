import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, PauseCircle, XCircle } from "lucide-react";

interface SystemStatusBadgeProps {
  status: "Healthy" | "Throttled" | "Paused" | "Error";
  reason?: string;
}

export function SystemStatusBadge({ status, reason }: SystemStatusBadgeProps) {
  const config = {
    Healthy: {
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300",
    },
    Throttled: {
      icon: AlertTriangle,
      className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    },
    Paused: {
      icon: PauseCircle,
      className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-950 dark:text-gray-300",
    },
    Error: {
      icon: XCircle,
      className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
    },
  };

  const { icon: Icon, className } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border font-medium text-sm",
          className
        )}
        title={reason}
      >
        <Icon className="h-4 w-4" />
        {status}
      </div>
    </div>
  );
}
