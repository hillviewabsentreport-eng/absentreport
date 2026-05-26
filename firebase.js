// ── Firebase init ───────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ═══════════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATION
// Replace these values with your own Firebase project config
// See SETUP.md Step 1 for instructions
// ═══════════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
   apiKey: "AIzaSyD7t79JAkQ37opp3oCWlBqbGRZogXIwaLg",
  authDomain: "hillviewabsentreporter.firebaseapp.com",
  projectId: "hillviewabsentreporter",
  storageBucket: "hillviewabsentreporter.firebasestorage.app",
  messagingSenderId: "773878243166",
  appId: "1:773878243166:web:f2ca8f8d4a3142168d39cf"
};

// ── Apps Script backend URL (same as before) ────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylBT8N2HmAPoxrlzXufSOprwx7kmYU8ZHAggDEIr0SVfcCApUsqKH31XWmxJi4g2zq/exec";



const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

const ACTION_CODE_SETTINGS = {
  url: "https://hillviewabsentreport-eng.github.io/absentreport/index.html",
  handleCodeInApp: true,
};

export {
  auth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
  ACTION_CODE_SETTINGS,
  APPS_SCRIPT_URL
};
