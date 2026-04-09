import { create } from 'zustand';
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { ref, onValue, set as setRTDB, onDisconnect, remove } from 'firebase/database';

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
  createdAt?: any;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: string;
};

export type Polaroid = {
  id: string;
  ownerId: string;
  type?: 'POLAROID' | 'YOUTUBE' | 'LINK' | 'POSTIT';
  scope?: 'PROFILE' | 'ROLLING_PAPER';
  authorId?: string;
  authorName?: string;
  x: number;
  y: number;
  image?: string;
  youtubeUrl?: string;
  url?: string;
  text: string;
  rotation: number;
  scale: number;
  date: string;
  createdAt?: any;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  url: string;
  logoUrl?: string;
  tagline?: string;
  description?: string;
  screenshots?: string[];
  categories?: string[];
  techStacks?: string[];
  demoVideo?: string;
  isVerified?: boolean;
  hasIssue?: boolean;
  feedbackCount: number;
  about?: string;
  useCases?: string[];
  targetAudience?: string[];
  platforms?: string[];
  createdAt?: any;
};

interface AppState {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  markers: Marker[];
  comments: Record<string, Comment[]>;
  projects: Project[];
  polaroids: Polaroid[];
  currentProject: string;
  isLoading: boolean;
  
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setProject: (projectId: string) => void;
  moveCursor: (x: number, y: number) => void;
  addMarker: (marker: Omit<Marker, 'id' | 'author' | 'authorId' | 'authorColor'> & { id?: string }) => void;
  addComment: (markerId: string, text: string) => void;
  deleteMarker: (markerId: string) => void;
  
  // Initialization
  init: () => void;
  
