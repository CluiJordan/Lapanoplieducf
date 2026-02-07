import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Minimize2, ArrowRightLeft, Heart, Scissors, 
  LayoutList, FileSpreadsheet, Rocket, HelpCircle, CheckCircle2,
  Moon, Sun 
} from 'lucide-react';
import SuggestionModal from './components/SuggestionModal';
import DonationModal from './components/DonationModal';
import HelpModal from './components/HelpModal';
import ComparatorTool from './components/ComparatorTool';
import CompressorTool from './components/CompressorTool';
import ColumnExtractorTool from './components/ColumnExtractorTool';
import AuditAverage from './components/AuditAverage'; 

import logoData from './assets/logo.png'; 

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // 1. Initialisation sécurisée du thème
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Vérifie si l'utilisateur a déjà une préférence enregistrée ou système
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // 2. Application globale du thème sur la racine HTML
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const renderView = () => {
    switch(currentView) {
        case 'comparator': return <ComparatorTool onBack={() => setCurrentView('dashboard')} />;
        case 'compressor': return <CompressorTool onBack={() => setCurrentView('dashboard')} />;
        case 'extractor': return <ColumnExtractorTool onBack={() => setCurrentView('dashboard')} />;
        case 'audit': return <AuditAverage onBack={() => setCurrentView('dashboard')} />;
        default: return (
            <div className="animate-in fade-in duration-700">
                {/* Header Dashboard */}
                <header className="mb-8 md:mb-12 pt-4 md:pt-6 max-w-5xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8 text-center md:text-left">
                        
                        {/* LOGO - Capsule supprimée, image conservée */}
                        <div className="shrink-0">
                            <img 
                                src={logoData} 
                                alt="Logo Lapanoplieducf" 
                                className="h-16 md:h-20 w-auto object-contain" 
                            />
                        </div>

                        {/* TEXTES */}
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors duration-300">
                                Suite <span className="text-indigo-600 dark:text-indigo-400">Administrative</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0 transition-colors duration-300">
                                L'essentiel pour votre gestion scolaire, réuni au même endroit.
                            </p>
                        </div>

                        {/* BOUTONS D'ACTION PC */}
                        <div className="hidden md:flex gap-3 items-center">
                             {/* Theme Toggle */}
                             <button 
                                onClick={toggleTheme}
                                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                                title={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
                            >
                                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                            </button>

                             <button 
                                onClick={() => setIsHelpOpen(true)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all text-xs flex items-center gap-2 shadow-sm"
                            >
                                <HelpCircle className="w-4 h-4" />
                                Aide
                            </button>
                             <button 
                                onClick={() => setIsSuggestionOpen(true)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all text-xs shadow-sm"
                            >
                                Suggestions
                            </button>
                            <button 
                                onClick={() => setIsDonationOpen(true)}
                                className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition-transform hover:-translate-y-0.5 text-xs flex items-center gap-2"
                            >
                                <Heart className="w-3 h-3 text-red-400 fill-red-400 dark:text-white dark:fill-white" />
                                Don
                            </button>
                        </div>
                    </div>
                </header>

                {/* Grid des Capsules */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto px-4 pb-12">
                    
                    {/* 1. Comparateur */}
                    <div 
                        onClick={() => setCurrentView('comparator')}
                        className="group bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-lg hover:shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutGrid className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Comparateur</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs mb-4 leading-tight">Manquants & Présents</p>
                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest group-hover:underline">
                            Lancer <ArrowRightLeft className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 2. Compresseur */}
                    <div 
                        onClick={() => setCurrentView('compressor')}
                        className="group bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-lg hover:shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Minimize2 className="w-20 h-20 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <Minimize2 className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">Compresseur</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs mb-4 leading-tight">Réduire PDF & Images</p>
                        <div className="flex items-center text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest group-hover:underline">
                            Lancer <Scissors className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 3. Extracteur */}
                    <div 
                        onClick={() => setCurrentView('extractor')}
                        className="group bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-lg hover:shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutList className="w-20 h-20 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <FileSpreadsheet className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">Extracteur</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs mb-4 leading-tight">Colonnes & Tri</p>
                        <div className="flex items-center text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest group-hover:underline">
                            Lancer <LayoutList className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 4. Audit-Moyenne */}
                    <div 
                        onClick={() => setCurrentView('audit')}
                        className="group bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-lg hover:shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Audit-Moyenne</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs mb-4 leading-tight">Anomalies & Orientation</p>
                        <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest group-hover:underline">
                            Lancer <CheckCircle2 className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 5. Bientôt */}
                    <div className="group bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all relative overflow-hidden flex flex-col items-center justify-center text-center opacity-75 hover:opacity-100">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Rocket className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-sm md:text-lg font-bold text-slate-400 dark:text-slate-500 mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">Outil à venir...</h3>
                        <p className="text-slate-400 dark:text-slate-600 text-[10px] md:text-xs mb-4 leading-tight">
                            D'autres fonctionnalités sont en préparation.
                        </p>
                         <div className="inline-flex items-center text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                            Bientôt disponible
                        </div>
                    </div>

                </div>

                {/* Section Soutien Mobile */}
                <div className="mt-12 md:hidden bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-3xl mx-auto overflow-hidden mx-4">
                    <div className="p-6 flex flex-col items-center justify-between gap-4 text-center">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Soutenez Lapanoplie</h3>
                        <div className="flex gap-2 w-full justify-center">
                            <button onClick={toggleTheme} className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1">{isDarkMode ? <Sun className="w-3 h-3"/> : <Moon className="w-3 h-3"/>}</button>
                            <button onClick={() => setIsDonationOpen(true)} className="flex-1 py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg text-xs flex items-center justify-center gap-2"><Heart className="w-3 h-3 text-red-400 fill-red-400 dark:text-white dark:fill-white" /> Don</button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center pb-8">
                    <p className="text-slate-400 dark:text-slate-600 text-xs md:text-sm mb-2">
                        © 2026 Lapanoplieducf — Innover pour mieux gérer.
                    </p>
                </div>
            </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-500`}>
      {/* Container principal */}
      <div className={currentView !== 'dashboard' ? 'w-full h-screen' : 'max-w-7xl mx-auto p-4 md:p-8'}>
        {renderView()}
      </div>
      
      {/* MODALES */}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
      {isSuggestionOpen && <SuggestionModal onClose={() => setIsSuggestionOpen(false)} />}
      {isDonationOpen && <DonationModal onClose={() => setIsDonationOpen(false)} />}
    </div>
  );
};

export default App;