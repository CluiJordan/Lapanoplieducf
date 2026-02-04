import React, { useState, useEffect } from 'react';
import { 
  Upload, Download, ChevronLeft, ArrowRight, LayoutList, 
  Settings, RefreshCw, Plus, FileSpreadsheet, FileText, Grid 
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
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  // --- LOGIQUE MÉTIER ---
  const detectBestHeaderRow = (data) => { if (!data || data.length === 0) return 1; let bestRow = 0; let maxColumns = 0; for (let i = 0; i < Math.min(data.length, 10); i++) { const row = data[i]; if (Array.isArray(row)) { const filledCols = row.filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0).length; if (filledCols > maxColumns) { maxColumns = filledCols; bestRow = i; } } } return bestRow + 1; };
  const parseFiledata = (data, rowIndex, keepSelection = false) => { const rIndex = rowIndex - 1; if (rIndex < 0 || rIndex >= data.length) return; const rawHeaders = data[rIndex]; if (!rawHeaders) return; const headers = rawHeaders.map(h => String(h || "").trim()).filter(h => h !== ""); setAllHeaders(headers); if (!keepSelection) setSelectedHeaders([]); const previewRows = data.slice(rIndex + 1, rIndex + 6).map(row => { let obj = {}; rawHeaders.forEach((h, colIndex) => { const cleanH = String(h || "").trim(); if (cleanH) { obj[cleanH] = row[colIndex]; } }); Object.keys(row).forEach(key => { if (!rawHeaders.includes(key) && isNaN(key)) { obj[key] = row[key]; } }); return obj; }); setPreviewData(previewRows); };
  const handleFileUpload = (e) => { const uploadedFile = e.target.files[0]; if (!uploadedFile) return; setFile(uploadedFile); setIsProcessing(true); const reader = new FileReader(); reader.onload = (evt) => { const bstr = evt.target.result; const wb = XLSX.read(bstr, { type: 'binary' }); const ws = wb.Sheets[wb.SheetNames[0]]; const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }); setRawData(data); const bestRow = detectBestHeaderRow(data); setHeaderRowIndex(bestRow); parseFiledata(data, bestRow); setIsProcessing(false); }; reader.readAsBinaryString(uploadedFile); };
  useEffect(() => { if (rawData.length > 0) { parseFiledata(rawData, headerRowIndex, true); } }, [headerRowIndex, rawData]);
  const toggleHeader = (header) => { if (selectedHeaders.includes(header)) { setSelectedHeaders(selectedHeaders.filter(h => h !== header)); } else { setSelectedHeaders([...selectedHeaders, header]); } };
  const moveHeader = (index, direction) => { const newHeaders = [...selectedHeaders]; if (direction === 'up' && index > 0) { [newHeaders[index], newHeaders[index - 1]] = [newHeaders[index - 1], newHeaders[index]]; } else if (direction === 'down' && index < newHeaders.length - 1) { [newHeaders[index], newHeaders[index + 1]] = [newHeaders[index + 1], newHeaders[index]]; } setSelectedHeaders(newHeaders); };
  const addEmptyColumn = () => { if(!newColName.trim()) return; const name = newColName.trim(); if(!allHeaders.includes(name)) { setAllHeaders([...allHeaders, name]); } if(!selectedHeaders.includes(name)) { setSelectedHeaders([...selectedHeaders, name]); } setIsAddColModalOpen(false); setNewColName(''); };
  const exportData = (type) => { if (selectedHeaders.length === 0) return; const rIndex = headerRowIndex - 1; const rawHeaders = rawData[rIndex]; const colIndices = {}; rawHeaders.forEach((h, idx) => { const cleanH = String(h || "").trim(); if (cleanH) colIndices[cleanH] = idx; }); const rowsToExport = rawData.slice(rIndex + 1).map(row => { const newObj = {}; selectedHeaders.forEach(header => { if(colIndices[header] !== undefined) { newObj[header] = row[colIndices[header]]; } else { newObj[header] = ""; } }); return newObj; }); const ws = XLSX.utils.json_to_sheet(rowsToExport, { header: selectedHeaders }); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Extrait"); const fileName = `extrait_${file.name.split('.')[0]}`; if (type === 'csv') XLSX.writeFile(wb, `${fileName}.csv`); else XLSX.writeFile(wb, `${fileName}.xlsx`); };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 animate-in fade-in duration-500">
        {/* HEADER TOOLBAR */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm h-16 shrink-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
                <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
                {!file ? (
                     <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase cursor-pointer hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
                        <Upload className="w-4 h-4"/> Charger Excel
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                ) : (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded text-xs font-bold text-orange-800">
                            <FileSpreadsheet className="w-3.5 h-3.5"/> {file.name}
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ligne Titres</span>
                             <input type="number" min="1" value={headerRowIndex} onChange={(e) => setHeaderRowIndex(parseInt(e.target.value) || 1)} className="w-12 py-1 text-center border border-slate-300 rounded text-xs font-bold text-indigo-600 focus:border-indigo-500 outline-none"/>
                             <button onClick={() => parseFiledata(rawData, headerRowIndex)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><RefreshCw className="w-3.5 h-3.5"/></button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => exportData('csv')} disabled={!selectedHeaders.length} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black uppercase rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"><FileText className="w-3.5 h-3.5"/> CSV</button>
                <button onClick={() => exportData('xlsx')} disabled={!selectedHeaders.length} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"><Download className="w-3.5 h-3.5"/> Excel</button>
            </div>
        </div>

        {/* WORKBENCH */}
        {!file ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-white animate-in zoom-in-95 duration-500">
                    <Grid className="w-10 h-10 opacity-20 text-orange-900"/>
                </div>
                <p className="font-bold text-sm uppercase tracking-widest opacity-60">En attente de fichier</p>
            </div>
        ) : (
            <div className="flex flex-1 overflow-hidden">
                
                {/* VOLET GAUCHE : SÉLECTION DES CHAMPS */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Colonnes Disponibles</span>
                        <button onClick={() => setIsAddColModalOpen(true)} className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"><Plus className="w-3 h-3"/> Créer</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {allHeaders.map((header, idx) => (
                            <label key={idx} className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-xs select-none transition-all ${selectedHeaders.includes(header) ? 'bg-orange-50 text-orange-900 font-bold border border-orange-100' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}>
                                <input type="checkbox" checked={selectedHeaders.includes(header)} onChange={() => toggleHeader(header)} className="accent-orange-600 rounded-sm w-3.5 h-3.5" />
                                <span className="truncate" title={header}>{header}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* CENTRE : APERÇU TABLEUR */}
                <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative">
                    <div className="flex-1 overflow-auto custom-scrollbar m-4 bg-white border border-slate-300 shadow-sm rounded-sm">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    {/* CORRECTION ICI : Ajout de la colonne # dans le header */}
                                    <th className="w-12 bg-slate-100 border-r border-b border-slate-300 text-center text-[10px] font-bold text-slate-500">#</th>
                                    
                                    {selectedHeaders.length === 0 && <th className="p-8 text-center text-slate-400 text-xs font-normal italic border-none bg-white">Sélectionnez des colonnes à gauche pour construire votre fichier...</th>}
                                    
                                    {selectedHeaders.map((h, i) => (
                                        <th key={i} className="px-3 py-2 border-b border-r border-slate-300 text-[10px] font-bold text-slate-600 w-40 truncate relative group bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="flex justify-between items-center w-full">
                                                <span className="truncate pr-2">{h}</span>
                                                <div className="flex opacity-0 group-hover:opacity-100 shrink-0 bg-slate-200 rounded">
                                                     <button onClick={() => moveHeader(i, 'up')} disabled={i===0} className="p-0.5 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronLeft className="w-3 h-3"/></button>
                                                     <button onClick={() => moveHeader(i, 'down')} disabled={i===selectedHeaders.length-1} className="p-0.5 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ArrowRight className="w-3 h-3"/></button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {previewData.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-orange-50/10 transition-colors">
                                        <td className="bg-slate-50 border-r border-slate-300 text-center text-[10px] text-slate-400 font-mono select-none border-b border-slate-200 font-bold">{rIdx + 1}</td>
                                        {selectedHeaders.map((h, cIdx) => (
                                            <td key={cIdx} className="px-3 py-1.5 text-xs text-slate-700 border-r border-slate-200 truncate font-mono border-b border-slate-100">
                                                {row[h] !== undefined ? row[h] : ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="h-8 bg-slate-200 border-t border-slate-300 flex items-center px-4 text-[10px] font-bold text-slate-500 uppercase justify-between shrink-0">
                         <span>Aperçu (5 premières lignes)</span>
                         <span>{selectedHeaders.length} Colonnes sélectionnées</span>
                    </div>
                </div>
            </div>
        )}
        
        {/* Modal ajout colonne */}
        {isAddColModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-white animate-in zoom-in-95">
                    <h3 className="text-xs font-black text-slate-700 mb-4 uppercase tracking-widest">Ajouter une colonne vide</h3>
                    <input autoFocus type="text" placeholder="Nom (ex: Observations)" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 mb-6 transition-all"/>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsAddColModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase transition-colors">Annuler</button>
                        <button onClick={addEmptyColumn} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-200 transition-all active:scale-95">Ajouter</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ColumnExtractorTool;