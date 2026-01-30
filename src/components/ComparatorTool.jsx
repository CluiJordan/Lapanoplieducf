import React, { useState } from 'react';
import { ChevronLeft, FileSpreadsheet, CheckSquare, CheckCircle, XCircle, Layers, FileText } from 'lucide-react';
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
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      const keys = data[0].map(k => k.toString().trim());
      const jsonData = data.slice(1).map(row => {
        let obj = {};
        keys.forEach((key, i) => obj[key] = row[i]);
        return obj;
      });

      if (fileNum === 1) {
        setData1(jsonData);
        setHasProcessed(false);
        if (jsonData.length > 0) {
          const sample = jsonData[0];
          const classKey = ['classe', 'class', 'groupe'].find(term => Object.keys(sample).some(k => k.toLowerCase().includes(term)));
          if (classKey) {
            const realKey = Object.keys(sample).find(k => k.toLowerCase().includes(classKey));
            const classesSet = new Set(jsonData.map(row => String(row[realKey] || "").trim()).filter(Boolean));
            const sorted = Array.from(classesSet).sort();
            setAvailableClasses(sorted);
            setSelectedClasses(new Set(sorted));
          }
        }
      } else {
        setData2(jsonData);
        setHasProcessed(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processComparison = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (!data1.length || !data2.length) { setError("Fichiers invalides"); setIsProcessing(false); return; }
      
      const kMat1 = findBestKey(data1[0], ['matricule', 'id', 'mat']);
      const kClasse1 = findBestKey(data1[0], ['classe', 'class', 'groupe']);
      const kNom1 = findBestKey(data1[0], ['nom', 'surname']);
      const kPrenom1 = findBestKey(data1[0], ['prenom', 'first']);

      const data1Map = new Map(data1.map(item => [String(item[kMat1] || "").toLowerCase().trim(), item]));
      const mat2Set = new Set(data2.map(row => String(row[findBestKey(row, ['matricule', 'id'])] || "").toLowerCase().trim()));

      const intersections = data2.map(row => {
        const mat = String(row[findBestKey(row, ['matricule', 'id'])] || "").toLowerCase().trim();
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

      setCommonData(intersections); setMissingByClass(missing); setHasProcessed(true); setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="animate-in">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onBack} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"><ChevronLeft className="w-6 h-6 text-slate-600" /></button>
            <h2 className="text-2xl font-bold text-slate-800">Comparateur de Listes</h2>
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <FileSpreadsheet className={`w-10 h-10 mb-2 ${file1 ? 'text-green-500' : 'text-slate-300'}`} />
                    <p className="text-sm font-bold text-slate-500 uppercase">Liste Référence</p>
                    <input type="file" onChange={e => handleFileUpload(e, 1)} className="mt-4 text-xs" />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <FileSpreadsheet className={`w-10 h-10 mb-2 ${file2 ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <p className="text-sm font-bold text-slate-500 uppercase">Liste Cible</p>
                    <input type="file" onChange={e => handleFileUpload(e, 2)} className="mt-4 text-xs" />
                </div>
                <button onClick={processComparison} disabled={!file1 || !file2 || isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-300">
                    {isProcessing ? "Comparaison..." : "Lancer la comparaison"}
                </button>
            </div>
            <div className="lg:col-span-8 bg-slate-100 rounded-3xl p-4 min-h-[500px]">
                {hasProcessed ? <p className="text-center text-slate-500">Résultats prêts (Mode: {viewMode})</p> : <p className="text-center mt-20 text-slate-400">En attente de fichiers...</p>}
            </div>
        </div>
    </div>
  );
};

export default ComparatorTool;