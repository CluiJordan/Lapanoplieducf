import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, CheckCircle, Trash2, Scissors, 
  Loader2, ChevronLeft, Image as ImageIcon, FileText, Target 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const CompressorTool = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [targetSizeKB, setTargetSizeKB] = useState(200);
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

  // --- LOGIQUE MATHÉMATIQUE DE COMPRESSION ---
  const generateBlob = async (imgSource, scale, quality) => { 
    const canvas = document.createElement('canvas'); 
    canvas.width = imgSource.width * scale; 
    canvas.height = imgSource.height * scale; 
    const ctx = canvas.getContext('2d'); 
    ctx.imageSmoothingEnabled = true; 
    ctx.imageSmoothingQuality = 'high'; 
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height); 
    const dataUrl = canvas.toDataURL('image/jpeg', quality); 
    const res = await fetch(dataUrl); 
    return await res.blob(); 
  }; 

  const runConvergenceAlgorithm = async (imgSource, budget) => { 
    let low = 0.01;
    let high = 1.0;
    let bestFoundBlob = null;
    
    // Test initial : Qualité 100%
    const initialTest = await generateBlob(imgSource, 1.0, 1.0);
    if (initialTest.size <= budget) return initialTest;

    // Boucle de dichotomie : 10 itérations pour une précision chirurgicale
    for (let i = 0; i < 10; i++) {
        let midQuality = (low + high) / 2;
        const currentBlob = await generateBlob(imgSource, 1.0, midQuality);
        
        if (currentBlob.size <= budget) {
            bestFoundBlob = currentBlob; // Stocke le candidat le plus proche
            low = midQuality;            // Tente d'augmenter la qualité
        } else {
            high = midQuality;           // Trop lourd, baisse la qualité
        }
    }

    // Fallback mathématique : Si même à qualité 0.01 c'est trop gros, on réduit l'échelle
    if (!bestFoundBlob) {
        let sLow = 0.1, sHigh = 0.95;
        for (let j = 0; j < 6; j++) {
            let midScale = (sLow + sHigh) / 2;
            const blobScale = await generateBlob(imgSource, midScale, 0.8);
            if (blobScale.size <= budget) {
                bestFoundBlob = blobScale;
                sLow = midScale;
            } else {
                sHigh = midScale;
            }
        }
    }
    return bestFoundBlob || await generateBlob(imgSource, 0.2, 0.4); 
  }; 

  const processFile = async () => { 
    if (!file) return; 
    setIsProcessing(true); 
    setProgress(0); 
    const targetBytes = targetSizeKB * 1024; 

    setTimeout(async () => { 
        try { 
            let resultBlob = null; 
            if (file.type.startsWith('image/')) { 
                const img = new Image(); 
                img.src = URL.createObjectURL(file); 
                await new Promise(r => img.onload = r); 
                resultBlob = await runConvergenceAlgorithm(img, targetBytes); 
            } else if (file.name.toLowerCase().endsWith('.pdf')) { 
                if(!pdfLibReady) throw new Error("Moteur non prêt"); 
                const pdf = await pdfjsLibRef.current.getDocument(await file.arrayBuffer()).promise; 
                const newPdf = new jsPDF(); 
                newPdf.deletePage(1); 
                const budgetPerPage = Math.max((targetBytes / pdf.numPages) - 1024, 8000); 
                
                for(let i=1; i<=pdf.numPages; i++){ 
                    const page = await pdf.getPage(i); 
                    const vp = page.getViewport({scale: 2.0}); 
                    const canvas = document.createElement('canvas'); 
                    canvas.width = vp.width; 
                    canvas.height = vp.height; 
                    await page.render({canvasContext: canvas.getContext('2d'), viewport: vp}).promise; 
                    const img = new Image(); 
                    img.src = canvas.toDataURL('image/jpeg'); 
                    await new Promise(r => img.onload = r); 
                    const pBlob = await runConvergenceAlgorithm(img, budgetPerPage); 
                    const imgProps = newPdf.getImageProperties(pBlob);
                    const pdfWidth = newPdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    newPdf.addPage();
                    newPdf.addImage(new Uint8Array(await pBlob.arrayBuffer()), 'JPEG', 0, 0, pdfWidth, pdfHeight); 
                    setProgress(Math.round((i/pdf.numPages)*100)); 
                } 
                if (newPdf.getNumberOfPages() > 1) newPdf.deletePage(1);
                resultBlob = newPdf.output('blob'); 
            } 
            setCompressedSize(resultBlob.size); 
            setDownloadUrl(URL.createObjectURL(resultBlob)); 
        } catch(e) { console.error(e); } finally { 
            setIsProcessing(false); 
            setProgress(100); 
        } 
    }, 100); 
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] bg-slate-50 animate-in fade-in duration-300">
        
        {/* BARRE DE TITRE COMPACTE */}
        <div className="max-w-2xl mx-auto w-full mt-6 px-4 z-20">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-16 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                    <div className="flex items-center gap-3 text-slate-600 font-black text-xs uppercase tracking-widest">
                        <Scissors className="w-4 h-4"/>
                        <span>Compresseur de fichiers</span>
                    </div>
                </div>
            </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
                
                <div className="w-full md:w-1/3 bg-slate-50/50 border-r border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                    {!file ? (
                        <label className="cursor-pointer group flex flex-col items-center">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:border-slate-400 transition-all">
                                <Upload className="w-10 h-10 text-slate-300 group-hover:text-slate-500"/>
                            </div>
                            <span className="font-black text-slate-700 text-xs uppercase tracking-widest">Importer</span>
                            <input type="file" className="hidden" accept=".pdf, .jpg, .jpeg, .png" onChange={(e) => setFile(e.target.files[0])} />
                        </label>
                    ) : (
                        <div className="w-full animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 relative shadow-sm">
                                {file.name.endsWith('.pdf') ? <FileText className="w-10 h-10 text-red-500"/> : <ImageIcon className="w-10 h-10 text-slate-600"/>}
                                <button onClick={() => { setFile(null); setDownloadUrl(null); }} className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            <p className="font-bold text-slate-800 text-xs truncate w-full mb-1 px-4 uppercase">{file.name}</p>
                            <span className="inline-block px-3 py-1 bg-slate-200/50 rounded-lg text-xs font-mono font-bold text-slate-500 mb-6">{formatBytes(file.size)}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative bg-white">
                    {!file ? (
                        <div className="flex flex-col items-center text-slate-200 select-none">
                            <Target className="w-16 h-16 mb-4 opacity-50"/>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Optimisation Numérique</p>
                        </div>
                    ) : (
                        <>
                            {!downloadUrl && !isProcessing && (
                                <div className="space-y-10 max-w-sm mx-auto w-full animate-in fade-in">
                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Cible Mathématique</h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Ajustement précis du poids</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poids cible (Ko)</span>
                                            <input 
                                                type="number" 
                                                value={targetSizeKB} 
                                                onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 0)}
                                                className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-center text-sm outline-none focus:ring-2 focus:ring-slate-100"
                                            />
                                        </div>
                                        <input type="range" min="10" max="2500" step="10" value={targetSizeKB} onChange={(e) => setTargetSizeKB(e.target.value)} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" />
                                    </div>
                                    
                                    <button onClick={processFile} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase shadow-xl transition-all active:scale-95">
                                        Lancer le calcul
                                    </button>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="text-center w-full max-w-xs mx-auto">
                                    <Loader2 className="w-10 h-10 animate-spin text-slate-900 mx-auto mb-6"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 font-mono">Convergence vers {targetSizeKB} Ko...</p>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="bg-slate-900 h-full transition-all duration-300" style={{width: `${progress}%`}}></div></div>
                                </div>
                            )}

                            {downloadUrl && (
                                <div className="text-center w-full animate-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><CheckCircle className="w-10 h-10"/></div>
                                    <h3 className="font-black text-slate-800 text-lg uppercase mb-8 tracking-tighter">Traitement Finalisé</h3>
                                    <div className="flex justify-center items-center gap-8 mb-10 bg-slate-50 p-6 rounded-[32px] border border-slate-100 mx-auto max-w-xs shadow-inner">
                                        <div className="text-right font-mono text-xs text-slate-400 line-through">{formatBytes(file.size)}</div>
                                        <div className="h-10 w-[1px] bg-slate-300"></div>
                                        <div className="text-left font-mono font-bold text-slate-800 text-xl">{formatBytes(compressedSize)}</div>
                                    </div>
                                    <a href={downloadUrl} download={`Lapanoplie_${file.name}`} className="inline-flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                                        <Download className="w-4 h-4"/> Télécharger
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CompressorTool;