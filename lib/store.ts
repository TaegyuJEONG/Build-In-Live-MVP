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

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  url: string;
  logoUrl?: string;
  description?: string;
  guide?: string;
  createdAt: any;
  feedbackCount: number;
  scriptSkipped?: boolean;
  hasIssue?: boolean;
  issueMemo?: string;
};

interface AppState {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  markers: Marker[];
  comments: Record<string, Comment[]>;
  projects: Project[];
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
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  firebaseUser: null,
  users: [],
  markers: [],
  comments: {},
  projects: [],
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
  }
}));
