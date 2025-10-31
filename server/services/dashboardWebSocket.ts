import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeDashboardWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    path: '/ws/dashboard',
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Dashboard WS] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Dashboard WS] User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Dashboard WS] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Emit live earnings update
export function emitEarningsUpdate(userId: string, amount: number, source: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('earnings:update', { amount, source, timestamp: new Date() });
}

// Emit vault unlock notification
export function emitVaultUnlock(userId: string, amount: number) {
  if (!io) return;
  io.to(`user:${userId}`).emit('vault:unlock', { amount, timestamp: new Date() });
}

// Emit badge unlock notification
export function emitBadgeUnlock(userId: string, badge: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('badge:unlock', { badge, timestamp: new Date() });
}
