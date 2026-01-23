import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './index.css'

// --- CONFIGURATION ---
const API_URL = import.meta.env.VITE_APP_SCRIPT_URL; 

// --- COMPLETE TAILWIND 500 PALETTE ---
const TAILWIND_COLORS = [
  '#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#be123c', '#4338ca', '#0f766e', '#b45309'
];

// --- 2025 TAX DATA ---
const STANDARD_DEDUCTION = 15000;
const SOCIAL_SECURITY_CAP = 176100;

const FEDERAL_TAX_BRACKETS = [
  { limit: 11925, rate: 0.10 }, 
  { limit: 48475, rate: 0.12 }, 
  { limit: 103350, rate: 0.22 },
  { limit: 197300, rate: 0.24 }, 
  { limit: 250525, rate: 0.32 }, 
  { limit: 626350, rate: 0.35 },
  { limit: Infinity, rate: 0.37 }
];

const STATE_TAX_RATES = {
  'AL': 0.05, 'AK': 0.00, 'AZ': 0.025, 'AR': 0.049, 'CA': 0.093, 'CO': 0.044, 'CT': 0.0699,
  'DE': 0.066, 'FL': 0.00, 'GA': 0.0575, 'HI': 0.11, 'ID': 0.058, 'IL': 0.0495, 'IN': 0.0323,
  'IA': 0.06, 'KS': 0.057, 'KY': 0.045, 'LA': 0.0425, 'ME': 0.0715, 'MD': 0.0575, 'MA': 0.05,
  'MI': 0.0425, 'MN': 0.0985, 'MS': 0.05, 'MO': 0.054, 'MT': 0.0675, 'NE': 0.0684, 'NV': 0.00,
  'NH': 0.00, 'NJ': 0.1075, 'NM': 0.059, 'NY': 0.06, 'NC': 0.0475, 'ND': 0.029, 'OH': 0.0399,
  'OK': 0.0475, 'OR': 0.099, 'PA': 0.0307, 'RI': 0.0599, 'SC': 0.07, 'SD': 0.00, 'TN': 0.00,
  'TX': 0.00, 'UT': 0.0485, 'VT': 0.0875, 'VA': 0.0575, 'WA': 0.00, 'WV': 0.065, 'WI': 0.0765,
  'WY': 0.00, 'DC': 0.1075
};

// --- WIDGET: CALCULATOR ---
const Calculator = ({ isOpen, onClose }) => {
    const [calcInput, setCalcInput] = useState('');
    const [result, setResult] = useState('');
  
    const handleBtn = (val) => {
        if (val === 'C') { setCalcInput(''); setResult(''); return; }
        if (val === '=') {
            try {
                // eslint-disable-next-line
                const res = Function('"use strict";return (' + calcInput + ')')();
                setResult(String(res));
                setCalcInput(String(res));
            } catch { setResult('Error'); }
            return;
        }
        setCalcInput(prev => prev + val);
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed bottom-28 right-8 w-72 bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden z-40 animate-fade-in-up">
        <div className="bg-gray-800 p-3 flex justify-between items-center">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider pl-2">Quick Calc</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white px-2">✕</button>
        </div>
        <div className="bg-gray-900 p-4 text-right border-b border-gray-800">
            <div className="text-gray-500 text-sm h-5">{result !== calcInput ? calcInput : ''}</div>
            <div className="text-white text-3xl font-mono font-bold truncate">{calcInput || '0'}</div>
        </div>
        <div className="grid grid-cols-4 gap-1 p-2 bg-gray-800">
            {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                <button key={btn} onClick={() => handleBtn(btn)} className={`p-4 text-lg font-bold rounded-xl transition-colors ${ btn === '=' ? 'bg-blue-600 text-white col-span-1' : ['/','*','-','+'].includes(btn) ? 'bg-gray-700 text-blue-400' : btn === 'C' ? 'bg-red-500/20 text-red-400' : 'bg-gray-900 text-white hover:bg-gray-700' }`}>{btn}</button>
            ))}
        </div>
      </div>
    );
};

