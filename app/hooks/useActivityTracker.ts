import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_THRESHOLD = 30 * 1000; // 30 seconds

export function useActivityTracker(enabled = true) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track activity mutation (SECURE VERSION - no client-supplied minutes)
  // Server calculates elapsed time from session timestamps to prevent coin farming
  const trackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/activity/track', {});
      return response.json();
    },
    onSuccess: (data: { success?: boolean; coinsEarned?: number; totalMinutes?: number; dailyLimit?: boolean }) => {
      if (data.coinsEarned && data.coinsEarned > 0) {
        toast({
          title: '🪙 Coins Earned!',
          description: `You earned ${data.coinsEarned} coins for being active!`,
        });
      }
      
      if (data.dailyLimit) {
        toast({
          title: '⏱️ Daily Limit Reached',
          description: 'You\'ve reached your maximum activity earnings for today (50 coins).',
          variant: 'default',
        });
      }
      
      // Invalidate activity query to refresh stats
      queryClient.invalidateQueries({ queryKey: ['/api/activity/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', 'me', 'coins'] });
    },
  });

  // Record activity event
  const recordActivity = () => {
    lastActivityRef.current = Date.now();
    if (!isActive) {
      setIsActive(true);
      startTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Activity event listeners
    const events = ['mousemove', 'click', 'scroll', 'keypress', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // Check activity status every second
    const checkInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
        // User is inactive
        if (isActive) {
          setIsActive(false);
          setActiveTime(0);
        }
      } else {
        // User is active - increment counter
        if (isActive) {
          const elapsed = Date.now() - startTimeRef.current;
          setActiveTime(elapsed);
        }
      }
    }, 1000);

    // Send heartbeat every 5 minutes if active
    intervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity < INACTIVITY_THRESHOLD) {
        // User has been active in the last 30 seconds
        trackMutation.mutate();
        startTimeRef.current = Date.now();
        setActiveTime(0);
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      clearInterval(checkInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isActive]);

  return {
    isActive,
    activeTime: Math.floor(activeTime / 1000), // Convert to seconds
    isTracking: enabled,
  };
}
