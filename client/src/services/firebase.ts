import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC8nZQ47JjGOumSdRy2G1MOXVS0RcNMGSc",
  authDomain: "like-d1b1e.firebaseapp.com",
  projectId: "like-d1b1e",
  storageBucket: "like-d1b1e.firebasestorage.app",
  messagingSenderId: "658954882036",
  appId: "1:658954882036:web:f6001a576567e722f547a1",
  measurementId: "G-88Q27QSQ2X",
};

export const app = initializeApp(firebaseConfig);

// Optional analytics in supported environments
void isSupported().then((ok) => {
  if (ok) getAnalytics(app);
});

