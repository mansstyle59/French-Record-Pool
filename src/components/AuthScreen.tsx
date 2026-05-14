import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from '../hooks/useSettings';
import { Disc, Play, Shield, Zap, Music, ArrowRight, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';

export default function AuthScreen() {
  const { login } = useAuth();
  const { settings } = useSettings();
  const [isHovered, setIsHovered] = useState(false);

  const [authMode, setAuthMode] = useState<'selection' | 'email-login' | 'email-signup'>('selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (authMode === 'email-signup') {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Une erreur est survenue lors de l\'authentification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-brand-blue blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-3/4 -right-1/4 w-1/2 h-1/2 bg-brand-red blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Header / Logo */}
      <header className="p-8 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <div className="h-10 flex items-center">
              <img src={settings.logoUrl || undefined} className="h-full w-auto object-contain" alt="Logo" />
            </div>
          ) : (
            <>
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-xl shadow-brand-primary/20">
                <Disc className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <span className="font-bold text-2xl tracking-tighter uppercase">
                <span style={{ color: settings.primaryColor }}>{settings.brandNamePart1}</span>
                <span style={{ color: settings.accentColor }} className="ml-1">{settings.brandNamePart2}</span>
                <span style={{ color: settings.secondaryColor }} className="ml-1">{settings.brandNamePart3}</span>
              </span>
            </>
          )}
        </div>
        
        <div className="flex bg-surface-800/50 backdrop-blur-md p-1 rounded-full border border-surface-700/50">
          <div className="flex gap-0.5 h-6 w-10 px-2 items-center">
            <div className="flex-1 h-3 bg-brand-blue rounded-sm" />
            <div className="flex-1 h-3 bg-brand-white rounded-sm" />
            <div className="flex-1 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="text-[10px] font-black text-gray-500 pr-3 uppercase tracking-widest flex items-center">FR / EU</span>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-12">
          
          <AnimatePresence mode="wait">
            {authMode === 'selection' ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-[10px] font-black uppercase tracking-[0.2em]">
                    <Zap size={12} /> Plateforme Exclusive DJs
                  </div>
                  
                  <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase">
                    L'ÉLITE DU <span className="text-gray-600">SOUND</span> <br />
                    <span className="text-brand-primary">DESIGN</span> FRANÇAIS
                  </h1>
                  
                  <p className="text-gray-400 max-w-xl mx-auto text-lg font-medium leading-relaxed">
                    Accédez au catalogue curatoré de French Record Pool. Téléchargements illimités, tracks exclusives et qualité studio pour les selecteurs exigeants.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <button 
                    onClick={login}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="group relative flex items-center gap-4 bg-white text-surface-900 px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] overflow-hidden"
                  >
                    <Chrome size={24} className="group-hover:rotate-12 transition-transform" />
                    S'INSCRIRE AVEC GOOGLE
                    <ArrowRight className={`ml-2 transition-all ${isHovered ? 'translate-x-1 opacity-100' : 'opacity-50'}`} />
                    
                    <div className="absolute bottom-0 left-0 w-full h-1 flex">
                      <div className="flex-1 bg-brand-blue" />
                      <div className="flex-1 bg-brand-white" />
                      <div className="flex-1 bg-brand-red" />
                    </div>
                  </button>
                  
                  <div className="flex items-center gap-4 w-full max-w-xs">
                    <div className="h-[1px] flex-1 bg-surface-700" />
                    <span className="text-[10px] font-black text-gray-600 uppercase">OU</span>
                    <div className="h-[1px] flex-1 bg-surface-700" />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setAuthMode('email-signup')}
                      className="px-6 py-3 rounded-xl border border-surface-700 hover:border-brand-primary transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      CRÉER UN COMPTE
                    </button>
                    <button 
                      onClick={() => setAuthMode('email-login')}
                      className="px-6 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      DÉJÀ INSCRIT ?
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md mx-auto bg-surface-800 border border-surface-700 p-8 rounded-[2rem] shadow-2xl relative"
              >
                <button 
                  onClick={() => setAuthMode('selection')}
                  className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
                >
                  <ArrowRight className="rotate-180" size={24} />
                </button>

                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
                  {authMode === 'email-signup' ? 'Inscription' : 'Connexion'}
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-black mb-8">French Pool Music Division</p>

                <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                  {authMode === 'email-signup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nom / DJ Name</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Denis Dewulf"
                        className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Email</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Mot de passe</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                    />
                  </div>

                  {authError && (
                    <p className="text-[10px] text-brand-red font-bold uppercase tracking-tight bg-brand-red/10 p-3 rounded-lg border border-brand-red/20 text-center">
                      {authError}
                    </p>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'ENCOURS...' : (authMode === 'email-signup' ? 'Valider l\'inscription' : 'Se connecter')}
                  </button>

                  <p className="text-center text-[10px] text-gray-600 font-bold uppercase leading-relaxed pt-4">
                    En continuant, vous acceptez les conditions générales de French Record Pool Electronique
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Proof / Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-surface-700/50"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center mb-2">
                <Music className="text-brand-blue" size={24} />
              </div>
              <p className="text-2xl font-black">1500+</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Morceaux Exclusifs</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center mb-2">
                <Shield className="text-brand-white" size={24} />
              </div>
              <p className="text-2xl font-black">STUDIO</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Qualité AIFF / WAV</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center mb-2">
                <Play className="text-brand-red" size={24} />
              </div>
              <p className="text-2xl font-black">UNLIMITED</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Accès Prioritaire</p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center relative z-10 border-t border-surface-800/50">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
          Directed by Denis Dewulf • © 2026 FRENCH RECORD POOL ELECTRONIQUE
        </p>
      </footer>
    </div>
  );
}
