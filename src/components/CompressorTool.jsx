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
            pdfjsLibRef.current.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            setPdfLibReady(true);
            clearInterval(checkLib);
        }
    }, 500);
    return () => clearInterval(checkLib);
  }, []);

  const formatBytes = (bytes) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const processFile = async () => {
    if (!file) return; 
    setIsProcessing(true); setProgress(0); setError(""); setStatusMessage("Initialisation...");
    const targetBytes = targetSizeKB * 1024;
    
    const generateBlob = async (imgSource, scale, quality) => {
        const canvas = document.createElement('canvas');
        canvas.width = imgSource.width * scale; canvas.height = imgSource.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        return await (await fetch(dataUrl)).blob();
    };

    const smartCompressImage = async (imgSource, budgetBytes) => {
        let minQ = 0.05, maxQ = 1.0, bestBlob = null;
        for (let i = 0; i < 6; i++) { 
            const midQ = (minQ + maxQ) / 2;
            const blob = await generateBlob(imgSource, 1.0, midQ);
            if (blob.size <= budgetBytes) { bestBlob = blob; minQ = midQ; } else { maxQ = midQ; }
        }
        if (!bestBlob) {
            let scale = 0.9;
            while (scale > 0.1) {
                const blob = await generateBlob(imgSource, scale, 0.5);
                if (blob.size <= budgetBytes) { bestBlob = blob; break; }
                scale *= 0.8;
            }
        }
        return bestBlob || await generateBlob(imgSource, 0.2, 0.1);
    };

    setTimeout(async () => {
        try {
            let resultBlob = null;
            if (file.type.startsWith('image/')) {
                setStatusMessage("Optimisation Caesium-Like...");
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise(r => img.onload = r);
                resultBlob = await smartCompressImage(img, targetBytes);
                setProgress(100);
            } 
            else if (file.name.toLowerCase().endsWith('.pdf')) {
                const ab = await file.arrayBuffer();
                const pdf = await pdfjsLibRef.current.getDocument(ab).promise;
                const newPdf = new jsPDF({compress: true});
                newPdf.deletePage(1); 
                const safePageBudget = Math.max(Math.floor(targetBytes / pdf.numPages) - 2000, 20000);

                for(let i=1; i<=pdf.numPages; i++){
                    setStatusMessage(`Page ${i}/${pdf.numPages}...`);
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({scale: 2.0});
                    const canvas = document.createElement('canvas'); 
                    canvas.width = viewport.width; canvas.height = viewport.height;
                    await page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).promise;
                    const img = new Image(); img.src = canvas.toDataURL('image/jpeg', 1.0); await new Promise(r => img.onload = r);
                    const pageBlob = await smartCompressImage(img, safePageBudget);
                    newPdf.addPage([viewport.width * 0.132, viewport.height * 0.132]); 
                    newPdf.addImage(new Uint8Array(await pageBlob.arrayBuffer()), 'JPEG', 0, 0, viewport.width * 0.132, viewport.height * 0.132, undefined, 'FAST');
                    setProgress(Math.round((i/pdf.numPages)*100));
                }
                setStatusMessage("Assemblage final...");
                resultBlob = newPdf.output('blob');
            }
            setCompressedSize(resultBlob.size);
            setDownloadUrl(URL.createObjectURL(resultBlob));
        } catch(e) { setError("Erreur de traitement."); }
        finally { setIsProcessing(false); setProgress(100); }
    }, 100);
  };

  if (!pdfLibReady) return <div className="p-8 text-center animate-pulse font-bold text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>Chargement...</div>;

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-slate-100 border border-slate-200 transition-colors active:scale-90"><ChevronLeft className="w-6 h-6 text-slate-600" /></button>
            <h2 className="text-2xl font-bold text-slate-800">Compresseur de Fichiers</h2>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            {!file ? (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-indigo-100 border-dashed rounded-3xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/50 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:rotate-6 transition-transform"><Upload className="w-8 h-8 text-indigo-400" /></div>
                    <p className="font-extrabold text-slate-700 uppercase tracking-tighter">Déposez un fichier PDF ou Image</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">JPG, PNG, PDF</p>
                    <input type="file" className="hidden" accept=".pdf, .jpg, .jpeg, .png" onChange={(e) => setFile(e.target.files[0])} />
                </label>
            ) : (
                <div className="animate-in fade-in">
                    <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl mb-6 border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">{file.name.endsWith('.pdf') ? <FileText className="text-red-500"/> : <ImageIcon className="text-indigo-600"/>}</div>
                            <div>
                                <p className="font-extrabold text-indigo-900 truncate max-w-[200px] text-sm">{file.name}</p>
                                <p className="text-[10px] text-indigo-700 font-mono font-bold tracking-tight">ACTUEL : {formatBytes(file.size)}</p>
                            </div>
                        </div>
                        <button onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors active:scale-90"><Trash2 className="w-5 h-5" /></button>
                    </div>

                    {!downloadUrl && !isProcessing && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Poids Cible Max (Ko)</label>
                                <div className="flex items-center gap-6">
                                    <input type="number" value={targetSizeKB} onChange={(e) => setTargetSizeKB(e.target.value)} className="w-32 px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono font-bold text-center text-xl text-slate-700 shadow-inner" />
                                    <p className="text-xs text-slate-400 leading-tight font-medium uppercase tracking-tighter">L'algorithme visera <span className="text-indigo-600 font-bold">{targetSizeKB} Ko</span> pour ce document.</p>
                                </div>
                            </div>

                            {file.name.endsWith('.pdf') && (
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-tight leading-none">Note : Le document sera aplati en images HD pour une compression optimale.</p>
                                </div>
                            )}
                            
                            <button onClick={processFile} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 tracking-widest text-xs">
                                <Scissors className="w-5 h-5"/> COMPRESSER LE FICHIER
                            </button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-indigo-600 h-full transition-all duration-300" style={{width: `${progress}%`}}></div></div>
                            <p className="text-indigo-900 font-extrabold animate-pulse uppercase text-sm tracking-widest">{statusMessage}</p>
                        </div>
                    )}

                    {downloadUrl && (
                        <div className="text-center bg-green-50/50 p-8 rounded-3xl border border-green-100 animate-in zoom-in-95">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="font-extrabold text-green-900 text-xl mb-1 uppercase tracking-tighter">Compression réussie !</h3>
                            
                            <div className="flex justify-center items-center gap-6 my-6 bg-white py-3 px-6 rounded-2xl shadow-sm inline-flex">
                                <div className="text-slate-400 text-xs line-through font-mono font-bold">{formatBytes(file.size)}</div>
                                <ArrowRightLeft className="w-4 h-4 text-green-500" />
                                <div className="font-mono font-extrabold text-green-700 text-xl">{formatBytes(compressedSize)}</div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <a href={downloadUrl} download={`Lapanoplie_${file.name}`} className="flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-extrabold shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest">
                                    <Download className="w-5 h-5"/> TÉLÉCHARGER
                                </a>
                                <button onClick={() => { setFile(null); setDownloadUrl(null); }} className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest hover:text-slate-600">Recommencer</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default CompressorTool;