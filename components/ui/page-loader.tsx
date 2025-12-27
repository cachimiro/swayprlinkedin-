"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay showing loader to avoid flash for fast loads
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-lg border animate-in zoom-in-95 duration-200">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}
