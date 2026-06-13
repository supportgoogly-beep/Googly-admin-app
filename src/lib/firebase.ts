import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getMessaging, Messaging } from "firebase/messaging";
import { getAnalytics, Analytics } from "firebase/analytics";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _messaging: Messaging | null = null;
let _analytics: Analytics | null = null;

const firebaseConfig = {
  apiKey: "AIzaSyApQ0fg_i_wep3nsTbln5rI8_jZj47a8n8",
  authDomain: "googly-admin-app.firebaseapp.com",
  projectId: "googly-admin-app",
  storageBucket: "googly-admin-app.firebasestorage.app",
  messagingSenderId: "134190736611",
  appId: "1:134190736611:web:78bd46fa25ee04a3d751d6",
  measurementId: "G-E9JQKB321L"
};

function getFirebase() {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    // Messaging relies on the browser supporting the Notification API.
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        _messaging = getMessaging(_app);
      } catch (e) {
        console.warn("Failed to initialize Firebase Messaging", e);
      }
    }
    _analytics = getAnalytics(_app);
  }
  return { app: _app, auth: _auth, messaging: _messaging, analytics: _analytics };
}

export { getFirebase };
export const auth = () => {
    const firebase = getFirebase();
    if (!firebase.auth) throw new Error("Firebase Auth not initialized");
    return firebase.auth;
};
export const messaging = () => {
    const firebase = getFirebase();
    if (!firebase.messaging) throw new Error("Firebase Messaging not initialized or not supported by browser");
    return firebase.messaging;
};
