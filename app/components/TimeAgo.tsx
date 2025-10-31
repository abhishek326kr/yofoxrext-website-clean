"use client";

import { formatDistanceToNow } from "date-fns";

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return (
    <span suppressHydrationWarning className={className}>
      {formatDistanceToNow(dateObj, { addSuffix: true })}
    </span>
  );
}
