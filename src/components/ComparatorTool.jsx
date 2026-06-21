import React, { useState } from 'react';
import {
  ChevronLeft, ArrowRightLeft, FileSpreadsheet,
  CheckCircle2, XCircle, AlertTriangle, Download, Search,
  Settings, FileText, Filter, Upload
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
  const [searchQuery, setSearchQuery] = useState('');

  const findHeaderRow = (ws) => {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const maxRow = Math.min(range.e.r, 20);
    let bestRow = 0;
    let maxScore = 0;
    const keywords = ['matricule', 'nom', 'prenom', 'classe', 'code', 'eleve'];
    for (let R = 0; R <= maxRow; ++R) {
      let score = 0;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ c: C, r: R })];
        if (cell && cell.v) {
          const val = String(cell.v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          if (keywords.some(k => val.includes(k))) score++;
        }
      }
      if (score > maxScore) { maxScore = score; bestRow = R; }
    }
    return bestRow;
  };

  const identifyDisplayColumns = (cols) => {
    const cleanStr = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    const findCol = (kws) => cols.find(c => kws.some(k => cleanStr(c).includes(k)));
    return {
      matricule: findCol(['matricule', 'mat', 'id', 'code', 'numero']),
      nom: findCol(['nom', 'name', 'family']),
      prenom: findCol(['prenom', 'firstname', 'first']),
      classe: findCol(['classe', 'class', 'niv', 'groupe']),
    };
  };

  const normalizeValue = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).trim().toUpperCase();
  };

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
      const jsonData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: '' });
      if (jsonData.length > 0) {
        setData(jsonData);
        const cols = Object.keys(jsonData[0]);
        setColumns(cols);
        const displayMap = identifyDisplayColumns(cols);
        setDisplayMapping(displayMap);
        setKey(displayMap.matricule || cols[0]);
        if (isFile1 && displayMap.classe) handleClassColumnSelect(displayMap.classe, jsonData);
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleClassColumnSelect = (colName, sourceData = data1) => {
    setClassCol1(colName);
    if (!colName) { setAvailableClasses([]); return; }
    const classes = [...new Set(sourceData.map(row => String(row[colName] || '').trim()))].filter(Boolean).sort();
    setAvailableClasses(classes);
    setSelectedClasses(classes);
  };

  const toggleClass = (cls) => {
    setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  };

  const toggleAllClasses = () => {
    setSelectedClasses(selectedClasses.length === availableClasses.length ? [] : availableClasses);
  };

  const processComparison = () => {
    if (!selectedKey1 || !selectedKey2) { alert('Sélectionnez les colonnes de comparaison.'); return; }
    setIsProcessing(true);
    setSearchQuery('');
    setTimeout(() => {
      let filteredData1 = data1;
      if (classCol1 && selectedClasses.length > 0) {
        filteredData1 = data1.filter(row => selectedClasses.includes(String(row[classCol1]).trim()));
      }
      const set1 = new Set(filteredData1.map(row => normalizeValue(row[selectedKey1])));
      const set2 = new Set(data2.map(row => normalizeValue(row[selectedKey2])));
      setComparisonResult({
        missing: filteredData1.filter(row => !set2.has(normalizeValue(row[selectedKey1]))),
        surplus: data2.filter(row => !set1.has(normalizeValue(row[selectedKey2]))),
        common: filteredData1.filter(row => set2.has(normalizeValue(row[selectedKey1]))),
      });
      setIsProcessing(false);
    }, 500);
  };

  const getEssentialData = (row, mapping) => ({
    Matricule: row[mapping.matricule] || '-',
    Nom: row[mapping.nom] || '-',
    Prénoms: row[mapping.prenom] || '-',
    Classe: row[mapping.classe] || '-',
  });

  const exportExcel = (dataToExport, fileName, mapping) => {
    const ws = XLSX.utils.json_to_sheet(dataToExport.map(row => getEssentialData(row, mapping)));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultats');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportPDF = (dataToExport, title, mapping) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(40, 40, 40);
    doc.text('Rapport Comparatif', 14, 20);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(`Type: ${title}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);
    const headers = ['Matricule', 'Nom', 'Prénoms', 'Classe'];
    const colClass = mapping.classe;
    let finalY = 40;
    if (colClass) {
      const grouped = dataToExport.reduce((acc, row) => {
        const cls = row[colClass] || 'Sans Classe';
        if (!acc[cls]) acc[cls] = [];
        acc[cls].push(row);
        return acc;
      }, {});
      Object.keys(grouped).sort().forEach((cls) => {
        const rows = grouped[cls].map(row => [row[mapping.matricule] || '-', row[mapping.nom] || '-', row[mapping.prenom] || '-', row[mapping.classe] || '-']);
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 70, 229);
        doc.text(`Classe : ${cls} (${rows.length})`, 14, finalY);
        autoTable(doc, { head: [headers], body: rows, startY: finalY + 5, theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 }, alternateRowStyles: { fillColor: [245, 247, 255] } });
        finalY = doc.lastAutoTable.finalY + 15;
      });
    } else {
      autoTable(doc, { head: [headers], body: dataToExport.map(row => [row[mapping.matricule] || '-', row[mapping.nom] || '-', row[mapping.prenom] || '-', row[mapping.classe] || '-']), startY: 40, theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 }, alternateRowStyles: { fillColor: [245, 247, 255] } });
    }
    doc.save(`${title}.pdf`);
  };

  const getCurrentMapping = () => activeTab === 'surplus' ? displayMapping2 : displayMapping1;

  const getFilteredRows = () => {
    if (!comparisonResult) return [];
    const rows = comparisonResult[activeTab];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toUpperCase();
    const mapping = getCurrentMapping();
    return rows.filter(row =>
      [mapping.matricule, mapping.nom, mapping.prenom, mapping.classe]
        .some(col => col && String(row[col] || '').toUpperCase().includes(q))
    );
  };

  const TABS = [
    { id: 'missing', label: 'Manquants dans B', color: 'red', Icon: XCircle, activeClass: 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30' },
    { id: 'surplus', label: 'Surplus dans B', color: 'orange', Icon: AlertTriangle, activeClass: 'bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30' },
    { id: 'common', label: 'Communs', color: 'emerald', Icon: CheckCircle2, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30' },
  ];

  const filteredRows = getFilteredRows();

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <ArrowRightLeft className="w-4 h-4" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em]">Comparateur</h2>
          </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-auto p-5 md:p-8 flex flex-col items-center custom-scrollbar">

        {/* FILE IMPORT ZONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl mb-7">
          {[
            {
              file: file1, label: 'Fichier Référence', sublabel: 'A', color: 'indigo',
              onChange: (e) => handleFileUpload(e, setFile1, setData1, setColumns1, setSelectedKey1, setDisplayMapping1, true),
              count: data1.length,
            },
            {
              file: file2, label: 'Fichier Comparé', sublabel: 'B', color: 'violet',
              onChange: (e) => handleFileUpload(e, setFile2, setData2, setColumns2, setSelectedKey2, setDisplayMapping2, false),
              count: data2.length,
            },
          ].map(({ file, label, sublabel, color, onChange, count }) => (
            <label
              key={sublabel}
              className={`relative flex flex-col items-center text-center p-7 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                file
                  ? `border-${color}-400 dark:border-${color}-600 bg-${color}-50 dark:bg-${color}-900/20`
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={onChange} />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                file ? `bg-${color}-100 dark:bg-${color}-900/40 text-${color}-600 dark:text-${color}-400` : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {file ? <FileSpreadsheet className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              {file ? (
                <>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-full mb-1">{file.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{count} lignes détectées</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest bg-${color}-100 dark:bg-${color}-900/40 text-${color}-700 dark:text-${color}-400 px-3 py-1 rounded-full`}>
                    Changer le fichier {sublabel}
                  </span>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">{label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Fichier {sublabel}</p>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg">
                    Importer {sublabel}
                  </span>
                </>
              )}
            </label>
          ))}
        </div>

        {/* CONFIGURATION */}
        {data1.length > 0 && data2.length > 0 && !comparisonResult && (
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 p-7 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/60 mb-7 animate-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Colonnes de correspondance */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <ArrowRightLeft className="w-3 h-3" /> Colonnes de correspondance
                </h4>
                {[
                  { label: 'Identifiant Fichier A', value: selectedKey1, onChange: (v) => setSelectedKey1(v), cols: columns1 },
                  { label: 'Identifiant Fichier B', value: selectedKey2, onChange: (v) => setSelectedKey2(v), cols: columns2 },
                ].map(({ label, value, onChange, cols }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
                    <select
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    >
                      {cols.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Filtre classe */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Filter className="w-3 h-3" /> Filtrer par classe (Fichier A)
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Colonne Classe</label>
                  <select
                    value={classCol1}
                    onChange={(e) => handleClassColumnSelect(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  >
                    <option value="">— Pas de filtrage —</option>
                    {columns1.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                {availableClasses.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{selectedClasses.length}/{availableClasses.length}</span>
                      <button onClick={toggleAllClasses} className="text-[10px] font-black text-indigo-500 hover:underline">
                        {selectedClasses.length === availableClasses.length ? 'Aucune' : 'Toutes'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {availableClasses.map(cls => (
                        <label key={cls} className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
                          <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => toggleClass(cls)} className="rounded text-indigo-600 border-gray-300 w-3.5 h-3.5" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{cls}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={processComparison}
                disabled={isProcessing}
                className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all active:scale-95 flex items-center gap-3"
              >
                {isProcessing ? 'Analyse en cours…' : 'Lancer la comparaison'}
                {!isProcessing && <ArrowRightLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* RÉSULTATS */}
        {comparisonResult && (
          <div className="w-full max-w-6xl animate-in">

            {/* STATS CARDS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div
                onClick={() => setActiveTab('missing')}
                className={`cursor-pointer rounded-2xl p-5 text-center border-2 transition-all ${activeTab === 'missing' ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-200 dark:shadow-red-900/30' : 'bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/40 hover:border-red-300'}`}
              >
                <div className={`text-3xl font-black mb-1 ${activeTab === 'missing' ? 'text-white' : 'text-red-600 dark:text-red-400'}`}>{comparisonResult.missing.length}</div>
                <div className={`text-xs font-bold ${activeTab === 'missing' ? 'text-red-100' : 'text-red-500 dark:text-red-400'}`}>Manquants dans B</div>
              </div>
              <div
                onClick={() => setActiveTab('surplus')}
                className={`cursor-pointer rounded-2xl p-5 text-center border-2 transition-all ${activeTab === 'surplus' ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-200 dark:shadow-orange-900/30' : 'bg-white dark:bg-slate-900 border-orange-100 dark:border-orange-900/40 hover:border-orange-300'}`}
              >
                <div className={`text-3xl font-black mb-1 ${activeTab === 'surplus' ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`}>{comparisonResult.surplus.length}</div>
                <div className={`text-xs font-bold ${activeTab === 'surplus' ? 'text-orange-100' : 'text-orange-500 dark:text-orange-400'}`}>Surplus dans B</div>
              </div>
              <div
                onClick={() => setActiveTab('common')}
                className={`cursor-pointer rounded-2xl p-5 text-center border-2 transition-all ${activeTab === 'common' ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30' : 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300'}`}
              >
                <div className={`text-3xl font-black mb-1 ${activeTab === 'common' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>{comparisonResult.common.length}</div>
                <div className={`text-xs font-bold ${activeTab === 'common' ? 'text-emerald-100' : 'text-emerald-500 dark:text-emerald-400'}`}>Communs</div>
              </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col" style={{ height: 460 }}>
              {/* Table toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-50/80 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Rechercher…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 w-full"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => { setComparisonResult(null); setSearchQuery(''); }}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase transition-colors"
                  >
                    Nouvelle recherche
                  </button>
                  <button
                    onClick={() => exportExcel(comparisonResult[activeTab], `Resultat_${activeTab}`, getCurrentMapping())}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Excel
                  </button>
                  <button
                    onClick={() => exportPDF(comparisonResult[activeTab], `Rapport_${activeTab}`, getCurrentMapping())}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <tr>
                      {['#', 'Matricule', 'Nom', 'Prénoms', 'Classe'].map(h => (
                        <th key={h} className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 first:w-12 first:text-center">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => {
                      const mapping = getCurrentMapping();
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800">
                          <td className="p-3 text-xs text-slate-400 dark:text-slate-600 text-center">{idx + 1}</td>
                          <td className="p-3 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{row[mapping.matricule] || '—'}</td>
                          <td className="p-3 text-xs text-slate-700 dark:text-slate-300">{row[mapping.nom] || '—'}</td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{row[mapping.prenom] || '—'}</td>
                          <td className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400">{row[mapping.classe] || '—'}</td>
                        </tr>
                      );
                    })}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-16 text-center text-slate-400 dark:text-slate-600 text-sm">
                          {searchQuery ? 'Aucun résultat pour cette recherche.' : 'Aucune donnée.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Count footer */}
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">
                {filteredRows.length} {filteredRows.length !== comparisonResult[activeTab].length ? `/ ${comparisonResult[activeTab].length}` : ''} entrée(s)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparatorTool;
