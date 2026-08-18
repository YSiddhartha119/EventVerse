import { io } from 'socket.io-client';

let socket = null;

// In production (monolith), the frontend and backend share the same URL.
// In development, Vite proxies API calls but NOT WebSockets, so we need
// to connect directly to the backend port.
const SOCKET_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:4000')
  : window.location.origin;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'], // prefer websocket, fallback to polling
    });
  }
  return socket;
};

export const joinEvent = (eventId) => {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('event:join', eventId);
};

export const leaveEvent = (eventId) => {
  const s = getSocket();
  s.emit('event:leave', eventId);
};
