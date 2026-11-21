import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';

/**
 * Firebase Web SDK configuration for MastroTickets (`mastro-tickets`).
 * Supports optional VITE_FIREBASE_* environment overrides.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCEyl3_p-3aOXFGfqI_nFmMvVPFn3reADk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mastro-tickets.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mastro-tickets',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mastro-tickets.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '666809364882',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:666809364882:web:3aa19e7e7a450b13f2914b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5FTBLF079K',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const configuredDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

function createFirestoreInstance(): Firestore {
  try {
    return configuredDatabaseId
      ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, configuredDatabaseId)
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return configuredDatabaseId ? getFirestore(app, configuredDatabaseId) : getFirestore(app);
  }
}

export const db = createFirestoreInstance();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function formatFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = formatFirestoreError(error, operationType, path);
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isPermissionDeniedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Missing or insufficient permissions') ||
    message.includes('permission-denied')
  );
}

/**
 * Startup connectivity check against Firestore server (`test/connection`).
 */
export async function testFirestoreConnection(): Promise<{
  connected: boolean;
  offline: boolean;
  reason?: string;
}> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true, offline: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('the client is offline') || message.includes('unavailable')) {
      console.warn(
        'Firestore is currently unreachable for project mastro-tickets. Verify Cloud Firestore Database is created and firestore.googleapis.com is enabled in Firebase Console.'
      );
      return { connected: false, offline: true, reason: message };
    }
    // A permission-denied response still confirms live server reachability
    return { connected: true, offline: false };
  }
}
