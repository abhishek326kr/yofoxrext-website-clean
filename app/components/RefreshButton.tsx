"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

export function RefreshButton({ 
  onRefresh, 
  label = "Refresh",
  size = "sm",
  variant = "ghost",
  className = ""
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (size === "icon") {
    return (
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing}
        size="icon"
        variant={variant}
        className={className}
        data-testid="button-refresh"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      size={size}
      variant={variant}
      className={className}
      data-testid="button-refresh"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {label}
    </Button>
  );
}
