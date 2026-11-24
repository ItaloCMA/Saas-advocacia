import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

// Recupera credenciais salvas no navegador (se houver)
const getSavedFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem('lexflow_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
};

const savedConfig = typeof window !== 'undefined' ? getSavedFirebaseConfig() : null;

// Determina se há credenciais válidas do Firebase configuradas
export const isFirebaseConfigured = Boolean(
  (typeof __firebase_config !== 'undefined') ||
  (savedConfig && savedConfig.apiKey && savedConfig.apiKey !== 'SUA_API_KEY' && savedConfig.apiKey !== 'sua_api_key_aqui') ||
  (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_API_KEY !== 'SUA_API_KEY' && env.VITE_FIREBASE_API_KEY !== 'sua_api_key_aqui')
);

export const getActiveFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  if (savedConfig) {
    return savedConfig;
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || "SUA_API_KEY",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "seu-projeto.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "seu-projeto",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "seu-projeto.appspot.com",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "00000000000",
    appId: env.VITE_FIREBASE_APP_ID || "1:00000000:web:00000000"
  };
};

let appInstance = null;
let authInstance = null;
let dbInstance = null;

if (isFirebaseConfigured) {
  try {
    const config = getActiveFirebaseConfig();
    appInstance = !getApps().length ? initializeApp(config) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.warn("Não foi possível conectar ao Firebase, usando armazenamento local:", err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const appId = typeof __app_id !== 'undefined' 
  ? __app_id 
  : (env.VITE_APP_ID || 'lexflow-escritorio-prod');

export default appInstance;
