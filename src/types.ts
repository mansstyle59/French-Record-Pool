export interface Track {
  id: string;
  title: string;
  artist: string;
  version?: string;
  genre: string;
  bpm: number;
  key: string;
  duration: string;
  artwork: string;
  previewUrl: string;
  fileUrl?: string;
  createdAt?: any;
  downloadCount?: number;
  isExclusive?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  count: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  subscriptionStatus: 'free' | 'pro' | 'admin';
  favoriteTracks: string[];
}

export interface SiteSettings {
  heroTitle1: string;
  heroTitle2: string;
  heroTitle3: string;
  heroDescription: string;
  heroImageUrl: string;
  brandNamePart1: string;
  brandNamePart2: string;
  brandNamePart3: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  headingFont?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  logoUrl?: string;
  buttonRoundness?: 'none' | 'small' | 'medium' | 'large' | 'full';
  headerStyle?: 'transparent' | 'solid' | 'glass';
  layoutDensity?: 'compact' | 'comfortable' | 'spacious';
  sectionTitleLatest?: string;
  sectionTitleTrending?: string;
  footerText?: string;
  heroOverlayOpacity?: number;
  heroTextAlign?: 'left' | 'center' | 'right';
  showHero?: boolean;
  showRecent?: boolean;
  sidebarLibraryTitle?: string;
  sidebarMusicTitle?: string;
  sidebarAdminTitle?: string;
  sidebarStylesTitle?: string;
  searchPlaceholder?: string;
}
