import React, { useState } from 'react';
import { LayoutGrid, Minimize2, ArrowRightLeft, Rocket, Heart, Lightbulb, Scissors } from 'lucide-react';
import SuggestionModal from './components/SuggestionModal';
import ComparatorTool from './components/ComparatorTool';
import CompressorTool from './components/CompressorTool';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const renderView = () => {
    switch(currentView) {
        case 'comparator': return <ComparatorTool onBack={() => setCurrentView('dashboard')} />;
        case 'compressor': return <CompressorTool onBack={() => setCurrentView('dashboard')} />;
        default: return (
            <div className="animate-in">
                {/* Header Dashboard */}
                <header className="mb-12 text-center">
                    <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
                        <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">Suite Lapanoplieducf</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                        Boîte à Outils <span className="text-indigo-600">Administrative</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                        Sélectionnez une capsule ci-dessous pour lancer l'outil correspondant.
                    </p>
                </header>

                {/* Grid des Capsules */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div 
                        onClick={() => setCurrentView('comparator')}
                        className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-100 cursor-pointer transition-all transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutGrid className="w-32 h-32 text-indigo-600" />
                        </div>
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <LayoutGrid className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-indigo-700 transition-colors">Comparateur de Listes</h3>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            Réconciliez deux fichiers Excel. Identifiez les présences et les manquants par classe. Générez des rapports PDF/CSV.
                        </p>
                        <div className="flex items-center text-indigo-600 font-bold group-hover:underline">
                            Lancer l'outil <ArrowRightLeft className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    <div 
                        onClick={() => setCurrentView('compressor')}
                        className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-100 cursor-pointer transition-all transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Minimize2 className="w-32 h-32 text-teal-600" />
                        </div>
                        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <Minimize2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors">Compresseur de Fichiers</h3>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            Réduisez drastiquement le poids de vos fichiers PDF et Images (JPG/PNG) en définissant une taille cible.
                        </p>
                        <div className="flex items-center text-teal-600 font-bold group-hover:underline">
                            Lancer l'outil <Scissors className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    <div className="group bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-200 transition-all relative overflow-hidden flex flex-col items-center justify-center text-center opacity-75 hover:opacity-100">
                         <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Rocket className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400 mb-3 group-hover:text-indigo-500 transition-colors">Outil à venir...</h3>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            D'autres fonctionnalités sont en préparation pour enrichir la suite. Une idée à suggérer ?
                        </p>
                         <div className="inline-flex items-center text-slate-400 font-bold text-sm bg-slate-100 px-3 py-1 rounded-full">
                            Bientôt disponible
                        </div>
                    </div>
                </div>

                {/* Donation Section - VERSION AFFINÉE ET SIMPLIFIÉE */}
                <div className="mt-10 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 text-left">
                             <div className="hidden md:flex p-3 bg-red-50 text-red-500 rounded-2xl shrink-0">
                                <Heart className="w-6 h-6 fill-red-500 animate-pulse" />
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    Soutenez Lapanoplieducf
                                </h3>
                                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed">
                                    Aidez-nous à maintenir ces outils gratuits et sans publicité. Chaque contribution, même petite, fait la différence.
                                </p>
                             </div>
                        </div>

                        <div className="flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsSuggestionOpen(true)}
                                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full font-bold transition-all text-sm"
                            >
                                Suggestions
                            </button>
                            <button className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5 text-sm flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                                Faire un don
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center text-slate-400 text-sm">
                    <p>© 2026 Lapanoplieducf — <span className="text-slate-500 font-medium italic">Innover pour mieux gérer.</span></p>
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
      {isSuggestionOpen && <SuggestionModal onClose={() => setIsSuggestionOpen(false)} />}
    </div>
  );
};

export default App;