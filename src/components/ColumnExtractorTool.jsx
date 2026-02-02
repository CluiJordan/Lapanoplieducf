import React, { useState } from 'react';
import { 
  Upload, FileSpreadsheet, Download, ChevronLeft, 
  ArrowUp, ArrowDown, X, Check, Eye, FileText, LayoutList 
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ColumnExtractorTool = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [allHeaders, setAllHeaders] = useState([]);
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // Extraction des données brutes
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        // La première ligne contient les en-têtes
        const headers = data[0].map(h => String(h).trim()).filter(h => h !== "");
        setAllHeaders(headers);
        
        // Par défaut, on ne sélectionne rien (ou tout, selon préférence. Ici: rien pour forcer le tri)
        setSelectedHeaders([]); 
        
        // On garde les données complètes pour l'export
        // On transforme en tableau d'objets pour faciliter la manip
        const jsonData = XLSX.utils.sheet_to_json(ws);
        setFullData(jsonData);
        setPreviewData(jsonData.slice(0, 5)); // Aperçu des 5 premières lignes
      }
      setIsProcessing(false);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const toggleHeader = (header) => {
    if (selectedHeaders.includes(header)) {
      setSelectedHeaders(selectedHeaders.filter(h => h !== header));
    } else {
      setSelectedHeaders([...selectedHeaders, header]);
    }
  };

  const moveHeader = (index, direction) => {
    const newHeaders = [...selectedHeaders];
    if (direction === 'up' && index > 0) {
      [newHeaders[index], newHeaders[index - 1]] = [newHeaders[index - 1], newHeaders[index]];
    } else if (direction === 'down' && index < newHeaders.length - 1) {
      [newHeaders[index], newHeaders[index + 1]] = [newHeaders[index + 1], newHeaders[index]];
    }
    setSelectedHeaders(newHeaders);
  };

  const exportData = (type) => {
    if (selectedHeaders.length === 0) return;

    // Création du nouveau dataset avec uniquement les colonnes choisies dans l'ordre choisi
    const exportSet = fullData.map(row => {
      const newRow = {};
      selectedHeaders.forEach(header => {
        newRow[header] = row[header];
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportSet, { header: selectedHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extrait");

    if (type === 'csv') {
      XLSX.writeFile(wb, `extrait_${file.name.split('.')[0]}.csv`);
    } else {
      XLSX.writeFile(wb, `extrait_${file.name.split('.')[0]}.xlsx`);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Extracteur de Colonnes</h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* COLONNE GAUCHE : UPLOAD ET SÉLECTION */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Zone Upload */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${file ? 'border-green-500 bg-green-50' : 'bg-white border-dashed border-slate-200 hover:border-indigo-300'}`}>
                <div className="flex flex-col items-center text-center">
                    <LayoutList className={`w-10 h-10 mb-3 ${file ? 'text-green-600' : 'text-slate-300'}`} />
                    {!file ? (
                        <>
                            <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-3">Fichier Source</p>
                            <label className="cursor-pointer bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black active:scale-95 transition-all uppercase hover:bg-slate-800">
                                Importer Excel
                                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-green-800 text-sm truncate max-w-[200px] mb-1">{file.name}</p>
                            <button onClick={() => {setFile(null); setAllHeaders([]); setSelectedHeaders([]);}} className="text-[10px] font-bold text-slate-400 underline hover:text-red-500">Changer de fichier</button>
                        </>
                    )}
                </div>
            </div>

            {/* Liste des Colonnes Disponibles */}
            {allHeaders.length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-xs uppercase text-slate-400 tracking-widest">Colonnes Disponibles ({allHeaders.length})</h3>
                        <button onClick={() => setSelectedHeaders(allHeaders)} className="text-[10px] font-bold text-indigo-600 underline">Tout ajouter</button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {allHeaders.map((header, idx) => {
                            const isSelected = selectedHeaders.includes(header);
                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => toggleHeader(header)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95 text-left truncate max-w-full ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-400 opacity-50' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                                >
                                    {header}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {/* COLONNE DROITE : ORDRE ET APERÇU */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            
            {selectedHeaders.length > 0 ? (
                <>
                    {/* Zone de Tri */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                            <h3 className="font-black text-xs uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4"/> Ordre de Sortie ({selectedHeaders.length})
                            </h3>
                            <button onClick={() => setSelectedHeaders([])} className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1"><X className="w-3 h-3"/> Tout retirer</button>
                        </div>
                        
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {selectedHeaders.map((header, idx) => (
                                <div key={idx} className="flex-shrink-0 w-32 bg-indigo-50 rounded-xl p-3 border border-indigo-100 relative group">
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleHeader(header)} className="p-1 hover:bg-red-100 rounded text-red-400"><X className="w-3 h-3"/></button>
                                    </div>
                                    <p className="font-bold text-indigo-900 text-xs truncate mb-3" title={header}>{header}</p>
                                    <div className="flex gap-1 justify-center">
                                        <button 
                                            onClick={() => moveHeader(idx, 'up')} 
                                            disabled={idx === 0}
                                            className="p-1.5 bg-white rounded-lg text-indigo-600 disabled:opacity-30 hover:bg-indigo-600 hover:text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => moveHeader(idx, 'down')} 
                                            disabled={idx === selectedHeaders.length - 1}
                                            className="p-1.5 bg-white rounded-lg text-indigo-600 disabled:opacity-30 hover:bg-indigo-600 hover:text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-3 h-3 rotate-180" />
                                        </button>
                                    </div>
                                    <div className="absolute -top-2 -left-2 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">
                                        {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aperçu Tableau */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col animate-in fade-in">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase text-slate-500 tracking-widest flex items-center gap-2"><Eye className="w-4 h-4"/> Aperçu (5 premières lignes)</h3>
                            <div className="flex gap-2">
                                <button onClick={() => exportData('csv')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-emerald-100">
                                    <FileText className="w-3 h-3"/> CSV
                                </button>
                                <button onClick={() => exportData('xlsx')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-indigo-100">
                                    <Download className="w-3 h-3"/> Excel
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto custom-scrollbar p-4 bg-slate-50/30 flex-1">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr>
                                        {selectedHeaders.map((h, i) => (
                                            <th key={i} className="px-4 py-3 bg-white font-black text-[10px] text-indigo-900 uppercase tracking-wider border-b-2 border-indigo-50 whitespace-nowrap sticky top-0 first:rounded-tl-lg last:rounded-tr-lg">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {previewData.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white transition-colors">
                                            {selectedHeaders.map((h, cIdx) => (
                                                <td key={cIdx} className="px-4 py-2 text-xs text-slate-600 font-mono border-r border-slate-50 last:border-r-0 whitespace-nowrap">
                                                    {row[h] !== undefined ? row[h] : ""}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[40px] bg-white p-10 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <LayoutList className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">En attente de configuration</p>
                    <p className="text-xs text-slate-300 max-w-xs">Chargez un fichier puis cliquez sur les colonnes à gauche pour construire votre nouveau fichier.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ColumnExtractorTool;