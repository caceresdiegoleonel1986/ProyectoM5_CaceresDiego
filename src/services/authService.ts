import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import type { UserProfile } from "../types/auth.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function ensureUserProfile(
  firebaseUser: FirebaseUser,
  requestedName?: string,
): Promise<UserProfile> {
  const email = firebaseUser.email;
  if (!email) throw new Error("La cuenta de Firebase no tiene un correo asociado.");

  const fallbackName = requestedName?.trim()
    || firebaseUser.displayName?.trim()
    || email.split("@")[0];
  const profileRef = doc(db, "users", firebaseUser.uid);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (snapshot.exists()) {
      const profileData: unknown = snapshot.data();
      const data = isRecord(profileData) ? profileData : {};
      return {
        id: firebaseUser.uid,
        email,
        displayName: typeof data.displayName === "string" ? data.displayName : fallbackName,
        role: data.role === "admin" ? "admin" : "customer",
      };
    }

    transaction.set(profileRef, {
      email,
      displayName: fallbackName,
      role: "customer",
      createdAt: serverTimestamp(),
    });
    return {
      id: firebaseUser.uid,
      email,
      displayName: fallbackName,
      role: "customer",
    };
  });
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return ensureUserProfile(cred.user, displayName ?? cred.user.displayName ?? undefined);
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return ensureUserProfile(cred.user, cred.user.displayName ?? undefined);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const cred = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(cred.user, cred.user.displayName ?? undefined);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
