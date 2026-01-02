// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9kieTZUM51pd_UpROzBpwHFmphjlgyN0",
  authDomain: "bpx451-a327d.firebaseapp.com",
  databaseURL: "https://bpx451-a327d.firebaseio.com",
  projectId: "bpx451-a327d",
  storageBucket: "bpx451-a327d.appspot.com",
  messagingSenderId: "1003388425350",
  appId: "1:1003388425350:web:6d2fff75703ba6fcebad07",
  measurementId: "G-Z9RL3RSWJS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Check if window is defined before initializing analytics
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };