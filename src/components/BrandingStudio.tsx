import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Layout, 
  Settings, 
  Save, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Undo, 
  Redo, 
  Zap,
  Globe,
  Share2,
  Trash2,
  Upload,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { SiteSettings } from '../types';

interface BrandingStudioProps {
  initialSettings: SiteSettings;
  onClose: () => void;
  defaultTab?: 'colors' | 'typo' | 'content' | 'layout';
}

export default function BrandingStudio({ initialSettings, onClose, defaultTab = 'colors' }: BrandingStudioProps) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'colors' | 'typo' | 'content' | 'layout'>(defaultTab);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const fonts = [
    { id: 'sans', name: 'Inter (Sans-serif)', family: 'Inter, sans-serif' },
    { id: 'mono', name: 'JetBrains Mono (Technical)', family: 'JetBrains Mono, monospace' },
    { id: 'serif', name: 'Playfair Display (Editorial)', family: 'Playfair Display, serif' },
  ];

  const roundnessOptions = [
    { id: 'none', label: 'Carré', radius: '0px' },
    { id: 'small', label: 'S', radius: '4px' },
    { id: 'medium', label: 'M', radius: '12px' },
    { id: 'large', label: 'L', radius: '24px' },
    { id: 'full', label: 'Arrondi', radius: '9999px' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-surface-950 flex overflow-hidden">
      {/* Sidebar Editor */}
      <div className="w-80 h-full border-r border-surface-800 bg-surface-900 flex flex-col z-20 shadow-2xl">
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface-800">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-white">Studio Branding</span>
          <div className="flex gap-2">
            <button className="text-gray-600 hover:text-gray-400">
              <Undo size={14} />
            </button>
            <button className="text-gray-600 hover:text-gray-400">
              <Redo size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Tabs Navigation */}
          <div className="flex border-b border-surface-800">
            {(['colors', 'typo', 'content', 'layout'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${
                  activeTab === tab 
                    ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'colors' && <Palette size={18} />}
                {tab === 'typo' && <Type size={18} />}
                {tab === 'content' && <Globe size={18} />}
                {tab === 'layout' && <Layout size={18} />}
                <span className="text-[8px] font-black uppercase tracking-widest">{tab}</span>
              </button>
            ))}
          </div>

          <div className="p-6 space-y-8">
            {activeTab === 'colors' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Palette Principale</label>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'primaryColor', label: 'Primaire (Boutons, Play)' },
                      { key: 'secondaryColor', label: 'Secondaire (Elite, Highlights)' },
                      { key: 'accentColor', label: 'Accent (Texte inverse, Focus)' }
                    ].map(color => (
                      <div key={color.key} className="bg-surface-800 p-4 rounded-2xl border border-surface-700/50 hover:border-brand-primary/30 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-gray-400">{color.label}</span>
                          <span className="text-[10px] font-mono text-gray-500 group-hover:text-white transition-colors">{(settings as any)[color.key]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={(settings as any)[color.key]} 
                            onChange={e => setSettings({...settings, [color.key]: e.target.value})}
                            className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-none bg-transparent p-0"
                          />
                          <div className="flex-1 grid grid-cols-5 gap-1.5">
                            {['#0055FF', '#FF3B30', '#FFCC00', '#34C759', '#FFFFFF'].map(p => (
                              <button 
                                key={p} 
                                onClick={() => setSettings({...settings, [color.key]: p})}
                                className="w-full aspect-square rounded-md border border-white/5" 
                                style={{ backgroundColor: p }} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Thème de la Barre de Titre</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['transparent', 'solid', 'glass'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => setSettings({...settings, headerStyle: style})}
                        className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                          settings.headerStyle === style 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-surface-800 text-gray-500 border-surface-700 hover:text-white'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'typo' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Famille de Police</label>
                  <div className="space-y-2">
                    {fonts.map(font => (
                      <button
                        key={font.id}
                        onClick={() => setSettings({...settings, fontFamily: font.id as any})}
                        className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          settings.fontFamily === font.id 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-surface-800 text-gray-400 border-surface-700 hover:text-white'
                        }`}
                        style={{ fontFamily: font.family }}
                      >
                        <span className="text-sm font-bold block">{font.name}</span>
                        <span className="text-[9px] opacity-60">The quick brown fox jumps over the lazy dog.</span>
                        {settings.fontFamily === font.id && <Check className="absolute top-4 right-4" size={16} />}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Ensemble des Boutons</label>
                  <div className="bg-surface-800 p-4 rounded-2xl border border-surface-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <div 
                        className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all"
                        style={{ 
                          backgroundColor: settings.primaryColor,
                          borderRadius: roundnessOptions.find(o => o.id === settings.buttonRoundness)?.radius 
                        }}
                      >
                        Button Preview
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {roundnessOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setSettings({...settings, buttonRoundness: opt.id as any})}
                          className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${
                            settings.buttonRoundness === opt.id 
                              ? 'bg-brand-primary border-brand-primary text-white' 
                              : 'bg-surface-900 border-surface-700 text-gray-600'
                          }`}
                          title={opt.label}
                        >
                          <div className="w-4 h-4 border-2 border-current" style={{ borderRadius: opt.radius }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 pb-20">
                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Identité Visuelle & Nom</label>
                  <div className="space-y-4">
                    <div className="bg-surface-800 p-4 rounded-2xl border border-surface-700/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-surface-900 rounded-xl flex items-center justify-center overflow-hidden border border-surface-700">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl || undefined} className="w-full h-full object-contain" alt="Logo" />
                          ) : (
                            <ImageIcon size={20} className="text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-white mb-1">Logo</p>
                          <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">URL de l'image (SVG/PNG)</p>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={settings.logoUrl || ''} 
                        onChange={e => setSettings({...settings, logoUrl: e.target.value})}
                        className="w-full bg-surface-900 border border-surface-700 p-3 rounded-xl text-[10px] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Marque {i}</span>
                          <input 
                            type="text" 
                            value={(settings as any)[`brandNamePart${i}`]} 
                            onChange={e => setSettings({...settings, [`brandNamePart${i}`]: e.target.value})}
                            className="w-full bg-surface-800 border border-surface-700 p-2 rounded-lg text-[10px] font-black uppercase outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Titres des Sections</label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Section Nouveautés</span>
                      <input 
                        type="text" 
                        value={settings.sectionTitleLatest || ''} 
                        onChange={e => setSettings({...settings, sectionTitleLatest: e.target.value})}
                        className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Section Tendances</span>
                      <input 
                        type="text" 
                        value={settings.sectionTitleTrending || ''} 
                        onChange={e => setSettings({...settings, sectionTitleTrending: e.target.value})}
                        className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Pied de Page (Footer)</label>
                  <textarea 
                    value={settings.footerText || ''} 
                    onChange={e => setSettings({...settings, footerText: e.target.value})}
                    className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-[10px] outline-none h-20 custom-scrollbar"
                  />
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Titres du Menu Latéral</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'sidebarLibraryTitle', label: 'Bibliothèque' },
                      { key: 'sidebarMusicTitle', label: 'Ma Musique' },
                      { key: 'sidebarAdminTitle', label: 'Admin' },
                      { key: 'sidebarStylesTitle', label: 'Styles' }
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">{item.label}</span>
                        <input 
                          type="text" 
                          value={(settings as any)[item.key] || ''} 
                          onChange={e => setSettings({...settings, [item.key]: e.target.value})}
                          className="w-full bg-surface-800 border border-surface-700 p-2.5 rounded-xl text-[10px] font-bold outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Titulaires & Description</label>
                  <div className="space-y-3">
                    {['heroTitle1', 'heroTitle2', 'heroTitle3'].map((key, i) => (
                      <div key={key} className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Ligne {i+1}</span>
                        <input 
                          type="text" 
                          value={(settings as any)[key]} 
                          onChange={e => setSettings({...settings, [key]: e.target.value})}
                          className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-primary"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Barre de Recherche</label>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Texte d'Indication (Placeholder)</span>
                    <input 
                      type="text" 
                      value={settings.searchPlaceholder || ''} 
                      onChange={e => setSettings({...settings, searchPlaceholder: e.target.value})}
                      className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-[10px] outline-none"
                    />
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Bouton d'Action (CTA)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Texte du Bouton</span>
                      <input 
                        type="text" 
                        value={settings.ctaText || ''} 
                        onChange={e => setSettings({...settings, ctaText: e.target.value})}
                        className="w-full bg-surface-800 border border-surface-700 p-2.5 rounded-xl text-[10px] font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-600 uppercase ml-2">Lien (Page ID)</span>
                      <select 
                        value={settings.ctaLink || ''} 
                        onChange={e => setSettings({...settings, ctaLink: e.target.value})}
                        className="w-full bg-surface-800 border border-surface-700 p-2.5 rounded-xl text-[10px] font-bold outline-none appearance-none"
                      >
                        <option value="dashboard">Dashboard</option>
                        <option value="discover">Discover</option>
                        <option value="new">Nouveautés</option>
                        <option value="search">Search</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Description Hero</label>
                  <textarea 
                    value={settings.heroDescription} 
                    onChange={e => setSettings({...settings, heroDescription: e.target.value})}
                    className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-xs outline-none focus:border-brand-primary h-24 custom-scrollbar"
                  />
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Hero Image Background</label>
                  <div className="relative group rounded-xl overflow-hidden mb-3">
                    <img src={settings.heroImageUrl || undefined} className="w-full h-32 object-cover opacity-50 group-hover:opacity-70 transition-opacity" alt="Hero" />
                    <button className="absolute inset-0 m-auto w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={18} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={settings.heroImageUrl} 
                    onChange={e => setSettings({...settings, heroImageUrl: e.target.value})}
                    placeholder="URL de l'image..."
                    className="w-full bg-surface-800 border border-surface-700 p-3 rounded-xl text-[10px] outline-none"
                  />
                </section>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 pb-20">
                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Visibilité des Sections</label>
                  <div className="space-y-2">
                    {[
                      { key: 'showHero', label: 'Bannière Hero' },
                      { key: 'showRecent', label: 'Dernières Sorties' }
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setSettings({...settings, [item.key]: !(settings as any)[item.key]})}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                          (settings as any)[item.key]
                            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/50' 
                            : 'bg-surface-800 text-gray-500 border-surface-700'
                        }`}
                      >
                         <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                         <div className={`w-8 h-4 rounded-full relative transition-all ${(settings as any)[item.key] ? 'bg-brand-primary' : 'bg-surface-700'}`}>
                           <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${(settings as any)[item.key] ? 'right-0.5' : 'left-0.5'}`} />
                         </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Personnalisation Hero</label>
                  <div className="bg-surface-800 p-4 rounded-2xl border border-surface-700/50 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Alignement Texte</span>
                        <div className="flex bg-surface-900 rounded-lg p-1">
                          {(['left', 'center', 'right'] as const).map(align => (
                            <button
                              key={align}
                              onClick={() => setSettings({...settings, heroTextAlign: align})}
                              className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${settings.heroTextAlign === align ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Opacité Overlay</span>
                          <span className="text-[9px] font-mono text-brand-primary">{settings.heroOverlayOpacity}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={settings.heroOverlayOpacity || 40} 
                          onChange={e => setSettings({...settings, heroOverlayOpacity: parseInt(e.target.value)})}
                          className="w-full accent-brand-primary bg-surface-900 h-1.5 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Densité Global</label>
                  <div className="space-y-2">
                    {(['compact', 'comfortable', 'spacious'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setSettings({...settings, layoutDensity: d})}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                          settings.layoutDensity === d 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-surface-800 text-gray-500 border-surface-700 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{d}</span>
                        <div className="flex gap-1">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-surface-800 space-y-3">
          <button 
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full py-4 bg-brand-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            {isSaving ? <Zap className="animate-pulse" size={14} /> : <Save size={16} />}
            {isSaving ? 'PUBLICATION...' : 'PUBLIER LES MODIFICATIONS'}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-4 text-gray-500 font-bold text-[9px] uppercase tracking-widest hover:text-white transition-colors"
          >
            QUITTER L'ÉDITEUR
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 h-full bg-surface-950 flex flex-col relative overflow-hidden">
        {/* Device Switcher */}
        <div className="h-16 flex items-center justify-center bg-surface-900 border-b border-surface-800 gap-1.5 relative z-10">
          <button 
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-surface-800 text-brand-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Monitor size={18} />
          </button>
          <button 
            onClick={() => setViewMode('tablet')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'tablet' ? 'bg-surface-800 text-brand-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Tablet size={18} />
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-surface-800 text-brand-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Smartphone size={18} />
          </button>
          
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Aperçu Réel</span>
          </div>
        </div>

        {/* Dynamic Preview Container */}
        <div className="flex-1 overflow-y-auto bg-surface-950 p-12 transition-all duration-500 flex justify-center custom-scrollbar">
           <div 
             className={`bg-surface-900 shadow-2xl transition-all duration-500 overflow-hidden relative border border-surface-800 ${
               viewMode === 'desktop' ? 'w-full' : 
               viewMode === 'tablet' ? 'w-[768px]' : 'w-[375px]'
             }`}
             style={{ 
               height: 'fit-content', 
               minHeight: '100%',
               fontFamily: fonts.find(f => f.id === settings.fontFamily)?.family,
               borderRadius: viewMode === 'desktop' ? '0px' : '32px'
             }}
           >
              {/* Fake App Navbar */}
              <div className={`h-16 flex items-center justify-between px-8 border-b border-surface-800 sticky top-0 z-10 ${
                settings.headerStyle === 'glass' ? 'bg-surface-900/60 backdrop-blur-xl' : 
                settings.headerStyle === 'transparent' ? 'bg-transparent border-transparent' : 
                'bg-surface-900'
              }`}>
                <div className="flex items-center gap-2">
                   {settings.logoUrl ? (
                     <div className="h-8 flex items-center">
                       <img src={settings.logoUrl || undefined} className="h-full w-auto object-contain" alt="Logo" />
                     </div>
                   ) : (
                     <>
                       <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.primaryColor }}>
                          <Zap size={12} className="text-white" />
                       </div>
                       <span className="font-black text-xs uppercase tracking-tighter">
                          <span style={{ color: settings.primaryColor }}>{settings.brandNamePart1}</span>
                          <span className="ml-1" style={{ color: settings.accentColor }}>{settings.brandNamePart2}</span>
                       </span>
                     </>
                   )}
                </div>
                <div className="flex gap-4">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-1.5 rounded-full bg-surface-800" />)}
                </div>
              </div>

              {/* Hero Section Preview */}
              {settings.showHero !== false && (
                <div className="relative h-[300px] md:h-[500px] overflow-hidden">
                  <img src={settings.heroImageUrl || undefined} className="w-full h-full object-cover" alt="" />
                  <div 
                    className={`absolute inset-0 flex flex-col justify-center px-12 md:px-20 ${
                      settings.heroTextAlign === 'center' ? 'items-center text-center' : 
                      settings.heroTextAlign === 'right' ? 'items-end text-right' : 'items-start text-left'
                    }`}
                    style={{ backgroundColor: `rgba(10, 10, 12, ${(settings.heroOverlayOpacity || 40) / 100})` }}
                  >
                     <h1 className="text-4xl md:text-7xl font-black mb-4 uppercase leading-[0.85] tracking-tighter">
                        <span style={{ color: settings.primaryColor }} className="block">{settings.heroTitle1}</span>
                        <span style={{ color: settings.accentColor }} className="block opacity-90">{settings.heroTitle2}</span>
                        <span style={{ color: settings.secondaryColor }} className="block opacity-90">{settings.heroTitle3}</span>
                     </h1>
                     <p className="text-gray-400 max-w-sm text-xs md:text-sm leading-relaxed mb-8 opacity-80">{settings.heroDescription}</p>
                     <div className="flex flex-wrap gap-4">
                        <button 
                          className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-surface-900 bg-white"
                          style={{ 
                            borderRadius: roundnessOptions.find(o => o.id === settings.buttonRoundness)?.radius 
                          }}
                        >
                          Écouter
                        </button>
                        <button 
                          className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                          style={{ 
                            backgroundColor: settings.primaryColor,
                            borderRadius: roundnessOptions.find(o => o.id === settings.buttonRoundness)?.radius 
                          }}
                        >
                          Explore our catalog
                        </button>
                        <button 
                          className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                          style={{ 
                            backgroundColor: settings.primaryColor,
                            borderRadius: roundnessOptions.find(o => o.id === settings.buttonRoundness)?.radius 
                          }}
                        >
                          {settings.ctaText}
                        </button>
                     </div>
                  </div>
                </div>
              )}

              {/* Grid Preview */}
              {settings.showRecent !== false && (
                <div className={`p-8 md:p-12 ${settings.layoutDensity === 'compact' ? 'space-y-4' : settings.layoutDensity === 'comfortable' ? 'space-y-8' : 'space-y-16'}`}>
                   <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter">{settings.sectionTitleLatest}</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="bg-surface-800 rounded-3xl p-4 border border-surface-700/50">
                          <div className="aspect-square bg-surface-700 rounded-2xl mb-4" />
                          <div className="h-3 w-3/4 bg-surface-700 rounded-full mb-2" />
                          <div className="h-2 w-1/2 bg-surface-800 rounded-full" />
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Footer Preview */}
              <div className="p-12 border-t border-surface-800 flex justify-center text-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{settings.footerText}</p>
              </div>
           </div>
        </div>

        {/* Global CSS Injector for Preview */}
        <style>{`
          .font-sans { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .font-serif { font-family: 'Playfair Display', serif; }
        `}</style>
      </div>

      {/* Saved Toast */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[110] bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <Check size={14} />
            </div>
            Le design de votre site a été publié
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
