import React, { useState } from 'react';
import { 
  FileSpreadsheet, ArrowRightLeft, Download, CheckCircle, 
  Trash2, CheckSquare, XCircle, Layers, FileText, 
  ChevronLeft, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ComparatorTool = ({ onBack }) => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [commonData, setCommonData] = useState([]);
  const [missingByClass, setMissingByClass] = useState({});
  const [hasProcessed, setHasProcessed] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState('present');

  const findBestKey = (obj, searchTerms) => {
    if (!obj) return null;
    return Object.keys(obj).find(key => 
      searchTerms.some(term => key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term))
    );
  };

  const handleFileUpload = (e, fileNum) => {
    const file = e.target.files[0];
    if (!file) return;
    fileNum === 1 ? setFile1(file) : setFile2(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const keys = data[0].map(k => k ? k.toString().trim() : "");
      const jsonData = data.slice(1).map(row => {
        let obj = {};
        keys.forEach((key, i) => { if(key) obj[key] = row[i]; });
        return obj;
      });
      if (fileNum === 1) {
        setData1(jsonData);
        setHasProcessed(false);
        const classKeyFound = findBestKey(jsonData[0] || {}, ['classe', 'class', 'groupe', 'div']);
        if (classKeyFound) {
          const sorted = Array.from(new Set(jsonData.map(r => String(r[classKeyFound] || "").trim()).filter(Boolean))).sort();
          setAvailableClasses(sorted);
          setSelectedClasses(new Set(sorted));
        }
      } else {
        setData2(jsonData);
        setHasProcessed(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processComparison = () => {
    setError(""); setIsProcessing(true);
    setTimeout(() => {
      if (!data1.length || !data2.length) { setError("Charger deux fichiers."); setIsProcessing(false); return; }
      const kMat1 = findBestKey(data1[0], ['matricule', 'id', 'mat']);
      const kClasse1 = findBestKey(data1[0], ['classe', 'class', 'groupe']);
      const kNom1 = findBestKey(data1[0], ['nom', 'surname']);
      const kPrenom1 = findBestKey(data1[0], ['prenom', 'first', 'name']);
      const data1Map = new Map(data1.map(item => [String(item[kMat1] || "").toLowerCase().trim(), item]));
      const intersections = data2.map(row => {
        const mat = String(row[findBestKey(row, ['matricule', 'id', 'mat'])] || "").toLowerCase().trim();
        const ref = data1Map.get(mat);
        if (ref) {
          const cls = String(ref[kClasse1] || "N/A").trim();
          if (selectedClasses.has(cls)) {
            return { Matricule: mat.toUpperCase(), Nom: (row[findBestKey(row, ['nom'])] || ref[kNom1] || "N/A").toUpperCase(), Prenom: row[findBestKey(row, ['prenom', 'name'])] || ref[kPrenom1] || "N/A", Classe: cls };
          }
        }
        return null;
      }).filter(Boolean);
      const missing = {};
      selectedClasses.forEach(cls => {
        missing[cls] = data1.filter(row => String(row[kClasse1] || "").trim() === cls && !data2.some(r2 => String(r2[findBestKey(r2, ['matricule'])] || "").toLowerCase().trim() === String(row[kMat1]).toLowerCase().trim())).map(row => ({ Matricule: row[kMat1], Nom: String(row[kNom1]).toUpperCase(), Prenom: row[kPrenom1], Classe: cls }));
      });
      setCommonData(intersections); setMissingByClass(missing); setHasProcessed(true); setIsProcessing(false); setViewMode('present');
    }, 600);
  };
  const exportToPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(10); doc.text("LAPANOPLIEDUCF", 14, 15); doc.setFontSize(16); doc.text(`Rapport : ${viewMode === 'present' ? 'Presents' : 'Manquants'}`, 14, 25);
    let finalY = 35; selectedClasses.forEach(cls => { const list = viewMode === 'present' ? commonData.filter(d => d.Classe === cls) : missingByClass[cls]; if (list && list.length > 0) { doc.setFontSize(11); doc.text(`Classe : ${cls}`, 14, finalY); doc.autoTable({ startY: finalY + 2, head: [['Matricule', 'Nom', 'Prénoms']], body: list.map(s => [s.Matricule, s.Nom, s.Prenom]), theme: 'grid', headStyles: {fillColor: [79, 70, 229]}, styles: {fontSize: 9} }); finalY = doc.lastAutoTable.finalY + 10; } }); doc.save("rapport_lapanoplieducf.pdf");
  };
  const exportToExcel = () => {
    const exportData = viewMode === 'present' ? commonData : Object.values(missingByClass).flat(); const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Resultats"); XLSX.writeFile(wb, "export_lapanoplieducf.xlsx");
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-full border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex items-center gap-3">
            {/* TAILLE RÉDUITE ICI : h-10 w-10 */}
            <img src="/favicon.png" className="h-10 w-10 object-contain" alt="icon" />
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Comparateur</h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
            {[1, 2].map(n => (
                <div key={n} className={`bg-white p-4 rounded-3xl border-2 transition-all ${(n === 1 ? file1 : file2) ? 'border-green-400 bg-green-50' : 'border-dashed border-slate-200 hover:border-indigo-300'}`}>
                    <div className="flex flex-col items-center text-center">
                        <FileSpreadsheet className={`w-8 h-8 mb-2 ${(n === 1 ? file1 : file2) ? 'text-green-600' : 'text-slate-300'}`} />
                        <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-2">{n === 1 ? '1. Référence' : '2. Vérification'}</p>
                        <label className="cursor-pointer bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black active:scale-95 transition-all uppercase tracking-wide">
                            { (n === 1 ? file1 : file2) ? 'Changer' : 'Charger' }
                            <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, n)} className="hidden" />
                        </label>
                    </div>
                </div>
            ))}
            {availableClasses.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Classes</span>
                        <button onClick={() => setSelectedClasses(selectedClasses.size === availableClasses.length ? new Set() : new Set(availableClasses))} className="text-[10px] font-black text-indigo-600 underline">Tout</button>
                    </div>
                    <div className="p-2 max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                        {availableClasses.map((cls, idx) => (
                            <div key={idx} onClick={() => { const s = new Set(selectedClasses); s.has(cls) ? s.delete(cls) : s.add(cls); setSelectedClasses(s); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${selectedClasses.has(cls) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'}`}>
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedClasses.has(cls) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {selectedClasses.has(cls) && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-[11px] font-bold">{cls}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <button onClick={processComparison} disabled={!file1 || !file2 || isProcessing} className="w-full py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 transition-all text-xs tracking-widest uppercase">
                {isProcessing ? "Analyse..." : "Comparer"}
            </button>
        </div>

        <div className="lg:col-span-9 h-[650px]">
            {hasProcessed ? (
                <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 h-full flex flex-col overflow-hidden animate-in fade-in">
                    <div className="bg-white p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            {['present', 'missing', 'all'].map(m => (
                                <button key={m} onClick={() => setViewMode(m)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {m === 'present' ? 'Presents' : m === 'missing' ? 'Manquants' : 'Tous'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                             <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-[10px] active:scale-95 transition-all uppercase tracking-wide"><Download className="w-3.5 h-3.5"/> EXCEL</button>
                             <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-[10px] active:scale-95 transition-all uppercase tracking-wide"><FileText className="w-3.5 h-3.5"/> PDF</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
                        {Array.from(selectedClasses).sort().map(cls => {
                            const p = commonData.filter(d => d.Classe === cls); const m = missingByClass[cls] || []; if (!p.length && !m.length) return null;
                            return (
                                <div key={cls} className="mb-4 animate-in slide-in-from-bottom-2">
                                    {(viewMode === 'present' || viewMode === 'all') && p.length > 0 && (
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-2 overflow-hidden">
                                            <div className="px-5 py-3 bg-green-50/50 border-b border-green-100 flex justify-between items-center">
                                                <span className="font-black text-green-800 text-xs uppercase tracking-tight">{cls} — PRÉSENTS</span>
                                                <span className="bg-white px-2 py-0.5 rounded-md text-[9px] font-black text-green-600 shadow-sm">{p.length}</span>
                                            </div>
                                            <table className="w-full"><tbody className="divide-y divide-slate-50">{p.map((s, i) => (<tr key={i} className="text-[11px] hover:bg-slate-50 transition-colors"><td className="px-5 py-2 font-mono text-slate-400 w-1/4">{s.Matricule}</td><td className="px-5 py-2 font-black text-slate-700 w-1/3 uppercase">{s.Nom}</td><td className="px-5 py-2 text-slate-500">{s.Prenom}</td></tr>))}</tbody></table>
                                        </div>
                                    )}
                                    {(viewMode === 'missing' || viewMode === 'all') && m.length > 0 && (
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="px-5 py-3 bg-red-50/50 border-b border-red-100 flex justify-between items-center">
                                                <span className="font-black text-red-800 text-xs uppercase tracking-tight">{cls} — MANQUANTS</span>
                                                <span className="bg-white px-2 py-0.5 rounded-md text-[9px] font-black text-red-600 shadow-sm">{m.length}</span>
                                            </div>
                                            <table className="w-full"><tbody className="divide-y divide-slate-50">{m.map((s, i) => (<tr key={i} className="text-[11px] hover:bg-slate-50 transition-colors"><td className="px-5 py-2 font-mono text-red-400 w-1/4">{s.Matricule}</td><td className="px-5 py-2 font-black text-slate-700 w-1/3 uppercase">{s.Nom}</td><td className="px-5 py-2 text-slate-500">{s.Prenom}</td></tr>))}</tbody></table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
                    <ArrowRightLeft className="w-16 h-16 mb-4 opacity-10" />
                    <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">En attente de fichiers</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ComparatorTool;