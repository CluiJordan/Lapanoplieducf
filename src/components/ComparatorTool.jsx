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
    return Object.keys(obj).find(key => searchTerms.some(term => key.toLowerCase().includes(term)));
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
        const classKeyFound = ['classe', 'class', 'groupe', 'div'].find(term => 
          Object.keys(jsonData[0] || {}).some(k => k.toLowerCase().includes(term))
        );
        if (classKeyFound) {
          const realKey = Object.keys(jsonData[0]).find(k => k.toLowerCase().includes(classKeyFound));
          const sorted = Array.from(new Set(jsonData.map(r => String(r[realKey] || "").trim()).filter(Boolean))).sort();
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
    setError(""); setIsProcessing(true); setHasProcessed(false);
    setTimeout(() => {
      if (!data1.length || !data2.length) { setError("Charger deux fichiers."); setIsProcessing(false); return; }
      
      const kMat1 = findBestKey(data1[0], ['matricule', 'id', 'mat']);
      const kClasse1 = findBestKey(data1[0], ['classe', 'class', 'groupe']);
      const kNom1 = findBestKey(data1[0], ['nom', 'surname']);
      const kPrenom1 = findBestKey(data1[0], ['prenom', 'first']);

      if (!kMat1) { setError("Colonne 'Matricule' introuvable."); setIsProcessing(false); return; }

      const data1Map = new Map(data1.map(item => [String(item[kMat1] || "").toLowerCase().trim(), item]));
      const mat2Set = new Set(data2.map(row => String(row[findBestKey(row, ['matricule', 'id', 'mat'])] || "").toLowerCase().trim()));
      
      const intersections = data2.map(row => {
        const mat = String(row[findBestKey(row, ['matricule', 'id', 'mat'])] || "").toLowerCase().trim();
        const ref = data1Map.get(mat);
        if (ref) {
          const cls = String(ref[kClasse1] || "N/A").trim();
          if (selectedClasses.has(cls)) return { Matricule: mat, Nom: ref[kNom1] || "N/A", Prenom: ref[kPrenom1] || "N/A", Classe: cls };
        }
        return null;
      }).filter(Boolean);

      const missing = {};
      selectedClasses.forEach(cls => {
        missing[cls] = data1.filter(row => String(row[kClasse1] || "").trim() === cls && !mat2Set.has(String(row[kMat1] || "").toLowerCase().trim()))
                          .map(row => ({ Matricule: row[kMat1], Nom: row[kNom1], Prenom: row[kPrenom1], Classe: cls }));
      });

      setCommonData(intersections); setMissingByClass(missing); setHasProcessed(true); setIsProcessing(false); setViewMode('present');
    }, 800);
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-slate-100 border border-slate-200 transition-colors active:scale-90"><ChevronLeft className="w-6 h-6 text-slate-600" /></button>
        <h2 className="text-2xl font-bold text-slate-800">Comparateur de Listes</h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className={`bg-white p-4 rounded-xl shadow-sm border-2 transition-all ${file1 ? 'border-green-400 bg-green-50' : 'border-dashed border-slate-300 hover:border-indigo-400'}`}>
                <div className="flex flex-col items-center">
                    <FileSpreadsheet className={`w-8 h-8 mb-2 ${file1 ? 'text-green-600' : 'text-slate-400'}`} />
                    <p className="font-bold text-[10px] uppercase text-slate-500 mb-1 tracking-wider text-center">Liste Référence</p>
                    {file1 ? <p className="font-medium text-green-700 text-sm truncate max-w-[180px]">{file1.name}</p> : 
                    <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md">Charger Réf<input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 1)} className="hidden" /></label>}
                </div>
            </div>

            {availableClasses.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col max-h-[250px] animate-in fade-in duration-500">
                    <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center shrink-0">
                        <span className="font-extrabold text-indigo-900 text-[10px] uppercase tracking-widest">Classes ({availableClasses.length})</span>
                        <button onClick={() => setSelectedClasses(selectedClasses.size === availableClasses.length ? new Set() : new Set(availableClasses))} className="text-[10px] font-bold text-indigo-600 underline">Tout/Rien</button>
                    </div>
                    <div className="p-2 overflow-y-auto custom-scrollbar flex-1 space-y-0.5">
                        {availableClasses.map((cls, idx) => (
                            <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs transition-colors">
                                <div onClick={(e) => { e.preventDefault(); const newSet = new Set(selectedClasses); newSet.has(cls) ? newSet.delete(cls) : newSet.add(cls); setSelectedClasses(newSet); }} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedClasses.has(cls) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                    {selectedClasses.has(cls) && <CheckSquare className="w-3 h-3 text-white" />}
                                </div>
                                <span className={selectedClasses.has(cls) ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}>{cls}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className={`bg-white p-4 rounded-xl shadow-sm border-2 transition-all ${file2 ? 'border-green-400 bg-green-50' : 'border-dashed border-slate-300 hover:border-indigo-400'}`}>
                <div className="flex flex-col items-center">
                    <FileSpreadsheet className={`w-8 h-8 mb-2 ${file2 ? 'text-green-600' : 'text-slate-400'}`} />
                    <p className="font-bold text-[10px] uppercase text-slate-500 mb-1 tracking-wider text-center">Liste à Vérifier</p>
                    {file2 ? <p className="font-medium text-green-700 text-sm truncate max-w-[180px]">{file2.name}</p> : 
                    <label className="cursor-pointer bg-slate-600 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md">Charger Cible<input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 2)} className="hidden" /></label>}
                </div>
            </div>

            <button onClick={processComparison} disabled={!file1 || !file2 || isProcessing} className="w-full py-3.5 rounded-xl font-bold shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 text-sm flex items-center justify-center gap-2 tracking-tight">
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> TRAITEMENT...</> : <><ArrowRightLeft className="w-4 h-4" /> COMPARER LES LISTES</>}
            </button>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 font-bold text-center">{error}</div>}
        </div>

        <div className="lg:col-span-8 xl:col-span-9 h-[650px]">
            {hasProcessed ? (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 h-full flex flex-col animate-in fade-in">
                    <div className="bg-white p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="bg-slate-100 p-1.5 rounded-xl flex items-center">
                            <button onClick={() => setViewMode('present')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'present' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CheckCircle className="w-4 h-4" /> Présents</button>
                            <button onClick={() => setViewMode('missing')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'missing' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><XCircle className="w-4 h-4" /> Manquants</button>
                            <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Layers className="w-4 h-4" /> Tous</button>
                        </div>
                        <button onClick={() => {}} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-lg"><FileText className="w-4 h-4" /> EXPORTER PDF</button>
                    </div>
                    
                    <div className="bg-slate-50/50 flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {Array.from(selectedClasses).sort().map(cls => {
                            const presents = commonData.filter(d => d.Classe === cls);
                            const missings = (missingByClass[cls] || []);
                            if (!presents.length && !missings.length) return null;
                            
                            return (
                                <div key={cls} className="mb-6 space-y-4">
                                    {(viewMode === 'present' || viewMode === 'all') && presents.length > 0 && (
                                        <div className="rounded-2xl border border-green-100 overflow-hidden shadow-sm bg-white animate-in slide-in-from-bottom-2">
                                            <div className="px-5 py-3 bg-green-50 flex justify-between items-center">
                                                <span className="font-extrabold text-green-900">{cls}</span>
                                                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white text-green-600 shadow-sm uppercase tracking-tighter">{presents.length} PRÉSENT(S)</span>
                                            </div>
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-[10px] text-green-800 uppercase font-bold border-b border-green-50"><tr><th className="px-5 py-3">Matricule</th><th className="px-5 py-3">Nom</th><th className="px-5 py-3">Prénom</th></tr></thead>
                                                <tbody>{presents.map((st, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="px-5 py-2.5 font-mono text-xs text-slate-400">{st.Matricule}</td><td className="px-5 py-2.5 font-bold text-slate-700">{st.Nom}</td><td className="px-5 py-2.5">{st.Prenom}</td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    )}
                                    {(viewMode === 'missing' || viewMode === 'all') && missings.length > 0 && (
                                        <div className="rounded-2xl border border-red-100 overflow-hidden shadow-sm bg-white animate-in slide-in-from-bottom-2">
                                            <div className="px-5 py-3 bg-red-50 flex justify-between items-center">
                                                <span className="font-extrabold text-red-900">{cls}</span>
                                                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white text-red-600 shadow-sm uppercase tracking-tighter">{missings.length} MANQUANT(S)</span>
                                            </div>
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-[10px] text-red-800 uppercase font-bold border-b border-red-50"><tr><th className="px-5 py-3">Matricule</th><th className="px-5 py-3">Nom</th><th className="px-5 py-3">Prénom</th></tr></thead>
                                                <tbody>{missings.map((st, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="px-5 py-2.5 font-mono text-xs text-red-400">{st.Matricule}</td><td className="px-5 py-2.5 font-bold text-slate-700">{st.Nom}</td><td className="px-5 py-2.5">{st.Prenom}</td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="h-full bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6"><ArrowRightLeft className="w-8 h-8 text-slate-300" /></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-sans">Prêt pour la comparaison</h3>
                    <p className="text-slate-400 max-w-xs text-sm">Chargez vos listes pour voir apparaître les présences et manquants ici.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ComparatorTool;