import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, FileSpreadsheet, AlertTriangle, CheckCircle2, 
  Filter, Ban, Settings2, Check, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AuditAverage = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- ÉTATS D'INTERFACE ---
  // viewMode remplace is3emeMode : 'none', '3eme', 'tleA', 'tleC', 'tleD'
  const [viewMode, setViewMode] = useState('none'); 
  const [filterMode, setFilterMode] = useState('all'); 
  const [showConfigModal, setShowConfigModal] = useState(false); 

  // --- ÉTAT POUR LES FILTRES DE COLONNES ---
  const [columnFilters, setColumnFilters] = useState({});

  // --- CONFIGURATION ÉTABLISSEMENT ---
  const [activeSubjects, setActiveSubjects] = useState({
    art: false,
    musique: false,
    tic: false,
    lv2_1ere_sci: false, // LV2 en 1ère C/D
    lv2_tle_sci: false   // LV2 en Tle C/D
  });

  // --- FILTRES GLOBAUX ---
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

    return { level, series, fullText: txt };
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

  // Réinitialiser la classe si le niveau change
  useEffect(() => { setSelectedClass('all'); }, [selectedLevel]);

  // --- GESTION INTELLIGENTE DES MODES (VUES) ---
  const handleViewModeChange = (mode) => {
      setViewMode(mode);
      
      // Logique d'auto-filtrage
      if (mode === 'none') {
          setSelectedLevel('all');
          return;
      }

      const searchTerms = {
          '3eme': ['3'],
          'tleA': ['tle', 'terminale'], // On filtrera plus précisément la série dans le tableau
          'tleC': ['tle', 'terminale'],
          'tleD': ['tle', 'terminale']
      };

      if (filterConfig.levels.length > 0) {
          const target = searchTerms[mode];
          if (target) {
              const matchingLevel = filterConfig.levels.find(l => target.some(t => l.toLowerCase().includes(t)));
              if (matchingLevel) setSelectedLevel(matchingLevel);
          }
      }
  };

  // Helper pour savoir si une colonne est "Majeure" dans le mode actuel
  const isMajorSubject = (colName, mode, rowContext = null) => {
      const name = colName.toLowerCase();
      
      // 1. Mode 3ème
      if (mode === '3eme') {
          return ['math', 'physique', 'pc', 'anglais', 'français', 'francais', 'cf', 'og', 'eo'].some(s => name.includes(s));
      }

      // 2. Mode Tle A
      if (mode === 'tleA') {
          // A1 spécifique : Maths en plus
          if (rowContext && (rowContext.includes('a1'))) {
               if (name.includes('math')) return true;
          }
          // Tronc commun A
          return ['français', 'francais', 'philo', 'espagnol', 'allemand', 'anglais'].some(s => name.includes(s));
      }

      // 3. Mode Tle D
      if (mode === 'tleD') {
          return ['math', 'physique', 'pc', 'svt', 'bio'].some(s => name.includes(s));
      }

      // 4. Mode Tle C
      if (mode === 'tleC') {
          return ['math', 'physique', 'pc'].some(s => name.includes(s)) && !name.includes('svt') && !name.includes('bio');
      }

      return false;
  };

  // Helper pour la couleur de fond des colonnes majeures
  const getMajorColor = (mode) => {
      switch(mode) {
          case '3eme': return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 border-b-emerald-500';
          case 'tleA': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 border-b-amber-500';
          case 'tleD': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 border-b-purple-500';
          case 'tleC': return 'bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-100 border-b-sky-500';
          default: return '';
      }
  };

  // --- LOGIQUE D'AUDIT PRINCIPALE ---
  const auditResults = useMemo(() => {
    if (data.length === 0) return { errors: [] };
    
    const errors = [];
    
    // Détection des colonnes
    const kEsp = findKey(['espagnol', 'esp']);
    const kAll = findKey(['allemand', 'all']);
    const kPhilo = findKey(['philo', 'philosophie']);
    const kEDHC = findKey(['edhc', 'ecm']);
    const kOrth = findKey(['orthographe', 'og']);
    const kEO = findKey(['expression', 'eo']);
    const kPC = findKey(['physique', 'chimie', 'pc', 'spc']);
    const kNom = findKey(['nom', 'surname']) || headers[0];

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

      if (filterConfig.classKey) {
          const cVal = row[filterConfig.classKey];
          if (!cVal || String(cVal).trim() === '') {
              rowErrors.push({ type: 'VIDE', msg: 'Classe manquante', col: filterConfig.classKey });
          }
      }

      // --- HELPER LV2 STRICT ---
      const checkStrictLV2 = (val, currentKey) => {
          const otherKey = (currentKey === kAll) ? kEsp : kAll;
          if (!otherKey) return { error: null, authorized: false }; 

          const otherValRaw = String(row[otherKey]).trim().replace(',', '.');
          const otherVal = otherValRaw === '' ? NaN : parseFloat(otherValRaw);
          
          const isOtherGrade = !isNaN(otherVal) && otherVal >= 0 && otherVal <= 20;
          const isOther21 = otherVal === 21;
          const isOther0 = otherVal === 0;

          // Cas 1 : La valeur actuelle est une NOTE (0-20)
          if (val >= 0 && val <= 20) {
              if (val === 0 && isOther21) return { error: 'Incohérent avec 21', authorized: false }; // 21 + 0 interdit
              if (isOtherGrade) return { error: 'Double Note', authorized: false };
              return { error: null, authorized: true }; // OK (C'est LA note valide)
          }
          // Cas 2 : La valeur actuelle est 21
          if (val === 21) {
              if (isOther0) return { error: 'Incohérent avec 0', authorized: false }; // 21 + 0 interdit
              return { error: 'Devrait être une Note', authorized: false }; // Erreur 21 générique
          }
          // Cas 3 : La valeur actuelle est 22
          if (val === 22) {
              if (isOtherGrade && !isOther0) return { error: null, authorized: true }; // Exemption valide (si l'autre est une note > 0)
              if (isOther0) return { error: null, authorized: true }; // Valide temporairement (c'est le 0 qui sera l'erreur)
              if (isOther21) return { error: null, authorized: true }; // Valide le 22 (l'erreur est portée par le 21)
              return { error: 'Aucune Note LV2', authorized: false };  // Double 22
          }
          return { error: null, authorized: false };
      };

      Object.keys(row).forEach(key => {
        if (IGNORED_COLUMNS.some(ignored => key.toLowerCase().includes(ignored))) return;

        if (key === kArt && !activeSubjects.art) return;
        if (key === kMus && !activeSubjects.musique) return;
        if (key === kTic && !activeSubjects.tic) return;
        
        const valStr = String(row[key]).trim();
        if (valStr === '') return; 

        const val = parseFloat(valStr.replace(',', '.'));

        if (!isNaN(val)) {
            // 1. LIMITES ABSOLUES
            if (val > 22) {
                rowErrors.push({ type: 'VALEUR', msg: `> 22 (${val})`, col: key });
                return;
            }
            if (val < 0) {
                rowErrors.push({ type: 'VALEUR', msg: `Négatif`, col: key });
                return;
            }

            let isAuthorized = false; 
            let customError = null;

            // 2. EXCEPTIONS GÉNÉRALES
            if (['2nd', '1ere', 'tle'].includes(level)) {
                if ((key === kEDHC || key === kOrth || key === kEO) && val === 22) isAuthorized = true;
            }

            // 3. LOGIQUE PAR NIVEAU
            
            // --- COLLÈGE (6ème / 5ème) ---
            if (level === '6' || level === '5') {
                if (key === kPhilo && (val === 22 || val === 0)) isAuthorized = true; // Philo : 0 ou 22 OK
                if ((key === kAll || key === kEsp) && val === 22) isAuthorized = true; // LV2 : 22 OK
            }
            
            // --- COLLÈGE (4ème / 3ème) ---
            else if (level === '4' || level === '3') {
                if (key === kPhilo && (val === 22 || val === 0)) isAuthorized = true; // Philo : 0 ou 22 OK
                
                // LV2 Stricte
                if (key === kAll || key === kEsp) {
                    const check = checkStrictLV2(val, key);
                    if (check.error) customError = check.error;
                    else if (check.authorized) isAuthorized = true;
                }
            }
            
            // --- SECONDE & PREMIÈRE A ---
            else if (level === '2nd' || (level === '1ere' && series === 'a')) {
                if (key === kPhilo && val === 22) isAuthorized = true; // Philo 22 en 2nd

                // LV2 Stricte
                if (key === kAll || key === kEsp) {
                    const check = checkStrictLV2(val, key);
                    if (check.error) customError = check.error;
                    else if (check.authorized) isAuthorized = true;
                }
            }

            // --- SCIENTIFIQUES (C & D) ---
            else if (['1ere', 'tle'].includes(level) && ['c', 'd'].includes(series)) {
                    const isLV2Active = (level === '1ere' ? activeSubjects.lv2_1ere_sci : activeSubjects.lv2_tle_sci);
                    
                    if (key === kAll || key === kEsp) {
                        if (isLV2Active) {
                            // LV2 ACTIVÉE (RÈGLES STRICTES)
                            const check = checkStrictLV2(val, key);
                            if (check.error) customError = check.error;
                            else if (check.authorized) isAuthorized = true;
                        } else {
                            // LV2 DÉSACTIVÉE (Note Interdite)
                            if (val >= 0 && val <= 20) {
                                customError = "Matière non prévue (Config)";
                            } else {
                                isAuthorized = true; // 21/22 Tolérés silencieusement
                            }
                        }
                    }
            }
            
            // --- TERMINALE A ---
            else if (level === 'tle' && series === 'a') {
                    if (key === kPC && val === 22) isAuthorized = true;
                    // LV2 Stricte
                    if (key === kAll || key === kEsp) {
                    const check = checkStrictLV2(val, key);
                    if (check.error) customError = check.error;
                    else if (check.authorized) isAuthorized = true;
                }
            }

            // --- VÉRIFICATION FINALE ---
            if (customError) {
                rowErrors.push({ type: 'LOGIQUE', msg: customError, col: key });
            } else if (!isAuthorized) {
                if (val === 0) rowErrors.push({ type: 'SUSPECT', msg: 'Moyenne 0', col: key });
                else if (val === 21) rowErrors.push({ type: 'SUSPECT', msg: 'Non classé (21)', col: key });
                else if (val === 22) rowErrors.push({ type: 'SUSPECT', msg: 'Non enseigné (22)', col: key });
            }
        }
      });

      if (rowErrors.length > 0) {
        errors.push({ rowIndex: index, details: rowErrors, student: row[kNom] || `Ligne ${index+1}` });
      }
    });
    return { errors, kAll, kEsp }; 
  }, [data, headers, filterConfig, activeSubjects]); 

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

  const handleColumnFilterChange = (header, value) => {
    setColumnFilters(prev => ({
        ...prev,
        [header]: value
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 transition-colors">
      
      {/* STYLE SCROLLBAR */}
      <style>{`
        .audit-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
        .audit-scrollbar::-webkit-scrollbar-track { background-color: #f1f5f9; }
        .dark .audit-scrollbar::-webkit-scrollbar-track { background-color: #1e293b; }
        .audit-scrollbar::-webkit-scrollbar-thumb { background-color: #94a3b8; border-radius: 8px; border: 3px solid #f1f5f9; }
        .dark .audit-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; border: 3px solid #1e293b; }
        .audit-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
        .audit-scrollbar::-webkit-scrollbar-corner { background-color: transparent; }
      `}</style>

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
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Cochez les matières enseignées.</p>
                    </div>

                    <div className="space-y-3 mb-8">
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
                                <input type="checkbox" className="hidden" checked={activeSubjects[item.id]} onChange={() => setActiveSubjects(prev => ({ ...prev, [item.id]: !prev[item.id] }))} />
                            </label>
                        ))}
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                        
                        {/* LV2 Options */}
                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm block">LV2 en Première (C & D)</span><span className="text-[10px] text-slate-400">Si décoché, toute moyenne (0-20) sera signalée.</span></div>
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${activeSubjects.lv2_1ere_sci ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>{activeSubjects.lv2_1ere_sci && <Check className="w-4 h-4 text-white" />}</div>
                            <input type="checkbox" className="hidden" checked={activeSubjects.lv2_1ere_sci} onChange={() => setActiveSubjects(prev => ({ ...prev, lv2_1ere_sci: !prev.lv2_1ere_sci }))} />
                        </label>
                         <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm block">LV2 en Terminale (C & D)</span><span className="text-[10px] text-slate-400">Si décoché, toute moyenne (0-20) sera signalée.</span></div>
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${activeSubjects.lv2_tle_sci ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>{activeSubjects.lv2_tle_sci && <Check className="w-4 h-4 text-white" />}</div>
                            <input type="checkbox" className="hidden" checked={activeSubjects.lv2_tle_sci} onChange={() => setActiveSubjects(prev => ({ ...prev, lv2_tle_sci: !prev.lv2_tle_sci }))} />
                        </label>
                    </div>
                    <button onClick={() => setShowConfigModal(false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-slate-800 dark:hover:bg-slate-200 transition-transform active:scale-95 shadow-lg">Valider et Lancer l'Audit</button>
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
                    {/* BOUTON LIGNES SUSPECTES */}
                    <button 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase transition-all shadow-sm active:scale-95
                        ${auditResults.errors.length > 0 
                            ? 'bg-white dark:bg-slate-900 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
                        }
                        ${filterMode === 'errors' ? 'ring-2 ring-offset-2 ring-red-500 dark:ring-offset-slate-900 bg-red-50' : ''}`} 
                        onClick={() => auditResults.errors.length > 0 && setFilterMode(filterMode === 'errors' ? 'all' : 'errors')}
                    >
                        {auditResults.errors.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        <span>{auditResults.errors.length} Lignes suspectes</span>
                    </button>
                </div>

                {/* FILTRES NIVEAU/CLASSE */}
                {(filterConfig.levels.length > 0 || filterConfig.classes.length > 0) && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-transparent dark:border-slate-700">
                         {filterConfig.levelKey && (
                             <div className="relative">
                                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="bg-transparent pl-3 pr-2 py-1 outline-none cursor-pointer appearance-none text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 w-24">
                                    <option value="all">Niveau</option>
                                    {filterConfig.levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                             </div>
                         )}
                         {filterConfig.levelKey && filterConfig.classKey && <div className="w-[1px] h-3 bg-slate-300 dark:bg-slate-600"></div>}
                         {filterConfig.classKey && (
                             <div className="relative">
                                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-transparent pl-2 pr-6 py-1 outline-none cursor-pointer appearance-none text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 w-28 disabled:opacity-50">
                                    <option value="all">Classe</option>
                                    {filterConfig.classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Filter className="w-3 h-3 absolute right-2 top-1.5 text-slate-400 pointer-events-none"/>
                             </div>
                         )}
                    </div>
                )}
                
                {/* SÉLECTEUR DE VUE SPÉCIALE (REMPLACE LE TOGGLE 3EME) */}
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                    <div className="relative group">
                         <div className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                            <Eye className={`w-4 h-4 ${viewMode !== 'none' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                            <select 
                                value={viewMode}
                                onChange={(e) => handleViewModeChange(e.target.value)}
                                className="bg-transparent outline-none text-[10px] font-black uppercase cursor-pointer appearance-none w-28 text-slate-700 dark:text-slate-200"
                            >
                                <option value="none">Vue Standard</option>
                                <option value="3eme">Mode 3ème</option>
                                <option value="tleA">Mode Tle A</option>
                                <option value="tleD">Mode Tle D</option>
                                <option value="tleC">Mode Tle C</option>
                            </select>
                         </div>
                    </div>
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
                    <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">Audit strict et Vues Spéciales (3ème, Bac A/C/D).</p>
                    <label className="block w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase cursor-pointer hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all active:scale-95 shadow-lg transform hover:-translate-y-1">
                        Sélectionner le fichier
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        ) : (
            <div className="flex-1 p-4 md:p-6 overflow-hidden">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative">
                    <div className="flex-1 overflow-auto audit-scrollbar relative">
                        <table className="w-full text-left border-collapse table-fixed min-w-max">
                            <thead className="sticky top-0 z-20 shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
                                <tr>
                                    <th className="p-3 w-14 bg-slate-50 dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 select-none">#</th>
                                    {headers.map((h, i) => {
                                        // Vérification basique pour le header (sans contexte de ligne)
                                        // Pour Tle A, on surligne Maths globalement dans le header pour indiquer qu'il est surveillé
                                        const isMajor = isMajorSubject(h, viewMode, viewMode === 'tleA' ? 'a1' : null); 
                                        const colorClass = isMajor ? getMajorColor(viewMode) : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900';
                                        
                                        return (
                                        <th 
                                            key={i} 
                                            className={`p-2 border-b border-r border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider w-32 truncate align-top
                                                ${colorClass}
                                                ${hoveredCell.col === h ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100' : ''}
                                            `}
                                        >
                                            <div className="flex flex-col gap-2">
                                                <span className="truncate" title={h}>{h}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Filtrer..."
                                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[9px] font-normal text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 transition-colors"
                                                    value={columnFilters[h] || ''}
                                                    onChange={(e) => handleColumnFilterChange(h, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </th>
                                    )})}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.map((row, rIdx) => {
                                    if (selectedLevel !== 'all' && filterConfig.levelKey && String(row[filterConfig.levelKey]).trim() !== selectedLevel) return null;
                                    if (selectedClass !== 'all' && filterConfig.classKey && String(row[filterConfig.classKey]).trim() !== selectedClass) return null;

                                    const rowErrors = auditResults.errors.find(e => e.rowIndex === rIdx);
                                    if (filterMode === 'errors' && !rowErrors) return null;

                                    const matchesColumnFilters = headers.every(h => {
                                        const filterText = columnFilters[h]?.toLowerCase();
                                        if (!filterText) return true;
                                        return String(row[h] || '').toLowerCase().includes(filterText);
                                    });

                                    if (!matchesColumnFilters) return null;

                                    // FILTRE DE VUE : Si on est en mode Tle A, C ou D, on vérifie la série de la ligne
                                    // Le filtre de niveau est déjà géré par selectedLevel, mais la série non.
                                    const { level, series, fullText } = getContext(row, filterConfig.levelKey, filterConfig.classKey);
                                    if (viewMode === 'tleA' && series !== 'a') return null;
                                    if (viewMode === 'tleC' && series !== 'c') return null;
                                    if (viewMode === 'tleD' && series !== 'd') return null;


                                    const isRowHovered = hoveredCell.row === rIdx;
                                    
                                    let isLV2ActiveForCell = false;
                                    if (['1ere', 'tle'].includes(level) && ['c', 'd'].includes(series)) {
                                        isLV2ActiveForCell = (level === '1ere' ? activeSubjects.lv2_1ere_sci : activeSubjects.lv2_tle_sci);
                                    } else {
                                        isLV2ActiveForCell = true; 
                                    }

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
                                                const isVal = parseFloat(String(val).replace(',', '.'));
                                                
                                                // Logique Visuelle Bleu (LV2)
                                                let isBlueExemption = false;
                                                if (
                                                    (h === auditResults.kAll || h === auditResults.kEsp) &&
                                                    !cellError && 
                                                    isVal === 22 &&
                                                    isLV2ActiveForCell
                                                ) {
                                                    const otherKey = (h === auditResults.kAll) ? auditResults.kEsp : auditResults.kAll;
                                                    if (otherKey) {
                                                        const otherValRaw = String(row[otherKey]).trim().replace(',', '.');
                                                        const otherVal = otherValRaw === '' ? NaN : parseFloat(otherValRaw);
                                                        if (!isNaN(otherVal) && otherVal >= 0 && otherVal <= 20) {
                                                            isBlueExemption = true;
                                                        }
                                                    }
                                                }

                                                // Logique Surlignage Mode Focus
                                                // On passe le fullText pour que la logique puisse détecter 'A1'
                                                const isMajor = isMajorSubject(h, viewMode, fullText);
                                                const majorColorClass = isMajor 
                                                    ? getMajorColor(viewMode).replace('border-b-', 'bg-opacity-50 ') // Version allégée pour le corps
                                                    : '';

                                                // Correction de style pour le body (plus léger que le header)
                                                let cellBackground = '';
                                                if (viewMode === '3eme' && isMajor) cellBackground = 'bg-emerald-50 dark:bg-emerald-900/20';
                                                if (viewMode === 'tleA' && isMajor) cellBackground = 'bg-amber-50 dark:bg-amber-900/20';
                                                if (viewMode === 'tleC' && isMajor) cellBackground = 'bg-sky-50 dark:bg-sky-900/20';
                                                if (viewMode === 'tleD' && isMajor) cellBackground = 'bg-purple-50 dark:bg-purple-900/20';

                                                return (
                                                    <td 
                                                        key={`${rIdx}-${h}`} 
                                                        onMouseEnter={() => setHoveredCell({ row: rIdx, col: h })}
                                                        onMouseLeave={() => setHoveredCell({ row: null, col: null })}
                                                        className={`p-3 border-r border-slate-100 dark:border-slate-800 text-xs font-mono truncate transition-colors cursor-default select-text
                                                            ${cellError 
                                                                ? 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100 font-bold' 
                                                                : isBlueExemption 
                                                                    ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold' 
                                                                    : 'text-slate-600 dark:text-slate-300'
                                                            }
                                                            ${!cellError && !isBlueExemption && isCrosshairActive 
                                                                ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                                                                : ''}
                                                            ${!cellError && !isCrosshairActive && !isBlueExemption ? cellBackground : ''}
                                                        `}
                                                        title={cellError ? cellError.msg : (isBlueExemption ? "Dispensé (Autre langue valide)" : val)}
                                                    >
                                                        {val}
                                                        {cellError && cellError.type === 'VIDE' && <Ban className="w-3 h-3 inline ml-2 opacity-50"/>}
                                                        {isBlueExemption && <Check className="w-3 h-3 inline ml-2 opacity-50"/>}
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

    </div>
  );
};

export default AuditAverage;