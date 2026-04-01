import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Database URL check is critical to prevent build failure
const isValidDatabaseURL = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string' || url === "") return false;
  
  // Prevent common placeholder strings or accidental null/undefined as strings
  if (
    url.includes("your_project_id") || 
    url.includes("your_api_key") || 
    url === "undefined" || 
    url === "null"
  ) return false;
  
  try {
    const parsedUrl = new URL(url);
    // Specifically check for Firebase RTDB patterns
    const isFirebaseHost = parsedUrl.hostname.includes("firebaseio.com") || 
                          parsedUrl.hostname.includes("firebasedatabase.app");
    
    // Path check to avoid the "Invalid Firebase Database URL" error
    // Firebase RTDB URL path should typically be empty or just '/'
    // Characters like ".", "#", "$", "[", or "]" are invalid in the path
    const hasInvalidPathChars = /[.#$[\]]/.test(parsedUrl.pathname);
    
    return parsedUrl.protocol === "https:" && isFirebaseHost && !hasInvalidPathChars;
  } catch {
    return false;
  }
};

const rawDatabaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // ONLY include databaseURL if it's verified valid.
  // Including an invalid URL (even if we don't call getDatabase) can trigger SDK errors.
  ...(isValidDatabaseURL(rawDatabaseURL) ? { databaseURL: rawDatabaseURL } : {})
};

// Initialize Firebase safely
let app: FirebaseApp | null = null;

try {
  if (getApps().length > 0) {
    app = getApp();
  } else if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Export instances or nulls with defensive checks
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Safely initialize RTDB
let rtdbInstance = null;
// Even with the config check, we double check here before calling getDatabase
if (app && isValidDatabaseURL(firebaseConfig.databaseURL as string)) {
  try {
    rtdbInstance = getDatabase(app);
  } catch (error) {
    console.warn("Failed to initialize Firebase Realtime Database:", error);
  }
}

export const rtdb = rtdbInstance;
export { app };

