import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "gen-lang-client-0198331062",
  appId: "1:763906333697:web:a2d432a9288a9f23a37400",
  apiKey: "AIzaSyCOaoS9Ps3_U7n8o4k0mpAJL6urL-9k5AI",
  authDomain: "gen-lang-client-0198331062.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-syndicateosaptel-f60a3212-ee66-4482-b2d6-7ae9d9ea515f",
  storageBucket: "gen-lang-client-0198331062.firebasestorage.app",
  messagingSenderId: "763906333697",
  measurementId: "",
  oAuthClientId: "763906333697-uo6jqs0u051msi4tcp15gqsfogf220nt.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID and forced long-polling to prevent WebSocket connection failures in preview/iframe environments
function initFirestoreInstance() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = initFirestoreInstance();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Connectivity validation constraint required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.");
    }
    return false;
  }
}

// Run testConnection asynchronously without blocking or failing on initial boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1200);
}