// Scratchpad Modal
const Scratchpad = ({ isOpen, onClose, value, onChange }) => {
    const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 450 });
    const [size, setSize] = useState({ width: 288, height: 250 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, rightAnchor: 0 });

    const startDrag = (e) => {
        e.preventDefault(); 
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const startResize = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setDragStart({
            rightAnchor: position.x + size.width,
            y: position.y 
        });
    };

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
            if (isResizing) {
                const newWidth = dragStart.rightAnchor - e.clientX;
                const newHeight = e.clientY - position.y;

                if (newWidth > 200 && newHeight > 150) {
                    setSize({ width: newWidth, height: newHeight });
                    setPosition({ x: e.clientX, y: position.y }); 
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, position.y, position.x]); 

    if (!isOpen) return null;

    return (
        <div 
            className="fixed bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col select-none" // Added select-none
            style={{ 
                left: position.x, 
                top: position.y, 
                width: size.width, 
                height: size.height,
                transition: isDragging || isResizing ? 'none' : 'opacity 0.2s' 
            }}
        >
            {/* Header */}
            <div 
                onMouseDown={startDrag}
                className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200 cursor-move"
            >
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider pl-2 pointer-events-none">Scratchpad</span>
                <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="text-gray-400 hover:text-gray-700 px-2 cursor-pointer">✕</button>
            </div>

            {/* Textarea */}
            <textarea 
                className="flex-1 w-full p-4 bg-white border-none resize-none font-mono focus:ring-0 text-gray-700 text-sm font-medium focus:outline-none select-text" // Added select-text
                placeholder="Type quick notes here..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

            {/* RESIZE HANDLE (Bottom Left) */}
            <div 
                onMouseDown={startResize}
                className="absolute bottom-0 left-0 w-8 h-8 cursor-nesw-resize flex items-end justify-start p-1 text-gray-300 hover:text-gray-500 z-10"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform scale-x-[-1] rotate-90 pointer-events-none">
                    <path d="M22 22H2V20H22V22ZM22 18H6V16H22V18ZM22 14H10V12H22V14Z" />
                </svg>
            </div>
        </div>
    );
};

