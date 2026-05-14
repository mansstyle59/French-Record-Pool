import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  FirestoreError 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Track } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('offline') || message.includes('unavailable')) {
    console.warn(`Firestore is currently ${message.includes('offline') ? 'offline' : 'unavailable'}. Operation: ${operationType} on ${path}`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const useTracks = (genre?: string) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'tracks'), orderBy('createdAt', 'desc'));
    
    if (genre && genre !== 'Tous' && genre !== 'All') {
      q = query(collection(db, 'tracks'), where('genre', '==', genre), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tracksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Track[];
      setTracks(tracksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tracks');
      setLoading(false);
    });

    return unsubscribe;
  }, [genre]);

  return { tracks, loading };
};
