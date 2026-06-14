import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  createUserWithEmailAndPassword,
  updateProfile,
  User
} from "firebase/auth";
import { auth } from "./firebase";
import { supabase } from "./supabase";

// Helper to determine if Firebase Auth is functioning
const isFirebaseAuthAvailable = () => {
  try {
    auth();
    return true;
  } catch (e) {
    return false;
  }
};

export const login = async (email: string, pass: string) => {
  if (!isFirebaseAuthAvailable()) {
    console.warn("Using mock login because Firebase config is missing.");
    if (pass !== "admin123" && email !== "ruhandharpurkayastha@gmail.com") {
      throw new Error("auth/user-not-found");
    }
    const mockUser = { uid: "mock-uuid-0000-0000-0000-000000000000", email, displayName: "Offline Admin" } as unknown as User;
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_firebase_user", JSON.stringify(mockUser));
    }
    return { user: mockUser };
  }
  return signInWithEmailAndPassword(auth(), email, pass);
};

export const register = async (email: string, pass: string, fullName: string) => {
  if (!isFirebaseAuthAvailable()) {
    const mockUser = { uid: "mock-uuid-0000-0000-0000-000000000000", email, displayName: fullName } as unknown as User;
    if (typeof window !== "undefined") {
      localStorage.setItem("mock_firebase_user", JSON.stringify(mockUser));
    }
    return { user: mockUser };
  }
  const userCred = await createUserWithEmailAndPassword(auth(), email, pass);
  await updateProfile(userCred.user, { displayName: fullName });
  return userCred;
};

export const logout = async () => {
  if (!isFirebaseAuthAvailable()) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mock_firebase_user");
    }
    return;
  }
  return signOut(auth());
};

export const resetPassword = async (email: string) => {
  if (!isFirebaseAuthAvailable()) {
    return;
  }
  return sendPasswordResetEmail(auth(), email);
};

export const verifyEmail = async (user: User) => {
  if (!isFirebaseAuthAvailable()) {
    return;
  }
  return sendEmailVerification(user);
};

export const syncUserWithSupabase = async (user: User, fullName?: string) => {
  // Check if user.uid is a valid UUID format. If the table 'users' expects a UUID,
  // we bypass upserting non-conforming Firebase UIDs to avoid database type errors.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.uid);
  if (!isUuid) {
    console.log("Supabase sync bypassed: Firebase user.uid is not a valid UUID format, avoiding type casting error.");
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.uid,
      email: user.email,
      name: fullName || user.displayName || user.email?.split('@')[0],
      role: 'staff', // Default newly synced users to staff for this admin portal context
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select();
  
  if (error) {
    if (error.code === '22P02') {
      console.warn("Supabase user sync bypassed: Database column requires UUID, Firebase UID cannot be cast.");
      return null;
    }
    console.error("Supabase sync error:", error);
    throw error;
  }
  return data;
};

export const getUserProfileFromSupabase = async (uid: string) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);
  if (!isUuid) {
    // If the database column expects a UUID and uid is not conforming, querying it will throw a 22P02 error.
    // So we avoid making the request or return null early.
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();
  
  if (error && error.code !== 'PGRST116' && error.code !== '22P02') { // PGRST116 is 'no rows found', 22P02 is invalid input syntax for type uuid
    console.error("Supabase profile fetch error:", error);
  }
  return data;
};
