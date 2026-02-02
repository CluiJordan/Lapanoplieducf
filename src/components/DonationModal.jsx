import React, { useState } from 'react';
import { X, Heart, Copy, Check } from 'lucide-react';

const DonationModal = ({ onClose }) => {
  const [copied, setCopied] = useState(null);

  const paymentMethods = [
    { provider: "Wave / Orange", number: "07 59 59 81 49", color: "bg-blue-500" },
    { provider: "Wave / MTN", number: "05 45 41 44 28", color: "bg-yellow-400" },
    { provider: "Wave / Moov Money", number: "01 50 05 24 94", color: "bg-blue-800" }
  ];

  const copyToClipboard = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(num);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden border border-white animate-in zoom-in-95">
        
        {/* Décoration de fond subtile */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Heart className="w-32 h-32 fill-current text-red-500" />
        </div>

        {/* Header de la modale */}
        <div className="p-8 text-center relative z-10">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Heart className="w-10 h-10 fill-red-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Soutenir le projet</h3>
            <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed">
                Ces outils sont gratuits. Votre soutien via un petit geste aide à payer le serveur et le café du développeur !
            </p>
        </div>

        {/* Liste des numéros */}
        <div className="px-8 pb-10 space-y-3 relative z-10">
            {paymentMethods.map((method, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                        {/* Barre de couleur opérateur */}
                        <div className={`w-1.5 h-10 ${method.color} rounded-full shadow-sm`}></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{method.provider}</p>
                            <p className="font-mono font-bold text-slate-700 text-lg tracking-tight">{method.number}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => copyToClipboard(method.number)}
                        className="p-3 bg-white hover:bg-indigo-50 rounded-xl transition-all active:scale-90 shadow-sm border border-slate-100 group-hover:border-indigo-100"
                        title="Copier le numéro"
                    >
                        {copied === method.number ? 
                            <Check className="w-5 h-5 text-green-500" /> : 
                            <Copy className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        }
                    </button>
                </div>
            ))}
            
            {/* Bouton Fermer */}
            <button 
                onClick={onClose}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-slate-800"
            >
                Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;