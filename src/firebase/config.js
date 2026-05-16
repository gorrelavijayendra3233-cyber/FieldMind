import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwM8DC7H0PvJJhXafEaJs9vBphcWFOKao",
  authDomain: "fieldmind-3b115.firebaseapp.com",
  projectId: "fieldmind-3b115",
  storageBucket: "fieldmind-3b115.firebasestorage.app",
  messagingSenderId: "178113545791",
  appId: "1:178113545791:web:a93eb14a94a3dbae021a8a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;