import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', { autoConnect: false });
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
