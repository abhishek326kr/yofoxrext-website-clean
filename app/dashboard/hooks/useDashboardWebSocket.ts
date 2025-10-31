'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function useDashboardWebSocket(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Connect to the API server (port 3001) for WebSocket
    const apiUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';
      
    const socket: Socket = io(apiUrl, {
      path: '/ws/dashboard',
      autoConnect: true,
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Dashboard WS] Connected to WebSocket');
      socket.emit('join', userId);
    });

    // Live earnings update
    socket.on('earnings:update', (data: { amount: number; source: string; timestamp: Date }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/overview'] });
      toast.success(`+${data.amount} coins from ${data.source}!`);
    });

    // Vault unlock with confetti!
    socket.on('vault:unlock', (data: { amount: number; timestamp: Date }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/vault/summary'] });
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d']
      });
      
      toast.success(`🎉 ${data.amount} coins unlocked in vault!`, {
        duration: 5000,
        action: {
          label: 'Claim Now',
          onClick: () => window.location.href = '/dashboard?tab=journey'
        }
      });
    });

    // Badge unlock
    socket.on('badge:unlock', (data: { badge: any; timestamp: Date }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/badges'] });
      toast.success(`🏆 New badge: ${data.badge.badgeName}! +${data.badge.coinReward} coins`);
    });

    socket.on('disconnect', () => {
      console.log('[Dashboard WS] Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('[Dashboard WS] WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, queryClient]);

  return null;
}
