"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
  type Firestore
} from "firebase/firestore";
import type { PlaceList, UserProfile } from "@/lib/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

const app = isFirebaseConfigured && getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = isFirebaseConfigured && app ? getAuth(app) : null;
export const db: Firestore | null = isFirebaseConfigured && app ? getFirestore(app) : null;

export function toUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    name: user.displayName ?? "Usuario",
    email: user.email,
    avatarUrl: user.photoURL
  };
}

export async function signInWithGoogle() {
  if (!auth) return null;
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return toUserProfile(result.user);
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}

export function subscribeUserLists(userId: string, callback: (lists: PlaceList[]) => void) {
  if (!db) return () => undefined;
  const listsQuery = query(collection(db, "lists"), where("ownerId", "==", userId));
  return onSnapshot(listsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as PlaceList));
  });
}

export async function saveListToFirestore(userId: string, list: PlaceList) {
  if (!db) return;
  await setDoc(doc(db, "lists", list.id), {
    ...list,
    ownerId: userId,
    updatedAt: new Date().toISOString()
  });
}
