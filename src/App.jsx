import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './index.css'

const API_URL = import.meta.env.VITE_APP_SCRIPT_URL;

const TAILWIND_COLORS = [
  '#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#be123c', '#4338ca', '#0f766e', '#b45309'
];

// Tax calculation data
const STANDARD_DEDUCTION = 15000;
const SOCIAL_SECURITY_CAP = 176100;
const FEDERAL_TAX_BRACKETS = [
  { limit: 11925, rate: 0.10 }, { limit: 48475, rate: 0.12 }, { limit: 103350, rate: 0.22 },
  { limit: 197300, rate: 0.24 }, { limit: 250525, rate: 0.32 }, { limit: 626350, rate: 0.35 },
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

// Widgets (bottom right: calculator and notepad)
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
        {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map(btn => (
          <button key={btn} onClick={() => handleBtn(btn)} className={`p-4 text-lg font-bold rounded-xl transition-colors ${btn === '=' ? 'bg-blue-600 text-white col-span-1' : ['/', '*', '-', '+'].includes(btn) ? 'bg-gray-700 text-blue-400' : btn === 'C' ? 'bg-red-500/20 text-red-400' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>{btn}</button>
        ))}
      </div>
    </div>
  );
};

const Scratchpad = ({ isOpen, onClose, value, onChange, isCalcOpen }) => {
  const [position, setPosition] = useState({
    x: Math.max(window.innerWidth - 350, 20),
    y: window.innerHeight - (isCalcOpen ? 600 : 400)
  });
  const [size, setSize] = useState({ width: 288, height: 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, rightAnchor: 0 });

  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - size.width - 20),
        y: Math.min(prev.y, window.innerHeight - size.height - 20)
      }));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size]);

  const startDrag = (e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); };
  const startResize = (e) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); setDragStart({ rightAnchor: position.x + size.width, y: position.y }); };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      if (isResizing) {
        const newWidth = dragStart.rightAnchor - e.clientX;
        const newHeight = e.clientY - position.y;
        if (newWidth > 200 && newHeight > 150) {
          setSize({ width: newWidth, height: newHeight });
          setPosition({ x: e.clientX, y: position.y });
        }
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, isResizing, dragStart, position.y, position.x]);

  if (!isOpen) return null;
  return (
    <div className="fixed bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col select-none" style={{ left: Math.max(0, position.x), top: Math.max(0, position.y), width: size.width, height: size.height, transition: isDragging || isResizing ? 'none' : 'opacity 0.2s' }}>
      <div onMouseDown={startDrag} className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200 cursor-move">
        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider pl-2 pointer-events-none">Scratchpad</span>
        <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="text-gray-400 hover:text-gray-700 px-2 cursor-pointer">✕</button>
      </div>
      <textarea className="flex-1 w-full p-4 bg-white border-none resize-none font-mono focus:ring-0 text-gray-700 text-sm font-medium focus:outline-none select-text" placeholder="Type quick notes here..." value={value} onChange={(e) => onChange(e.target.value)} />
      <div onMouseDown={startResize} className="absolute bottom-0 left-0 w-8 h-8 cursor-nesw-resize flex items-end justify-start p-1 text-gray-300 hover:text-gray-500 z-10">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-180 pointer-events-none"><path d="M22 22H2V20H22V22ZM22 18H6V16H22V18ZM22 14H10V12H22V14Z" /></svg>
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

 
  const netMonthlyIncome = useMemo(() => {
    const grossAnnual = Number(salary) + Number(bonus);
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
    const totalTax = federalTax + (Math.min(grossAnnual, SOCIAL_SECURITY_CAP) * 0.062) + (grossAnnual * 0.0145) + (grossAnnual * (STATE_TAX_RATES[stateCode] || 0.00));
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

      //moving transfer amount money to another category 
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
    if (!spreadsheetInput) return setStatus("⚠️ Enter Link or ID");
    const realId = getSpreadsheetId(spreadsheetInput);
    setStatus("⏳ Syncing...");
    try {
      const res = await fetch(`${API_URL}?spreadsheetId=${realId}&sheetName=${sheetName}`);
      const json = await res.json();
      if (json.allSheets) setAvailableSheets(json.allSheets);
      if (json.savedData) { setSalary(json.savedData.salary); setBonus(json.savedData.bonus); setStateCode(json.savedData.state); }
      if (json.status === "empty") {
        setItems([{ id: '1', category: 'Rent', amount: 0, color: TAILWIND_COLORS[0] }, { id: '2', category: 'Groceries', amount: 0, color: TAILWIND_COLORS[1] }]);
      } else {
        setItems((json.items || []).map((i, idx) => ({ ...i, id: `item-${idx}`, color: i.color || TAILWIND_COLORS[idx % TAILWIND_COLORS.length] })));
        setStatus("✅ Data Synced");
      }
    } catch (e) { setStatus(`❌ Error: ${e.message}`); }
  };


  const saveBudget = async () => {
    const realId = getSpreadsheetId(spreadsheetInput);

    // save budget colors pop up: allows users to transfer colors to highlight the categories in their spreadsheet
    const shouldSyncDesign = window.confirm(
      "Do you want to apply your category colors to the Google Sheet?"
    );

    setStatus("⏳ Saving...");
    try {
      console.log("SENDING TO GOOGLE:", JSON.stringify({
        syncDesign: shouldSyncDesign,
        firstItemColor: items[0].color,
      }, null, 2));

      console.log(items);

      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          spreadsheetId: realId,
          sheetName: sheetName.trim() || "MyBudget",
          netMonthlyIncome,
          incomeData: { salary, bonus, state: stateCode },
          items,
          syncDesign: shouldSyncDesign 
        })
      });
      const json = await res.json();
      if (json.allSheets) setAvailableSheets(json.allSheets);
      setStatus("✅ Saved!");
    } catch (e) { setStatus(`❌ Error: ${e.message}`); }
  };

  const getSpreadsheetId = (input) => { const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/); return match ? match[1] : input; };
  const addNewCategory = () => {
    if (!newCategory) return;
    const nextColor = TAILWIND_COLORS[items.length % TAILWIND_COLORS.length];
    setItems([...items, { id: `new-${Date.now()}`, category: newCategory, amount: 0, color: nextColor }]);
    setNewCategory('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-gray-100 relative overflow-hidden">
          <div className="mb-8 relative"><div className="w-20 h-20 bg-linear-to-tr from-blue-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg z-10 relative"><span className="text-4xl animate-pulse">💳</span></div></div>
          <h1 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">FinFlow</h1>
          <p className="text-gray-500 mb-8 font-medium">Smart Budgeting for Modern Life</p>
          <div className="flex justify-center"><GoogleLogin onSuccess={handleLoginSuccess} useOneTap shape="pill" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-gray-800 bg-gray-50 min-h-screen relative">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg">💳</div><h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">FinFlow</h1></div>
        <div className="flex items-center gap-4 bg-white pl-4 pr-2 py-2 rounded-full shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-right hidden md:block"><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Welcome back</p><p className="text-sm font-bold text-gray-800 leading-none">{user.name}</p></div>
          {user.picture && <img src={user.picture} alt="Profile" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-2 border-white shadow-xs" />}
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors font-bold">✕</button>
        </div>
      </div>
      
      {/* Sync Settings Div (top) */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 mb-8">
        
        <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[300px]">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Spreadsheet Link</label>
                <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm" placeholder="Paste ID or Link..." value={spreadsheetInput} onChange={e => setSpreadsheetInput(e.target.value)} />
            </div>
            <div className="w-64">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Select or Type Tab</label>
                <div className="relative">
                    <input list="sheet-options" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500" value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="e.g. Jan-2026" />
                    <datalist id="sheet-options">{availableSheets.map(name => <option key={name} value={name} />)}</datalist>
                </div>
            </div>
            <button onClick={loadBudget} className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95">Sync Data</button>
        </div>

        <div className="w-full text-center mt-4 font-bold text-emerald-600 text-sm uppercase h-4">
            {status}
        </div>
      </div>

      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl mb-10 text-white relative overflow-hidden">
        <div className="flex flex-wrap gap-8 items-end relative z-10">
          <div><label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Salary</label><input type="number" className="pl-4 p-3 rounded-xl bg-slate-700/50 border border-slate-600 w-32 focus:outline-hidden focus:ring-2 focus:ring-blue-400" value={salary} onChange={e => setSalary(e.target.value)} /></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Bonus</label><input type="number" className="pl-4 p-3 rounded-xl bg-slate-700/50 border border-slate-600 w-32 focus:outline-hidden focus:ring-2 focus:ring-blue-400" value={bonus} onChange={e => setBonus(e.target.value)} /></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase mb-2 block">State</label><select className="p-3 rounded-xl bg-slate-700/50 border border-slate-600 w-24 focus:outline-hidden" value={stateCode} onChange={e => setStateCode(e.target.value)}>{Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="ml-auto text-right"><div className="text-xs text-slate-400 font-bold uppercase mb-1">Est. Monthly Net</div><div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">${netMonthlyIncome.toLocaleString()}</div></div>
        </div>
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80"><span>Budget Utilized</span><span>{Math.round(progressPercent)}%</span></div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-rose-500' : 'bg-linear-to-r from-emerald-400 to-cyan-400'}`} style={{ width: `${Math.min(progressPercent, 100)}%` }}></div></div>
        </div>
      </div>

     <DragDropContext onDragEnd={onDragEnd}>
        {/* flex-row: left and right big divs */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch h-[700px]">
          
          {/* Left Div: categories + transfer amount + amount to be transfered */}
          <div className="flex-1 flex flex-col w-full h-full">
            
            {/* Leftover Budget Div */}
            <div className="mb-4 bg-white border border-indigo-100 px-8 py-6 rounded-3xl shadow-sm text-center relative overflow-hidden">
              <span className="text-indigo-900 font-bold text-xs uppercase tracking-widest">To Be Budgeted</span>
              <div className="mt-2 mb-8">
                <span className={`text-5xl font-extrabold ${unallocatedFunds < 0 ? 'text-rose-500' : 'text-indigo-600'}`}>
                    ${unallocatedFunds.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Transfer Amount Div */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <div className="flex items-center gap-3 bg-slate-100 p-2 pl-4 rounded-full border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Transfer Amount</span>
                <span className="font-bold text-gray-800">$</span>
                <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-16 font-bold bg-transparent focus:outline-none text-gray-800" />
              </div>
            </div>
            
            {/* Category Div */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden flex flex-col relative h-full">
              
              <div className="flex-1 grid grid-cols-1 grid-rows-1 overflow-y-auto p-4 smooth-scroll no-scrollbar relative min-h-0">

                {/* Layer 1: Static Content: Category name and the amount */}
                <div className="col-start-1 row-start-1 z-0">
                  {items.map((item, index) => {
                    const itemColor = item.color || TAILWIND_COLORS[index % TAILWIND_COLORS.length];
                    return (
                      <div key={item.id} className="mb-3 relative group">
                        <div
                          className="min-h-[74px] py-4 pr-4 pl-3 rounded-2xl border flex items-center gap-3 relative shadow-xs"
                          style={{ backgroundColor: `${itemColor}10`, borderColor: `${itemColor}40` }}
                        >
                          <div className="w-10 h-10 flex-shrink-0"></div>

                          <div className="relative group/picker flex-shrink-0" title="Change Color">
                            <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: itemColor }} />
                            <input
                              type="color"
                              value={itemColor}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                setItems(prev => prev.map((itm, idx) => idx === index ? { ...itm, color: newColor } : itm));
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>

                          <span className="font-bold text-gray-700 text-lg leading-tight flex-1 break-words min-w-0 pr-2">{item.category}</span>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-gray-200/50">
                              <span className="text-gray-400 mr-1 text-sm">$</span>
                              <input type="number" className="w-20 text-right font-bold text-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-sm" value={item.amount} onChange={(e) => handleAmountChange(index, e.target.value)} />
                            </div>
                            <button onClick={() => handleRemoveCategory(index)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-rose-500 hover:text-white transition-all">✕</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Layer 2: Draggable Money to transfer amounts between categories */}
                <div className="col-start-1 row-start-1 z-10 pointer-events-none">
                  <Droppable droppableId="budget-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="mb-3 relative min-h-[74px] flex items-center pl-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-amber-100 shadow-sm rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform text-xl z-20 bg-lime-100 pointer-events-auto"
                                >
                                  💸
                                </div>
                                {snapshot.isDragging && <div className="absolute top-1/2 left-14 -translate-y-1/2 bg-gray-900 text-white font-bold px-4 py-2 rounded-full shadow-xl whitespace-nowrap z-50">Move ${transferAmount}</div>}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 z-30 relative mt-auto">
                <input className="flex-1 p-3 rounded-xl border border-gray-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" placeholder="New Category..." value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addNewCategory(); }} />
                <button onClick={addNewCategory} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 rounded-xl font-bold transition-all active:scale-95 text-lg">+</button>
              </div>
            </div>
          </div>

          {/* Right Div */}
          <div className="flex-1 w-full lg:w-auto h-full flex flex-col">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col h-full justify-between">
              <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8 text-center">Funds Allocation</h3>
              
              {/* Chart Container */}
              <div className="w-full h-[70%] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={items}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius="50%"
                      outerRadius="75%" 
                      paddingAngle={5}
                      cornerRadius={6}
                    >
                      {items.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || TAILWIND_COLORS[index % TAILWIND_COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `$${val.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px" }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <button
                onClick={saveBudget}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-2xl shadow-xl mt-6 transition-all active:scale-[0.98]"
              >
                💾 Save All Changes
              </button>
            </div>
          </div>

        </div>
      </DragDropContext>

      <div className="fixed bottom-8 right-8 flex flex-col md:flex-row items-center gap-4 z-50">
        <button onClick={() => setIsScratchOpen(!isScratchOpen)} className="w-16 h-16 bg-linear-to-br from-gray-300 to-gray-700 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110 shadow-md shadow-gray-400" title="Scratchpad">📝</button>
        <button onClick={() => setIsCalcOpen(!isCalcOpen)} className="w-16 h-16 bg-linear-to-br from-blue-400 to-indigo-800 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110 shadow-md shadow-indigo-400" title="Calculator">🧮</button>
      </div>

      <Scratchpad isOpen={isScratchOpen} onClose={() => setIsScratchOpen(false)} value={scratchpad} onChange={setScratchpad} isCalcOpen={isCalcOpen} />
      <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </div>
  );
}