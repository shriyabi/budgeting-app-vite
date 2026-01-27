import React, { useState, useMemo, useEffect } from 'react'; //useEffect
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './index.css'
import ScratchpadWidget from './components/scratchpad';
import Calculator from './components/calculator';
import HelpWidget from './components/help';

const API_URL = import.meta.env.VITE_APP_SCRIPT_URL;

// --- DOLLAR BILL PALETTE ---
const TAILWIND_COLORS = [
  '#0f5132', // Treasury Green (Darkest)
  '#198754', // Emerald Bill
  '#4ade80', // Fresh Mint
  '#84cc16', // Lime Strip
  '#eab308', // Gold Seal
  '#14532d', // Forest Shadow
  '#15803d', // Greenback 
  '#86efac', // Light Green Highlight
  '#111827', // Ink Black
  '#71717a', // Serial Grey
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

const getSpreadsheetId = (input) => {
  if (!input) return "";
  // 1. Try to find the ID pattern in a URL
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];

  // 2. If it's a raw ID (no slashes, long string), return it
  if (!input.includes('/') && input.length > 20) return input;

  // 3. Fallback: Return null so we don't send garbage to Google
  return null;
};
  

export default function BudgetApp() {
  const [user, setUser] = useState(null);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  //const [status, setStatus] = useState('');
  const [spreadsheetStatus, setSpreadsheetStatus] = useState('');
  const [transferStatus, setTransferStatus] = useState('');
  const [salary, setSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [stateCode, setStateCode] = useState('AL');
  const [items, setItems] = useState([]);
  const [transferAmount, setTransferAmount] = useState(50);
  const [newCategory, setNewCategory] = useState('');
  const [scratchpad, setScratchpad] = useState('');
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isScratchOpen, setIsScratchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  const [isLoadingSheets, setIsLoadingSheets] = useState(false);


 
  // 3. EFFECT: Auto-fetch Sheet Names
 // 3. EFFECT: Auto-fetch Sheet Names
  useEffect(() => {
    const fetchSheetNames = async () => {
      const realId = getSpreadsheetId(spreadsheetInput);

      if (realId) {
        setIsLoadingSheets(true);
        try {
          console.log("Fetching sheets for ID:", realId);
          // Send meta=true to get the list
          const res = await fetch(`${API_URL}?spreadsheetId=${realId}&meta=true`);
          const json = await res.json();

          if (json.allSheets && json.allSheets.length > 0) {
            console.log("✅ Sheets received:", json.allSheets);
            setAvailableSheets(json.allSheets);
            
            // AUTO-SELECT: If current name is invalid, pick the first one
            if (!sheetName || sheetName === "Sheet Name" || sheetName === "Sheet1") {
               setSheetName(json.allSheets[0]);
            }
          }
        } catch (e) {
          console.error("❌ Auto-fetch failed:", e);
        } finally {
          setIsLoadingSheets(false);
        }
      }
    };

    const timer = setTimeout(fetchSheetNames, 1000); // 1-second debounce
    return () => clearTimeout(timer);
  }, [spreadsheetInput]);
  // --- YOUR EXISTING LOGIC ---

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
      if (source.index === destination.index) {
        setTransferStatus(`❌ Transfer failed`);
        return;
      }

      // Moving transfer amount money to another category 
      setItems(prev => {
        const copy = [...prev];
        copy[source.index] = { ...copy[source.index], amount: copy[source.index].amount - amt };
        copy[destination.index] = { ...copy[destination.index], amount: copy[destination.index].amount + amt };
        return copy;
      });
      setTransferStatus(`✅ Moved $${amt}`);
    }
  };

