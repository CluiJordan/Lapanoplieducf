import React, { useState } from 'react';
import { 
  ChevronLeft, ArrowRightLeft, FileSpreadsheet, 
  CheckCircle2, XCircle, AlertTriangle, Download, Search, Settings, FileText, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ComparatorTool = ({ onBack }) => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  
  const [selectedKey1, setSelectedKey1] = useState('');
  const [selectedKey2, setSelectedKey2] = useState('');

  const [classCol1, setClassCol1] = useState(''); 
  const [availableClasses, setAvailableClasses] = useState([]); 
  const [selectedClasses, setSelectedClasses] = useState([]); 

  const [displayMapping1, setDisplayMapping1] = useState({});
  const [displayMapping2, setDisplayMapping2] = useState({});

  const [comparisonResult, setComparisonResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('missing'); 

  // --- 1. DÉTECTION ---
  const findHeaderRow = (ws) => {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const maxRow = Math.min(range.e.r, 20); 
    let bestRow = 0;
    let maxScore = 0;
    const keywords = ['matricule', 'nom', 'prenom', 'classe', 'code', 'eleve'];

    for (let R = 0; R <= maxRow; ++R) {
        let score = 0;
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = { c: C, r: R };
            const cell = ws[XLSX.utils.encode_cell(cellAddress)];
            if (cell && cell.v) {
                const val = String(cell.v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (keywords.some(k => val.includes(k))) score++;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            bestRow = R;
        }
    }
    return bestRow;
  };

  const identifyDisplayColumns = (cols) => {
    const cleanStr = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

    const findCol = (keywords) => cols.find(c => {
        const clean = cleanStr(c);
        return keywords.some(k => clean.includes(k));
    });

    return {
        matricule: findCol(['matricule', 'mat', 'id', 'code', 'numero']),
        nom: findCol(['nom', 'name', 'family']),
        prenom: findCol(['prenom', 'firstname', 'first']), 
        classe: findCol(['classe', 'class', 'niv', 'groupe'])
    };
  };

  const normalizeValue = (val) => {
    if (val === null || val === undefined) return "";
    return String(val).trim().toUpperCase();
  };

  // --- 2. IMPORTATION ---
  const handleFileUpload = (e, setFile, setData, setColumns, setKey, setDisplayMapping, isFile1 = false) => {
    const f = e.target.files[0];
    if (!f) return;
    
    setFile(f);
    setComparisonResult(null); 

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      const headerRowIndex = findHeaderRow(ws);
      const jsonData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "" });
      
      if (jsonData.length > 0) {
        setData(jsonData);
        const cols = Object.keys(jsonData[0]);
        setColumns(cols);

        const displayMap = identifyDisplayColumns(cols);
        setDisplayMapping(displayMap);

        setKey(displayMap.matricule || cols[0]);

        if (isFile1 && displayMap.classe) {
            handleClassColumnSelect(displayMap.classe, jsonData);
        }
      }
    };
    reader.readAsBinaryString(f);
  };

  // --- 3. GESTION DES CLASSES ---
  const handleClassColumnSelect = (colName, sourceData = data1) => {
    setClassCol1(colName);
    if (!colName) {
        setAvailableClasses([]);
        return;
    }
    const classes = [...new Set(sourceData.map(row => String(row[colName] || "").trim()))].filter(Boolean).sort();
    setAvailableClasses(classes);
    setSelectedClasses(classes); 
  };

  const toggleClass = (cls) => {
    setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  };

  const toggleAllClasses = () => {
    if (selectedClasses.length === availableClasses.length) setSelectedClasses([]);
    else setSelectedClasses(availableClasses);
  };

  // --- 4. TRAITEMENT ---
  const processComparison = () => {
    if (!selectedKey1 || !selectedKey2) {
        alert("Sélectionnez les colonnes de comparaison.");
        return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
        let filteredData1 = data1;
        if (classCol1 && selectedClasses.length > 0) {
            filteredData1 = data1.filter(row => selectedClasses.includes(String(row[classCol1]).trim()));
        }

        const set1 = new Set(filteredData1.map(row => normalizeValue(row[selectedKey1])));
        const set2 = new Set(data2.map(row => normalizeValue(row[selectedKey2])));

        const missingIn2 = filteredData1.filter(row => !set2.has(normalizeValue(row[selectedKey1])));
        const surplusIn2 = data2.filter(row => !set1.has(normalizeValue(row[selectedKey2])));
        const common = filteredData1.filter(row => set2.has(normalizeValue(row[selectedKey1])));

        setComparisonResult({
            missing: missingIn2,
            surplus: surplusIn2,
            common: common
        });
        setIsProcessing(false);
    }, 500);
  };

  // --- 5. EXPORTS ---
  const getEssentialData = (row, mapping) => ({
    "Matricule": row[mapping.matricule] || "-",
    "Nom": row[mapping.nom] || "-",
    "Prénoms": row[mapping.prenom] || "-",
    "Classe": row[mapping.classe] || "-"
  });

  const exportExcel = (dataToExport, fileName, mapping) => {
    const cleanData = dataToExport.map(row => getEssentialData(row, mapping));
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultats");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportPDF = (dataToExport, title, mapping) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Rapport Comparatif", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Type: ${title}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);

    const headers = ["Matricule", "Nom", "Prénoms", "Classe"];
    const colClass = mapping.classe;

    let finalY = 40; 

    if (colClass) {
        const groupedData = dataToExport.reduce((acc, row) => {
            const className = row[colClass] || "Sans Classe";
            if (!acc[className]) acc[className] = [];
            acc[className].push(row);
            return acc;
        }, {});

        Object.keys(groupedData).sort().forEach((cls) => {
            const rows = groupedData[cls].map(row => [
                row[mapping.matricule] || "-",
                row[mapping.nom] || "-",
                row[mapping.prenom] || "-",
                row[mapping.classe] || "-"
            ]);

            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(79, 70, 229); // Indigo
            doc.text(`Classe : ${cls} (${rows.length})`, 14, finalY);
            
            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: finalY + 5,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255 },
                styles: { fontSize: 9, cellPadding: 2 },
                alternateRowStyles: { fillColor: [245, 247, 255] }
            });

            finalY = doc.lastAutoTable.finalY + 15;
        });
    } else {
        const rows = dataToExport.map(row => [
            row[mapping.matricule] || "-",
            row[mapping.nom] || "-",
            row[mapping.prenom] || "-",
            row[mapping.classe] || "-"
        ]);
        
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 247, 255] }
        });
    }

    doc.save(`${title}.pdf`);
  };

  const getCurrentMapping = () => activeTab === 'surplus' ? displayMapping2 : displayMapping1;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 transition-colors">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-all active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                <ArrowRightLeft className="w-4 h-4"/>
                <h2 className="font-black text-xs uppercase tracking-[0.2em]">Comparateur</h2>
            </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
        
        {/* IMPORTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-8">
            <div className={`p-6 rounded-3xl border-2 border-dashed transition-all relative group ${file1 ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-6 h-6"/>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{file1 ? file1.name : "Fichier Référence (A)"}</h3>
                    <label className="mt-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase cursor-pointer hover:scale-105 transition-transform">
                        {file1 ? "Changer A" : "Importer A"}
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, setFile1, setData1, setColumns1, setSelectedKey1, setDisplayMapping1, true)} />
                    </label>
                </div>
            </div>

            <div className={`p-6 rounded-3xl border-2 border-dashed transition-all relative group ${file2 ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-6 h-6"/>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{file2 ? file2.name : "Fichier Comparé (B)"}</h3>
                    <label className="mt-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase cursor-pointer hover:scale-105 transition-transform">
                        {file2 ? "Changer B" : "Importer B"}
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, setFile2, setData2, setColumns2, setSelectedKey2, setDisplayMapping2, false)} />
                    </label>
                </div>
            </div>
        </div>

        {/* --- CONFIGURATION --- */}
        {data1.length > 0 && data2.length > 0 && !comparisonResult && (
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900 mb-8 animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">
                    <Settings className="w-5 h-5" />
                    <h3 className="font-black text-sm uppercase">Configuration</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    {/* Clés */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><ArrowRightLeft className="w-3 h-3"/> Colonnes de Correspondance</h4>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Identifiant Fichier A</label>
                            <select value={selectedKey1} onChange={(e) => setSelectedKey1(e.target.value)} className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none">
                                {columns1.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Identifiant Fichier B</label>
                            <select value={selectedKey2} onChange={(e) => setSelectedKey2(e.target.value)} className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none">
                                {columns2.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Filtre Classe */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Filter className="w-3 h-3"/> Filtrer Classe (Fichier A)</h4>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Colonne Classe</label>
                            <select 
                                value={classCol1} 
                                onChange={(e) => handleClassColumnSelect(e.target.value)} 
                                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none mb-3"
                            >
                                <option value="">-- Pas de filtrage --</option>
                                {columns1.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        {availableClasses.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{selectedClasses.length} sélec.</span>
                                    <button onClick={toggleAllClasses} className="text-[10px] font-bold text-indigo-500 hover:underline">Tout</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableClasses.map(cls => (
                                        <label key={cls} className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
                                            <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => toggleClass(cls)} className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cls}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button 
                        onClick={processComparison}
                        disabled={isProcessing}
                        className="w-full md:w-auto px-12 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm uppercase shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isProcessing ? "Analyse..." : "Comparer"}
                        {!isProcessing && <ArrowRightLeft className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
        )}

        {/* RÉSULTATS */}
        {comparisonResult && (
            <div className="w-full max-w-6xl animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex justify-center gap-4 mb-6">
                    <button onClick={() => setActiveTab('missing')} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab === 'missing' ? 'bg-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><XCircle className="w-4 h-4"/> Manquants B ({comparisonResult.missing.length})</button>
                    <button onClick={() => setActiveTab('surplus')} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab === 'surplus' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><AlertTriangle className="w-4 h-4"/> Surplus B ({comparisonResult.surplus.length})</button>
                    <button onClick={() => setActiveTab('common')} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab === 'common' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><CheckCircle2 className="w-4 h-4"/> Communs ({comparisonResult.common.length})</button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Search className="w-4 h-4"/>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {activeTab === 'missing' ? "Présents dans A, Absents de B" : activeTab === 'surplus' ? "Présents dans B, Absents de A" : "Présents dans les deux listes"}
                            </span>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setComparisonResult(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-colors">Nouvelle recherche</button>
                            
                            <button 
                                onClick={() => exportExcel(comparisonResult[activeTab], `Resultat_${activeTab}`, getCurrentMapping())}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-3 h-3"/> Excel
                            </button>
                            <button 
                                onClick={() => exportPDF(comparisonResult[activeTab], `Rapport_${activeTab}`, getCurrentMapping())}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-colors"
                            >
                                <FileText className="w-3 h-3"/> PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {/* MODIFICATION ICI : SUPPRESSION DES BORDURES VERTICALES */}
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                                <tr>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 w-12 text-center">#</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Matricule</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Nom</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Prénoms</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Classe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {comparisonResult[activeTab].map((row, idx) => {
                                    const mapping = getCurrentMapping();
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-3 text-xs text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-slate-800 text-center">{idx + 1}</td>
                                            <td className="p-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">{row[mapping.matricule] || "-"}</td>
                                            <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">{row[mapping.nom] || "-"}</td>
                                            <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">{row[mapping.prenom] || "-"}</td>
                                            <td className="p-3 text-xs text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">{row[mapping.classe] || "-"}</td>
                                        </tr>
                                    );
                                })}
                                {comparisonResult[activeTab].length === 0 && (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 dark:text-slate-600 text-sm">Aucune donnée.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};

export default ComparatorTool;