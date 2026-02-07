import React from 'react';
import { X, HelpCircle, LayoutGrid, Minimize2, LayoutList, CheckCircle2 } from 'lucide-react';

const HelpModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Ajout des classes dark:bg-slate-900 et dark:border-slate-800 */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden border border-white dark:border-slate-800 animate-in zoom-in-95 max-h-[90vh] flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Guide Rapide</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-8 grid gap-8 overflow-y-auto custom-scrollbar">
            
            {/* Outil 1 : Comparateur */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 mt-1">
                    <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Comparateur</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Sert à vérifier les listes de classe. Importez deux fichiers Excel pour détecter immédiatement les élèves manquants ou en trop.
                    </p>
                </div>
            </div>

            {/* Outil 2 : Compresseur */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-2xl shrink-0 mt-1">
                    <Minimize2 className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Compresseur</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Réduit le poids de vos fichiers (Images ou PDF) sans perdre en qualité visible.
                    </p>
                </div>
            </div>

            {/* Outil 3 : Extracteur */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl shrink-0 mt-1">
                    <LayoutList className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Extracteur</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Nettoyez un fichier Excel complexe en ne conservant que les colonnes essentielles.
                    </p>
                </div>
            </div>

            {/* Outil 4 : Audit-Moyenne */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 mt-1">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Audit-Moyenne</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Détecte les incohérences de notes et vérifie l'application des codes spéciaux (21, 22).
                    </p>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 text-center shrink-0 border-t border-slate-100 dark:border-slate-800">
            <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95">
                C'est compris
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;