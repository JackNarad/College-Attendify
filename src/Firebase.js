import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyDPnwCduTrN8BlRMOf4rx06XFYrtNdaHLs",
  authDomain: "data-crud-33419.firebaseapp.com",
  projectId: "data-crud-33419",
  storageBucket: "data-crud-33419.appspot.com",
  messagingSenderId: "722097389151",
  appId: "1:722097389151:web:7fd84c2b89c2177da465ea",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 