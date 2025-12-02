import { io, Socket } from 'socket.io-client';

class SocketService {
  socket: Socket | null = null;

  setupSocketConnection() {
    this.socket = io(import.meta.env.VITE_APP_BASE_ENDPOINT || '', {
      transports: ['websocket'],
      secure: true
    });
    this.socketConnectionEvents();
  }

  socketConnectionEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Reason: ${reason}`);
      this.socket?.connect();
    });

    this.socket.on('connect_error', (error) => {
      console.log(`Error: ${error}`);
      this.socket?.connect();
    });
  }
}

export const socketService = new SocketService();

