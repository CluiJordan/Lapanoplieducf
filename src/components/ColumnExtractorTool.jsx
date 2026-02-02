import React, { useState, useEffect } from 'react';
import { 
  Upload, FileSpreadsheet, Download, ChevronLeft, 
  ArrowRight, X, CheckCircle, Eye, FileText, LayoutList, 
  Settings, RefreshCw, Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ColumnExtractorTool = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]); 
  const [headerRowIndex, setHeaderRowIndex] = useState(1); 
  const [allHeaders, setAllHeaders] = useState([]);
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // États pour Ajout Colonne Vide
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  const detectBestHeaderRow = (data) => { if (!data || data.length === 0) return 1; let bestRow = 0; let maxColumns = 0; for (let i = 0; i < Math.min(data.length, 10); i++) { const row = data[i]; if (Array.isArray(row)) { const filledCols = row.filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0).length; if (filledCols > maxColumns) { maxColumns = filledCols; bestRow = i; } } } return bestRow + 1; };
  
  const parseFiledata = (data, rowIndex, keepSelection = false) => { 
    const rIndex = rowIndex - 1; 
    if (rIndex < 0 || rIndex >= data.length) return; 
    const rawHeaders = data[rIndex]; 
    if (!rawHeaders) return; 
    const headers = rawHeaders.map(h => String(h || "").trim()).filter(h => h !== "");
    setAllHeaders(headers); 
    if (!keepSelection) setSelectedHeaders([]); 

    const previewRows = data.slice(rIndex + 1, rIndex + 6).map(row => { 
        let obj = {}; 
        rawHeaders.forEach((h, colIndex) => { 
            const cleanH = String(h || "").trim(); 
            if (cleanH) { obj[cleanH] = row[colIndex]; } 
        });
        // Gérer les colonnes virtuelles ajoutées manuellement
        Object.keys(row).forEach(key => {
            if (!rawHeaders.includes(key) && isNaN(key)) { obj[key] = row[key]; }
        });
        return obj; 
    }); 
    setPreviewData(previewRows); 
  };

  const handleFileUpload = (e) => { 
    const uploadedFile = e.target.files[0]; 
    if (!uploadedFile) return; 
    setFile(uploadedFile); 
    setIsProcessing(true); 
    const reader = new FileReader(); 
    reader.onload = (evt) => { 
        const bstr = evt.target.result; 
        const wb = XLSX.read(bstr, { type: 'binary' }); 
        const ws = wb.Sheets[wb.SheetNames[0]]; 
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }); 
        setRawData(data); 
        const bestRow = detectBestHeaderRow(data); 
        setHeaderRowIndex(bestRow); 
        parseFiledata(data, bestRow); 
        setIsProcessing(false); 
    }; 
    reader.readAsBinaryString(uploadedFile); 
  };

  useEffect(() => { if (rawData.length > 0) { parseFiledata(rawData, headerRowIndex, true); } }, [headerRowIndex, rawData]);

  const toggleHeader = (header) => { if (selectedHeaders.includes(header)) { setSelectedHeaders(selectedHeaders.filter(h => h !== header)); } else { setSelectedHeaders([...selectedHeaders, header]); } };
  
  const moveHeader = (index, direction) => { 
    const newHeaders = [...selectedHeaders]; 
    if (direction === 'up' && index > 0) { [newHeaders[index], newHeaders[index - 1]] = [newHeaders[index - 1], newHeaders[index]]; } 
    else if (direction === 'down' && index < newHeaders.length - 1) { [newHeaders[index], newHeaders[index + 1]] = [newHeaders[index + 1], newHeaders[index]]; } 
    setSelectedHeaders(newHeaders); 
  };

  const addEmptyColumn = () => {
    if(!newColName.trim()) return;
    const name = newColName.trim();
    if(!allHeaders.includes(name)) { setAllHeaders([...allHeaders, name]); }
    if(!selectedHeaders.includes(name)) { setSelectedHeaders([...selectedHeaders, name]); }
    setIsAddColModalOpen(false); setNewColName('');
  };

  const exportData = (type) => { 
    if (selectedHeaders.length === 0) return; 
    const rIndex = headerRowIndex - 1; 
    const rawHeaders = rawData[rIndex]; 
    const colIndices = {}; 
    rawHeaders.forEach((h, idx) => { const cleanH = String(h || "").trim(); if (cleanH) colIndices[cleanH] = idx; }); 

    const rowsToExport = rawData.slice(rIndex + 1).map(row => { 
        const newObj = {}; 
        selectedHeaders.forEach(header => { 
            if(colIndices[header] !== undefined) { newObj[header] = row[colIndices[header]]; } 
            else { newObj[header] = ""; }
        }); 
        return newObj; 
    }); 
    
    const ws = XLSX.utils.json_to_sheet(rowsToExport, { header: selectedHeaders }); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Extrait"); 
    const fileName = `extrait_${file.name.split('.')[0]}`; 
    if (type === 'csv') XLSX.writeFile(wb, `${fileName}.csv`); 
    else XLSX.writeFile(wb, `${fileName}.xlsx`); 
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 relative">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-full border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex items-center gap-3">
            <img src="/favicon.png" className="h-10 w-10 object-contain" alt="icon" />
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Extracteur</h2>
        </div>
      </div>

      {!file ? (
        <div className="max-w-4xl mx-auto mt-10">
             <div className={`h-80 rounded-[40px] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-6 group hover:border-orange-300 hover:bg-orange-50/30 border-slate-200 bg-white`}>
                <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <LayoutList className="w-10 h-10 text-orange-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-700 uppercase tracking-wide">Déposez votre fichier ici</h3>
                    <p className="text-slate-400 font-medium mt-2 uppercase tracking-widest text-xs">Excel .xlsx, .xls</p>
                </div>
                <label className="cursor-pointer bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    Sélectionner un fichier
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[750px]">
            <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 shrink-0">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 rounded-xl"><FileSpreadsheet className="w-6 h-6 text-green-600"/></div>
                            <div className="overflow-hidden"><p className="font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p><button onClick={() => setFile(null)} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wide">Changer de fichier</button></div>
                        </div>
                        <div className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-500">{allHeaders.length} Colonnes</div>
                    </div>
                    
                    {/* Actions Simplifiées */}
                    <button onClick={() => setIsAddColModalOpen(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-[10px] uppercase transition-colors">
                        <Plus className="w-4 h-4"/> Ajouter une colonne vide
                    </button>

                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-slate-500"><Settings className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-widest">Ligne des titres :</span></div>
                        <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400">N°</span><input type="number" min="1" max="100" value={headerRowIndex} onChange={(e) => setHeaderRowIndex(parseInt(e.target.value) || 1)} className="w-16 h-10 text-center font-black text-indigo-600 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"/><button onClick={() => parseFiledata(rawData, headerRowIndex)} className="p-2 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 active:rotate-180 transition-all"><RefreshCw className="w-4 h-4"/></button></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-black text-xs uppercase text-slate-400 tracking-widest">Colonnes Disponibles</h3>
                        <div className="flex gap-2"><button onClick={() => setSelectedHeaders(allHeaders)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100">Tout</button><button onClick={() => setSelectedHeaders([])} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md hover:bg-slate-100">Rien</button></div>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-2">
                        {allHeaders.map((header, idx) => { const isSelected = selectedHeaders.includes(header); return ( <button key={idx} onClick={() => toggleHeader(header)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/30'}`}><span className="font-bold text-xs truncate mr-2 text-left">{header}</span>{isSelected ? <CheckCircle className="w-4 h-4 shrink-0 text-white" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-300"></div>}</button> ); })}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6 h-full">
                <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl text-white shrink-0">
                    <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><LayoutList className="w-5 h-5 text-orange-400" /><h3 className="font-black text-sm uppercase tracking-widest">Sortie ({selectedHeaders.length} cols)</h3></div></div>
                    {selectedHeaders.length === 0 ? ( <div className="h-32 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-medium uppercase tracking-wider">Sélectionnez des colonnes à gauche</div> ) : ( <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">{selectedHeaders.map((header, idx) => ( <div key={idx} className="flex-shrink-0 w-36 bg-slate-800 rounded-2xl p-3 border border-slate-700 relative group hover:border-orange-400/50 transition-colors"><div className="absolute -top-2 -left-2 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg z-10">{idx + 1}</div><p className="font-bold text-slate-200 text-xs truncate mb-4 mt-1" title={header}>{header}</p><div className="flex gap-1 justify-center bg-slate-900/50 p-1 rounded-lg"><button onClick={() => moveHeader(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-700 rounded disabled:opacity-20"><ChevronLeft className="w-3 h-3 text-white" /></button><button onClick={() => toggleHeader(header)} className="p-1 hover:bg-red-900/50 rounded group/del"><X className="w-3 h-3 text-slate-500 group-hover/del:text-red-400" /></button><button onClick={() => moveHeader(idx, 'down')} disabled={idx === selectedHeaders.length - 1} className="p-1 hover:bg-slate-700 rounded disabled:opacity-20"><ArrowRight className="w-3 h-3 text-white" /></button></div></div> ))}</div> )}
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h3 className="font-black text-xs uppercase text-slate-500 tracking-widest flex items-center gap-2"><Eye className="w-4 h-4"/> Aperçu</h3>
                        <div className="flex gap-2"><button onClick={() => exportData('csv')} disabled={selectedHeaders.length===0} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-emerald-100"><FileText className="w-3 h-3"/> CSV</button><button onClick={() => exportData('xlsx')} disabled={selectedHeaders.length===0} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-indigo-100"><Download className="w-3 h-3"/> Excel</button></div>
                    </div>
                    <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50/30">
                        <table className="w-full text-left text-sm border-collapse"><thead><tr>{selectedHeaders.map((h, i) => ( <th key={i} className="px-4 py-3 bg-white font-black text-[10px] text-indigo-900 uppercase tracking-wider border-b-2 border-indigo-50 whitespace-nowrap sticky top-0 first:pl-6">{h}</th> ))}</tr></thead><tbody className="divide-y divide-slate-100">{previewData.map((row, rIdx) => ( <tr key={rIdx} className="hover:bg-white transition-colors group">{selectedHeaders.map((h, cIdx) => ( <td key={cIdx} className="px-4 py-2.5 text-xs text-slate-600 font-mono border-r border-slate-50 last:border-r-0 whitespace-nowrap first:pl-6 group-hover:text-slate-900">{row[h] !== undefined ? row[h] : ""}</td> ))}</tr> ))}</tbody></table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isAddColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] p-8 w-full max-w-sm animate-in zoom-in-95 border border-white">
                <h3 className="text-xl font-black text-slate-800 mb-4 uppercase">Nouvelle Colonne</h3>
                <input autoFocus type="text" placeholder="Nom (ex: Observations)" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 font-bold outline-none focus:border-indigo-500"/>
                <div className="flex gap-2"><button onClick={() => setIsAddColModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Annuler</button><button onClick={addEmptyColumn} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Ajouter</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ColumnExtractorTool;