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
  authorId: string;
  authorColor: string;
  scrollY: number;
  pathname: string;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  authorId: string;
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
  addMarker: (marker: Omit<Marker, 'id' | 'author' | 'authorId' | 'authorColor'> & { id?: string }) => void;
  addComment: (markerId: string, text: string) => void;
  editComment: (markerId: string, commentId: string, text: string) => void;
  deleteMarker: (markerId: string) => void;
  deleteComment: (markerId: string, commentId: string) => void;
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
    
    // Identity is now random on every refresh to allow testing different people
    const initialQuery: Record<string, string> = {};

    const socket = io({ query: initialQuery });
    
    socket.on('init', (data: { you: User, users: User[], markers: Marker[], comments: Record<string, Comment[]> }) => {
      // Identity persistence disabled as per user request (change on every refresh)
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

    socket.on('marker-deleted', (markerId: string) => {
      set(state => {
        const newComments = { ...state.comments };
        delete newComments[markerId];
        return {
          markers: state.markers.filter(m => m.id !== markerId),
          comments: newComments
        };
      });
    });

    socket.on('comment-deleted', ({ markerId, commentId }: { markerId: string, commentId: string }) => {
      set(state => ({
        comments: {
          ...state.comments,
          [markerId]: (state.comments[markerId] || []).filter(c => c.id !== commentId)
        }
      }));
    });

    socket.on('comment-edited', ({ markerId, commentId, text }: { markerId: string, commentId: string, text: string }) => {
      set(state => ({
        comments: {
          ...state.comments,
          [markerId]: (state.comments[markerId] || []).map(c => c.id === commentId ? { ...c, text } : c)
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

  addMarker: (markerData: Omit<Marker, 'id' | 'author' | 'authorId' | 'authorColor'> & { id?: string }) => {
    const me = get().currentUser;
    if (!me) return;
    
    const marker: Marker = {
      ...markerData,
      id: markerData.id || Math.random().toString(36).substring(7),
      author: me.name,
      authorId: me.id,
      authorColor: me.color
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
      authorId: me.id,
      timestamp: new Date().toISOString()
    };

    get().socket?.emit('add-comment', { markerId, comment });
  },

  editComment: (markerId: string, commentId: string, text: string) => {
    get().socket?.emit('edit-comment', { markerId, commentId, text });
  },

  deleteMarker: (markerId: string) => {
    console.log('[STORE] Deleting marker:', markerId);
    get().socket?.emit('delete-marker', markerId);
  },

  deleteComment: (markerId: string, commentId: string) => {
    console.log('[STORE] Deleting comment:', { markerId, commentId });
    get().socket?.emit('delete-comment', { markerId, commentId });
  }
}));
