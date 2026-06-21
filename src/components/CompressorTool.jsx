import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Download, CheckCircle, Trash2, Minimize2,
  Loader2, ChevronLeft, Image as ImageIcon, FileText, Target, TrendingDown
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
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const check = setInterval(() => {
      if (window.pdfjsLib) {
        pdfjsLibRef.current = window.pdfjsLib;
        setPdfLibReady(true);
        clearInterval(check);
      }
    }, 500);
    return () => clearInterval(check);
  }, []);

  const formatBytes = (bytes) => {
    if (!+bytes) return '0 Ko';
    return `${(bytes / 1024).toFixed(1)} Ko`;
  };

  const compressionRatio = () => {
    if (!file || !compressedSize) return null;
    return Math.round((1 - compressedSize / file.size) * 100);
  };

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
    let low = 0.01, high = 1.0, bestFoundBlob = null;
    const initialTest = await generateBlob(imgSource, 1.0, 1.0);
    if (initialTest.size <= budget) return initialTest;
    for (let i = 0; i < 10; i++) {
      const midQuality = (low + high) / 2;
      const currentBlob = await generateBlob(imgSource, 1.0, midQuality);
      if (currentBlob.size <= budget) { bestFoundBlob = currentBlob; low = midQuality; }
      else { high = midQuality; }
    }
    if (!bestFoundBlob) {
      let sLow = 0.1, sHigh = 0.95;
      for (let j = 0; j < 6; j++) {
        const midScale = (sLow + sHigh) / 2;
        const blobScale = await generateBlob(imgSource, midScale, 0.8);
        if (blobScale.size <= budget) { bestFoundBlob = blobScale; sLow = midScale; }
        else { sHigh = midScale; }
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
          if (!pdfLibReady) throw new Error('Moteur PDF non prêt');
          const pdf = await pdfjsLibRef.current.getDocument(await file.arrayBuffer()).promise;
          const newPdf = new jsPDF();
          newPdf.deletePage(1);
          const budgetPerPage = Math.max((targetBytes / pdf.numPages) - 1024, 8000);
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const img = new Image();
            img.src = canvas.toDataURL('image/jpeg');
            await new Promise(r => img.onload = r);
            const pBlob = await runConvergenceAlgorithm(img, budgetPerPage);
            const imgProps = newPdf.getImageProperties(pBlob);
            const pdfWidth = newPdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            newPdf.addPage();
            newPdf.addImage(new Uint8Array(await pBlob.arrayBuffer()), 'JPEG', 0, 0, pdfWidth, pdfHeight);
            setProgress(Math.round((i / pdf.numPages) * 100));
          }
          if (newPdf.getNumberOfPages() > 1) newPdf.deletePage(1);
          resultBlob = newPdf.output('blob');
        }
        setCompressedSize(resultBlob.size);
        setDownloadUrl(URL.createObjectURL(resultBlob));
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
        setProgress(100);
      }
    }, 100);
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setCompressedSize(null);
    setProgress(0);
  };

  const isPDF = file?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center shrink-0 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2.5 text-teal-600 dark:text-teal-400">
            <Minimize2 className="w-4 h-4" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em]">Compresseur</h2>
          </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex items-center justify-center p-5 md:p-8">
        <div className="w-full max-w-4xl">

          {/* MAIN CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[520px] transition-colors">

            {/* LEFT PANEL — FILE */}
            <div className="w-full md:w-2/5 bg-slate-50 dark:bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
              {!file ? (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  className={`cursor-pointer flex flex-col items-center w-full p-8 rounded-2xl border-2 border-dashed transition-all ${dragOver ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5 transition-all">
                    <Upload className="w-9 h-9 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-black text-slate-700 dark:text-slate-300 text-sm mb-1">Importer un fichier</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">PDF · JPG · PNG</p>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg">
                    Parcourir
                  </span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} />
                </label>
              ) : (
                <div className="w-full animate-in flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center shadow-sm">
                      {isPDF
                        ? <FileText className="w-10 h-10 text-red-500" />
                        : <ImageIcon className="w-10 h-10 text-teal-500" />
                      }
                    </div>
                    <button
                      onClick={reset}
                      className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate w-full mb-2 px-2 text-center">{file.name}</p>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 mb-4">
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{formatBytes(file.size)}</span>
                  </div>
                  {compressedSize && (
                    <div className="w-full bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/40 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4 text-teal-500" />
                        <span className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase">Résultat</span>
                      </div>
                      <div className="text-2xl font-black text-teal-700 dark:text-teal-300">{formatBytes(compressedSize)}</div>
                      <div className="text-[10px] text-teal-500 font-bold mt-1">−{compressionRatio()}% du poids initial</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT PANEL — CONTROLS */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors">
              {!file && (
                <div className="flex flex-col items-center text-slate-200 dark:text-slate-700 select-none">
                  <Target className="w-16 h-16 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">Optimisation Mathématique</p>
                </div>
              )}

              {file && !isProcessing && !downloadUrl && (
                <div className="space-y-8 max-w-sm mx-auto w-full animate-in">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-1">Taille cible</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Algorithme de convergence par dichotomie</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Poids cible</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={targetSizeKB}
                          onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-center text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                        />
                        <span className="text-xs font-bold text-slate-400">Ko</span>
                      </div>
                    </div>
                    <input
                      type="range" min="10" max="2500" step="10"
                      value={targetSizeKB}
                      onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono">
                      <span>10 Ko</span><span>2 500 Ko</span>
                    </div>
                  </div>

                  <button
                    onClick={processFile}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs uppercase shadow-xl shadow-teal-200 dark:shadow-none transition-all active:scale-95"
                  >
                    Lancer la compression
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="text-center w-full max-w-xs mx-auto">
                  <Loader2 className="w-10 h-10 animate-spin text-teal-600 dark:text-teal-400 mx-auto mb-6" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 font-mono">
                    Convergence vers {targetSizeKB} Ko…
                  </p>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {isPDF && (
                    <p className="text-[10px] text-slate-400 font-mono mt-2">{progress}%</p>
                  )}
                </div>
              )}

              {downloadUrl && (
                <div className="text-center w-full animate-in">
                  <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white text-xl uppercase mb-8 tracking-tighter">Traitement terminé</h3>
                  <a
                    href={downloadUrl}
                    download={`Lapanoplie_${file.name}`}
                    className="inline-flex items-center gap-3 px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-teal-200 dark:shadow-none hover:shadow-2xl transition-all active:scale-95 mb-5"
                  >
                    <Download className="w-4 h-4" /> Télécharger
                  </a>
                  <div>
                    <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold underline transition-colors">
                      Compresser un autre fichier
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressorTool;
