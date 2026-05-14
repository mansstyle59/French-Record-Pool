import { LayoutDashboard, Disc, Mic2, Download, Library, Search, User, Bell, Play, Pause, SkipForward, SkipBack, Volume2, Share2, Heart, MoreHorizontal, ChevronRight, LogOut, LogIn, Database, Settings, Upload, Trash2, Save, Plus, Zap, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { GENRES } from '../data';
import { Track, SiteSettings } from '../types';
import { useAuth } from './AuthContext';
import { useTracks } from '../hooks/useTracks';
import { useSettings } from '../hooks/useSettings';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AdminPanel from './AdminPanel';
import BrandingStudio from './BrandingStudio';

type ViewType = 'dashboard' | 'discover' | 'new' | 'search' | 'downloads' | 'favorites' | 'playlists' | 'genre' | 'admin';

const Sidebar = ({ 
  activeView, 
  setView, 
  currentGenre, 
  setGenre, 
  settings, 
  onUpgrade,
  isEditMode,
  setIsEditMode
}: { 
  activeView: ViewType, 
  setView: (v: ViewType) => void, 
  currentGenre: string, 
  setGenre: (g: string) => void, 
  settings: SiteSettings, 
  onUpgrade: () => void,
  isEditMode: boolean,
  setIsEditMode: (val: boolean) => void
}) => {
  const { profile } = useAuth();
  return (
    <div className="w-64 h-full border-r border-surface-700 bg-surface-900 flex flex-col p-4 relative z-50 shadow-2xl">
      <div className="flex gap-1 h-1 w-full mb-6 rounded-full overflow-hidden opacity-80">
        <div className="flex-1 bg-brand-blue" />
        <div className="flex-1 bg-brand-white" />
        <div className="flex-1 bg-brand-red" />
      </div>

      <div className="flex items-center gap-3 px-2 mb-8">
        {settings.logoUrl ? (
          <div className="h-10 flex items-center">
            <img src={settings.logoUrl || undefined} className="h-full w-auto object-contain" alt="Logo" />
          </div>
        ) : (
          <>
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
              style={{ backgroundColor: settings.primaryColor, boxShadow: `0 10px 15px -3px ${settings.primaryColor}33` }}
            >
              <Disc className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <span className="font-bold tracking-tight uppercase" style={{ fontSize: '14px' }}>
              <span style={{ color: settings.primaryColor }}>{settings.brandNamePart1}</span>
              <span style={{ color: settings.accentColor }} className="ml-1">{settings.brandNamePart2}</span>
              <span style={{ color: settings.secondaryColor }} className="ml-1">{settings.brandNamePart3}</span>
            </span>
          </>
        )}
      </div>

      <nav className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
        <div>
          <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-widest text-[10px]">{settings.sidebarLibraryTitle}</h3>
          <ul className="space-y-1">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Tableau de bord" 
              active={activeView === 'dashboard'} 
              onClick={() => setView('dashboard')} 
            />
            <NavItem 
              icon={<Library size={20} />} 
              label="Découvrir" 
              active={activeView === 'discover'}
              onClick={() => setView('discover')} 
            />
            <NavItem 
              icon={<Disc size={20} />} 
              label="Nouveautés" 
              active={activeView === 'new'}
              onClick={() => setView('new')} 
            />
            <NavItem 
              icon={<Search size={20} />} 
              label="Rechercher" 
              active={activeView === 'search'}
              onClick={() => setView('search')} 
            />
          </ul>
        </div>

        <div>
          <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-widest text-[10px]">{settings.sidebarMusicTitle}</h3>
          <ul className="space-y-1">
            <NavItem 
              icon={<Download size={20} />} 
              label="Téléchargements" 
              badge={12} 
              active={activeView === 'downloads'}
              onClick={() => setView('downloads')}
            />
            <NavItem 
              icon={<Heart size={20} />} 
              label="Favoris" 
              active={activeView === 'favorites'}
              onClick={() => setView('favorites')}
            />
            <NavItem 
              icon={<Mic2 size={20} />} 
              label="Mes Playlists" 
              active={activeView === 'playlists'}
              onClick={() => setView('playlists')}
            />
          </ul>
        </div>

            {profile?.subscriptionStatus === 'admin' && (
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-widest text-[10px]">{settings.sidebarAdminTitle}</h3>
            <ul className="space-y-1">
              <NavItem 
                icon={<Settings size={20} />} 
                label="Panel Admin" 
                active={activeView === 'admin'}
                onClick={() => setView('admin')}
              />
                <NavItem 
                  icon={<Zap size={20} className="text-yellow-400" />} 
                  label="Branding Studio" 
                  active={false}
                  onClick={() => (window as any).openBrandingStudio()}
                />
                
                <div className="px-2 py-4 mt-4 border-t border-surface-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase text-brand-primary tracking-widest">Mode Édition</span>
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`w-10 h-5 rounded-full transition-all relative ${isEditMode ? 'bg-brand-primary' : 'bg-surface-800'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isEditMode ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Activez pour modifier le design en direct.</p>
                </div>
            </ul>
          </div>
        )}

        <div>
          <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-widest text-[10px]">{settings.sidebarStylesTitle}</h3>
          <ul className="space-y-1">
            {GENRES.map(genre => (
              <li key={genre.id}>
                <button 
                  onClick={() => {
                    setGenre(genre.name);
                    setView('genre');
                  }}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg transition-colors group ${activeView === 'genre' && currentGenre === genre.name ? 'bg-surface-800 text-white' : 'text-gray-400 hover:text-white hover:bg-surface-800'}`}
                >
                  <span>{genre.name}</span>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-400">{genre.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="mt-4 p-4 bg-surface-800 rounded-xl relative overflow-hidden group border border-surface-700/50">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Mic2 size={40} />
        </div>
        <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">OFFRE <span className="text-brand-red">PRO</span></h4>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">Téléchargements haute fidélité illimités pour DJs professionnels.</p>
        <button 
          onClick={onUpgrade}
          className="w-full py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-all shadow-lg shadow-brand-red/20"
        >
          DEVENIR PRO
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: number, onClick?: () => void }) => (
  <li>
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all ${active ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'text-gray-400 hover:text-white hover:bg-surface-800'}`}
    >
      {icon}
      <span className="text-sm flex-1 text-left">{label}</span>
      {badge && <span className="px-1.5 py-0.5 bg-brand-primary text-[10px] text-white rounded-md font-bold">{badge}</span>}
    </button>
  </li>
);

interface TrackRowProps {
  track: Track;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onDownload: (track: Track) => void;
  key?: string;
}

const TrackRow = ({ track, index, isActive, onPlay, onDownload }: TrackRowProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group grid grid-cols-[40px_1fr_180px_80px_80px_80px_100px] items-center py-3 px-4 rounded-xl border border-transparent hover:bg-surface-800 hover:border-surface-700 transition-all cursor-pointer ${isActive ? 'bg-surface-800 border-surface-700' : ''}`}
      onClick={onPlay}
    >
      <div className="text-xs text-gray-600 font-mono group-hover:hidden">{String(index + 1).padStart(2, '0')}</div>
      <div className="hidden group-hover:flex items-center">
        {isActive ? <Pause size={14} className="text-brand-primary fill-brand-primary" /> : <Play size={14} className="text-white fill-white" />}
      </div>

      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg flex-shrink-0 bg-surface-700">
          <img src={track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'} alt={track.title} className="w-full h-full object-cover" />
        </div>
        <div className="truncate">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-white'}`}>{track.title}</p>
          <p className="text-xs text-gray-500 truncate">{track.artist} {track.version && <span className="text-gray-600">({track.version})</span>}</p>
        </div>
      </div>

      <div className="text-xs text-gray-400">{track.genre}</div>
      <div className="text-xs font-mono text-gray-400">{track.bpm}</div>
      <div className="text-xs font-mono font-medium text-brand-accent">{track.key}</div>
      <div className="text-xs text-gray-500">{track.duration}</div>

      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-400 hover:text-white transition-colors" title="Ajouter aux favoris">
          <Heart size={16} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDownload(track);
          }}
          className="p-1.5 hover:bg-surface-700 rounded-lg text-brand-primary transition-colors" 
          title="Télécharger"
        >
          <Download size={16} />
        </button>
        <button className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-400 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </motion.div>
  );
};

