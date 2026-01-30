import React, { useState } from 'react';
import { CheckCircle, Lightbulb, XCircle, Loader2, Send } from 'lucide-react';

const SuggestionModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState('form');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('loading');
    setTimeout(() => { setStep('success'); }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/50">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Message reçu !</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Merci pour votre contribution. C'est grâce à vos idées que cet outil évolue.</p>
            <button onClick={onClose} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm border border-slate-100"><Lightbulb className="w-6 h-6" /></div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Boîte à idées</h3>
                        <p className="text-slate-500 text-sm mt-1">Une suggestion ? Un bug ? Dites-nous tout.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Votre message <span className="text-red-400">*</span></label>
                    <textarea required value={message} onChange={(e) => setMessage(e.target.value)} className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none resize-none" placeholder="Ex: J'aimerais pouvoir exporter les listes en PDF..."></textarea>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email (facultatif)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" placeholder="Pour vous tenir informé(e)" />
                </div>
            </form>
            <div className="p-6 pt-2 bg-white">
                 <button onClick={handleSubmit} disabled={!message.trim() || step === 'loading'} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all">
                    {step === 'loading' ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi...</> : <><Send className="w-5 h-5" /> Envoyer ma suggestion</>}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SuggestionModal;