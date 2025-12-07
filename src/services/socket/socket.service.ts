import { BASE_ENDPOINT } from '@services/axios';
import { io, Socket } from 'socket.io-client';

class SocketService {
  socket: Socket | null = null;

  setupSocketConnection() {
    try {
      // In local development, use empty string to leverage Vite's socket.io proxy
      // The proxy in vite.config.ts will route /socket.io to http://localhost:5000
      // Otherwise, use the full BASE_ENDPOINT
      let isDev = false;
      // Safely check for import.meta (available in Vite, not in Jest)
      // Use type assertion to avoid TypeScript errors in test environment
      const metaEnv = typeof import.meta !== 'undefined' 
        ? (import.meta as { env?: { DEV?: boolean; MODE?: string } })?.env
        : undefined;
      
      if (metaEnv) {
        isDev = metaEnv.DEV ?? metaEnv.MODE === 'development';
      } else {
        // In test environment, import.meta might not be available
        // Default to development mode for tests
        isDev = typeof process !== 'undefined' && 
                (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');
      }
      const socketUrl = BASE_ENDPOINT || (isDev ? '' : 'http://localhost:5000');
      
      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        autoConnect: true,
        timeout: 20000,
        forceNew: false
      });
      this.socketConnectionEvents();
    } catch (error) {
      console.warn('Failed to setup socket connection:', error);
    }
  }

  socketConnectionEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected. Reason: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn(`Socket connection error: ${error.message}`);
      // Don't throw or break the app - just log the warning
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.warn(`Socket reconnection error: ${error.message}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.warn('Socket reconnection failed. The app will continue to work without real-time features.');
    });
  }
}

export const socketService = new SocketService();

