import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type User = {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  projectId: string;
};

export type Marker = {
  id: string;
  x: number;
  y: number;
  projectId: string;
  author: string;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  timestamp: string;
};

interface AppState {
  socket: Socket | null;
  currentUser: User | null;
  users: User[];
  markers: Marker[];
  comments: Record<string, Comment[]>;
  currentProject: string;
  connect: () => void;
  setProject: (projectId: string) => void;
  moveCursor: (x: number, y: number) => void;
  addMarker: (marker: Omit<Marker, 'id' | 'author'>) => void;
  addComment: (markerId: string, text: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  socket: null,
  currentUser: null,
  users: [],
  markers: [],
  comments: {},
  currentProject: 'home',

  connect: () => {
    if (get().socket) return;
    
    const socket = io();
    
    socket.on('init', (data: { you: User, users: User[], markers: Marker[], comments: Record<string, Comment[]> }) => {
      set({
        socket,
        currentUser: data.you,
        users: data.users,
        markers: data.markers,
        comments: data.comments
      });
    });

    socket.on('user-joined', (user: User) => {
      set(state => ({ users: [...state.users.filter(u => u.id !== user.id), user] }));
    });

    socket.on('user-updated', (user: User) => {
      set(state => ({ users: state.users.map(u => u.id === user.id ? user : u) }));
    });

    socket.on('cursor-moved', (user: User) => {
      set(state => ({
        users: state.users.map(u => u.id === user.id ? { ...u, x: user.x, y: user.y } : u)
      }));
    });

    socket.on('user-left', (id: string) => {
      set(state => ({ users: state.users.filter(u => u.id !== id) }));
    });

    socket.on('marker-added', (marker: Marker) => {
      set(state => ({ markers: [...state.markers, marker] }));
    });

    socket.on('comment-added', ({ markerId, comment }: { markerId: string, comment: Comment }) => {
      set(state => ({
        comments: {
          ...state.comments,
          [markerId]: [...(state.comments[markerId] || []), comment]
        }
      }));
    });
  },

  setProject: (projectId: string) => {
    set({ currentProject: projectId });
    get().socket?.emit('join-project', projectId);
  },

  moveCursor: (x: number, y: number) => {
    get().socket?.emit('cursor-move', { x, y });
  },

  addMarker: (markerData) => {
    const me = get().currentUser;
    if (!me) return;
    
    const marker: Marker = {
      ...markerData,
      id: Math.random().toString(36).substring(7),
      author: me.name
    };
    
    get().socket?.emit('add-marker', marker);
  },

  addComment: (markerId: string, text: string) => {
    const me = get().currentUser;
    if (!me) return;

    const comment: Comment = {
      id: Math.random().toString(36).substring(7),
      text,
      author: me.name,
      timestamp: new Date().toISOString()
    };

    get().socket?.emit('add-comment', { markerId, comment });
  }
}));
