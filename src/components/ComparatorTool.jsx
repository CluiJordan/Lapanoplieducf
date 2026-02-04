import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, ChevronLeft, 
  Search, Filter, FileText, CheckCircle, AlertCircle, Play, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // CHANGEMENT ICI : Import direct

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
  const [viewMode, setViewMode] = useState('missing');

  const classStats = useMemo(() => {
    if (!hasProcessed) return {};
    const stats = {};
    availableClasses.forEach(cls => {
      const present = commonData.filter(d => d.Classe === cls).length;
      const missing = (missingByClass[cls] || []).length;
      stats[cls] = { present, missing };
    });
    return stats;
  }, [hasProcessed, availableClasses, commonData, missingByClass]);

  const findBestKey = (obj, searchTerms) => { if (!obj) return null; return Object.keys(obj).find(key => searchTerms.some(term => key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term))); };
  
  const handleFileUpload = (e, fileNum) => { 
    const file = e.target.files[0]; if (!file) return; 
    fileNum === 1 ? setFile1(file) : setFile2(file); 
    const reader = new FileReader(); 
    reader.onload = (evt) => { 
        const wb = XLSX.read(evt.target.result, { type: 'binary' }); 
        const ws = wb.Sheets[wb.SheetNames[0]]; 
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); 
        const keys = data[0].map(k => k ? k.toString().trim() : ""); 
        const jsonData = data.slice(1).map(row => { let obj = {}; keys.forEach((key, i) => { if(key) obj[key] = row[i]; }); return obj; }); 
        if (fileNum === 1) { 
            setData1(jsonData); setHasProcessed(false); 
            const classKeyFound = findBestKey(jsonData[0] || {}, ['classe', 'class', 'groupe', 'div']); 
            if (classKeyFound) { 
                const sorted = Array.from(new Set(jsonData.map(r => String(r[classKeyFound] || "").trim()).filter(Boolean))).sort(); 
                setAvailableClasses(sorted); setSelectedClasses(new Set(sorted)); 
            } 
        } else { setData2(jsonData); setHasProcessed(false); } 
    }; 
    reader.readAsBinaryString(file); 
  };

  const processComparison = () => { 
    setIsProcessing(true); 
    setTimeout(() => { 
        if (!data1.length || !data2.length) { setIsProcessing(false); return; } 
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
                return { Matricule: mat.toUpperCase(), Nom: (row[findBestKey(row, ['nom'])] || ref[kNom1] || "N/A").toUpperCase(), Prenom: row[findBestKey(row, ['prenom', 'name'])] || ref[kPrenom1] || "N/A", Classe: cls }; 
            } return null; 
        }).filter(Boolean); 
        
        const missing = {}; 
        availableClasses.forEach(cls => { 
            missing[cls] = data1.filter(row => String(row[kClasse1] || "").trim() === cls && !data2.some(r2 => String(r2[findBestKey(r2, ['matricule'])] || "").toLowerCase().trim() === String(row[kMat1]).toLowerCase().trim())).map(row => ({ Matricule: row[kMat1], Nom: String(row[kNom1]).toUpperCase(), Prenom: row[kPrenom1], Classe: cls })); 
        }); 
        
        setCommonData(intersections); setMissingByClass(missing); setHasProcessed(true); setIsProcessing(false); setViewMode('missing'); 
    }, 800); 
  };

  // --- CORRECTION APPEL AUTOTABLE ---
  const exportToPDF = () => { 
      const doc = new jsPDF(); 
      doc.setFontSize(10); 
      doc.text("LAPANOPLIEDUCF", 14, 15); 
      doc.setFontSize(16); 
      doc.text(`Rapport : ${viewMode === 'present' ? 'Présents' : 'Manquants'}`, 14, 25); 
      
      let finalY = 35; 
      const sortedClasses = Array.from(selectedClasses).sort();
      
      sortedClasses.forEach(cls => { 
          const list = viewMode === 'present' ? commonData.filter(d => d.Classe === cls) : missingByClass[cls]; 
          
          if (list && list.length > 0) { 
              if (finalY > 270) { doc.addPage(); finalY = 20; } 
              doc.setFontSize(12);
              doc.setTextColor(100);
              doc.text(`Classe : ${cls}`, 14, finalY); 
              
              // UTILISATION DE LA FONCTION IMPORTÉE DIRECTEMENT
              autoTable(doc, { 
                  startY: finalY + 2, 
                  head: [['Matricule', 'Nom', 'Prénoms']], 
                  body: list.map(s => [s.Matricule, s.Nom, s.Prenom]), 
                  theme: 'grid', 
                  headStyles: {fillColor: [63, 63, 70]}, 
                  styles: {fontSize: 9},
                  margin: { left: 14, right: 14 }
              }); 
              
              finalY = doc.lastAutoTable.finalY + 15; 
          } 
      }); 
      
      doc.save(`rapport_${viewMode}_lapanoplie.pdf`); 
  };
  
  const exportToExcel = () => { 
      const exportData = viewMode === 'present' ? commonData : Object.values(missingByClass).flat(); 
      const ws = XLSX.utils.json_to_sheet(exportData); 
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Resultats"); 
      XLSX.writeFile(wb, `export_${viewMode}_lapanoplie.xlsx`); 
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 animate-in fade-in duration-500">
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm h-16 shrink-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
            <div className="flex gap-3">
                {[1, 2].map(n => (
                    <label key={n} className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all active:scale-95 ${(n===1?file1:file2) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-300 hover:shadow-sm'}`}>
                        <div className={`p-1 rounded-md ${(n===1?file1:file2) ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                            <FileSpreadsheet className="w-3.5 h-3.5"/>
                        </div>
                        <span className="truncate max-w-[120px]">{(n===1?file1:file2)?.name || (n===1 ? "1. Liste Réf" : "2. Liste Vérif")}</span>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, n)} className="hidden" />
                    </label>
                ))}
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={processComparison} disabled={!file1 || !file2 || isProcessing} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                {isProcessing ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"/> : <Play className="w-3 h-3 fill-current"/>} 
                {isProcessing ? "Analyse..." : "Comparer"}
            </button>
            {hasProcessed && (
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1 animate-in slide-in-from-right-4">
                    <button onClick={exportToExcel} className="px-3 py-1.5 bg-white hover:bg-green-50 text-green-700 border border-slate-200 text-[10px] font-black uppercase rounded-md flex items-center gap-2 transition-all shadow-sm active:scale-95"><Download className="w-3 h-3"/> Excel</button>
                    <button onClick={exportToPDF} className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-slate-200 text-[10px] font-black uppercase rounded-md flex items-center gap-2 transition-all shadow-sm active:scale-95"><FileText className="w-3 h-3"/> PDF</button>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {availableClasses.length > 0 && (
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Filter className="w-3 h-3"/> Filtre Classes</span>
                    <button onClick={() => setSelectedClasses(selectedClasses.size === availableClasses.length ? new Set() : new Set(availableClasses))} className="text-[10px] font-bold text-indigo-600 hover:underline">
                        {selectedClasses.size === availableClasses.length ? "Aucune" : "Toutes"}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {availableClasses.map(cls => {
                        const stats = classStats[cls] || { present: 0, missing: 0 };
                        return (
                            <label key={cls} className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-all border ${selectedClasses.has(cls) ? 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={selectedClasses.has(cls)} onChange={() => { const s = new Set(selectedClasses); s.has(cls) ? s.delete(cls) : s.add(cls); setSelectedClasses(s); }} className="accent-indigo-600 w-3.5 h-3.5 rounded-sm" />
                                    <span className="font-bold">{cls}</span>
                                </div>
                                {hasProcessed && (
                                    <div className="flex gap-1.5 text-[9px] font-mono">
                                        <span className={`px-1.5 py-0.5 rounded ${stats.missing > 0 ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-100 text-slate-300'}`} title="Manquants">
                                            -{stats.missing}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold" title="Présents">
                                            +{stats.present}
                                        </span>
                                    </div>
                                )}
                            </label>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
            {!hasProcessed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-white animate-in zoom-in-95 duration-500"><Users className="w-10 h-10 opacity-20 text-indigo-900"/></div>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-60">Prêt à comparer</p>
                </div>
            ) : (
                <>
                    <div className="flex bg-white border-b border-slate-200 px-6 pt-2">
                        <button onClick={() => setViewMode('missing')} className={`relative flex items-center gap-2 px-6 py-3 text-xs font-black uppercase transition-all ${viewMode==='missing' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <AlertCircle className="w-4 h-4"/> Manquants
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] ml-1">{Object.values(missingByClass).flat().length}</span>
                            {viewMode==='missing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>}
                        </button>
                        <button onClick={() => setViewMode('present')} className={`relative flex items-center gap-2 px-6 py-3 text-xs font-black uppercase transition-all ${viewMode==='present' ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <CheckCircle className="w-4 h-4"/> Présents
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] ml-1">{commonData.length}</span>
                            {viewMode==='present' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></div>}
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar p-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ring-1 ring-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 w-32">Classe</th>
                                        <th className="px-6 py-4 w-40">Matricule</th>
                                        <th className="px-6 py-4">Nom & Prénoms</th>
                                        <th className="px-6 py-4 text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-slate-700 divide-y divide-slate-50">
                                    {Array.from(selectedClasses).sort().map(cls => {
                                        const list = viewMode === 'present' ? commonData.filter(d => d.Classe === cls) : missingByClass[cls] || [];
                                        if (list.length === 0) return null;
                                        return (
                                            <React.Fragment key={cls}>
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan="4" className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-2">
                                                        {cls} — {list.length} élève(s)
                                                    </td>
                                                </tr>
                                                {list.map((row, idx) => (
                                                    <tr key={`${cls}-${idx}`} className="group hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 font-bold text-slate-800">{row.Classe}</td>
                                                        <td className="px-6 py-3 font-mono text-slate-500 bg-slate-50/30">{row.Matricule}</td>
                                                        <td className="px-6 py-3 font-bold uppercase text-slate-600 group-hover:text-indigo-900 transition-colors">{row.Nom} {row.Prenom}</td>
                                                        <td className="px-6 py-3 text-right">
                                                            {viewMode === 'missing' 
                                                                ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase border border-red-100">Manquant</span>
                                                                : <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-600 text-[9px] font-black uppercase border border-green-100">Présent</span>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                    {((viewMode === 'present' && commonData.length === 0) || (viewMode === 'missing' && Object.values(missingByClass).flat().length === 0)) && (
                                        <tr><td colSpan="4" className="p-12 text-center text-slate-400 italic">Aucune donnée trouvée pour cette sélection.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ComparatorTool;