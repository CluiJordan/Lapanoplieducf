import React from 'react';
import { X, HelpCircle, LayoutGrid, Minimize2, LayoutList } from 'lucide-react';

const HelpModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden border border-white animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Guide Rapide</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-8 grid gap-8">
            
            {/* Outil 1 */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-1">
                    <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 text-lg mb-1">Comparateur</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Sert à vérifier les listes de classe. Importez deux fichiers Excel (ex: la liste officielle et la liste des notes) pour détecter immédiatement les élèves manquants ou en trop.
                    </p>
                </div>
            </div>

            {/* Outil 2 */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shrink-0 mt-1">
                    <Minimize2 className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 text-lg mb-1">Compresseur</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Réduit le poids de vos fichiers (Images ou PDF) trop lourds pour être envoyés par mail ou sur les plateformes éducatives, sans perdre en qualité visible.
                    </p>
                </div>
            </div>

            {/* Outil 3 */}
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shrink-0 mt-1">
                    <LayoutList className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 text-lg mb-1">Extracteur</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Permet de nettoyer un fichier Excel complexe. Vous sélectionnez uniquement les colonnes dont vous avez besoin (ex: Nom, Matricule, Moyenne) pour créer un nouveau fichier propre prêt à l'emploi.
                    </p>
                </div>
            </div>

        </div>

        <div className="bg-slate-50 px-8 py-6 text-center">
            <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                C'est compris
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;