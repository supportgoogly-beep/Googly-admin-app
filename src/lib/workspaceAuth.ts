import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { getFirebase } from "./firebase";

// Active workspace scopes
export const WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive"
];

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Google Auth Provider with Workspace Scopes
const getProvider = () => {
  const provider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
  return provider;
};

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const { auth } = getFirebase();
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate standard Google OAuth Sign In Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const { auth } = getFirebase();
  if (!auth) throw new Error("Firebase Auth is not initialized yet.");

  try {
    isSigningIn = true;
    const provider = getProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve standard Google Access Token from authorization credential.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Workspace googleSignIn error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Acquire cached access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Clear session
export const logout = async () => {
  const { auth } = getFirebase();
  if (auth) {
    await auth.signOut();
  }
  cachedAccessToken = null;
};
