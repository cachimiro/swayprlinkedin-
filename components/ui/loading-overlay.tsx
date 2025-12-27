"use client";

import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ isLoading, message, className }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 rounded-lg bg-card p-6 shadow-lg border">
        <LoadingSpinner size="md" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
