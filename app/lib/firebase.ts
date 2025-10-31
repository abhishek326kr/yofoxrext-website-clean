"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";

// Check if all required Firebase environment variables are present
function checkFirebaseConfig(): boolean {
  // Check using the actual values instead of process.env which may not be available on client
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

// Export flag to indicate if Google OAuth is available
export const isGoogleAuthEnabled = checkFirebaseConfig();

// Firebase configuration - Use environment variables
// Note: storageBucket and messagingSenderId are optional and not required for Google OAuth
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (only once) - Only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== "undefined" && isGoogleAuthEnabled) {
  // Only initialize on client side and when Firebase is configured
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  
  // Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
  
  console.log("✅ Firebase client initialized - Google OAuth is available");
} else if (typeof window !== "undefined") {
  console.log("⚠️  Firebase not configured - Google OAuth is disabled. Email/password authentication is still available.");
}

// Sign in with Google and return ID token
export async function signInWithGoogle(): Promise<string> {
  if (!isGoogleAuthEnabled || !auth || !googleProvider) {
    throw new Error("Google OAuth is not configured. Please use email/password login.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw new Error(error.message || "Google sign-in failed");
  }
}

export { auth, googleProvider };
