import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, CheckCircle, Trash2, Scissors, 
  Loader2, AlertTriangle, ChevronLeft, Image as ImageIcon, 
  ArrowRightLeft, FileText 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const CompressorTool = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [targetSizeKB, setTargetSizeKB] = useState(200);
  const [error, setError] = useState("");
  const [pdfLibReady, setPdfLibReady] = useState(false);
  
  const pdfjsLibRef = useRef(null);

  useEffect(() => {
    const checkLib = setInterval(() => {
        if (window.pdfjsLib) {
            pdfjsLibRef.current = window.pdfjsLib;
            setPdfLibReady(true);
            clearInterval(checkLib);
        }
    }, 500);
    return () => clearInterval(checkLib);
  }, []);

  const formatBytes = (bytes) => { if (!+bytes) return '0 Ko'; const k = 1024; return `${(bytes / k).toFixed(1)} Ko`; };

  const processFile = async () => {
    if (!file) return; 
    setIsProcessing(true); setProgress(0); setStatusMessage("Analyse...");
    const targetBytes = targetSizeKB * 1024;
    const generateBlob = async (imgSource, scale, quality) => {
        const canvas = document.createElement('canvas'); canvas.width = imgSource.width * scale; canvas.height = imgSource.height * scale;
        const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality); const res = await fetch(dataUrl); return await res.blob();
    };
    const smartCompress = async (imgSource, budget) => {
        let minQ = 0.1, maxQ = 0.95, best = null;
        for (let i = 0; i < 5; i++) { const mid = (minQ + maxQ) / 2; const b = await generateBlob(imgSource, 1.0, mid); if (b.size <= budget) { best = b; minQ = mid; } else { maxQ = mid; } }
        if (!best) { let s = 0.8; while (s > 0.2) { const b = await generateBlob(imgSource, s, 0.4); if (b.size <= budget) { best = b; break; } s *= 0.7; } }
        return best || await generateBlob(imgSource, 0.1, 0.1);
    };
    setTimeout(async () => {
        try {
            let finalBlob = null;
            if (file.type.startsWith('image/')) {
                const img = new Image(); img.src = URL.createObjectURL(file); await new Promise(r => img.onload = r); finalBlob = await smartCompress(img, targetBytes);
            } else if (file.name.toLowerCase().endsWith('.pdf')) {
                const pdf = await pdfjsLibRef.current.getDocument(await file.arrayBuffer()).promise;
                const newPdf = new jsPDF(); newPdf.deletePage(1); const budgetPerPage = Math.floor(targetBytes / pdf.numPages) - 1024;
                for(let i=1; i<=pdf.numPages; i++){ setStatusMessage(`Page ${i}/${pdf.numPages}`); const page = await pdf.getPage(i); const vp = page.getViewport({scale: 2.0}); const canvas = document.createElement('canvas'); canvas.width = vp.width; canvas.height = vp.height; await page.render({canvasContext: canvas.getContext('2d'), viewport: vp}).promise; const img = new Image(); img.src = canvas.toDataURL('image/jpeg'); await new Promise(r => img.onload = r); const pBlob = await smartCompress(img, budgetPerPage); const w = vp.width * 0.13; const h = vp.height * 0.13; newPdf.addPage([w, h]); newPdf.addImage(new Uint8Array(await pBlob.arrayBuffer()), 'JPEG', 0, 0, w, h); setProgress(Math.round((i/pdf.numPages)*100)); }
                finalBlob = newPdf.output('blob');
            }
            setCompressedSize(finalBlob.size); setDownloadUrl(URL.createObjectURL(finalBlob));
        } catch(e) { setError("Erreur de traitement."); } finally { setIsProcessing(false); setProgress(100); }
    }, 100);
  };

  if (!pdfLibReady) return <div className="p-8 text-center animate-pulse font-bold text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>Chargement...</div>;

  return (
    <div className="animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-3 bg-white rounded-full border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
                <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex items-center gap-3">
                {/* TAILLE RÉDUITE ICI : h-10 w-10 */}
                <img src="/favicon.png" className="h-10 w-10 object-contain" alt="icon" />
                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Compresseur</h2>
            </div>
        </div>

        <div className="max-w-xl mx-auto bg-white rounded-[40px] shadow-2xl border border-slate-50 p-10">
            {!file ? (
                <label className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-indigo-50 rounded-[30px] cursor-pointer hover:bg-indigo-50/30 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:rotate-6 transition-transform"><Upload className="w-8 h-8 text-indigo-200" /></div>
                    <p className="font-extrabold text-slate-700 uppercase tracking-tighter">Déposez un fichier</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">JPG, PNG, PDF</p>
                    <input type="file" className="hidden" accept=".pdf, .jpg, .jpeg, .png" onChange={(e) => setFile(e.target.files[0])} />
                </label>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                {file.name.endsWith('.pdf') ? <FileText className="text-red-500 w-5 h-5"/> : <ImageIcon className="text-indigo-600 w-5 h-5"/>}
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-xs truncate max-w-[150px]">{file.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 font-mono">{formatBytes(file.size)}</p>
                            </div>
                        </div>
                        <button onClick={() => { setFile(null); setDownloadUrl(null); }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                    </div>

                    {!downloadUrl && !isProcessing && (
                        <div className="space-y-6">
                            <div className="px-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Objectif de poids (Ko)</label>
                                <input type="range" min="50" max="1000" step="10" value={targetSizeKB} onChange={(e) => setTargetSizeKB(e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                <div className="text-center mt-4 font-mono font-black text-indigo-600 text-2xl">{targetSizeKB} Ko</div>
                            </div>
                            <button onClick={processFile} className="w-full py-5 bg-indigo-600 text-white rounded-[25px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Compresser maintenant</button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden"><div className="bg-indigo-600 h-full transition-all" style={{width: `${progress}%`}}></div></div>
                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest animate-pulse">{statusMessage}</p>
                        </div>
                    )}

                    {downloadUrl && (
                        <div className="bg-indigo-900 rounded-[35px] p-8 text-center text-white shadow-2xl animate-in zoom-in-95">
                            <CheckCircle className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                            <h3 className="font-black text-lg uppercase tracking-tight mb-6">Prêt au téléchargement</h3>
                            <div className="flex justify-center items-center gap-6 mb-8">
                                <span className="text-indigo-400 font-mono text-xs line-through">{formatBytes(file.size)}</span>
                                <ArrowRightLeft className="w-4 h-4 text-white opacity-30" />
                                <span className="text-white font-mono font-black text-xl">{formatBytes(compressedSize)}</span>
                            </div>
                            <a href={downloadUrl} download={`Lapanoplie_${file.name}`} className="block w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Télécharger</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default CompressorTool;