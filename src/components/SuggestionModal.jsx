import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle, Mail, AlertCircle, MessageSquare } from 'lucide-react';

const SuggestionModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errors, setErrors] = useState({}); // Pour gérer les messages d'erreur par champ

  const validateForm = () => {
    const newErrors = {};
    
    // Validation Email
    if (!email.trim()) {
      newErrors.email = "L'adresse email est obligatoire.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Le format de l'email n'est pas valide.";
    }

    // Validation Message
    if (!message.trim()) {
      newErrors.message = "Merci d'écrire un petit message.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // On arrête tout si la validation échoue
    if (!validateForm()) return;

    setStatus('submitting');

    try {
      const response = await fetch("https://formspree.io/f/mzdvjaqy", {
        method: "POST",
        body: JSON.stringify({
          email: email,
          message: message,
          _subject: "Suggestion Lapanoplieducf"
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setMessage('');
        setErrors({});
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  // État de succès (Modal de confirmation)
  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 border border-white/20">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Bien reçu !</h3>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed text-sm">Merci pour ton aide précieuse. Ton message a été transmis à l'équipe.</p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative animate-in slide-in-from-bottom-8 overflow-hidden border border-slate-100">
        
        {/* Header Épuré */}
        <div className="px-8 py-6 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="mt-1 p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                <MessageSquare className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Une idée ?</h3>
                <p className="text-sm text-slate-400 font-bold">Aidez-nous à améliorer la suite.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            
            {/* Champ Email (Obligatoire) */}
            <div className="space-y-2">
                <label className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Votre Email
                    {errors.email && <span className="text-red-500 flex items-center gap-1 normal-case"><AlertCircle className="w-3 h-3"/> {errors.email}</span>}
                </label>
                <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if(errors.email) setErrors({...errors, email: null}); // Efface l'erreur quand on tape
                        }}
                        placeholder="nom@exemple.com"
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl outline-none font-medium text-slate-700 placeholder:text-slate-400 transition-all ${errors.email ? 'border-red-300 focus:ring-4 focus:ring-red-500/10' : 'border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                    />
                </div>
            </div>

            {/* Champ Message (Obligatoire) */}
            <div className="space-y-2">
                <label className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Votre Suggestion
                    {errors.message && <span className="text-red-500 flex items-center gap-1 normal-case"><AlertCircle className="w-3 h-3"/> {errors.message}</span>}
                </label>
                <textarea 
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if(errors.message) setErrors({...errors, message: null});
                    }}
                    placeholder="Ex: J'aimerais pouvoir exporter en PDF..."
                    className={`w-full h-32 p-4 bg-slate-50 border rounded-2xl outline-none resize-none font-medium text-slate-700 placeholder:text-slate-400 transition-all ${errors.message ? 'border-red-300 focus:ring-4 focus:ring-red-500/10' : 'border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                />
            </div>

            {/* Footer Actions */}
            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={status === 'submitting'}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    {status === 'submitting' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Envoi en cours...
                        </>
                    ) : (
                        <>
                            Envoyer maintenant
                            <Send className="w-5 h-5" />
                        </>
                    )}
                </button>
                {status === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl text-center">
                        <p className="text-red-600 text-xs font-bold flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Une erreur est survenue. Réessayez.
                        </p>
                    </div>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestionModal;