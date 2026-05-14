import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SiteSettings } from '../types';

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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

export const useSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle1: 'FRENCH',
    heroTitle2: 'RECORD',
    heroTitle3: 'POOL',
    heroDescription: 'L\'accès privilégié aux meilleures tracks françaises pour DJs exigeants.',
    heroImageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&h=800&fit=crop',
    brandNamePart1: 'FRENCH',
    brandNamePart2: 'RECORD',
    brandNamePart3: 'POOL',
    primaryColor: '#0055FF',
    secondaryColor: '#FF3B30',
    accentColor: '#FFFFFF',
    fontFamily: 'sans',
    headingFont: 'Outfit',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    ctaText: 'Explorer le catalogue',
    ctaLink: 'discover',
    logoUrl: undefined,
    buttonRoundness: 'full',
    headerStyle: 'glass',
    layoutDensity: 'comfortable',
    sectionTitleLatest: 'Nos Dernières Sorties',
    sectionTitleTrending: 'Tendances du Pool',
    footerText: '© 2024 French Record Pool. All rights reserved.',
    heroOverlayOpacity: 40,
    heroTextAlign: 'left',
    showHero: true,
    showRecent: true,
    sidebarLibraryTitle: 'Bibliothèque',
    sidebarMusicTitle: 'Ma Musique',
    sidebarAdminTitle: 'Administration',
    sidebarStylesTitle: 'Styles',
    searchPlaceholder: 'Rechercher des morceaux, artistes, ou BPM...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'main'), (doc) => {
      if (doc.exists()) {
        setSettings(prev => ({ ...prev, ...doc.data() as SiteSettings }));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/main');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { settings, loading };
};