const MusicPlayer = ({ currentTrack, isPlaying, setIsPlaying }: { currentTrack: Track | null, isPlaying: boolean, setIsPlaying: (val: boolean) => void }) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Playback failed or was blocked:", error);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  useEffect(() => {
    if (currentTrack) {
      setProgress(0);
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      if (!isNaN(dur)) {
        setProgress((cur / dur) * 100);
        setDuration(dur);
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-20 bg-surface-800 border-t border-surface-700 px-8 flex items-center justify-between sticky bottom-0 z-20 shadow-2xl backdrop-blur-xl bg-opacity-95">
      <audio 
        ref={audioRef}
        src={currentTrack.previewUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg border border-surface-700 bg-surface-700">
           <img src={currentTrack.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>
        <div className="truncate">
          <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
          <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
        </div>
        <button className="text-gray-400 hover:text-brand-primary ml-2 transition-colors">
          <Heart size={16} className="fill-transparent hover:fill-brand-primary" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white"><SkipBack size={20} /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 bg-white text-surface-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button className="text-gray-400 hover:text-white"><SkipForward size={20} /></button>
        </div>
        <div className="flex items-center gap-3 w-full">
          <span className="text-[10px] font-mono text-gray-500">{audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}</span>
          <div className="h-1 flex-1 bg-surface-700 rounded-full relative group cursor-pointer" onClick={(e) => {
            if (audioRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const per = x / rect.width;
              audioRef.current.currentTime = per * audioRef.current.duration;
            }
          }}>
            <div className="absolute inset-y-0 left-0 bg-brand-primary rounded-full group-hover:bg-brand-accent transition-colors" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%` }} />
          </div>
          <span className="text-[10px] font-mono text-gray-500">{currentTrack.duration}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-6 w-1/4">
        <div className="flex items-center gap-3 group">
          <Volume2 size={18} className="text-gray-400" />
          <div className="w-24 h-1 bg-surface-700 rounded-full cursor-pointer overflow-hidden" onClick={(e) => {
            if (audioRef.current) {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = e.clientX - rect.left;
               audioRef.current.volume = Math.max(0, Math.min(1, x / rect.width));
            }
          }}>
            <div className="h-full bg-gray-400 group-hover:bg-brand-primary transition-colors" style={{ width: `${(audioRef.current?.volume || 1) * 100}%` }} />
          </div>
        </div>
        <button className="text-gray-400 hover:text-white"><Share2 size={18} /></button>
        <button className="text-gray-400 hover:text-white"><Disc size={18} className="animate-spin-slow" /></button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const [selectedGenre, setSelectedGenre] = useState<string>('Tous');
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const { tracks, loading } = useTracks(selectedGenre);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const Header = () => {
    const { profile, login, logout, user } = useAuth();
    const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
      const timer = setInterval(() => {
        setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <header className={`h-16 flex items-center justify-between px-8 border-bottom border-surface-700 sticky top-0 z-10 ${getHeaderClasses()}`}>
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder={settings.searchPlaceholder} 
              className="w-full bg-surface-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-primary ring-offset-bg-surface-900 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-secondary rounded-full border-2 border-surface-900" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-surface-700">
                <div className="text-right">
                  <p className="text-sm font-medium">{profile?.displayName || 'DJ'}</p>
                  <p className="text-[10px] text-brand-primary font-bold uppercase tracking-tighter">{profile?.subscriptionStatus} Member</p>
                </div>
                <button onClick={logout} className="group relative">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL || undefined} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-surface-800 shadow-xl group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-sm font-bold border-2 border-surface-800 shadow-xl group-hover:opacity-50 transition-opacity">
                      {(profile?.displayName || 'D').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <LogOut className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity text-white" size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={login} className="flex items-center gap-2 px-4 py-2 bg-brand-primary rounded-full font-bold text-sm hover:scale-105 transition-transform">
              <LogIn size={18} /> SE CONNECTER
            </button>
          )}
        </div>
      </header>
    );
  };

  const selectedGenreTracks = tracks;
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBrandingStudio, setShowBrandingStudio] = useState(false);
  const [brandingTab, setBrandingTab] = useState<'colors' | 'typo' | 'content' | 'layout'>('colors');

  const openStudio = (tab: 'colors' | 'typo' | 'content' | 'layout' = 'colors') => {
    setBrandingTab(tab);
    setShowBrandingStudio(true);
  };

  const handleDownload = async (track: Track) => {
    if (!profile) {
      alert('Veuillez vous connecter pour télécharger.');
      return;
    }

    if (profile.subscriptionStatus === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    // Pro or Admin logic
    if (track.fileUrl) {
      // Record download in Firestore
      try {
        await updateDoc(doc(db, 'tracks', track.id), {
          downloadCount: increment(1)
        });
        
        // Also add to user's download history if we had a collection for that
        // For now just open the link
        window.open(track.fileUrl, '_blank');
      } catch (error) {
        console.error("Error recording download:", error);
        // Still allow download if the counter fails
        window.open(track.fileUrl, '_blank');
      }
    } else {
      alert('Le fichier source n\'est pas disponible pour ce morceau.');
    }
  };

  const handleTrackSelect = (track: Track, playNow: boolean) => {
    setCurrentTrack(track);
    if (playNow) {
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      handleTrackSelect(tracks[0], false);
    }
  }, [tracks]);

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      root.style.setProperty('--color-brand-primary', settings.primaryColor);
      root.style.setProperty('--color-brand-blue', settings.primaryColor);
      root.style.setProperty('--color-brand-red', settings.secondaryColor);
      root.style.setProperty('--color-brand-secondary', settings.secondaryColor);
      root.style.setProperty('--color-brand-accent', settings.accentColor);
      root.style.setProperty('--color-brand-white', settings.accentColor);
    }
  }, [settings]);



  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            {settings.showHero !== false && (
              <div className={`mb-12 group/hero-container relative ${isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-brand-primary/50' : ''}`}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative rounded-[2.5rem] overflow-hidden min-h-[400px] h-auto shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] group border ${isEditMode ? 'border-brand-primary ring-4 ring-brand-primary/20' : 'border-surface-700/30'}`}
                >
                  {isEditMode && (
                    <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
                       <button 
                         onClick={() => openStudio('content')}
                         className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                       >
                         <Settings size={14} className="animate-spin-slow" />
                         Modifier le Hero
                       </button>
                    </div>
                  )}
                  {/* Background Image with Overlay */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={settings.heroImageUrl || undefined} 
                      alt="Banner" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                    />
                    <div 
                      className="absolute inset-0 transition-opacity duration-500" 
                      style={{ backgroundColor: `rgba(10, 10, 12, ${(settings.heroOverlayOpacity || 40) / 100})` }}
                    />
                  </div>

                  {/* Animated Decorative Blur */}
                  <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-primary/10 blur-[100px] rounded-full -mr-20 -mt-20 animate-pulse pointer-events-none" />

                  {/* Content */}
                  <div 
                    className={`relative z-10 h-full p-12 flex flex-col justify-center min-h-[400px] ${
                      settings.heroTextAlign === 'center' ? 'items-center text-center' : 
                      settings.heroTextAlign === 'right' ? 'items-end text-right' : 'items-start text-left'
                    }`}
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 mb-6"
                    >
                      <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full">
                        <Zap size={10} className="text-brand-primary/60" />
                        <span className="text-brand-primary/60 text-[8px] font-black uppercase tracking-[0.2em]">New Release</span>
                      </div>
                    </motion.div>

                    <motion.h1 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.85]"
                    >
                      <span style={{ color: settings.primaryColor }} className="block opacity-90">{settings.heroTitle1}</span>
                      <span style={{ color: settings.accentColor }} className="block -mt-2 opacity-80">{settings.heroTitle2}</span>
                      <span style={{ color: settings.secondaryColor }} className="block -mt-2 opacity-90">{settings.heroTitle3}</span>
                    </motion.h1>

                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className={`text-gray-500 max-w-sm mb-10 text-sm leading-relaxed font-medium ${settings.heroTextAlign === 'center' ? 'mx-auto' : settings.heroTextAlign === 'right' ? 'ml-auto' : ''}`}
                    >
                      {settings.heroDescription}
                    </motion.p>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`flex flex-wrap items-center gap-5 ${settings.heroTextAlign === 'center' ? 'justify-center' : settings.heroTextAlign === 'right' ? 'justify-end' : ''}`}
                    >
                      <button 
                        style={{ borderRadius: getButtonRadius() }}
                        className="group relative bg-white text-surface-900 px-10 py-5 font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.15)]"
                      >
                        <Play size={20} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                        <span>Écouter Volume 1</span>
                        
                        <div className="absolute bottom-0 left-0 w-full h-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex-1 bg-brand-blue" />
                          <div className="flex-1 bg-brand-white" />
                          <div className="flex-1 bg-brand-red" />
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveView('discover')}
                        style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius() }}
                        className="text-white px-10 py-5 font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(var(--color-brand-primary-rgb),0.3)]"
                      >
                        <Library size={20} />
                        <span>Explore our catalog</span>
                      </button>
                      
                        <button 
                          onClick={() => setActiveView(settings.ctaLink as any)}
                          style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius() }}
                          className="text-white px-10 py-5 font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(var(--color-brand-primary-rgb),0.3)]"
                        >
                          <Library size={20} />
                          <span>{settings.ctaText}</span>
                        </button>

                        <button 
                          style={{ borderRadius: getButtonRadius() }}
                          className="bg-surface-800/40 backdrop-blur-xl text-white px-10 py-5 font-black text-xs uppercase tracking-widest hover:bg-surface-700/60 transition-all border border-surface-700/50 flex items-center gap-3"
                        >
                          <Plus size={20} />
                        <span>Ajouter à ma collection</span>
                      </button>
                    </motion.div>
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute top-8 right-8 flex flex-col items-end gap-1 opacity-20">
                    <div className="w-12 h-1 bg-white rounded-full" />
                    <div className="w-8 h-1 bg-white rounded-full" />
                    <div className="w-4 h-1 bg-white rounded-full" />
                  </div>
                </motion.div>
              </div>
            )}

            {settings.showRecent !== false && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight uppercase tracking-tighter">{settings.sectionTitleLatest}</h2>
                    <p className="text-xs text-gray-500">Mis à jour il y a quelques instants</p>
                  </div>
                </div>

                <div className={`bg-surface-800/30 rounded-2xl border p-2 relative group/recent ${isEditMode ? 'border-brand-primary ring-2 ring-brand-primary/10 hover:ring-brand-primary/30 cursor-pointer' : 'border-surface-700/50'}`}>
                  {isEditMode && (
                    <div 
                      onClick={() => openStudio('content')}
                      className="absolute -top-3 -right-3 z-30 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all opacity-0 group-hover/recent:opacity-100"
                    >
                      <Settings size={14} />
                    </div>
                  )}
                  <div className="grid grid-cols-[40px_1fr_180px_80px_80px_80px_100px] gap-4 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <div>#</div>
                    <div>Morceau</div>
                    <div>Style</div>
                    <div>BPM</div>
                    <div>Tonalité</div>
                    <div>Durée</div>
                    <div className="text-right pr-4">Actions</div>
                  </div>
                  
                  <div className="space-y-1">
                    {loading ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                        <Disc className="w-10 h-10 animate-spin" />
                        <p className="text-sm font-medium">Chargement du catalogue...</p>
                      </div>
                    ) : tracks.length > 0 ? (
                      tracks.map((track, i) => (
                        <TrackRow 
                          key={track.id} 
                          track={track} 
                          index={i} 
                          isActive={currentTrack?.id === track.id}
                          onPlay={() => handleTrackSelect(track, true)}
                          onDownload={handleDownload}
                        />
                      ))
                    ) : (
                      <div className="py-20 text-center text-gray-500">
                        <Library className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">Aucun morceau disponible dans cette catégorie.</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setActiveView('new')}
                    className="w-full py-4 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors flex items-center justify-center gap-2 group"
                  >
                    Voir tous les nouveaux morceaux <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-8 mb-12">
               <div className="col-span-2 space-y-6">
                  <h3 className="text-xl font-bold uppercase tracking-tighter">{settings.sectionTitleTrending}</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border border-surface-700 border-dashed rounded-3xl h-48 flex items-center justify-center text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center px-6">
                      Aucune tendance disponible actuellement
                    </div>
                  </div>
               </div>
               <div>
                  <h3 className="text-xl font-bold mb-6">Top Artistes</h3>
                  <div className="space-y-4">
                     <div className="bg-surface-800/20 border border-surface-700/30 border-dashed rounded-2xl p-8 text-center text-gray-600 text-[9px] font-black uppercase tracking-widest">
                        Données artistes indisponibles
                     </div>
                  </div>
               </div>
            </div>

            <footer className="py-12 border-t border-surface-800 flex flex-col items-center justify-center gap-4 text-center">
               <div className="flex items-center gap-2 mb-2">
                 {settings.logoUrl ? (
                   <img src={settings.logoUrl || undefined} className="h-8 w-auto object-contain" alt="Logo" />
                 ) : (
                   <span className="font-bold text-xs uppercase tracking-widest">{settings.brandNamePart1} {settings.brandNamePart2}</span>
                 )}
               </div>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{settings.footerText}</p>
            </footer>
          </>
        );
      case 'discover':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8">DÉCOUVRIR</h2>
            <div className="grid grid-cols-4 gap-6 mb-12">
              {['Indie Dance', 'Nu Disco', 'Melodic Techno', 'Organic House'].map((cat, i) => (
                 <div key={cat} className="aspect-square rounded-3xl bg-surface-800 border border-surface-700 p-6 flex flex-col justify-between group hover:border-brand-primary transition-all cursor-pointer overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Disc className="w-12 h-12 text-brand-primary group-hover:rotate-12 transition-transform" />
                    <h3 className="font-bold text-xl relative z-10">{cat}</h3>
                 </div>
              ))}
            </div>
            <h3 className="text-xl font-bold mb-6">Curated for you</h3>
            <div className="grid grid-cols-2 gap-8">
               <div className="border border-surface-700 border-dashed rounded-3xl h-48 flex items-center justify-center text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center px-6">
                 Collections thématiques bientôt disponibles
               </div>
            </div>
          </div>
        );
      case 'new':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">NOUVEAUTÉS</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <span>Filter par:</span>
                <button className="px-3 py-1 bg-surface-800 rounded-full text-white underline decoration-brand-primary">7 derniers jours</button>
              </div>
            </div>
            <div className="bg-surface-800/30 rounded-2xl border border-surface-700/50 p-2">
                <div className="grid grid-cols-[40px_1fr_180px_80px_80px_80px_100px] gap-4 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <div>#</div>
                  <div>Morceau</div>
                  <div>Style</div>
                  <div>BPM</div>
                  <div>Tonalité</div>
                  <div>Durée</div>
                  <div className="text-right pr-4">Actions</div>
                </div>
                <div className="space-y-1">
                  {tracks.map((track, i) => (
                    <TrackRow 
                      key={track.id} 
                      track={track} 
                      index={i} 
                      isActive={currentTrack?.id === track.id}
                      onPlay={() => handleTrackSelect(track, true)}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8">RECHERCHER</h2>
            <div className="max-w-2xl mb-12">
               <div className="relative group">
                <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary" />
                <input 
                  type="text" 
                  placeholder="Artiste, titre, label, BPM, Key..." 
                  className="w-full bg-surface-800 text-xl font-bold rounded-2xl py-6 pl-14 pr-6 border-2 border-transparent focus:border-brand-primary outline-none transition-all"
                  autoFocus
                />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
               <div>
                 <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-6">Recherches récentes</h3>
                 <div className="space-y-2">
                    <p className="text-[10px] text-gray-600 italic">Votre historique de recherche apparaîtra ici.</p>
                 </div>
               </div>
               <div>
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-6">Tendances</h3>
                  <div className="flex flex-wrap gap-2">
                     <p className="text-[10px] text-gray-600 italic">Aucune tendance pour le moment.</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'favorites':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8">MES FAVORIS</h2>
            <div className="py-20 text-center">
              <Heart className="w-16 h-16 mx-auto mb-6 text-gray-700 opacity-20" />
              <p className="text-xl font-bold text-gray-500 mb-2">Pas encore de favoris</p>
              <p className="text-sm text-gray-600 font-medium max-w-xs mx-auto leading-relaxed">Cliquez sur l'icône coeur des morceaux que vous aimez pour les retrouver ici.</p>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="mt-8 bg-brand-primary px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform"
              >
                Explorer le catalogue
              </button>
            </div>
          </div>
        );
      case 'downloads':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8">TÉLÉCHARGEMENTS</h2>
            <div className="bg-surface-800 border border-surface-700 rounded-3xl p-8 flex items-center gap-8 mb-12">
               <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Download className="w-10 h-10 text-brand-primary" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold mb-2">Historique des téléchargements</h3>
                  <p className="text-gray-400 text-sm">
                    {profile?.subscriptionStatus !== 'free' 
                      ? 'Votre quota PRO est illimité. Profitez des meilleurs morceaux en haute qualité.' 
                      : 'Passez au status PRO pour débloquer les téléchargements illimités et les versions exclusives.'}
                  </p>
               </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="aspect-video bg-surface-800/50 rounded-2xl border border-surface-700/50 border-dashed animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Empty Slot</span>
                  </div>
                ))}
            </div>
          </div>
        );
      case 'playlists':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">MES PLAYLISTS</h2>
              <button className="bg-white text-surface-900 px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors">
                 <Mic2 size={16} /> Créer une playlist
              </button>
            </div>
            <div className="grid grid-cols-3 gap-8">
                <PlaylistCard title="My Selection" description="Personal highlights" tracks={0} color="bg-brand-primary" />
                <div className="border-2 border-surface-800 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-600 hover:text-gray-400 hover:border-surface-700 transition-all cursor-pointer group p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
                      <Mic2 size={24} />
                    </div>
                    <p className="font-bold text-sm">Organisez vos morceaux par sets ou par moods</p>
                </div>
            </div>
          </div>
        );
      case 'genre':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
               <button 
                onClick={() => setActiveView('dashboard')}
                className="p-2 hover:bg-surface-800 rounded-full text-gray-400 hover:text-white transition-colors"
               >
                 <ChevronRight className="rotate-180" size={24} />
               </button>
               <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedGenre}</h2>
            </div>
            <div className="bg-surface-800/30 rounded-2xl border border-surface-700/50 p-2">
                <div className="grid grid-cols-[40px_1fr_180px_80px_80px_80px_100px] gap-4 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <div>#</div>
                  <div>Morceau</div>
                  <div>Style</div>
                  <div>BPM</div>
                  <div>Tonalité</div>
                  <div>Durée</div>
                  <div className="text-right pr-4">Actions</div>
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                      <Disc className="w-10 h-10 animate-spin" />
                      <p className="text-sm font-medium">Chargement...</p>
                    </div>
                  ) : tracks.length > 0 ? (
                    tracks.map((track, i) => (
                      <TrackRow 
                        key={track.id} 
                        track={track} 
                        index={i} 
                        isActive={currentTrack?.id === track.id}
                        onPlay={() => handleTrackSelect(track, true)}
                        onDownload={handleDownload}
                      />
                    ))
                  ) : (
                    <div className="py-20 text-center text-gray-500">
                      <p>Aucun morceau trouvé pour ce genre.</p>
                    </div>
                  )}
                </div>
            </div>
          </div>
        );
      case 'admin':
        return <AdminPanel />;
      default:
        return null;
    }
  };

  const getButtonRadius = () => {
    switch (settings.buttonRoundness) {
      case 'none': return '0px';
      case 'small': return '8px';
      case 'medium': return '16px';
      case 'large': return '24px';
      case 'full': return '9999px';
      default: return '9999px';
    }
  };

  const getHeaderClasses = () => {
    switch (settings.headerStyle) {
      case 'glass': return 'bg-surface-900/80 backdrop-blur-md';
      case 'transparent': return 'bg-transparent border-transparent';
      case 'solid': return 'bg-surface-900';
      default: return 'bg-surface-900/80 backdrop-blur-md';
    }
  };

  useEffect(() => {
    (window as any).openBrandingStudio = () => setShowBrandingStudio(true);
  }, []);

  return (
    <div className={`flex h-screen bg-surface-900 text-white overflow-hidden font-${settings.fontFamily}`}>
      <Sidebar 
        activeView={activeView} 
        setView={setActiveView} 
        currentGenre={selectedGenre} 
        setGenre={setSelectedGenre} 
        settings={settings}
        onUpgrade={() => setShowUpgradeModal(true)}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main 
          className={`flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar ${
            settings.layoutDensity === 'compact' ? 'space-y-4 p-4' : 
            settings.layoutDensity === 'spacious' ? 'space-y-16 p-12' : 
            'space-y-8 p-8'
          }`} 
          style={{ fontSize: '9px', lineHeight: '16px' }}
        >
          {renderContent()}
        </main>
        
        <MusicPlayer 
          currentTrack={currentTrack} 
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      </div>

      <AnimatePresence>
        {isEditMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => openStudio('colors')}
            className="fixed bottom-24 right-8 z-[60] w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
          >
            <Palette size={24} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute right-full mr-4 bg-surface-900 border border-surface-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
               <Zap size={12} className="text-brand-primary" />
               Studio Global
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-900 border border-surface-700 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-brand-red/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <Download className="text-brand-red w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-tight">
                  Passer en mode <span className="text-brand-red">ELITE PRO</span>
                </h3>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Cette fonctionnalité est réservée à nos membres <span className="text-white font-bold">PRO</span>. 
                  Accédez aux téléchargements illimités, aux versions exclusives et aux formats haute qualité.
                </p>

                <div className="space-y-3 mb-10 text-left bg-surface-800/50 p-6 rounded-2xl border border-surface-700">
                  <div className="flex items-start gap-3">
                    <Zap size={14} className="text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-[11px] font-bold text-gray-300">Téléchargements Illimités (WAV/MP3)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap size={14} className="text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-[11px] font-bold text-gray-300">Accès anticipé aux exclusivités</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap size={14} className="text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-[11px] font-bold text-gray-300">Support technique prioritaire</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="w-full py-4 bg-brand-red text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-red/30">
                    S'abonner maintenant (19.99€/mois)
                  </button>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-4 text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Peut-être plus tard
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBrandingStudio && (
          <BrandingStudio 
            initialSettings={settings} 
            onClose={() => setShowBrandingStudio(false)} 
            defaultTab={brandingTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const PlaylistCard = ({ title, description, tracks, color }: { title: string, description: string, tracks: number, color: string }) => (
  <div className="group relative bg-surface-800 rounded-3xl overflow-hidden border border-surface-700 hover:border-brand-primary transition-all cursor-pointer h-48">
    <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-40 transition-opacity`} />
    <div className="p-6 h-full flex flex-col justify-between relative z-10">
      <div>
        <h4 className="text-xl font-black mb-1 leading-tight tracking-tight">{title}</h4>
        <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest">{tracks} Tracks</span>
        <div className="w-10 h-10 rounded-full bg-white text-surface-900 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
          <Play size={18} fill="currentColor" />
        </div>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 flex opacity-30 group-hover:opacity-100 transition-opacity">
      <div className="flex-1 bg-brand-blue" />
      <div className="flex-1 bg-brand-white" />
      <div className="flex-1 bg-brand-red" />
    </div>
  </div>
);
