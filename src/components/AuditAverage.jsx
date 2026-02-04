import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, FileSpreadsheet, AlertTriangle, CheckCircle2, 
  Filter, Ban, Settings2, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AuditAverage = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- ÉTATS D'INTERFACE ---
  const [is3emeMode, setIs3emeMode] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); 
  const [showConfigModal, setShowConfigModal] = useState(false); 

  // --- CONFIGURATION ÉTABLISSEMENT ---
  const [activeSubjects, setActiveSubjects] = useState({
    art: false,
    musique: false,
    tic: false,
    svt_tle_a: false // Nouvelle option pour Tle A
  });

  // --- FILTRES ---
  const [selectedLevel, setSelectedLevel] = useState('all'); 
  const [selectedClass, setSelectedClass] = useState('all'); 
  const [hoveredCell, setHoveredCell] = useState({ row: null, col: null });

  // --- UTILITAIRES ---
  const findKey = (search, headerList = headers) => headerList.find(h => search.some(s => h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(s)));

  const getContext = (row, levelKey, classKey) => {
    const lvlVal = levelKey ? row[levelKey] : '';
    const clsVal = classKey ? row[classKey] : '';
    const txt = ((lvlVal || '') + ' ' + (clsVal || '')).toLowerCase();
    
    let level = null;
    let series = null;

    if (txt.includes('6eme') || txt.includes('6ème') || txt.includes('6èm') || txt.includes('6em')) level = '6';
    else if (txt.includes('5eme') || txt.includes('5ème') || txt.includes('5èm')) level = '5';
    else if (txt.includes('4eme') || txt.includes('4ème') || txt.includes('4èm')) level = '4';
    else if (txt.includes('3eme') || txt.includes('3ème') || txt.includes('3èm')) level = '3';
    else if (txt.includes('2nd') || txt.includes('seconde')) level = '2nd';
    else if (txt.includes('1ere') || txt.includes('premiere')) level = '1ere';
    else if (txt.includes('tle') || txt.includes('terminale')) level = 'tle';

    if (txt.includes(' a') || txt.includes('a1') || txt.includes('a2')) series = 'a';
    else if (txt.includes(' c') || txt.includes('c1') || txt.includes('c2')) series = 'c';
    else if (txt.includes(' d') || txt.includes('d1') || txt.includes('d2')) series = 'd';

    return { level, series };
  };

  // --- CONFIG FILTRES CASCADE ---
  const filterConfig = useMemo(() => {
    const levelKey = findKey(['niveau', 'niv', 'level', 'cycle']);
    const classKey = findKey(['codeclasse', 'code', 'classe', 'class', 'groupe']);

    if (!levelKey && !classKey) return { levels: [], classes: [], levelKey: null, classKey: null };

    const allLevels = levelKey 
        ? [...new Set(data.map(d => String(d[levelKey]).trim()))].filter(Boolean).sort()
        : [];

    const relevantClasses = data
        .filter(row => {
            if (selectedLevel === 'all') return true;
            if (!levelKey) return true;
            return String(row[levelKey]).trim() === selectedLevel;
        })
        .map(row => classKey ? String(row[classKey]).trim() : '')
        .filter(Boolean);

    return {
        levelKey,
        classKey,
        levels: allLevels,
        classes: [...new Set(relevantClasses)].sort()
    };
  }, [data, headers, selectedLevel]);

  useEffect(() => { setSelectedClass('all'); }, [selectedLevel]);

  // --- LOGIQUE D'AUDIT PRINCIPALE ---
  const auditResults = useMemo(() => {
    if (data.length === 0) return { errors: [] };
    
    const errors = [];
    
    // Identifications des matières
    const kEsp = findKey(['espagnol', 'esp']);
    const kAll = findKey(['allemand', 'all']);
    const kPhilo = findKey(['philo', 'philosophie']);
    const kEDHC = findKey(['edhc', 'ecm']);
    const kOrth = findKey(['orthographe', 'og']);
    const kEO = findKey(['expression', 'eo']);
    const kSVT = findKey(['svt', 'biologie', 'bio']);
    const kPC = findKey(['physique', 'chimie', 'pc', 'spc']);
    const kNom = findKey(['nom', 'surname']) || headers[0];

    // Matières optionnelles globales
    const kArt = findKey(['art', 'plastique']);
    const kMus = findKey(['musique', 'music']);
    const kTic = findKey(['tic', 'informatique']);
    
    const IGNORED_COLUMNS = [
        'matricule', 'id', 'rang', 'classe', 'code', 'niveau', 'niv', 'groupe', 'nom', 'prenom', 'sexe', 
        'date', 'naissance', 'tel', 'phone', 'contact', 'annee', 'age', 'obs', 'appréciation'
    ];

    data.forEach((row, index) => {
      const rowErrors = [];
      const { level, series } = getContext(row, filterConfig.levelKey, filterConfig.classKey);

      // A. Check Classe Vide
      if (filterConfig.classKey) {
          const cVal = row[filterConfig.classKey];
          if (!cVal || String(cVal).trim() === '') {
              rowErrors.push({ type: 'VIDE', msg: 'Classe manquante', col: filterConfig.classKey });
          }
      }

      // B. Scan des Cellules
      Object.keys(row).forEach(key => {
        if (IGNORED_COLUMNS.some(ignored => key.toLowerCase().includes(ignored))) return;

        // Gestion matières optionnelles globales
        if (key === kArt && !activeSubjects.art) return;
        if (key === kMus && !activeSubjects.musique) return;
        if (key === kTic && !activeSubjects.tic) return;
        
        const valStr = String(row[key]).trim();
        if (valStr === '') return; 

        const val = parseFloat(valStr.replace(',', '.'));

        if (!isNaN(val)) {
            // > 22 ou Négatif
            if (val > 22) rowErrors.push({ type: 'VALEUR', msg: `> 22 (${val})`, col: key });
            else if (val < 0) rowErrors.push({ type: 'VALEUR', msg: `Négatif`, col: key });

            // Analyse des codes spéciaux (0, 21, 22)
            else if (val === 0 || val === 21 || val === 22) {
                let isAuthorized = false; 

                // --- 1. RÈGLES LYCÉE GÉNÉRALES (2nd, 1ere, Tle) ---
                if (['2nd', '1ere', 'tle'].includes(level)) {
                    // EDHC, Orthographe, EO doivent être 22
                    if ((key === kEDHC || key === kOrth || key === kEO) && val === 22) isAuthorized = true;
                }

                // --- 2. RÈGLES PAR NIVEAU SPÉCIFIQUE ---

                // CAS 6ème / 5ème
                if (level === '6' || level === '5') {
                    if ((key === kPhilo || key === kAll || key === kEsp) && val === 22) isAuthorized = true;
                }

                // CAS 4ème / 3ème
                else if (level === '4' || level === '3') {
                    if (key === kPhilo && val === 22) isAuthorized = true;
                    // LV2 : 21 autorisé si l'autre LV2 a une note
                    if ((key === kAll || key === kEsp) && val === 21) {
                         const otherLangKey = (key === kAll) ? kEsp : kAll;
                         const otherLangVal = parseFloat(row[otherLangKey]);
                         if (otherLangKey && !isNaN(otherLangVal) && otherLangVal > 0 && otherLangVal <= 20) isAuthorized = true;
                    }
                }

                // CAS 2nd
                else if (level === '2nd') {
                    if ((series === 'a' || series === 'c') && key === kPhilo && val === 22) isAuthorized = true;
                }

                // CAS 1ère
                else if (level === '1ere') {
                    if (['c', 'd'].includes(series) && (key === kAll || key === kEsp) && val === 22) isAuthorized = true;
                }

                // CAS Terminale
                else if (level === 'tle') {
                     // Tle C/D : Pas de langues
                     if (['c', 'd'].includes(series) && (key === kAll || key === kEsp) && val === 22) isAuthorized = true;
                     
                     // Tle A : Règles SPÉCIFIQUES
                     if (series === 'a') {
                         // Physique/Chimie doit être 22
                         if (key === kPC && val === 22) isAuthorized = true;

                         // SVT : Dépend de la config utilisateur
                         if (key === kSVT) {
                             if (!activeSubjects.svt_tle_a && val === 22) isAuthorized = true; // Si NON enseignée -> 22 OK
                             // Si enseignée (activeSubjects.svt_tle_a = true), alors 22 est une erreur (donc isAuthorized reste false)
                         }
                     }
                }

                if (!isAuthorized) {
                    if (val === 0) rowErrors.push({ type: 'SUSPECT', msg: 'Moyenne 0', col: key });
                    if (val === 21) rowErrors.push({ type: 'SUSPECT', msg: 'Non classé (21)', col: key });
                    if (val === 22) rowErrors.push({ type: 'SUSPECT', msg: 'Non enseigné (22)', col: key });
                }
            }
        }
      });

      if (rowErrors.length > 0) {
        errors.push({ rowIndex: index, details: rowErrors, student: row[kNom] || `Ligne ${index+1}` });
      }
    });
    return { errors };
  }, [data, headers, filterConfig, activeSubjects]); 

  const isOrientationCol = (colName) => {
    const name = colName.toLowerCase();
    return ['math', 'physique', 'pc', 'anglais', 'français', 'francais', 'cf', 'og', 'eo'].some(s => name.includes(s));
  };

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" }); 
      if (jsonData.length > 0) {
        setHeaders(Object.keys(jsonData[0]));
        setData(jsonData);
        setShowConfigModal(true);
      }
      setIsProcessing(false);
    };
    reader.readAsBinaryString(f);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 transition-colors">
      
      {/* MODAL CONFIGURATION */}
      {showConfigModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Settings2 className="w-8 h-8"/>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">Configuration Pédagogique</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                            Cochez les matières enseignées dans votre établissement.
                        </p>
                    </div>

                    <div className="space-y-3 mb-8">
                        {/* Matières Globales */}
                        {[
                            { id: 'art', label: 'Arts Plastiques (Tout niveau)' },
                            { id: 'musique', label: 'Éducation Musicale (Tout niveau)' },
                            { id: 'tic', label: 'Informatique / TIC (Tout niveau)' }
                        ].map((item) => (
                            <label key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${activeSubjects[item.id] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {activeSubjects[item.id] && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={activeSubjects[item.id]}
                                    onChange={() => setActiveSubjects(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                />
                            </label>
                        ))}
                        
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                        {/* Matière Spécifique */}
                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm block">SVT en Terminale A</span>
                                <span className="text-[10px] text-slate-400">Si décoché, la note attendue sera 22.</span>
                            </div>
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${activeSubjects.svt_tle_a ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                {activeSubjects.svt_tle_a && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={activeSubjects.svt_tle_a}
                                onChange={() => setActiveSubjects(prev => ({ ...prev, svt_tle_a: !prev.svt_tle_a }))}
                            />
                        </label>
                    </div>

                    <button 
                        onClick={() => setShowConfigModal(false)}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-slate-800 dark:hover:bg-slate-200 transition-transform active:scale-95 shadow-lg"
                    >
                        Valider et Lancer l'Audit
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER FIXE */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-all active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4"/>
                <h2 className="font-black text-xs uppercase tracking-[0.2em]">Audit-Moyenne</h2>
            </div>
        </div>

        {file && !showConfigModal && (
            <div className="flex items-center gap-6">
                <div className="flex gap-4 mr-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${filterMode === 'errors' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`} onClick={() => setFilterMode(filterMode === 'errors' ? 'all' : 'errors')}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{auditResults.errors.length} Anomalies</span>
                    </div>
                </div>

                {/* FILTRES CASCADE */}
                {(filterConfig.levels.length > 0 || filterConfig.classes.length > 0) && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-transparent dark:border-slate-700">
                         {filterConfig.levelKey && (
                             <div className="relative">
                                <select 
                                    value={selectedLevel} 
                                    onChange={(e) => setSelectedLevel(e.target.value)} 
                                    className="bg-transparent pl-3 pr-2 py-1 outline-none cursor-pointer appearance-none text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 w-24"
                                >
                                    <option value="all">Niveau</option>
                                    {filterConfig.levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                             </div>
                         )}
                         {filterConfig.levelKey && filterConfig.classKey && <div className="w-[1px] h-3 bg-slate-300 dark:bg-slate-600"></div>}
                         {filterConfig.classKey && (
                             <div className="relative">
                                <select 
                                    value={selectedClass} 
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="bg-transparent pl-2 pr-6 py-1 outline-none cursor-pointer appearance-none text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 w-28 disabled:opacity-50"
                                >
                                    <option value="all">Classe</option>
                                    {filterConfig.classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Filter className="w-3 h-3 absolute right-2 top-1.5 text-slate-400 pointer-events-none"/>
                             </div>
                         )}
                    </div>
                )}
                
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mr-1">Mode 3ème</span>
                    <button 
                        onClick={() => setIs3emeMode(!is3emeMode)}
                        className={`w-9 h-5 rounded-full transition-all relative ${is3emeMode ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${is3emeMode ? 'left-5' : 'left-1'}`}></div>
                    </button>
                </div>

                <button onClick={() => setShowConfigModal(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors" title="Configurer les matières">
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-slate-950">
        
        {!file ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in zoom-in-95">
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 text-center max-w-lg w-full transition-colors">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner">
                        <FileSpreadsheet className="w-12 h-12"/>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Charger un relevé</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">Audit strict (2nd/1ère/Tle inclus) et options configurables.</p>
                    <label className="block w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase cursor-pointer hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all active:scale-95 shadow-lg transform hover:-translate-y-1">
                        Sélectionner le fichier
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        ) : (
            <div className="flex-1 p-4 md:p-6 overflow-hidden">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative">
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse table-fixed min-w-max">
                            <thead className="sticky top-0 z-20 shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
                                <tr>
                                    <th className="p-3 w-14 bg-slate-50 dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 select-none">#</th>
                                    {headers.map((h, i) => (
                                        <th 
                                            key={i} 
                                            className={`p-3 border-b border-r border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider w-32 truncate
                                                ${is3emeMode && isOrientationCol(h) 
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 border-b-emerald-500' 
                                                    : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900'}
                                                ${hoveredCell.col === h ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : ''}
                                            `}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.map((row, rIdx) => {
                                    if (selectedLevel !== 'all' && filterConfig.levelKey && String(row[filterConfig.levelKey]).trim() !== selectedLevel) return null;
                                    if (selectedClass !== 'all' && filterConfig.classKey && String(row[filterConfig.classKey]).trim() !== selectedClass) return null;

                                    const rowErrors = auditResults.errors.find(e => e.rowIndex === rIdx);
                                    if (filterMode === 'errors' && !rowErrors) return null;

                                    const isRowHovered = hoveredCell.row === rIdx;

                                    return (
                                        <tr 
                                            key={rIdx} 
                                            className={`group transition-colors 
                                                ${isRowHovered ? 'bg-indigo-100/50 dark:bg-indigo-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-900'} 
                                            `}
                                        >
                                            <td className={`sticky left-0 z-10 p-2 text-center text-[10px] font-mono font-bold border-r border-slate-200 dark:border-slate-700 select-none
                                                ${isRowHovered 
                                                    ? 'bg-indigo-300 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100' 
                                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500'}
                                            `}>
                                                {rIdx + 1}
                                            </td>

                                            {headers.map((h) => {
                                                const val = row[h];
                                                const cellError = rowErrors?.details.find(d => d.col === h);
                                                const isCrosshairActive = isRowHovered || hoveredCell.col === h;

                                                return (
                                                    <td 
                                                        key={`${rIdx}-${h}`} 
                                                        onMouseEnter={() => setHoveredCell({ row: rIdx, col: h })}
                                                        onMouseLeave={() => setHoveredCell({ row: null, col: null })}
                                                        className={`p-3 border-r border-slate-100 dark:border-slate-800 text-xs font-mono truncate transition-colors cursor-default select-text
                                                            ${cellError 
                                                                ? 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100 font-bold' 
                                                                : 'text-slate-600 dark:text-slate-300'}
                                                            ${!cellError && isCrosshairActive 
                                                                ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                                                                : ''}
                                                            ${is3emeMode && isOrientationCol(h) && !cellError && !isCrosshairActive
                                                                ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                                                                : ''}
                                                        `}
                                                        title={cellError ? cellError.msg : val}
                                                    >
                                                        {val}
                                                        {cellError && cellError.type === 'VIDE' && <Ban className="w-3 h-3 inline ml-2 opacity-50"/>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* FOOTER ALERTE */}
      {data.length > 0 && auditResults.errors.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-40 animate-in slide-in-from-bottom-4 border border-slate-800 dark:border-slate-200">
              <AlertTriangle className="w-4 h-4 text-orange-400 dark:text-orange-600 animate-pulse"/>
              <span className="text-xs font-bold uppercase tracking-wide">{auditResults.errors.length} Lignes suspectes</span>
              {filterMode !== 'errors' && (
                  <button onClick={() => setFilterMode('errors')} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors">
                      Voir
                  </button>
              )}
          </div>
      )}

    </div>
  );
};

export default AuditAverage;