const loadBudget = async () => {
    // 1. Validation
    if (!spreadsheetInput) return setSpreadsheetStatus("⚠️ Enter Link");
    if (!sheetName) return setSpreadsheetStatus("⚠️ Select a Sheet Name");

    const realId = getSpreadsheetId(spreadsheetInput);
    setSpreadsheetStatus("⏳ Syncing...");

    try {
      // 2. Fetch Data
      const url = `${API_URL}?spreadsheetId=${realId}&sheetName=${sheetName}`;
      const res = await fetch(url);
      const text = await res.text();

      // 3. Catch HTML Errors
      if (text.trim().startsWith("<")) {
        throw new Error("Script Permissions Error");
      }

      const json = JSON.parse(text);

      // 4. Update Dropdown (Just in case)
      if (json.allSheets) setAvailableSheets(json.allSheets);

      // 5. Update Income Data
      if (json.savedData) {
        setSalary(json.savedData.salary);
        setBonus(json.savedData.bonus);
        setStateCode(json.savedData.state);
      }

      // 6. Handle "New" vs "Existing"
      if (json.status === "empty") {
        setItems([
          { id: '1', category: 'Rent', amount: 0, color: TAILWIND_COLORS[0] },
          { id: '2', category: 'Groceries', amount: 0, color: TAILWIND_COLORS[1] }
        ]);
        setSpreadsheetStatus("✨ New Budget Ready");
      } else if (json.status === "error") {
        throw new Error(json.message);
      } else {
        setItems((json.items || []).map((i, idx) => ({
          ...i,
          id: `item-${idx}`,
          color: i.color || TAILWIND_COLORS[idx % TAILWIND_COLORS.length]
        })));
        setSpreadsheetStatus("✅ Data Synced");
      }

    } catch (e) {
      console.error(e);
      setSpreadsheetStatus(`❌ Error: ${e.message}`);
    }
  };

  const saveBudget = async () => {
    const realId = getSpreadsheetId(spreadsheetInput);

    // Save budget colors pop up
    const shouldSyncDesign = window.confirm(
      "Do you want to apply your category colors to the Google Sheet?"
    );

    setSpreadsheetStatus("⏳ Saving...");
    try {
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
      setSpreadsheetStatus("✅ Saved!");
    } catch (e) {
      setSpreadsheetStatus(`❌ Error: ${e.message}`);
    }
  };

  const addNewCategory = () => {
    if (!newCategory) return;
    const nextColor = TAILWIND_COLORS[items.length % TAILWIND_COLORS.length];
    setItems([...items, { id: `new-${Date.now()}`, category: newCategory, amount: 0, color: nextColor }]);
    setNewCategory('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex font-mono items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors duration-300">
          <div className="mb-8 relative">
            <div className="w-20 h-20 bg-linear-to-br from-[#064e3b] to-[#10b981] rounded-2xl mx-auto flex items-center justify-center shadow-xl z-10 relative border border-[#34d399]/30">
              <span className="text-4xl animate-pulse filter drop-shadow-md">💰</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-gray-100 tracking-tight font-serif"> Encourage-mint </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium font-serif">Budgeting made more cents</p>
          <div className="flex justify-center"><GoogleLogin onSuccess={handleLoginSuccess} useOneTap shape="pill" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-screen bg-linear-to-br from-[#fdfbf7] to-[#ecfdf5] dark:from-gray-950 dark:to-[#02261d] h-auto'>
      <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-gray-900 dark:text-gray-100 min-h-screen relative transition-colors duration-300">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-linear-to-br from-[#064e3b] to-[#10b981] rounded-lg flex items-center justify-center text-white text-3xl shadow-lg border border-[#34d399]/30">&#x1F4B0;</div><h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight font-serif">Encourage-mint</h1></div>
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 pl-4 pr-2 py-2 rounded-full shadow-xs border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="text-right hidden md:block"><p className="text-xs text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider font-mono">Welcome back</p><p className="text-sm font-bold font-serif text-gray-800 dark:text-gray-200 leading-none">{user.name}</p></div>
            {user.picture && <img src={user.picture} alt="Profile" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full  border-2 border-white dark:border-gray-700 shadow-xs" />}
            <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center  bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900 dark:hover:text-rose-300 transition-colors font-bold">✕</button>
          </div>
        </div>

      

        {/* Sync Settings Div */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300">

          <div className="flex flex-wrap gap-4 items-end">
            
            {/* INPUT 1: LINK */}
            <div className="flex-1 min-w-[300px]">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 block font-mono">
                Spreadsheet Link
              </label>
              <input 
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                placeholder="Paste Google Sheet Link..." 
                value={spreadsheetInput} 
                onChange={e => setSpreadsheetInput(e.target.value)} 
              />
            </div>

            {/* INPUT 2: SHEET NAME (The Problem Child) */}
            {/* --- DIAGNOSTIC SHEET SELECTOR --- */}
            <div className="w-64 relative z-50">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block font-mono">
                  Sheet Name
                </label>
                {/* DEBUG BUTTON: Force load and show alert */}
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    const realId = getSpreadsheetId(spreadsheetInput);
                    if (!realId) return alert("❌ No ID found in link");

                    setIsLoadingSheets(true);
                    try {
                      // 1. Fetch
                      const res = await fetch(`${API_URL}?spreadsheetId=${realId}&meta=true`);
                      const text = await res.text();
                      console.log("RAW RESPONSE:", text); // Check Console!

                      // 2. Parse
                      const json = JSON.parse(text);
                      console.log("340", json); 
                      // 3. Check keys
                      if (json.allSheets) {
                        setAvailableSheets(json.allSheets);
                        alert(`✅ Success! Found ${json.allSheets.length} sheets: \n${json.allSheets.join(", ")}`);
                        if(json.allSheets.length > 0) setSheetName(json.allSheets[0]);
                      } else {
                        alert("⚠️ Connected, but 'allSheets' is missing from response.\nKeys found: " + Object.keys(json).join(", "));
                      }
                    } catch (err) {
                      alert("❌ Error: " + err.message);
                    } finally {
                      setIsLoadingSheets(false);
                    }
                  }}
                  className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-200 transition-colors"
                >
                  🔄 Force Load
                </button>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  className="w-full font-serif p-3 pr-10 bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder={isLoadingSheets ? "Loading..." : "Select Sheet..."}
                  autoComplete="off"
                />

                {/* VISIBLE LIST (Removed 'hidden' classes to debug) */}
                {availableSheets.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border-2 border-emerald-500 rounded-xl shadow-2xl z-50 block">
                    {availableSheets.map((name) => (
                      <li
                        key={name}
                        // PREVENT DEFAULT prevents input blur
                        onMouseDown={(e) => { e.preventDefault(); setSheetName(name); }}
                        className="px-4 py-3 hover:bg-emerald-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white font-bold border-b border-gray-100 dark:border-gray-700"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* EMPTY STATE INDICATOR */}
                {availableSheets.length === 0 && (
                   <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-yellow-50 text-yellow-800 text-xs text-center border border-yellow-200 rounded hidden group-hover:block">
                      No sheets loaded yet. Click 'Force Load'.
                   </div>
                )}
              </div>
            </div>

            {/* BUTTON: SYNC */}
            <button 
              onClick={loadBudget} 
              className="bg-emerald-900 hover:bg-black dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 uppercase font-mono"
            >
              Sync Data
            </button>
          </div>

          {/* Status Message */}
          <div className="w-full text-center mt-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm uppercase h-4">
            {spreadsheetStatus}
          </div>
        </div>

        {/* Salary/Tax Calculator */}

        <div className="bg-linear-to-br from-[#1a4731] via-[#0f5132] to-[#064e3b] p-8 rounded-3xl shadow-xl shadow-[#064e3b]/20 mb-10 text-white relative overflow-hidden border-2 border-[#4ade80]/20">

          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent -mr-32 -mt-32 pointer-events-none opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          <div className="flex flex-wrap gap-8 items-end relative z-10">

            {/* input fields */}
            <div>
              <label className="text-[10px] text-[#86efac] font-bold uppercase tracking-widest mb-2 block font-mono opacity-80">
                Base Salary
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                <input
                  type="number"
                  className="pl-8 p-3 rounded-xl bg-[#022c22]/60 border border-[#34d399]/30 w-36 focus:outline-none focus:ring-2 focus:ring-[#4ade80] text-white font-mono text-lg shadow-inner"
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#86efac] font-bold uppercase tracking-widest mb-2 block font-mono opacity-80">
                Bonus
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                <input
                  type="number"
                  className="pl-8 p-3 rounded-xl bg-[#022c22]/60 border border-[#34d399]/30 w-36 focus:outline-none focus:ring-2 focus:ring-[#4ade80] text-white font-mono text-lg shadow-inner"
                  value={bonus}
                  onChange={e => setBonus(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#86efac] font-bold uppercase tracking-widest mb-2 block font-mono opacity-80">
                State Tax
              </label>
              <select
                className="p-3 rounded-xl bg-[#022c22]/60 border border-[#34d399]/30 w-28 focus:outline-none focus:ring-2 focus:ring-[#4ade80] text-white font-mono text-lg [&>option]:text-black cursor-pointer"
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
              >
                {Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* income display */}
            <div className="ml-auto text-right">
              <div className="text-[10px] text-[#86efac] font-bold uppercase tracking-widest mb-1 opacity-80 font-mono">
                Monthly Net Income
              </div>
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-b from-white to-[#86efac] drop-shadow-sm tracking-tight font-sans">
                ${netMonthlyIncome.toLocaleString()}
              </div>
            </div>
          </div>

          {/* progress bar on net income used */}
          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-[#86efac] font-mono">
              <span>Funds Utilized</span>
              <span>{isNaN(progressPercent) ? 0 : Math.round(progressPercent)}%</span>
            </div>
            <div className="h-4 bg-[#022c22]/50 rounded-full overflow-hidden border border-[#34d399]/20 p-[2px]">
              <div
                className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(74,222,128,0.3)] ${progressPercent > 100 ? 'bg-rose-500' : 'bg-linear-to-r from-[#15803d] via-[#22c55e] to-[#86efac]'}`}
                style={{ width: `${isNaN(progressPercent) ? 0 : Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>


        <DragDropContext onDragEnd={onDragEnd}>
          {/* Two main divs: categories and chart*/}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-auto lg:h-[700px]">

            {/* Categories Div */}
            <div className="flex-1 flex flex-col w-full h-full min-h-[600px] lg:min-h-0">

              {/* To Be Budgeted */}
              <div className="mb-4 bg-linear-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 border border-emerald-100 dark:border-gray-700 px-8 py-6 rounded-3xl shadow-sm text-center relative overflow-hidden transition-all duration-300">
                <span className="text-emerald-800 font-mono dark:text-emerald-200 font-bold text-xs uppercase tracking-widest opacity-80">
                  To Be Budgeted
                </span>
                <div className="mt-2 lg:mb-10">
                  <span className={`text-5xl font-extrabold ${unallocatedFunds <= 0
                    ? 'text-rose-500 drop-shadow-sm' // negative amount
                    : progressPercent > 85
                      ? 'bg-linear-to-r from-yellow-500 to-amber-600 dark:from-yellow-300 dark:to-yellow-500 bg-clip-text text-transparent' // more than 85% used
                      : 'bg-linear-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-emerald-200 bg-clip-text text-transparent' // else
                    }`}>
                    ${unallocatedFunds.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Transfer Amount */}


              <div className="flex justify-center items-center gap-4 mb-8">

                <div className="flex items-center gap-3 bg-slate-100 dark:bg-gray-700 p-2 pl-4 rounded-full border border-slate-100 dark:border-gray-600 shadow-sm transition-colors duration-300">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wide font-mono">Transfer Amount</span>
                  <span className="font-bold text-gray-800 dark:text-white">$</span>
                  <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-16 font-bold bg-transparent focus:outline-none text-gray-800 dark:text-white" />
                </div>

                <Droppable droppableId="unallocated-source" isDropDisabled={true} direction="horizontal">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      <Draggable draggableId="unallocated-coin-drag" index={0}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="w-12 h-12 flex items-center justify-center border-2 border-yellow-600/20 shadow-md rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform text-2xl z-20 bg-linear-to-br from-yellow-100 to-yellow-300 text-yellow-800 pointer-events-auto">
                            🪙
                            {snapshot.isDragging && <div className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-full shadow-2xl fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2">+ ${transferAmount}</div>}
                          </div>
                        )}
                      </Draggable>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Help Icon */}
                <div className="relative group cursor-help">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-xs font-bold border border-gray-300 dark:border-gray-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors">
                    ?
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform group-hover:-translate-y-1 pointer-events-none z-50">
                    <div className="font-bold uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-700 pb-1">How to Move Money</div>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg leading-none">🪙</span>
                      <span className="leading-tight">Drag <b>Coin</b> to add new money from your Income to a Category.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none">💸</span>
                      <span className="leading-tight">Drag <b>Bill</b> (next to category) to move money between buckets.</span>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>

              <div className="w-full text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm uppercase h-4 mb-4">
                {/* {status} */}
                {transferStatus}
              </div>

              {/* Categories List */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col relative h-full transition-colors duration-300">
                <div className="flex-1 grid grid-cols-1 grid-rows-1 overflow-y-auto p-4 smooth-scroll no-scrollbar relative min-h-0">
                  <div className="col-start-1 row-start-1 z-0">
                    {items.map((item, index) => {
                      const itemColor = item.color || TAILWIND_COLORS[index % TAILWIND_COLORS.length];
                      return (
                        <div key={item.id} className="mb-3 relative group">
                          <div className="min-h-[74px] py-4 pr-4 pl-3 rounded-2xl border dark:border-gray-600 relative shadow-xs overflow-hidden" style={{ borderColor: `${itemColor}40` }}>
                            <div className="absolute inset-0 opacity-15 dark:opacity-40 pointer-events-none" style={{ backgroundColor: itemColor }} />
                            <div className="relative z-10 flex items-center gap-3 h-full">
                              <div className="w-10 h-10 flex-shrink-0"></div>
                              <div className="relative group/picker flex-shrink-0" title="Change Color">
                                <div className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: itemColor }} />
                                <input type="color" value={itemColor} onChange={(e) => { const newColor = e.target.value; setItems(prev => prev.map((itm, idx) => idx === index ? { ...itm, color: newColor } : itm)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-0" />
                              </div>
                              <span className="font-bold text-gray-700 dark:text-gray-200 text-lg leading-tight flex-1 break-words min-w-0 pr-2 uppercase font-mono">{item.category}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center bg-white/60 dark:bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-600/50">
                                  <span className="text-gray-400 mr-1 text-sm">$</span>
                                  <input type="number" className="w-20 text-right font-bold text-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-white rounded-sm" value={item.amount} onChange={(e) => handleAmountChange(index, e.target.value)} />
                                </div>
                                <button onClick={() => handleRemoveCategory(index)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-rose-500 hover:text-white transition-all">✕</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="col-start-1 row-start-1 z-10 pointer-events-none">
                    <Droppable droppableId="budget-list">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className="mb-3 relative min-h-[74px] flex items-center pl-3">
                                  <div {...provided.dragHandleProps} className="w-10 h-10 flex-shrink-0 flex items-center justify-center border-2 border-yellow-600/20 shadow-sm rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform text-xl z-20 bg-linear-to-br from-yellow-100 to-yellow-300 text-yellow-800 pointer-events-auto">💸</div>
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
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3 z-30 relative mt-auto transition-colors duration-300">
                  <input className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white dark:bg-gray-800 font-mono dark:text-white" placeholder="New Category..." value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addNewCategory(); }} />
                  <button onClick={addNewCategory} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-xl font-bold transition-all active:scale-95 text-lg">+</button>
                </div>
              </div>
            </div>

            {/* Chart Div (Right) */}
            <div className="flex-1 w-full lg:w-auto h-full flex flex-col">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full justify-between transition-colors duration-300">
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8 text-center font-mono">Funds Allocation</h3>

                {/* Chart */}
                <div className="w-full font-mono uppercase mb-10 h-[400px] lg:h-auto lg:flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {/* <Pie
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
                      </Pie> */}

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
                            key={entry.id || `cell-${index}`}
                            fill={entry.color || TAILWIND_COLORS[index % TAILWIND_COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>

                      <Tooltip formatter={(val) => `$${val.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <button
                  onClick={saveBudget}
                  className="w-full font-mono uppercase py-4 bg-gray-900 hover:bg-black dark:bg-emerald-800 dark:hover:bg-emerald-700 text-white text-lg font-bold rounded-2xl shadow-xl mt-6 transition-all active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </div>

          </div>
        </DragDropContext>

        {/* Widget Buttons*/}


        <div className="fixed bottom-8 right-8 flex flex-col md:flex-row items-center gap-4 z-50">
          <button
            onClick={() => setIsScratchOpen(!isScratchOpen)}
            className="w-16 h-16 bg-linear-to-br from-gray-300 to-gray-700 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110"
            title="Scratchpad"
          >
            📝
          </button>
          <button
            onClick={() => setIsCalcOpen(!isCalcOpen)}
            className="w-16 h-16 bg-linear-to-br from-blue-400 to-indigo-800 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110"
            title="Calculator"
          >
            🧮
          </button>

          <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="w-16 h-16 font-extrabold bg-linear-to-br from-lime-200 to-lime-700 text-white rounded-full shadow-2xl flex items-center justify-center text-5xl transition-transform hover:scale-110 border-emerald-200/50"
            title="Help & Instructions"
          >
            ?
          </button>

        </div>


        {/* Widgets */}
        <ScratchpadWidget
          isOpen={isScratchOpen}
          onClose={() => setIsScratchOpen(false)}
          value={scratchpad}
          onChange={setScratchpad}
          isCalcOpen={isCalcOpen}
        />

        <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
        {/* 
        <HelpWidget isOpen={isHelpOpen} onClose={() => setIsCalcOpen(false)} /> */}

        <HelpWidget
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
        <div className="fixed bottom-8 right-[240px] z-50 md:right-[200px]">
          <button onClick={() => setIsHelpOpen(true)}>

          </button>
        </div>

      </div>
    </div>
  );
}