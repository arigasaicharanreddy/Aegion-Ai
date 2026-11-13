import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Strictly in-memory OAuth access token cache (never stored in localStorage or sessionStorage)
let cachedGoogleAccessToken: string | null = null;

export function getGoogleAccessToken(): string | null {
  return cachedGoogleAccessToken;
}

export function clearGoogleAccessToken(): void {
  cachedGoogleAccessToken = null;
}

export function initGoogleAuthListener(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

export interface GooglePopupResult {
  idToken: string;
  accessToken: string | null;
  email: string;
  displayName: string;
  photoURL?: string;
}

export async function signInWithGooglePopup(): Promise<GooglePopupResult> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(firebaseAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedGoogleAccessToken = credential?.accessToken || null;
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    accessToken: cachedGoogleAccessToken,
    email: result.user.email || '',
    displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
    photoURL: result.user.photoURL || undefined,
  };
}

export async function signOutGoogle(): Promise<void> {
  cachedGoogleAccessToken = null;
  try {
    await signOut(firebaseAuth);
  } catch {
    // Ignore sign-out errors if no active Firebase session
  }
}
