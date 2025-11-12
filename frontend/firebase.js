// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIRBASE_APIKEY,
  authDomain: "food-delivery-bd10b.firebaseapp.com",
  projectId: "food-delivery-bd10b",
  storageBucket: "food-delivery-bd10b.firebasestorage.app",
  messagingSenderId: "608881856821",
  appId: "1:608881856821:web:63276a2e7e6eafa133fc7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };