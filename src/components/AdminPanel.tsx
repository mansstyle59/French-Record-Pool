import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { extractMetadata, formatDuration } from '../lib/metadata';
import { Track, SiteSettings } from '../types';
import { Upload, Trash2, Save, Plus, Disc, LayoutDashboard, Database, RefreshCw, Users, BarChart3, Activity, UserCheck, Shield, Music, Mail, Search, Zap, Image, X } from 'lucide-react';
import { GENRES } from '../data';
import { useTracks } from '../hooks/useTracks';
import { useAuth } from './AuthContext';

export default function AdminPanel() {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracks' | 'users' | 'layout'>('dashboard');
  const { tracks, loading: tracksLoading } = useTracks();
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalUsers: 0,
    totalDownloads: 0,
    newUsersToday: 0
  });

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
    sidebarStylesTitle: 'Styles'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Apply colors to preview via CSS variables locally
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-brand-primary', settings.primaryColor);
    root.style.setProperty('--color-brand-blue', settings.primaryColor);
    root.style.setProperty('--color-brand-red', settings.secondaryColor);
    root.style.setProperty('--color-brand-secondary', settings.secondaryColor);
    root.style.setProperty('--color-brand-accent', settings.accentColor);
    root.style.setProperty('--color-brand-white', settings.accentColor);
  }, [settings]);

  // Track Upload State
  const [uploadState, setUploadState] = useState<'idle' | 'extracting' | 'ready' | 'uploading'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingTrack, setPendingTrack] = useState<Partial<Track>>({});
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      // These would ideally be real-time listeners or cloud functions
      // For now we fetch them once for the dashboard overview
      if (profile?.subscriptionStatus !== 'admin') return;

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setStats(prev => ({
          ...prev,
          totalUsers: usersSnap.size,
          totalTracks: tracks.length,
          // Example logic for "today"
          newUsersToday: usersSnap.docs.filter(d => {
            const data = d.data();
            return data.createdAt && data.createdAt.toDate().toDateString() === new Date().toDateString();
          }).length
        }));
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };

    fetchStats();
  }, [profile, tracks]);

  useEffect(() => {
    if (activeTab === 'users' && profile?.subscriptionStatus === 'admin') {
      const fetchUsers = async () => {
        setUsersLoading(true);
        try {
          const q = query(collection(db, 'users'), orderBy('email', 'asc'));
          const snap = await getDocs(q);
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("Failed to fetch users", e);
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsers();
    }
  }, [activeTab, profile]);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetUpload = () => {
    setPendingTrack({});
    setAudioFile(null);
    setLinkUrl('');
    setArtworkFile(null);
    if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl);
    setArtworkPreviewUrl(null);
    setUploadState('idle');
    setUploadProgress(0);
  };

  const handleArtworkUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl);
    const url = URL.createObjectURL(file);
    setArtworkFile(file);
    setArtworkPreviewUrl(url);
    setPendingTrack(prev => ({ ...prev, artwork: url }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setAudioFile(file);
    setArtworkFile(null);
    if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl);
    setArtworkPreviewUrl(null);
    setUploadState('extracting');
    try {
      const metadata = await extractMetadata(file);
      setPendingTrack({
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || 'Unknown Artist',
        bpm: metadata.bpm || 120,
        duration: metadata.duration ? formatDuration(metadata.duration) : '0:00',
        genre: metadata.genre?.[0] || 'House',
        artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop',
        previewUrl: URL.createObjectURL(file), 
        fileUrl: '', 
      });
      setUploadState('ready');
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      alert('Erreur lors de l\'extraction des métadonnées.');
      setUploadState('idle');
    }
  };

  const handleUrlAdd = async () => {
    const url = linkUrl.trim();
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('protocol');
    } catch {
      alert('Lien invalide : entrez une URL http(s) complète vers un fichier audio.');
      return;
    }
    setAudioFile(null);
    setArtworkFile(null);
    if (artworkPreviewUrl) URL.revokeObjectURL(artworkPreviewUrl);
    setArtworkPreviewUrl(null);
    setUploadState('extracting');

    const fileName = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const [guessArtist, ...rest] = baseName.split(' - ');
    const hasArtist = rest.length > 0;

    // Best-effort duration (fails silently if the host blocks it or the file is not audio)
    const duration = await new Promise<string>((resolve) => {
      const audio = new Audio();
      const done = (v: string) => { audio.src = ''; resolve(v); };
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => done(isFinite(audio.duration) ? formatDuration(audio.duration) : '0:00');
      audio.onerror = () => done('0:00');
      setTimeout(() => done('0:00'), 8000);
      audio.src = url;
    });

    setPendingTrack({
      title: (hasArtist ? rest.join(' - ') : baseName) || 'Sans titre',
      artist: hasArtist ? guessArtist : 'Unknown Artist',
      bpm: 120,
      duration,
      genre: 'House',
      artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop',
      previewUrl: url,
      fileUrl: url,
    });
    setUploadState('ready');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      handleFileUpload(file);
    }
  };

  const saveTrack = async () => {
    const isLinkTrack = !audioFile && !!pendingTrack.fileUrl;
    if (!pendingTrack.title || !pendingTrack.artist || (!audioFile && !isLinkTrack)) return;

    setUploadState('uploading');
    setUploadProgress(0);

    try {
      // 1. Upload artwork if provided
      let artworkUrl = pendingTrack.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop';
      if (artworkFile) {
        const artworkRef = ref(storage, `artworks/${Date.now()}_${artworkFile.name}`);
        await uploadBytes(artworkRef, artworkFile);
        artworkUrl = await getDownloadURL(artworkRef);
      }

      // 2. Upload audio file to Firebase Storage (or reuse the provided link)
      let downloadUrl = pendingTrack.fileUrl || '';
      if (audioFile) {
        const storageRef = ref(storage, `tracks/${Date.now()}_${audioFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, audioFile);

        downloadUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      // 3. Save metadata to Firestore
      await addDoc(collection(db, 'tracks'), {
        ...pendingTrack,
        artwork: artworkUrl,
        fileUrl: downloadUrl,
        previewUrl: downloadUrl,
        createdAt: serverTimestamp(),
        downloadCount: 0,
        isExclusive: false
      });

      alert('Morceau ajouté avec succès !');
      resetUpload();
    } catch (error) {
      console.error('Failed to save track:', error);
      alert('Erreur lors de l\'enregistrement : ' + (error instanceof Error ? error.message : String(error)));
      setUploadState('ready');
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
      alert('Paramètres du site mis à jour !');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'tracks', id));
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete track:', error);
      alert('Erreur lors de la suppression : ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTrack = async (id: string, updates: Partial<Track>) => {
    try {
      await setDoc(doc(db, 'tracks', id), updates, { merge: true });
      setEditingTrackId(null);
    } catch (error) {
      console.error('Failed to update track:', error);
      alert('Erreur lors de la mise à jour.');
    }
  };

  if (authLoading) return <div className="p-10 text-gray-500 font-mono flex items-center gap-3">
    <RefreshCw className="animate-spin" size={16} /> 
    SYSTEM_VERIFYING_ACCESS...
  </div>;
  
  if (profile?.subscriptionStatus !== 'admin') {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold text-brand-red mb-4 uppercase tracking-tighter">Accès Refusé</h2>
        <div className="flex gap-1 h-1 w-12 mx-auto mb-6">
          <div className="flex-1 bg-brand-blue" />
          <div className="flex-1 bg-brand-white" />
          <div className="flex-1 bg-brand-red" />
        </div>
        <p className="text-gray-400 max-w-sm mx-auto">Cette zone est strictement réservée à l'administrateur système (<span className="text-white font-bold">Denis Dewulf</span>).</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl pb-10">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative">
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-full hidden md:block" />
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-0.5 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">System Controller</h2>
            <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Shield size={9} className="text-brand-primary" /> Admin Terminal • French Record Pool
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-800 rounded-lg border border-surface-700/50">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live</span>
            </div>
        <div className="flex bg-surface-800 p-0.5 rounded-xl border border-surface-700/50 shadow-2xl backdrop-blur-xl relative z-10">
               <button 
                 onClick={() => setActiveTab('dashboard')}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <BarChart3 size={12} /> DASHBOARD
               </button>
               <button 
                 onClick={() => setActiveTab('tracks')}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'tracks' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <Music size={12} /> CATALOGUE
               </button>
               <button 
                 onClick={() => setActiveTab('users')}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'users' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <Users size={12} /> USERS
               </button>
               <button 
                 onClick={() => setActiveTab('layout')}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'layout' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <LayoutDashboard size={12} /> BRANDING <Zap size={8} className="text-yellow-400 animate-pulse" />
               </button>
             </div>
           </div>
        </div>

      {/* Quick Stats Bar */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Catalogue', value: stats.totalTracks, icon: Music, color: 'text-brand-blue' },
            { label: 'Elite Members', value: stats.totalUsers, icon: Users, color: 'text-brand-primary' },
            { label: 'Total Syncs', value: tracks.reduce((acc, t) => acc + (t.downloadCount || 0), 0), icon: Activity, color: 'text-brand-secondary' },
            { label: 'New Arrivals', value: stats.newUsersToday, icon: UserCheck, color: 'text-green-500' }
          ].map((stat, i) => (
            <div key={i} className="relative bg-surface-800 border border-surface-700/50 p-5 rounded-2xl group hover:border-brand-primary/30 transition-all overflow-hidden">
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-surface-900 ${stat.color} shadow-inner`}>
                       <stat.icon size={16} />
                    </div>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em]">{stat.label}</p>
                 </div>
                 <p className="text-2xl font-black">{stat.value}</p>
               </div>
            </div>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <div className="bg-surface-800 border border-surface-700 rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <Activity className="text-brand-primary" size={16} /> Activité Récente
                </h3>
                <div className="space-y-3">
                   {tracks.slice(0, 5).map(track => (
                      <div key={track.id} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center font-black text-[10px] text-brand-primary">
                            +
                         </div>
                         <div>
                            <p className="text-[11px] font-bold">Nouveau morceau</p>
                            <p className="text-[9px] text-gray-500 uppercase font-black">{track.title} • {track.artist}</p>
                         </div>
                      </div>
                   ))}
                   <button 
                    onClick={() => setActiveTab('tracks')}
                    className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors border-t border-surface-700 mt-2"
                   >
                     Catalogue Complet
                   </button>
                </div>
             </div>

             <div className="bg-surface-800 border border-surface-700 rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                   <UserCheck className="text-brand-blue" size={16} /> Membres VIP
                </h3>
                <div className="space-y-3">
                   {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-2 bg-surface-900/50 rounded-xl border border-surface-700/30">
                         {user.photoURL ? (
                           <img src={user.photoURL || undefined} className="w-6 h-6 rounded-full" alt="" />
                         ) : (
                           <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[9px] font-bold text-brand-primary">
                             {user.displayName?.[0] || 'U'}
                           </div>
                         )}
                         <div className="flex-1">
                            <p className="text-[10px] font-bold">{user.displayName || user.email}</p>
                            <p className={`text-[8px] uppercase font-black tracking-widest ${user.subscriptionStatus === 'admin' ? 'text-brand-primary' : 'text-gray-500'}`}>
                               {user.subscriptionStatus}
                            </p>
                         </div>
                      </div>
                   ))}
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors border-t border-surface-700 mt-2"
                    >
                      Gestion Utilisateurs
                    </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
             <div className="bg-surface-800 border border-surface-700 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-surface-700">
                   <h3 className="text-sm font-bold flex items-center gap-2">
                      <Users className="text-brand-primary" size={16} /> Gestion Utilisateurs
                   </h3>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                      <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-surface-900 border border-surface-700 rounded-lg pl-9 pr-4 py-1.5 text-[10px] outline-none focus:border-brand-primary transition-all w-full md:w-[200px]"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                   {usersLoading ? (
                      <div className="col-span-full py-10 text-center">
                         <RefreshCw className="animate-spin text-brand-primary mx-auto mb-2" size={24} />
                         <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Lecture BDD...</p>
                      </div>
                   ) : filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                      <div key={user.id} className="bg-surface-900/50 border border-surface-700/50 p-3 rounded-xl hover:border-brand-primary/30 transition-all group">
                         <div className="flex items-start justify-between mb-2">
                            {user.photoURL ? (
                              <img src={user.photoURL || undefined} className="w-8 h-8 rounded-lg object-cover" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-[10px] font-black text-brand-primary">
                                {user.displayName?.[0] || 'U'}
                              </div>
                            )}
                            <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${user.subscriptionStatus === 'admin' ? 'bg-brand-primary text-white' : 'bg-surface-800 text-gray-500'}`}>
                               {user.subscriptionStatus}
                            </div>
                         </div>
                         <h4 className="font-bold text-[10px] truncate">{user.displayName || 'Sans Nom'}</h4>
                         <div className="flex items-center gap-1.5 text-gray-500 text-[9px] mt-0.5 mb-3">
                            <Mail size={10} />
                            <span className="truncate">{user.email}</span>
                         </div>
                         <div className="flex gap-1.5">
                            <button 
                              onClick={() => {
                                alert(`Détails de ${user.displayName || user.email}:\nID: ${user.id}\nStatus: ${user.subscriptionStatus}`);
                              }}
                              className="flex-1 py-1.5 bg-surface-800 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-surface-700 transition-colors"
                            >
                              INFOS
                            </button>
                            
                            {user.email !== 'dewulf.denis@gmail.com' && (
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={async () => {
                                    const newStatus = user.subscriptionStatus === 'admin' ? 'free' : 'admin';
                                    if(confirm(`Passer ${user.email} en status ${newStatus} ?`)) {
                                      await setDoc(doc(db, 'users', user.id), { subscriptionStatus: newStatus }, { merge: true });
                                      setUsers(users.map(u => u.id === user.id ? { ...u, subscriptionStatus: newStatus } : u));
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ${user.subscriptionStatus === 'admin' ? 'bg-brand-primary/20 text-brand-primary hover:bg-brand-primary' : 'bg-surface-800 text-gray-500 hover:text-white hover:bg-surface-700'}`}
                                >
                                  <Shield size={10} />
                                </button>
                                
                                <button 
                                  onClick={async () => {
                                    if(confirm(`Supprimer l'utilisateur ${user.email} ?`)) {
                                      await deleteDoc(doc(db, 'users', user.id));
                                      setUsers(users.filter(u => u.id !== user.id));
                                    }
                                  }}
                                  className="p-1.5 text-gray-600 hover:text-brand-red bg-surface-800 rounded-lg hover:bg-brand-red/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                         </div>
                      </div>
                   ))) : (
                      <div className="col-span-full py-10 text-center text-[9px] text-gray-500 uppercase font-black">
                         Aucun résultat.
                      </div>
                   )}
                </div>
             </div>
          </div>
       )}

       {activeTab === 'tracks' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Database className="text-brand-primary" size={16} /> Catalogue Engine
                  </h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {tracksLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4">
                        <RefreshCw className="animate-spin" size={24} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Hydratation du flux...</span>
                      </div>
                    ) : tracks.map(track => (
                      <div key={track.id} className="flex items-center gap-3 p-3 bg-surface-900/50 rounded-xl border border-surface-700/30 group hover:border-brand-primary/40 transition-all hover:bg-surface-900 shadow-sm font-mono">
                        <div className="relative group-hover:scale-105 transition-transform">
                          <img src={track.artwork || undefined} className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                            <Plus size={16} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingTrackId === track.id ? (
                            <div className="space-y-2">
                               <input 
                                 type="text" 
                                 value={track.title} 
                                 onChange={(e) => handleUpdateTrack(track.id, { title: e.target.value })}
                                 className="w-full bg-surface-800 p-1.5 rounded-lg text-xs font-bold border border-surface-700 focus:border-brand-primary outline-none"
                               />
                               <input 
                                 type="text" 
                                 value={track.artist} 
                                 onChange={(e) => handleUpdateTrack(track.id, { artist: e.target.value })}
                                 className="w-full bg-surface-800 p-1.5 rounded-lg text-[10px] border border-surface-700 focus:border-brand-primary outline-none"
                               />
                            </div>
                          ) : (
                            <>
                              <p className="font-bold text-sm truncate text-white">{track.title}</p>
                              <p className="text-[10px] text-gray-500 truncate font-medium">{track.artist} • {track.genre}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {deletingId === track.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                               <button 
                                 disabled={isDeleting}
                                 onClick={() => handleDeleteTrack(track.id)}
                                 className="px-2 py-1 bg-brand-red text-white text-[8px] font-black uppercase rounded hover:bg-brand-red/80 transition-colors flex items-center gap-1"
                               >
                                 {isDeleting ? <RefreshCw size={10} className="animate-spin" /> : <Trash2 size={10} />}
                                 CONFIRMER
                               </button>
                               <button 
                                 disabled={isDeleting}
                                 onClick={() => setDeletingId(null)}
                                 className="px-2 py-1 bg-surface-700 text-gray-300 text-[8px] font-black uppercase rounded hover:bg-surface-600 transition-colors"
                               >
                                 ANNULER
                               </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setEditingTrackId(editingTrackId === track.id ? null : track.id)}
                                className={`p-2 rounded-lg transition-all ${editingTrackId === track.id ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-white hover:bg-surface-800'}`}
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={() => setDeletingId(track.id)}
                                className="p-2 text-gray-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-surface-800 border border-brand-primary/30 rounded-2xl p-4 ring-1 ring-brand-primary/10">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Plus className="text-brand-primary" size={16} /> Upload Engine
                  </h3>

                  <div className="space-y-3">
                    {/* Audio file drop zone */}
                    <label className="block">
                      <span className="text-[8px] font-black uppercase text-gray-500 mb-1.5 block tracking-widest">Master Audio Stream</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }}
                        className="hidden"
                        id="track-upload"
                      />
                      <label
                        htmlFor="track-upload"
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={`w-full border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-surface-700 hover:border-brand-primary/50'}`}
                      >
                        {uploadState === 'extracting' ? (
                          <>
                            <RefreshCw className="animate-spin text-brand-primary" size={20} />
                            <span className="text-[8px] font-black uppercase text-brand-primary">Extraction métadonnées...</span>
                          </>
                        ) : audioFile ? (
                          <>
                            <Music className="text-brand-primary" size={20} />
                            <span className="text-[8px] font-black uppercase text-white truncate max-w-full px-2">{audioFile.name}</span>
                            <span className="text-[7px] text-gray-500">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                          </>
                        ) : (
                          <>
                            <Upload className={isDragging ? 'text-brand-primary' : 'text-gray-500'} size={20} />
                            <span className="text-[8px] font-black uppercase text-gray-400">Drag & Drop ou cliquer</span>
                          </>
                        )}
                      </label>
                    </label>

                    {uploadState !== 'uploading' && !audioFile && pendingTrack.title === undefined && (
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black uppercase text-gray-500 block tracking-widest">Ou ajouter via un lien (URL)</span>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUrlAdd(); }}
                            placeholder="https://.../artiste - titre.mp3"
                            className="flex-1 min-w-0 bg-surface-900 border border-surface-700 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-brand-primary/50"
                          />
                          <button
                            onClick={handleUrlAdd}
                            disabled={!linkUrl.trim() || uploadState === 'extracting'}
                            className="px-3 py-2 bg-brand-primary text-white font-black uppercase tracking-widest text-[8px] rounded-xl disabled:opacity-40"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    )}

                    {pendingTrack.title !== undefined && (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-3 bg-surface-900 rounded-xl border border-surface-700 shadow-xl">
                          <h4 className="text-[8px] font-black text-brand-primary uppercase mb-3 tracking-widest flex items-center gap-1.5">
                            <Activity size={10} /> Métadonnées du Morceau
                          </h4>
                          <div className="space-y-3">

                            {/* Artwork section */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">Pochette</label>
                              <div className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                  {artworkPreviewUrl ? (
                                    <img src={artworkPreviewUrl} className="w-16 h-16 rounded-xl object-cover shadow-lg" alt="artwork" />
                                  ) : (
                                    <div className="w-16 h-16 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center">
                                      <Image size={20} className="text-gray-600" />
                                    </div>
                                  )}
                                  <label htmlFor="artwork-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 rounded-xl cursor-pointer transition-opacity">
                                    <Upload size={14} className="text-white" />
                                  </label>
                                  <input
                                    id="artwork-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleArtworkUpload(f); }}
                                  />
                                </div>
                                <label htmlFor="artwork-upload" className="flex-1 py-2 border border-dashed border-surface-700 hover:border-brand-primary/50 rounded-lg text-[8px] text-gray-500 cursor-pointer transition-colors text-center">
                                  {artworkFile ? artworkFile.name : 'Choisir une pochette...'}
                                </label>
                              </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">Titre</label>
                              <input
                                type="text"
                                value={pendingTrack.title}
                                onChange={e => setPendingTrack({...pendingTrack, title: e.target.value})}
                                className="w-full bg-surface-800 p-2.5 rounded-lg text-[10px] font-bold border border-surface-700 focus:border-brand-primary outline-none"
                              />
                            </div>

                            {/* Artist */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">Artiste</label>
                              <input
                                type="text"
                                value={pendingTrack.artist}
                                onChange={e => setPendingTrack({...pendingTrack, artist: e.target.value})}
                                className="w-full bg-surface-800 p-2.5 rounded-lg text-[10px] font-bold border border-surface-700 focus:border-brand-primary outline-none"
                              />
                            </div>

                            {/* BPM + Duration */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">BPM</label>
                                <input
                                  type="number"
                                  value={pendingTrack.bpm}
                                  onChange={e => setPendingTrack({...pendingTrack, bpm: parseInt(e.target.value)})}
                                  className="w-full bg-surface-800 p-2.5 rounded-lg text-[10px] font-bold border border-surface-700 focus:border-brand-primary outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">Durée</label>
                                <input
                                  type="text"
                                  value={pendingTrack.duration}
                                  onChange={e => setPendingTrack({...pendingTrack, duration: e.target.value})}
                                  className="w-full bg-surface-800 p-2.5 rounded-lg text-[10px] font-bold border border-surface-700 focus:border-brand-primary outline-none"
                                />
                              </div>
                            </div>

                            {/* Key (tonalité) */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">Tonalité</label>
                              <select
                                value={pendingTrack.key || ''}
                                onChange={e => setPendingTrack({...pendingTrack, key: e.target.value})}
                                className="w-full bg-surface-800 p-2.5 rounded-lg text-[10px] font-bold border border-surface-700 focus:border-brand-primary outline-none font-mono"
                              >
                                <option value="">— Sélectionner —</option>
                                {['Am','A','Bbm','Bb','Bm','B','Cm','C','C#m','C#','Dm','D','Ebm','Eb','Em','E','Fm','F','F#m','F#','Gm','G','Abm','Ab'].map(k => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>

                            {/* Genre */}
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">Genre</label>
                              <select
                                value={pendingTrack.genre}
                                onChange={e => setPendingTrack({...pendingTrack, genre: e.target.value})}
                                className="w-full bg-surface-800 p-2.5 rounded-lg text-[10px] font-bold border border-surface-700 focus:border-brand-primary outline-none font-mono"
                              >
                                {GENRES.map(g => (
                                  <option key={g.id} value={g.name}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={resetUpload}
                            disabled={uploadState === 'uploading'}
                            className="px-4 py-4 bg-surface-700 text-gray-300 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-surface-600 transition-all flex items-center gap-1.5 disabled:opacity-40"
                          >
                            <X size={12} /> Annuler
                          </button>
                          <button
                            onClick={saveTrack}
                            disabled={uploadState === 'uploading'}
                            className="flex-1 py-4 bg-brand-primary text-white font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 flex flex-col items-center justify-center gap-2 overflow-hidden relative disabled:opacity-60"
                          >
                            {uploadState === 'uploading' ? (
                              <>
                                <div className="flex items-center gap-2 relative z-10">
                                  <RefreshCw className="animate-spin" size={14} />
                                  <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-300 z-0" style={{ width: `${uploadProgress}%` }} />
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5 relative z-10">
                                <Save size={14} />
                                <span>Valider &amp; Publier</span>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
         </div>
       )}
       {activeTab === 'layout' && (
         <div className="space-y-6">
            <div className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 border border-brand-primary/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
               <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Studio de Branding <span className="text-brand-primary">ELITE</span></h3>
                  <p className="text-gray-400 text-sm max-w-md">Utilisez notre éditeur visuel avancé pour personnaliser chaque détail de votre plateforme, comme sur WIX.</p>
               </div>
               <button 
                 onClick={() => (window as any).openBrandingStudio()}
                 className="bg-white text-surface-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10 flex items-center gap-3"
               >
                 <Zap size={18} className="text-brand-primary animate-pulse" />
                 LANCER L'ÉDITEUR VISUEL
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b border-surface-700 pb-3">
                    <LayoutDashboard className="text-brand-blue" size={16} /> Hero Banner</h3>
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Titre Hero</label>
                        <div className="grid grid-cols-3 gap-2">
                           <input 
                            type="text" 
                            value={settings.heroTitle1} 
                            onChange={e => setSettings({...settings, heroTitle1: e.target.value})}
                            className="bg-surface-900 border border-surface-700 p-2.5 rounded-lg text-[10px] font-bold outline-none focus:border-brand-blue"
                           />
                           <input 
                            type="text" 
                            value={settings.heroTitle2} 
                            onChange={e => setSettings({...settings, heroTitle2: e.target.value})}
                            className="bg-surface-900 border border-surface-700 p-2.5 rounded-lg text-[10px] font-bold outline-none focus:border-brand-white"
                           />
                           <input 
                            type="text" 
                            value={settings.heroTitle3} 
                            onChange={e => setSettings({...settings, heroTitle3: e.target.value})}
                            className="bg-surface-900 border border-surface-700 p-2.5 rounded-lg text-[10px] font-bold outline-none focus:border-brand-red"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Description</label>
                        <textarea 
                          value={settings.heroDescription} 
                          onChange={e => setSettings({...settings, heroDescription: e.target.value})}
                          className="w-full bg-surface-900 border border-surface-700 p-3 rounded-lg text-[10px] outline-none focus:border-brand-primary h-20"
                        />
                     </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-surface-900 p-3 rounded-xl border border-surface-700">
                              <span className="text-[8px] text-gray-500 block mb-1 uppercase">Luminosité (%)</span>
                              <input 
                                type="range" 
                                min="10" max="100" 
                                className="w-full accent-brand-primary h-1" 
                              />
                           </div>
                           <div className="bg-surface-900 p-3 rounded-xl border border-surface-700">
                              <span className="text-[8px] text-gray-500 block mb-1 uppercase">Flou Background</span>
                              <input 
                                type="range" 
                                min="0" max="20" 
                                className="w-full accent-brand-primary h-1" 
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Image URL</label>
                        <input 
                          type="text" 
                          value={settings.heroImageUrl} 
                          onChange={e => setSettings({...settings, heroImageUrl: e.target.value})}
                          className="w-full bg-surface-900 border border-surface-700 p-2.5 rounded-lg text-[10px] outline-none"
                        />
                     </div>
                  </div>
               </div>

                <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 shadow-2xl">
                   <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b border-surface-700 pb-3">
                     <Disc className="text-brand-primary" size={16} /> Identité & Couleurs
                   </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Nom de Marque</label>
                         <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="text" 
                              value={settings.brandNamePart1} 
                              onChange={e => setSettings({...settings, brandNamePart1: e.target.value})}
                              className="w-full bg-surface-900 border border-brand-primary/20 p-2.5 rounded-lg text-[10px] font-bold outline-none"
                            />
                            <input 
                              type="text" 
                              value={settings.brandNamePart2} 
                              onChange={e => setSettings({...settings, brandNamePart2: e.target.value})}
                              className="w-full bg-surface-900 border border-white/20 p-2.5 rounded-lg text-[10px] font-bold outline-none"
                            />
                            <input 
                              type="text" 
                              value={settings.brandNamePart3} 
                              onChange={e => setSettings({...settings, brandNamePart3: e.target.value})}
                              className="w-full bg-surface-900 border border-brand-red/20 p-2.5 rounded-lg text-[10px] font-bold outline-none"
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-700">
                         <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 block uppercase tracking-tighter">CTA Text</span>
                            <input 
                              type="text" 
                              value={settings.ctaText}
                              onChange={e => setSettings({...settings, ctaText: e.target.value})}
                              className="w-full bg-surface-900 border border-surface-700 p-2 rounded-lg text-[10px] outline-none"
                            />
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 block uppercase tracking-tighter">CTA Link</span>
                            <select 
                              value={settings.ctaLink}
                              onChange={e => setSettings({...settings, ctaLink: e.target.value})}
                              className="w-full bg-surface-900 border border-surface-700 p-2 rounded-lg text-[10px] outline-none"
                            >
                              <option value="discover">Catalogue</option>
                              <option value="profile">Profile</option>
                            </select>
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-700">
                         {['primaryColor', 'secondaryColor', 'accentColor'].map((col) => (
                            <div key={col} className="space-y-1">
                               <span className="text-[8px] text-gray-500 block uppercase tracking-tighter">{col.replace('Color','')}</span>
                               <div className="flex items-center gap-1.5">
                                  <input 
                                    type="color" 
                                    value={(settings as any)[col]} 
                                    onChange={e => setSettings({...settings, [col]: e.target.value})}
                                    className="w-5 h-5 rounded overflow-hidden border-none cursor-pointer p-0 bg-transparent"
                                  />
                                  <span className="text-[8px] font-mono">{(settings as any)[col]}</span>
                               </div>
                            </div>
                         ))}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-surface-700">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Typographie & Réseaux</label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <span className="text-[8px] text-gray-500 block uppercase">Police de Caractères</span>
                               <select 
                                 value={settings.fontFamily}
                                 onChange={e => setSettings({...settings, fontFamily: e.target.value as any})}
                                 className="w-full bg-surface-900 border border-surface-700 p-3 rounded-xl text-xs font-bold outline-none"
                               >
                                 <option value="sans">Inter (Sans-serif Moderne)</option>
                                 <option value="mono">JetBrains Mono (Technical)</option>
                                 <option value="serif">Playfair Display (Editorial)</option>
                               </select>
                            </div>
                            <div className="space-y-2">
                               <span className="text-[8px] text-gray-500 block uppercase">Instagram Link</span>
                               <input 
                                 type="text" 
                                 value={settings.instagramUrl}
                                 onChange={e => setSettings({...settings, instagramUrl: e.target.value})}
                                 className="w-full bg-surface-900 border border-surface-700 p-3 rounded-xl text-xs outline-none"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-surface-700">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Palette de Couleurs</label>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                               <span className="text-[8px] text-gray-500 block uppercase">Primaire</span>
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="color" 
                                   value={settings.primaryColor} 
                                   onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                                   className="w-8 h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                                 />
                                 <span className="text-[10px] font-mono">{settings.primaryColor}</span>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <span className="text-[8px] text-gray-500 block uppercase">Secondaire</span>
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="color" 
                                   value={settings.secondaryColor} 
                                   onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                                   className="w-8 h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                                 />
                                 <span className="text-[10px] font-mono">{settings.secondaryColor}</span>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <span className="text-[8px] text-gray-500 block uppercase">Accent</span>
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="color" 
                                   value={settings.accentColor} 
                                   onChange={e => setSettings({...settings, accentColor: e.target.value})}
                                   className="w-8 h-8 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                                 />
                                 <span className="text-[10px] font-mono">{settings.accentColor}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-8 p-6 bg-surface-900 rounded-2xl border border-brand-primary/20 border-dashed">
                       <p className="text-xs text-gray-500 mb-4 italic">Prévisualisation :</p>
                       <div className="flex flex-col gap-6">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                             <Disc className="w-5 h-5 text-white" />
                           </div>
                           <span className="font-bold text-lg tracking-tight">
                             <span className="text-brand-primary">{settings.brandNamePart1}</span>
                             <span className="text-brand-white ml-1">{settings.brandNamePart2}</span>
                             <span className="text-brand-secondary ml-1">{settings.brandNamePart3}</span>
                           </span>
                         </div>
                         
                         <div className="flex gap-2">
                            <div className="px-3 py-1 bg-brand-primary text-brand-white text-[10px] font-bold rounded uppercase tracking-wider">Bouton Primaire</div>
                            <div className="px-3 py-1 bg-brand-secondary text-brand-white text-[10px] font-bold rounded uppercase tracking-wider">Bouton Secondaire</div>
                         </div>
                       </div>
                   </div>
                </div>
             <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 overflow-hidden relative">
               <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                  <div className="w-1 h-1 rounded-full bg-brand-primary animate-ping" />
                  <span className="text-[7px] font-black text-brand-primary uppercase tracking-widest">LIVE</span>
               </div>
               
               <h3 className="text-[8px] font-black mb-3 text-gray-500 uppercase tracking-widest">Aperçu Réel</h3>
               <div className="relative rounded-xl overflow-hidden h-[180px] border border-surface-700 group">
                  <img 
                    src={settings.heroImageUrl || undefined} 
                    alt="Preview" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface-950/80 via-surface-950/40 to-transparent flex flex-col justify-center px-10">
                    <h1 className={`text-2xl font-black mb-1 leading-tight uppercase font-${settings.fontFamily}`}>
                      <span style={{ color: settings.primaryColor }} className="block">{settings.heroTitle1}</span>
                      <span style={{ color: settings.accentColor }} className="block">{settings.heroTitle2}</span>
                    </h1>
                    <p className={`text-gray-400 max-w-[200px] text-[8px] leading-relaxed font-medium line-clamp-2 font-${settings.fontFamily}`}>{settings.heroDescription}</p>
                    
                    <div className="mt-4 flex gap-2">
                       <div className="px-3 py-1 bg-white text-black text-[7px] font-black rounded-lg uppercase tracking-widest">Explorer</div>
                       <div className="px-3 py-1 bg-surface-800 border border-surface-700 text-white text-[7px] font-black rounded-lg uppercase tracking-widest">Détails</div>
                    </div>
                  </div>
               </div>
               
               <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: 'Navbar', value: 'Dynamic' },
                    { label: 'Font', value: settings.fontFamily },
                    { label: 'Status', value: 'Admin Pro' },
                    { label: 'DB', value: 'Firebase' }
                  ].map(item => (
                    <div key={item.label} className="p-2 bg-surface-900 rounded-lg border border-surface-700 text-center">
                       <span className="text-[6px] text-gray-500 uppercase block leading-none mb-1">{item.label}</span>
                       <span className="text-[7px] font-black text-white uppercase truncate block leading-none">{item.value}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
            
            <button 
              onClick={saveSettings}
              disabled={isSavingSettings}
              className="w-full py-4 bg-brand-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 group"
            >
              {isSavingSettings ? <RefreshCw className="animate-spin" size={14} /> : <Save size={18} />}
              {isSavingSettings ? 'SYNC...' : 'APPLY ENGINE CHANGES'}
            </button>
         </div>
       )}
    </div>
  );
}
