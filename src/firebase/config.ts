// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5Zndm8G41VFdXUcM-shyNgv4ckAyGwxI",
  authDomain: "rapidos-21203.firebaseapp.com",
  projectId: "rapidos-21203",
  storageBucket: "rapidos-21203.firebasestorage.app",
  messagingSenderId: "664352144036",
  appId: "1:664352144036:web:59b1152330db91769d8431",
  measurementId: "G-5CNVLMV6B5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app; 