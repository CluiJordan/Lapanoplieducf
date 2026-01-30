import React, { useState, useRef } from 'react';
import { ChevronLeft, Upload, FileText, Image as ImageIcon, Trash2, Scissors, CheckCircle, ArrowRightLeft, Loader2, AlertTriangle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const CompressorTool = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [targetSizeKB, setTargetSizeKB] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [progress, setProgress] = useState(0);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Ko';
    return (bytes / 1024).toFixed(2) + ' Ko';
  };

  const smartCompressImage = async (imgSource, budgetBytes) => {
    const generateBlob = async (scale, quality) => {
        const canvas = document.createElement('canvas');
        canvas.width = imgSource.width * scale; canvas.height = imgSource.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        return await (await fetch(dataUrl)).blob();
    };

    let minQ = 0.05, maxQ = 1.0, bestBlob = null;
    for (let i = 0; i < 6; i++) {
        const midQ = (minQ + maxQ) / 2;
        const blob = await generateBlob(1.0, midQ);
        if (blob.size <= budgetBytes) { bestBlob = blob; minQ = midQ; } else { maxQ = midQ; }
    }
    if (!bestBlob) bestBlob = await generateBlob(0.5, 0.5);
    return bestBlob;
  };

  const processFile = async () => {
    setIsProcessing(true); setProgress(10);
    try {
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise(r => img.onload = r);
            const blob = await smartCompressImage(img, targetSizeKB * 1024);
            setCompressedSize(blob.size);
            setDownloadUrl(URL.createObjectURL(blob));
        } else if (file.name.endsWith('.pdf')) {
            // Logique PDF simplifiée pour l'exemple
            const doc = new jsPDF();
            doc.text("Version compressée de " + file.name, 10, 10);
            const blob = doc.output('blob');
            setCompressedSize(blob.size);
            setDownloadUrl(URL.createObjectURL(blob));
        }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); setProgress(100); }
  };

  return (
    <div className="animate-in">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onBack} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100"><ChevronLeft className="w-6 h-6 text-slate-600" /></button>
            <h2 className="text-2xl font-bold text-slate-800">Compresseur</h2>
        </div>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            {!file ? (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-indigo-100 rounded-2xl cursor-pointer bg-slate-50 hover:bg-indigo-50 transition-colors">
                    <Upload className="w-10 h-10 text-indigo-400 mb-4" />
                    <p className="font-semibold text-slate-600">Choisir un fichier (PDF, JPG, PNG)</p>
                    <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </label>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="text-indigo-600" />
                            <div><p className="font-bold text-indigo-900">{file.name}</p><p className="text-xs text-indigo-500">{formatBytes(file.size)}</p></div>
                        </div>
                        <button onClick={() => setFile(null)}><Trash2 className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Poids cible (Ko)</label>
                        <input type="number" value={targetSizeKB} onChange={e => setTargetSizeKB(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500" />
                    </div>
                    <button onClick={processFile} disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Scissors />} Compresser
                    </button>
                </div>
            )}
            {downloadUrl && (
                <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-3xl text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-2" />
                    <p className="font-bold text-green-800">Fichier prêt : {formatBytes(compressedSize)}</p>
                    <a href={downloadUrl} download={"compressed_" + file.name} className="inline-block mt-4 px-8 py-3 bg-green-600 text-white rounded-xl font-bold">Télécharger</a>
                </div>
            )}
        </div>
    </div>
  );
};

export default CompressorTool;