export default function BudgetApp() {
  const [user, setUser] = useState(null);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [sheetName, setSheetName] = useState('Jan-2026');
  const [availableSheets, setAvailableSheets] = useState([]); 
  const [status, setStatus] = useState('');
  
  const [salary, setSalary] = useState(60000);
  const [bonus, setBonus] = useState(0);
  const [stateCode, setStateCode] = useState('TX');
  
  const [items, setItems] = useState([]);
  const [transferAmount, setTransferAmount] = useState(50);
  const [newCategory, setNewCategory] = useState('');
  
  const [scratchpad, setScratchpad] = useState(''); 
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isScratchOpen, setIsScratchOpen] = useState(false);

  // --- PROGRESSIVE TAX ENGINE ---
  const netMonthlyIncome = useMemo(() => {
    const grossAnnual = Number(salary) + Number(bonus);
    
    // 1. Federal Tax (Progressive)
    const taxableIncome = Math.max(0, grossAnnual - STANDARD_DEDUCTION);
    let federalTax = 0;
    let previousLimit = 0;

    for (let bracket of FEDERAL_TAX_BRACKETS) {
      if (taxableIncome > previousLimit) {
        const taxableAmountInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
        federalTax += taxableAmountInBracket * bracket.rate;
        previousLimit = bracket.limit;
      }
    }

    // 2. FICA (Social Security + Medicare)
    const socialSecurity = Math.min(grossAnnual, SOCIAL_SECURITY_CAP) * 0.062;
    const medicare = grossAnnual * 0.0145;
    const ficaTax = socialSecurity + medicare;

    // 3. State Tax (Effective Rate Estimate)
    const stateRate = STATE_TAX_RATES[stateCode] || 0.00;
    const stateTax = grossAnnual * stateRate;

    // 4. Final Net
    const totalTax = federalTax + ficaTax + stateTax;
    return Math.floor((grossAnnual - totalTax) / 12);
  }, [salary, bonus, stateCode]);

  const totalAllocated = items.reduce((sum, i) => sum + i.amount, 0);
  const unallocatedFunds = netMonthlyIncome - totalAllocated;
  const progressPercent = Math.min(100, Math.max(0, (totalAllocated / netMonthlyIncome) * 100));

  const handleLoginSuccess = (res) => setUser(jwtDecode(res.credential));
  const handleLogout = () => { googleLogout(); setUser(null); setItems([]); };
  const handleRemoveCategory = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleAmountChange = (index, newValue) => { setItems(prev => prev.map((item, i) => i === index ? { ...item, amount: Number(newValue) } : item)); };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const amt = Number(transferAmount);
    
    if (source.droppableId === 'unallocated-source') {
      setItems(prev => {
        const copy = [...prev];
        copy[destination.index] = { ...copy[destination.index], amount: copy[destination.index].amount + amt };
        return copy;
      });
      return;
    }

    if (source.droppableId === 'budget-list' && destination.droppableId === 'budget-list') {
      if (source.index === destination.index) return;
      setItems(prev => {
        const copy = [...prev];
        copy[source.index] = { ...copy[source.index], amount: copy[source.index].amount - amt };
        copy[destination.index] = { ...copy[destination.index], amount: copy[destination.index].amount + amt };
        return copy;
      });
      setStatus(`✅ Moved $${amt}`);
    }
  };

  const loadBudget = async () => {
    if(!spreadsheetInput) return setStatus("⚠️ Enter Link or ID");
    const realId = getSpreadsheetId(spreadsheetInput);
    setStatus("⏳ Syncing...");
    try {
      const res = await fetch(`${API_URL}?spreadsheetId=${realId}&sheetName=${sheetName}`);
      const json = await res.json();
      
      if (json.allSheets) setAvailableSheets(json.allSheets);
      if (json.savedData) {
        setSalary(json.savedData.salary);
        setBonus(json.savedData.bonus);
        setStateCode(json.savedData.state);
      }

      if(json.status === "empty") {
        setItems([{id:'1', category:'Rent', amount:0}, {id:'2', category:'Groceries', amount:0}]);
      } else {
        setItems((json.items || []).map((i, idx) => ({ ...i, id: `item-${idx}` })));
        setStatus("✅ Data Synced");
      }
    } catch(e) { setStatus(`❌ Error: ${e.message}`); }
  };

  const saveBudget = async () => {
    const realId = getSpreadsheetId(spreadsheetInput);
    setStatus("⏳ Saving...");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          spreadsheetId: realId, 
          sheetName: sheetName.trim() || "MyBudget",
          netMonthlyIncome, 
          incomeData: { salary, bonus, state: stateCode }, 
          items
        })
      });
      const json = await res.json();
      if (json.allSheets) setAvailableSheets(json.allSheets);
      setStatus("✅ Saved!");
    } catch(e) { setStatus(`❌ Error: ${e.message}`); }
  };

  const getSpreadsheetId = (input) => {
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-gray-100 relative overflow-hidden">
          <div className="mb-8 relative">
            <div className="w-20 h-20 bg-linear-to-tr from-blue-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg z-10 relative">
               <span className="text-4xl animate-pulse">💳</span>
            </div>
            <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto absolute top-0 left-0 right-0 -z-10 opacity-50"></div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">FinFlow</h1>
          <p className="text-gray-500 mb-8 font-medium">Smart Budgeting for Modern Life</p>
          <div className="flex justify-center"><GoogleLogin onSuccess={handleLoginSuccess} useOneTap shape="pill" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-gray-800 bg-gray-50 min-h-screen relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg">💳</div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">FinFlow</h1>
        </div>
        <div className="flex items-center gap-4 bg-white pl-4 pr-2 py-2 rounded-full shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Welcome back</p>
            <p className="text-sm font-bold text-gray-800 leading-none">{user.name}</p>
          </div>
          {user.picture && <img src={user.picture} alt="Profile" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-2 border-white shadow-xs" />}
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors font-bold">✕</button>
        </div>
      </div>

      {/* SYNC SETTINGS */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[300px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Spreadsheet Link</label>
            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm" placeholder="Paste ID or Link..." value={spreadsheetInput} onChange={e=>setSpreadsheetInput(e.target.value)} />
        </div>
        <div className="w-64">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Select or Type Tab</label>
            <div className="relative">
                <input list="sheet-options" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500" value={sheetName} onChange={e=>setSheetName(e.target.value)} placeholder="e.g. Jan-2026" />
                <datalist id="sheet-options">{availableSheets.map(name => <option key={name} value={name} />)}</datalist>
            </div>
        </div>
        <button onClick={loadBudget} className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95">Sync Data</button>
      </div>

      {/* INCOME CALCULATOR */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl mb-10 text-white relative overflow-hidden">
        <div className="flex flex-wrap gap-8 items-end relative z-10">
            <div><label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Salary</label><input type="number" className="pl-4 p-3 rounded-xl bg-slate-700/50 border border-slate-600 w-32 focus:outline-hidden focus:ring-2 focus:ring-blue-400" value={salary} onChange={e=>setSalary(e.target.value)} /></div>
            <div><label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Bonus</label><input type="number" className="pl-4 p-3 rounded-xl bg-slate-700/50 border border-slate-600 w-32 focus:outline-hidden focus:ring-2 focus:ring-blue-400" value={bonus} onChange={e=>setBonus(e.target.value)} /></div>
            <div><label className="text-xs text-slate-400 font-bold uppercase mb-2 block">State</label><select className="p-3 rounded-xl bg-slate-700/50 border border-slate-600 w-24 focus:outline-hidden" value={stateCode} onChange={e=>setStateCode(e.target.value)}>{Object.keys(STATE_TAX_RATES).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="ml-auto text-right">
                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Est. Monthly Net</div>
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">${netMonthlyIncome.toLocaleString()}</div>
            </div>
        </div>
        
        {/* BUDGET HEALTH PROGRESS BAR */}
        <div className="mt-6 relative z-10">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
                <span>Budget Utilized</span>
                <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-rose-500' : 'bg-linear-to-r from-emerald-400 to-cyan-400'}`} 
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
            </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col lg:flex-row gap-8">
          
         {/* Categories List */}
          <div className="flex-1">
            {/* Unallocated Amount Display */}
            <div className="mb-8 bg-white border border-indigo-100 p-8 rounded-3xl shadow-xs text-center relative overflow-hidden">
                <span className="text-indigo-900 font-bold text-xs uppercase tracking-widest">To Be Budgeted</span>
                <div className="mt-3">
                    <span className={`text-5xl font-extrabold text-shadow-sm ${unallocatedFunds < 0 ? 'text-shadow-rose-900 text-rose-500' : 'text-shadow-indigo-500 text-indigo-600'}`}>
                        ${unallocatedFunds.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="flex justify-center items-center gap-3 mb-6 bg-slate-100 border-xl border-slate-800 p-2 pl-4 rounded-full w-max mx-auto border border-gray-100 shadow-xs">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Transfer Amount</span>
                <span className="font-bold text-gray-800">$</span>
                <input type="number" value={transferAmount} onChange={e=>setTransferAmount(e.target.value)} className="w-16 font-bold bg-transparent focus:outline-hidden text-gray-800" />
            </div>
            <div className="text-center font-bold h-6 mb-4 text-emerald-600 text-sm uppercase">{status}</div>

            {/* Categories List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden flex flex-col relative">
                
                {/* SCROLLABLE LIST */}
                <div className="relative overflow-y-auto max-h-[400px] p-4 smooth-scroll no-scrollbar">
                    
                    <Droppable droppableId="budget-list">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps} 
                                    className="mb-3 relative group"
                                >
                                   {/* THE UNIFIED CARD */}
                                   <div 
                                        className={`
                                            min-h-[74px] py-4 pr-4 pl-3 rounded-2xl border flex items-center gap-3 relative transition-all
                                            ${snapshot.isDragging ? 'shadow-xl z-50 scale-105' : 'shadow-xs'}
                                        `}
                                        style={{ 
                                            // 1. Use the user's chosen color
                                            // 2. Add '10' (hex) for ~6% opacity background
                                            // 3. Add '40' (hex) for ~25% opacity border
                                            backgroundColor: `${item.color || '#6366f1'}10`, 
                                            borderColor: `${item.color || '#6366f1'}40` 
                                        }}
                                   >
                                       
                                       {/* 1. DRAG HANDLE (Banknote) */}
                                       <div 
                                            {...provided.dragHandleProps} 
                                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 shadow-sm rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform text-xl z-20"
                                       >
                                            💸
                                       </div>

                                       {/* 2. COLOR PICKER (Hidden Input + Visual Circle) */}
                                       <div className="relative group/picker flex-shrink-0">
                                            <div 
                                                className="w-4 h-4 rounded-full border border-black/10 shadow-sm cursor-pointer hover:scale-125 transition-transform" 
                                                style={{ backgroundColor: item.color || '#6366f1' }}
                                            />
                                            {/* The actual input is invisible but covers the circle */}
                                            <input 
                                                type="color" 
                                                value={item.color || '#6366f1'}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[index].color = e.target.value;
                                                    setItems(newItems);
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                       </div>

                                       {/* 3. CATEGORY NAME (Wraps automatically) */}
                                       <span className="font-bold text-gray-700 text-lg leading-tight flex-1 break-words min-w-0 pr-2">
                                            {item.category}
                                       </span>

                                       {/* 4. CONTROLS (Right Aligned) */}
                                       <div className="flex items-center gap-2 flex-shrink-0">
                                         <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-gray-200/50">
                                            <span className="text-gray-400 mr-1 text-sm">$</span>
                                            <input 
                                                type="number" 
                                                onPointerDown={(e) => e.stopPropagation()} // Vital for draggable inputs
                                                className="w-20 text-right font-bold text-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-sm" 
                                                value={item.amount} 
                                                onChange={(e) => handleAmountChange(index, e.target.value)} 
                                            />
                                         </div>
                                         <button 
                                            onClick={() => handleRemoveCategory(index)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-rose-500 hover:text-white transition-all"
                                         >
                                            ✕
                                         </button>
                                       </div>

                                       {/* DRAG PREVIEW TOOLTIP */}
                                       {snapshot.isDragging && (
                                            <div className="absolute top-1/2 left-14 -translate-y-1/2 bg-gray-900 text-white font-bold px-4 py-2 rounded-full shadow-xl whitespace-nowrap z-50">
                                                Move ${transferAmount}
                                            </div>
                                       )}
                                   </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                </div>

                {/* ADD CATEGORY BAR */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 z-30 relative">
                    <input 
                        className="flex-1 p-3 rounded-xl border border-gray-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" 
                        placeholder="New Category..." 
                        value={newCategory} 
                        onChange={e=>setNewCategory(e.target.value)} 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCategory) {
                                // Add random color on Enter
                                const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                                setItems([...items, {id:`new-${Date.now()}`, category:newCategory, amount:0, color: randomColor}]); 
                                setNewCategory('');
                            }
                        }}
                    />
                    <button 
                        onClick={()=>{ 
                            if(!newCategory) return; 
                            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                            setItems([...items, {id:`new-${Date.now()}`, category:newCategory, amount:0, color: randomColor}]); 
                            setNewCategory(''); 
                        }} 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 rounded-xl font-bold transition-all active:scale-95 text-lg"
                    >
                        +
                    </button>
                </div>
            </div>
          </div>

          {/* RIGHT: CHART */}
          <div className="flex-1 flex flex-col gap-6 h-min sticky top-8">
             <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8 text-center">Funds Allocation</h3>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={items} dataKey="amount" nameKey="category" innerRadius={80} outerRadius={120} paddingAngle={5} cornerRadius={6}>
                                {items.map((_, i) => <Cell key={i} fill={TAILWIND_COLORS[i % TAILWIND_COLORS.length]} stroke="none" />)}
                            </Pie>
                            <Tooltip formatter={(val)=>`$${val.toLocaleString()}`} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <button onClick={saveBudget} className="w-full py-4 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-2xl shadow-xl mt-6 transition-all active:scale-[0.98]">💾 Save All Changes</button>
             </div>
          </div>
        </div>
      </DragDropContext>
      
      {/* FLOATING TOOLS */}
      <div className="fixed bottom-8 right-8 flex flex-col md:flex-row items-center gap-4 z-50">
        <button onClick={() => setIsScratchOpen(!isScratchOpen)} className="w-16 h-16 bg-linear-to-br from-gray-300 to-gray-700 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110 shadow-md shadow-gray-400" title="Scratchpad">📝</button>
        <button onClick={() => setIsCalcOpen(!isCalcOpen)} className="w-16 h-16 bg-linear-to-br from-blue-400 to-indigo-800 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110 shadow-md shadow-indigo-400" title="Calculator">🧮</button>
      </div>
      
      <Scratchpad isOpen={isScratchOpen} onClose={() => setIsScratchOpen(false)} value={scratchpad} onChange={setScratchpad} />
      <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />

    </div>
  );
}