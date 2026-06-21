import React, { useState, useEffect } from 'react';
import {
  Upload, Download, ChevronLeft, ArrowRight, LayoutList,
  RefreshCw, Plus, FileSpreadsheet, FileText, Grid, X, CheckSquare, Square
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ColumnExtractorTool = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(1);
  const [allHeaders, setAllHeaders] = useState([]);
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  const detectBestHeaderRow = (data) => {
    if (!data || data.length === 0) return 1;
    let bestRow = 0, maxColumns = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const filledCols = row.filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0).length;
        if (filledCols > maxColumns) { maxColumns = filledCols; bestRow = i; }
      }
    }
    return bestRow + 1;
  };

  const parseFiledata = (data, rowIndex, keepSelection = false) => {
    const rIndex = rowIndex - 1;
    if (rIndex < 0 || rIndex >= data.length) return;
    const rawHeaders = data[rIndex];
    if (!rawHeaders) return;
    const headers = rawHeaders.map(h => String(h || '').trim()).filter(h => h !== '');
    setAllHeaders(headers);
    if (!keepSelection) setSelectedHeaders([]);
    const previewRows = data.slice(rIndex + 1, rIndex + 6).map(row => {
      const obj = {};
      rawHeaders.forEach((h, colIndex) => {
        const cleanH = String(h || '').trim();
        if (cleanH) obj[cleanH] = row[colIndex];
      });
      return obj;
    });
    setPreviewData(previewRows);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      setRawData(data);
      const bestRow = detectBestHeaderRow(data);
      setHeaderRowIndex(bestRow);
      parseFiledata(data, bestRow);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  useEffect(() => {
    if (rawData.length > 0) parseFiledata(rawData, headerRowIndex, true);
  }, [headerRowIndex, rawData]);

  const toggleHeader = (header) => {
    setSelectedHeaders(prev =>
      prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
    );
  };

  const selectAll = () => setSelectedHeaders([...allHeaders]);
  const selectNone = () => setSelectedHeaders([]);

  const moveHeader = (index, direction) => {
    const newHeaders = [...selectedHeaders];
    if (direction === 'up' && index > 0) {
      [newHeaders[index], newHeaders[index - 1]] = [newHeaders[index - 1], newHeaders[index]];
    } else if (direction === 'down' && index < newHeaders.length - 1) {
      [newHeaders[index], newHeaders[index + 1]] = [newHeaders[index + 1], newHeaders[index]];
    }
    setSelectedHeaders(newHeaders);
  };

  const addEmptyColumn = () => {
    if (!newColName.trim()) return;
    const name = newColName.trim();
    if (!allHeaders.includes(name)) setAllHeaders(prev => [...prev, name]);
    if (!selectedHeaders.includes(name)) setSelectedHeaders(prev => [...prev, name]);
    setIsAddColModalOpen(false);
    setNewColName('');
  };

  const exportData = (type) => {
    if (selectedHeaders.length === 0) return;
    const rIndex = headerRowIndex - 1;
    const rawHeaders = rawData[rIndex];
    const colIndices = {};
    rawHeaders.forEach((h, idx) => {
      const cleanH = String(h || '').trim();
      if (cleanH) colIndices[cleanH] = idx;
    });
    const rowsToExport = rawData.slice(rIndex + 1).map(row => {
      const newObj = {};
      selectedHeaders.forEach(header => {
        newObj[header] = colIndices[header] !== undefined ? row[colIndices[header]] : '';
      });
      return newObj;
    });
    const ws = XLSX.utils.json_to_sheet(rowsToExport, { header: selectedHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extrait');
    const fileName = `extrait_${file.name.split('.')[0]}`;
    if (type === 'csv') XLSX.writeFile(wb, `${fileName}.csv`);
    else XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const allSelected = allHeaders.length > 0 && selectedHeaders.length === allHeaders.length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">

      {/* HEADER TOOLBAR */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-5 flex items-center justify-between h-16 shrink-0 z-20 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 transition-all active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400">
            <LayoutList className="w-4 h-4" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em]">Extracteur de colonnes</h2>
          </div>
          {file && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-lg">
                <FileSpreadsheet className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-bold text-orange-800 dark:text-orange-300 max-w-[180px] truncate">{file.name}</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">Ligne titres</span>
                <input
                  type="number" min="1"
                  value={headerRowIndex}
                  onChange={(e) => setHeaderRowIndex(parseInt(e.target.value) || 1)}
                  className="w-12 py-1 text-center border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-xs font-bold text-orange-600 dark:text-orange-400 outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                />
                <button onClick={() => parseFiledata(rawData, headerRowIndex)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!file ? (
            <label className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs uppercase cursor-pointer transition-all shadow-sm active:scale-95">
              <Upload className="w-4 h-4" /> Charger un fichier
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          ) : (
            <>
              <button onClick={() => exportData('csv')} disabled={!selectedHeaders.length} className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] font-black uppercase rounded-xl shadow-sm disabled:opacity-40 flex items-center gap-1.5 transition-all active:scale-95">
                <FileText className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => exportData('xlsx')} disabled={!selectedHeaders.length} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-xl shadow-sm disabled:opacity-40 flex items-center gap-1.5 transition-all active:scale-95">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* WORKBENCH */}
      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-400">
          <label className="cursor-pointer flex flex-col items-center group">
            <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-200 dark:border-zinc-800 group-hover:border-orange-300 dark:group-hover:border-orange-700 transition-all animate-in">
              <Grid className="w-10 h-10 text-slate-200 dark:text-zinc-700 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
              Charger un fichier Excel
            </p>
            <p className="text-xs text-slate-300 dark:text-zinc-600 mt-1">.xlsx ou .xls</p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT PANEL */}
          <div className="w-60 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 transition-colors">
            <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/40">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">Colonnes</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={allSelected ? selectNone : selectAll}
                  title={allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  className="flex items-center gap-1 text-[10px] font-bold text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors px-1"
                >
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {allSelected ? 'Aucune' : 'Toutes'}
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-zinc-700" />
                <button
                  onClick={() => setIsAddColModalOpen(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {allHeaders.map((header, idx) => {
                const isSelected = selectedHeaders.includes(header);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs select-none transition-all ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-300 font-bold border border-orange-100 dark:border-orange-900/40'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleHeader(header)}
                      className="accent-orange-500 rounded-sm w-3.5 h-3.5 shrink-0"
                    />
                    <span className="truncate" title={header}>{header}</span>
                  </label>
                );
              })}
              {allHeaders.length === 0 && (
                <p className="text-xs text-slate-300 dark:text-zinc-600 text-center py-8">Aucune colonne</p>
              )}
            </div>
            <div className="px-3 py-2 border-t border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase">
              {selectedHeaders.length}/{allHeaders.length} sélectionnées
            </div>
          </div>

          {/* PREVIEW TABLE */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-zinc-950 overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar m-4 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 shadow-sm rounded-xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-slate-50 dark:bg-zinc-800/80 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 bg-slate-100 dark:bg-zinc-900 border-r border-b border-slate-200 dark:border-zinc-700 text-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 p-2">#</th>
                    {selectedHeaders.length === 0 && (
                      <th className="p-8 text-center text-slate-300 dark:text-zinc-600 text-xs font-normal italic border-none">
                        Cochez des colonnes à gauche pour construire votre export…
                      </th>
                    )}
                    {selectedHeaders.map((h, i) => (
                      <th key={i} className="px-3 py-2 border-b border-r border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-600 dark:text-zinc-300 w-36 truncate group bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
                        <div className="flex justify-between items-center w-full">
                          <span className="truncate pr-2">{h}</span>
                          <div className="flex opacity-0 group-hover:opacity-100 shrink-0 bg-slate-200 dark:bg-zinc-600 rounded overflow-hidden">
                            <button onClick={() => moveHeader(i, 'up')} disabled={i === 0} className="p-0.5 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-25 transition-colors">
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button onClick={() => moveHeader(i, 'down')} disabled={i === selectedHeaders.length - 1} className="p-0.5 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-25 transition-colors">
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-orange-50/20 dark:hover:bg-orange-900/5 transition-colors">
                      <td className="bg-slate-50 dark:bg-zinc-800/40 border-r border-slate-200 dark:border-zinc-700 text-center text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-bold p-2">
                        {rIdx + 1}
                      </td>
                      {selectedHeaders.map((h, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800 truncate font-mono">
                          {row[h] !== undefined ? row[h] : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {previewData.length === 0 && selectedHeaders.length > 0 && (
                    <tr>
                      <td colSpan={selectedHeaders.length + 1} className="p-8 text-center text-xs text-slate-300 dark:text-zinc-600">
                        Aucune donnée disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="h-9 bg-slate-200 dark:bg-zinc-800 border-t border-slate-300 dark:border-zinc-700 flex items-center px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase justify-between shrink-0">
              <span>Aperçu — 5 premières lignes</span>
              <span>{selectedHeaders.length} colonne{selectedHeaders.length > 1 ? 's' : ''} sélectionnée{selectedHeaders.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ajout colonne */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-7 w-full max-w-sm border border-slate-200 dark:border-zinc-700 animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-widest">Ajouter une colonne vide</h3>
              <button onClick={() => setIsAddColModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Nom (ex: Observations)"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEmptyColumn()}
              className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 mb-5 transition-all text-slate-800 dark:text-zinc-200 placeholder-slate-400"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsAddColModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-black uppercase transition-colors">
                Annuler
              </button>
              <button onClick={addEmptyColumn} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnExtractorTool;
