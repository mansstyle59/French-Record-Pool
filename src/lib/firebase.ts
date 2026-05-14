import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Test connection to ensure Firestore is reachable
async function testConnection() {
  try {
    // Attempting to reach the server directly
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore appears to be offline. This might be temporary while the database is provisioned.");
    } else {
      console.error("Firestore connectivity test failed:", error);
    }
  }
}
testConnection();

export default app;
