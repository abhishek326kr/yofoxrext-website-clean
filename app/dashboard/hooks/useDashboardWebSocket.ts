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

    const socket: Socket = io({
      path: '/ws/dashboard',
      autoConnect: true
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
