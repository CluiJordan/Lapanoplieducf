import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Minimize2, LayoutList, Moon, Sun, ChevronRight } from 'lucide-react';
import ComparatorTool from './components/ComparatorTool';
import CompressorTool from './components/CompressorTool';
import ColumnExtractorTool from './components/ColumnExtractorTool';
import logoData from './assets/logo.png';

const TOOLS = [
  {
    id: 'comparator',
    label: 'Comparateur',
    description: 'Comparez deux listes Excel et identifiez les élèves manquants, en surplus ou communs entre les deux fichiers.',
    tag: 'Excel A  ↔  Excel B',
    Icon: ArrowRightLeft,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    hoverShadow: 'hover:shadow-indigo-100 dark:hover:shadow-slate-950',
  },
  {
    id: 'compressor',
    label: 'Compresseur',
    description: 'Réduisez précisément le poids de vos PDF et images avec un algorithme de convergence mathématique.',
    tag: 'PDF · JPG · PNG',
    Icon: Minimize2,
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
    hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
    btn: 'bg-teal-600 hover:bg-teal-700',
    hoverShadow: 'hover:shadow-teal-100 dark:hover:shadow-slate-950',
  },
  {
    id: 'extractor',
    label: 'Extracteur',
    description: 'Sélectionnez et réordonnez les colonnes de vos fichiers Excel, puis exportez en CSV ou XLSX.',
    tag: 'Excel → CSV · XLSX',
    Icon: LayoutList,
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
    btn: 'bg-orange-500 hover:bg-orange-600',
    hoverShadow: 'hover:shadow-orange-100 dark:hover:shadow-slate-950',
  },
];

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

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

  const goBack = () => setCurrentView('dashboard');

  if (currentView !== 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {currentView === 'comparator' && <ComparatorTool onBack={goBack} />}
        {currentView === 'compressor' && <CompressorTool onBack={goBack} />}
        {currentView === 'extractor' && <ColumnExtractorTool onBack={goBack} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoData} alt="Lapanoplieducf" className="h-8 w-auto" />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="font-black text-slate-800 dark:text-white text-sm hidden sm:block tracking-tight">
              Lapanoplieducf
            </span>
          </div>
          <button
            onClick={() => setIsDarkMode(p => !p)}
            aria-label="Changer le thème"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          >
            {isDarkMode
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-slate-600" />
            }
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-5xl mx-auto px-5 pt-14 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Suite Administrative · Côte d'Ivoire
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
          Gérez plus vite,
          <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
            {' '}sans complexité.
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto leading-relaxed">
          Trois outils essentiels. Traitement 100&nbsp;% local — aucun fichier ne quitte votre appareil.
        </p>
      </div>

      {/* TOOLS GRID */}
      <div className="max-w-5xl mx-auto px-5 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map(({ id, label, description, tag, Icon, iconBg, iconColor, hoverBorder, btn, hoverShadow }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${hoverBorder} rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${hoverShadow} focus:outline-none`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 mb-5">
                {tag}
              </p>

              <div className={`w-11 h-11 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>

              <h2 className="font-black text-slate-900 dark:text-white text-lg mb-2 leading-tight">{label}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{description}</p>

              <div className={`inline-flex items-center gap-2 ${btn} text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition-all group-hover:shadow-md`}>
                Ouvrir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6">
        <p className="text-center text-xs text-slate-400 dark:text-slate-600">
          © 2026 Lapanoplieducf — Traitement 100&nbsp;% local, aucune donnée transmise.
        </p>
      </footer>
    </div>
  );
};

export default App;
