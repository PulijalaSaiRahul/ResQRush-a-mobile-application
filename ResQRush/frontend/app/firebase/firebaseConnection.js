// firebaseConnection.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhe6uwV_tVs7rMs1R7fce_UL-F80oEu94",
  authDomain: "resqrush-3204.firebaseapp.com",
  databaseURL: "https://resqrush-3204-default-rtdb.firebaseio.com",
  projectId: "resqrush-3204",
  storageBucket: "resqrush-3204.firebasestorage.app",
  messagingSenderId: "455424272661",
  appId: "1:455424272661:web:1e2ed773f3958f1216a11c",
  measurementId: "G-B986P3KEF5"
};

// Check if Firebase app is already initialized to prevent duplicate initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore and Authentication
const db = getFirestore(app);
const auth = getAuth(app);

// Export Firestore and Auth instances
export { db, auth };

// Default export for Firebase app
export default app;