  // Project Management
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'feedbackCount' | 'ownerId'>) => Promise<string>;

  // Polaroid Management
  addPolaroid: (uid: string, data: Omit<Polaroid, 'id' | 'ownerId' | 'createdAt'>) => Promise<void>;
  updatePolaroid: (uid: string, id: string, data: Partial<Polaroid>) => Promise<void>;
  deletePolaroid: (uid: string, id: string) => Promise<void>;
  subscribeToPolaroids: (uid: string) => () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  firebaseUser: null,
  users: [],
  markers: [],
  comments: {},
  projects: [],
  polaroids: [],
  currentProject: 'home',
  isLoading: true,

  setFirebaseUser: (user) => {
    if (!auth || !rtdb) return;
    if (user) {
      const color = `hsl(${Math.random() * 360}, 80%, 70%)`;
      const newUser: User = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        x: 0,
        y: 0,
        color,
        projectId: get().currentProject
      };
      set({ firebaseUser: user, currentUser: newUser });
      
      // Setup RTDB Presence
      const userRef = ref(rtdb, `cursors/${get().currentProject}/${user.uid}`);
      onDisconnect(userRef).remove();
      setRTDB(userRef, newUser);
    } else {
      set({ firebaseUser: null, currentUser: null });
    }
  },

  init: () => {
    const currentAuth = auth;
    const currentDb = db;
    if (!currentAuth || !currentDb) {
      set({ isLoading: false });
      return;
    }
    // 1. Auth state listener
    onAuthStateChanged(currentAuth, (user) => {
      get().setFirebaseUser(user);
      set({ isLoading: false });
    });

    // 2. Global Projects listener
    const projectsRef = collection(currentDb, 'projects');
    const qProjects = query(projectsRef, orderBy('createdAt', 'desc'));
    onSnapshot(qProjects, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      set({ projects });
    });
  },

  setProject: (projectId: string) => {
    set({ currentProject: projectId });
    const currentDb = db;
    const currentRtdb = rtdb;
    if (!currentDb || !currentRtdb) return;
    
    // Update marker listeners
    const markersRef = collection(currentDb, `projects/${projectId}/markers`);
    onSnapshot(markersRef, (snapshot) => {
      const markers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Marker));
      set({ markers });
      
      // For each marker, listen to comments
      markers.forEach(marker => {
        const commentsRef = collection(currentDb, `projects/${projectId}/markers/${marker.id}/comments`);
        onSnapshot(query(commentsRef, orderBy('timestamp', 'asc')), (cSnapshot) => {
          const mComments = cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
          set(state => ({
            comments: { ...state.comments, [marker.id]: mComments }
          }));
        });
      });
    });

    // Update RTDB cursor listener
    const cursorsRef = ref(currentRtdb, `cursors/${projectId}`);
    onValue(cursorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        set({ users: Object.values(data) });
      } else {
        set({ users: [] });
      }
    });

    // If user is logged in, update their position in RTDB
    const user = get().currentUser;
    if (user) {
      const userRef = ref(currentRtdb, `cursors/${projectId}/${user.id}`);
      setRTDB(userRef, { ...user, projectId });
    }
  },

  moveCursor: (x: number, y: number) => {
    const user = get().currentUser;
    const currentRtdb = rtdb;
    if (!user || !currentRtdb) return;
    
    // Update local state for immediate feedback
    set(state => ({
      currentUser: state.currentUser ? { ...state.currentUser, x, y } : null
    }));

    // Update Firebase RTDB
    const userRef = ref(currentRtdb, `cursors/${get().currentProject}/${user.id}`);
    setRTDB(userRef, { ...user, x, y, projectId: get().currentProject });
  },

  addMarker: async (markerData) => {
    const me = get().currentUser;
    const project = get().currentProject;
    const currentDb = db;
    if (!me || project === 'home' || !currentDb) return;

    const marker = {
      ...markerData,
      author: me.name,
      authorId: me.id,
      authorColor: me.color,
      projectId: project,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(currentDb, `projects/${project}/markers`), marker);
    // Increment feedback count on project
    await updateDoc(doc(currentDb, 'projects', project), {
      feedbackCount: increment(1)
    });
  },

  addComment: async (markerId, text) => {
    const me = get().currentUser;
    const project = get().currentProject;
    const currentDb = db;
    if (!me || project === 'home' || !currentDb) return;

    const comment = {
      text,
      author: me.name,
      authorId: me.id,
      timestamp: new Date().toISOString()
    };

    await addDoc(collection(currentDb, `projects/${project}/markers/${markerId}/comments`), comment);
  },

  deleteMarker: async (markerId) => {
    const project = get().currentProject;
    const currentDb = db;
    if (project === 'home' || !currentDb) return;
    await deleteDoc(doc(currentDb, `projects/${project}/markers`, markerId));
  },

  deleteProject: async (projectId: string) => {
    const currentDb = db;
    if (!currentDb) return;
    await deleteDoc(doc(currentDb, 'projects', projectId));
  },

  updateProject: async (projectId: string, data: Partial<Project>) => {
    const currentDb = db;
    if (!currentDb) return;
    await updateDoc(doc(currentDb, 'projects', projectId), data);
  },

  addProject: async (data) => {
    const currentDb = db;
    const user = get().firebaseUser;
    if (!currentDb || !user) throw new Error("Not authenticated or DB not initialized");
    
    const projectRef = await addDoc(collection(currentDb, 'projects'), {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      feedbackCount: 0,
      isVerified: false
    });

    return projectRef.id;
  },

  addPolaroid: async (uid, data) => {
    const currentDb = db;
    if (!currentDb) return;
    await addDoc(collection(currentDb, `users/${uid}/polaroids`), {
      ...data,
      type: data.type || 'POLAROID',
      ownerId: uid,
      createdAt: serverTimestamp()
    });
  },

  updatePolaroid: async (uid, id, data) => {
    const currentDb = db;
    if (!currentDb) return;
    // Filter out undefined values to prevent Firebase errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    if (Object.keys(cleanData).length === 0) return;
    await updateDoc(doc(currentDb, `users/${uid}/polaroids`, id), cleanData);
  },

  deletePolaroid: async (uid, id) => {
    const currentDb = db;
    if (!currentDb) return;
    await deleteDoc(doc(currentDb, `users/${uid}/polaroids`, id));
  },

  subscribeToPolaroids: (uid) => {
    const currentDb = db;
    if (!currentDb) return () => {};
    const q = query(collection(currentDb, `users/${uid}/polaroids`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const polaroids = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          type: data.type || 'POLAROID' // Default for legacy data
        } as Polaroid;
      });
      set({ polaroids });
    });
  }
}));
