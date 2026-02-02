import React, { useState } from 'react';
import { LayoutGrid, Minimize2, ArrowRightLeft, Heart, Scissors, LayoutList, FileSpreadsheet, Rocket } from 'lucide-react';
import SuggestionModal from './components/SuggestionModal';
import DonationModal from './components/DonationModal';
import ComparatorTool from './components/ComparatorTool';
import CompressorTool from './components/CompressorTool';
import ColumnExtractorTool from './components/ColumnExtractorTool';
import logoData from './assets/logo.png'; 

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  const renderView = () => {
    switch(currentView) {
        case 'comparator': return <ComparatorTool onBack={() => setCurrentView('dashboard')} />;
        case 'compressor': return <CompressorTool onBack={() => setCurrentView('dashboard')} />;
        case 'extractor': return <ColumnExtractorTool onBack={() => setCurrentView('dashboard')} />;
        default: return (
            <div className="animate-in fade-in duration-700">
                {/* Header Dashboard */}
                <header className="mb-8 md:mb-10 text-center pt-2 md:pt-4">
                    
                    {/* ZONE LOGO XXL */}
                    <div className="flex justify-center mb-4 md:mb-6">
                        <img 
                            src={logoData} 
                            alt="Logo Lapanoplieducf" 
                            // Légèrement réduit sur mobile (h-32) pour laisser de la place à la grille
                            className="h-32 md:h-64 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-500" 
                        />
                    </div>

                    {/* Titre Simplifié */}
                    <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-2 md:mb-3 tracking-tight">
                        Suite <span className="text-indigo-600">Administrative</span>
                    </h1>
                    <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base font-medium px-4">
                        Vos outils essentiels réunis au même endroit.
                    </p>
                </header>

                {/* Grid des Capsules (2 colonnes partout) */}
                {/* grid-cols-2 sur mobile, gap-3 (petit écart) mobile, gap-6 PC */}
                <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-5xl mx-auto px-4">
                    
                    {/* 1. Capsule Comparateur */}
                    <div 
                        onClick={() => setCurrentView('comparator')}
                        // p-5 mobile, p-8 PC
                        className="group bg-white p-5 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-100 cursor-pointer transition-all transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            {/* Icone de fond plus petite sur mobile */}
                            <LayoutGrid className="w-16 h-16 md:w-32 md:h-32 text-indigo-600" />
                        </div>
                        {/* Icone principale plus petite sur mobile */}
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 md:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <LayoutGrid className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        {/* Titre et Texte ajustés */}
                        <h3 className="text-sm md:text-xl font-bold text-slate-800 mb-1 md:mb-3 group-hover:text-indigo-700 transition-colors">Comparateur</h3>
                        <p className="text-slate-500 text-[10px] md:text-sm mb-3 md:mb-6 leading-tight md:leading-relaxed">
                            Identifiez les présences et manquants entre deux listes.
                        </p>
                        <div className="flex items-center text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:underline">
                            Lancer <ArrowRightLeft className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 2. Capsule Compresseur */}
                    <div 
                        onClick={() => setCurrentView('compressor')}
                        className="group bg-white p-5 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-100 cursor-pointer transition-all transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Minimize2 className="w-16 h-16 md:w-32 md:h-32 text-teal-600" />
                        </div>
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-3 md:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <Minimize2 className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-slate-800 mb-1 md:mb-3 group-hover:text-teal-700 transition-colors">Compresseur</h3>
                        <p className="text-slate-500 text-[10px] md:text-sm mb-3 md:mb-6 leading-tight md:leading-relaxed">
                            Réduisez le poids de vos fichiers PDF et Images.
                        </p>
                        <div className="flex items-center text-teal-600 text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:underline">
                            Lancer <Scissors className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 3. Capsule Extracteur */}
                    <div 
                        onClick={() => setCurrentView('extractor')}
                        className="group bg-white p-5 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-100 cursor-pointer transition-all transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutList className="w-16 h-16 md:w-32 md:h-32 text-orange-600" />
                        </div>
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-3 md:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <FileSpreadsheet className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-slate-800 mb-1 md:mb-3 group-hover:text-orange-700 transition-colors">Extracteur</h3>
                        <p className="text-slate-500 text-[10px] md:text-sm mb-3 md:mb-6 leading-tight md:leading-relaxed">
                            Sélectionnez et réorganisez les colonnes Excel.
                        </p>
                        <div className="flex items-center text-orange-600 text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:underline">
                            Lancer <LayoutList className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* 4. Capsule Bientôt Disponible */}
                    <div className="group bg-slate-50 p-5 md:p-8 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-200 transition-all relative overflow-hidden flex flex-col items-center justify-center text-center opacity-75 hover:opacity-100">
                         <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Rocket className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-slate-400 mb-1 md:mb-3 group-hover:text-indigo-500 transition-colors">Outil à venir...</h3>
                        <p className="text-slate-400 text-[10px] md:text-sm mb-3 md:mb-6 leading-tight md:leading-relaxed">
                            D'autres fonctionnalités sont en préparation.
                        </p>
                         <div className="inline-flex items-center text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-widest bg-slate-100 px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                            Bientôt disponible
                        </div>
                    </div>

                </div>

                {/* Section Soutien */}
                <div className="mt-12 md:mt-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 text-left">
                             <div className="hidden md:flex p-3 bg-red-50 text-red-500 rounded-2xl shrink-0">
                                <Heart className="w-6 h-6 fill-red-500 animate-pulse" />
                             </div>
                             <div>
                                 <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                                    Soutenez Lapanoplie
                                </h3>
                                <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-md leading-relaxed">
                                    Aidez-nous à maintenir ces outils gratuits.
                                </p>
                             </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={() => setIsSuggestionOpen(true)}
                                className="px-4 py-2 md:px-5 md:py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full font-bold transition-all text-xs md:text-sm"
                            >
                                Suggestions
                            </button>
                            <button 
                                onClick={() => setIsDonationOpen(true)}
                                className="px-4 py-2 md:px-6 md:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5 text-xs md:text-sm flex items-center gap-2"
                            >
                                <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-400 fill-red-400" />
                                Don
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center pb-8">
                    <p className="text-slate-400 text-xs md:text-sm mb-2">
                        © 2026 Lapanoplieducf — <span className="text-slate-500 font-medium italic">Innover pour mieux gérer.</span>
                    </p>
                    <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        <span>Confidentialité</span>
                        <span>•</span>
                        <span>Sécurité Locale</span>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">
        {renderView()}
      </div>
      
      {/* MODALES */}
      {isSuggestionOpen && <SuggestionModal onClose={() => setIsSuggestionOpen(false)} />}
      {isDonationOpen && <DonationModal onClose={() => setIsDonationOpen(false)} />}
    </div>
  );
};

export default App;