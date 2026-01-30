import React, { useState, useMemo, useEffect } from 'react'; //useEffect
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './index.css'
import ScratchpadWidget from './components/scratchpad';
import Calculator from './components/calculator';
import HelpWidget from './components/help';
import SpendingTracker from './components/spending_tracker';


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
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];

  if (!input.includes('/') && input.length > 20) return input;

  return null;
};

//Runs the recurring expense
const BudgetEngine = {
  parseLocalDate: (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-'); 
    return new Date(parts[0], parts[1] - 1, parts[2]);
  },

  //calc income
  calculateBudgetIncome: (netAnnual, payFrequency, budgetDuration, startDateStr) => {
    const start = BudgetEngine.parseLocalDate(startDateStr);

    let end = new Date(start);
    let label = "";
    let total = 0;

    switch (budgetDuration) {
      case 'Weekly':
        end.setDate(start.getDate() + 6); 
        end.setHours(23, 59, 59, 999);
        label = `Weekly (${start.toLocaleDateString()})`;
        total = netAnnual / 52;
        break;
      case 'Bi-Weekly':
        end.setDate(start.getDate() + 13); 
        end.setHours(23, 59, 59, 999);
        label = `Bi-Weekly (${start.toLocaleDateString()})`;
        total = netAnnual / 26;
        break;
      case 'Monthly':
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        label = `Monthly (${start.toLocaleString('default', { month: 'long' })})`;
        total = netAnnual / 12;
        break;
      case 'Annual':
        end.setFullYear(start.getFullYear() + 1);
        label = `Annual (${start.getFullYear()})`;
        total = netAnnual;
        break;
      default:
        total = netAnnual / 12;
    }

    return { total, label, start, end };
  },

  //filtering
  shouldIncludeExpense: (item, budgetStart, budgetEnd) => {

    if (item.isActive === false) return false;

    if (!item.isRecurring) return false;

    if (!item.lastPaidDate || !item.recurrenceFreq) return false;

    const lastPaid = new Date(item.lastPaidDate); 
    lastPaid.setHours(12, 0, 0, 0);

    const start = new Date(budgetStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(budgetEnd);
    end.setHours(23, 59, 59, 999);

    let nextDueDate = new Date(lastPaid);
    let safety = 0;

    while (nextDueDate <= end && safety < 500) {
      switch (item.recurrenceFreq) {
        case 'Weekly': nextDueDate.setDate(nextDueDate.getDate() + 7); break;
        case 'Bi-Weekly': nextDueDate.setDate(nextDueDate.getDate() + 14); break;
        case 'Monthly': nextDueDate.setMonth(nextDueDate.getMonth() + 1); break;
        case 'Semi-Annual': nextDueDate.setMonth(nextDueDate.getMonth() + 6); break;
        case 'Annual': nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); break;
        default: return false;
      }
      if (nextDueDate >= start && nextDueDate <= end) {
        return true;
      }

      safety++;
    }

    return false;
  }
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
  const [mobileExpand, setMobileExpand] = useState(false);
  const [showTransferHelp, setShowTransferHelp] = useState(false);
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);
  const [payFrequency, setPayFrequency] = useState('Bi-Weekly');
  const [salaryFrequency, setSalaryFrequency] = useState('Annual');
  const [budgetDuration, setBudgetDuration] = useState('Monthly'); // Weekly, Bi-Weekly, Monthly, Annual
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [copyFromSheet, setCopyFromSheet] = useState('');
  //const [incomeDisplayMode, setIncomeDisplayMode] = useState('Monthly'); // Visual Toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [chartMode, setChartMode] = useState('budget'); // budget or spent 

  // Budget calcutations 
  // 1. calc net income (defualt: annual)
  const netAnnualIncome = useMemo(() => {
    let grossSalary = Number(salary);

    if (salaryFrequency === 'Monthly') grossSalary *= 12;
    else if (salaryFrequency === 'Bi-Weekly') grossSalary *= 26;
    else if (salaryFrequency === 'Weekly') grossSalary *= 52;

    const grossAnnual = grossSalary + Number(bonus);
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

    return Math.floor(grossAnnual - totalTax);
  }, [salary, bonus, stateCode, salaryFrequency]);

  const effectiveBudgetIncome = useMemo(() => {
    return Math.floor(BudgetEngine.calculateBudgetIncome(
      netAnnualIncome,
      payFrequency,
      budgetDuration,
      targetDate
    ).total);
  }, [netAnnualIncome, payFrequency, budgetDuration, targetDate]);

  //for salary div
  const totalAllocated = items.reduce((sum, i) => sum + i.amount, 0);
  const unallocatedFunds = effectiveBudgetIncome - totalAllocated;
  const progressPercent = Math.min(100, Math.max(0, (totalAllocated / effectiveBudgetIncome) * 100));

  const handleLoginSuccess = (res) => setUser(jwtDecode(res.credential));
  const handleLogout = () => { googleLogout(); setUser(null); setItems([]); };
  const handleRemoveCategory = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleAmountChange = (index, newValue) => { setItems(prev => prev.map((item, i) => i === index ? { ...item, amount: Number(newValue) } : item)); };
  const handleCategoryNameChange = (index, newName) => { setItems(prev => prev.map((item, i) => i === index ? { ...item, category: newName } : item)); };

  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  useEffect(() => {
    const fetchSheetNames = async () => {
      const realId = getSpreadsheetId(spreadsheetInput);

      if (realId) {
        setIsLoadingSheets(true);
        try {
          console.log("Fetching sheets for ID:", realId);
          //get list
          const res = await fetch(`${API_URL}?spreadsheetId=${realId}&meta=true`);
          const json = await res.json();

          if (json.allSheets && json.allSheets.length > 0) {
            console.log("Sheets received:", json.allSheets);
            setAvailableSheets(json.allSheets);
            setShowSheetDropdown(true);


            if (!sheetName || sheetName === "Sheet Name" || sheetName === "Sheet1") {
              setSheetName(json.allSheets[0]);
            }
          }
        } catch (e) {
          console.error("Auto-fetch failed:", e);
        } finally {
          setIsLoadingSheets(false);
        }
      }
    };

    const timer = setTimeout(fetchSheetNames, 1000); //timer to reload
    return () => clearTimeout(timer);
  }, [spreadsheetInput]);

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
    if (!spreadsheetInput) return setSpreadsheetStatus("⚠️ Enter Link");
    const realId = getSpreadsheetId(spreadsheetInput);
    setSpreadsheetStatus("⏳ Syncing...");

    try {
      const url = `${API_URL}?spreadsheetId=${realId}&sheetName=${sheetName}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.items) {
        setItems(json.items.map((i, idx) => ({
          ...i,
          id: `item-${idx}`,
          isActive: i.isActive !== false,
          color: i.color || TAILWIND_COLORS[idx % 10]
        })));

      }

      // sync from spreadsheet to ui
      if (json.savedData) {
        console.log(json.savedData)
        setSalary(json.savedData.salary || 0);
        setBonus(json.savedData.bonus || 0);
        setStateCode(json.savedData.state || 'AL');
        if (json.savedData.payFrequency) setPayFrequency(json.savedData.payFrequency);
        if (json.savedData.budgetDuration) setBudgetDuration(json.savedData.budgetDuration);
        if (json.savedData.targetDate) setTargetDate(json.savedData.targetDate);
        if (json.savedData.salaryFrequency) setSalaryFrequency(json.savedData.salaryFrequency);
      }
      setSpreadsheetStatus("✅ Loaded!");
    } catch (e) { setSpreadsheetStatus(`Error: ${e.message}`); }
  };

  const saveBudget = async () => {
    const realId = getSpreadsheetId(spreadsheetInput);
    const shouldSyncDesign = window.confirm("Do you want to apply your category colors to the Google Sheet?");
    setSpreadsheetStatus("⏳ Saving...");

    const budgetInfo = BudgetEngine.calculateBudgetIncome(netAnnualIncome, payFrequency, budgetDuration, targetDate);

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          spreadsheetId: realId,
          sheetName: sheetName.trim() || "MyBudget",
          budgetPeriod: budgetInfo.label,
          netMonthlyIncome: effectiveBudgetIncome,
          incomeData: {
            salary, bonus, state: stateCode,
            payFrequency, budgetDuration, targetDate,
            salaryFrequency
          },
          
          //intgerate spending gtracking
          items: items.map(item => ({
             category: item.category,
             amount: item.amount,
             recurrenceFreq: item.recurrenceFreq,
             lastPaidDate: item.lastPaidDate,
             isActive: item.isActive,
             spent: item.spent || 0, 
             color: item.color
          })),

          syncDesign: shouldSyncDesign
        })
      });
      setSpreadsheetStatus("✅ Saved!");
    } catch (e) { setSpreadsheetStatus(`Error: ${e.message}`); }
};

  const handleGenerateBudget = async () => {
    setShowSetupWizard(false);
    setSpreadsheetStatus("⏳ Scanning history...");

    try {
      setBudgetDuration(budgetDuration);

      //based on user preference on budgetting period, calc income for budgeting period
      const budgetInfo = BudgetEngine.calculateBudgetIncome(
        netAnnualIncome,
        payFrequency,
        budgetDuration,
        targetDate
      );

      let finalItems = [];

      //option 1: either sync/copy from a sheet
      if (copyFromSheet) {
        let sourceItems = [];

        if (copyFromSheet === sheetName) {
          sourceItems = items;
        } else {
          const realId = getSpreadsheetId(spreadsheetInput);
          const res = await fetch(`${API_URL}?spreadsheetId=${realId}&sheetName=${copyFromSheet}`);
          const json = await res.json();
          sourceItems = json.items || [];

          if (json.savedData) {
            if (json.savedData.salary) setSalary(json.savedData.salary);
            if (json.savedData.payFrequency) setPayFrequency(json.savedData.payFrequency);
            if (json.savedData.salaryFrequency) setSalaryFrequency(json.savedData.salaryFrequency);
          }
        }

        finalItems = sourceItems.filter(item => {
          //query all recurring expenses that fit within the user defined budgeting period 
          const hasRecurrence = item.recurrenceFreq && item.recurrenceFreq !== "None" && item.recurrenceFreq !== "";

          if (item.isActive === false) return false;
          if (hasRecurrence) {
            return BudgetEngine.shouldIncludeExpense({ ...item, isRecurring: true }, budgetInfo.start, budgetInfo.end);
          }
          return true;
        });
      }

      // option b: create budget from scratch but load recurring expenses
      else {
        if (availableSheets.length > 0) {
          console.log(`🔎 Global Scan: Checking ${availableSheets.length} sheets...`);

          const realId = getSpreadsheetId(spreadsheetInput);
          const recurringMap = new Map();

          //query sheets to scan for active, recurring expenses
          const promises = availableSheets.map(name =>
            fetch(`${API_URL}?spreadsheetId=${realId}&sheetName=${name}`)
              .then(res => res.json())
              .catch(
                e => ({ items: [] }))
          );

          const results = await Promise.all(promises);

          console.log(results)

          //scan for categories with active recurrance and occur within budgeting period
          results.forEach(json => {
            if (json.items) {
              json.items.forEach(item => {

                const hasRecurrence = item.recurrenceFreq && item.recurrenceFreq !== "None" && item.recurrenceFreq !== "";

                if (
                  item.isActive !== false &&
                  hasRecurrence &&
                  BudgetEngine.shouldIncludeExpense({ ...item, isRecurring: true }, budgetInfo.start, budgetInfo.end)
                ) {
                  const key = item.category.trim().toLowerCase();

                  const newItem = {
                    ...item,
                    isRecurring: true,
                    isActive: true,
                    id: `scanned-${Date.now()}`
                  };

                  if (!recurringMap.has(key)) {
                    recurringMap.set(key, newItem);
                  } else {
                    const existing = recurringMap.get(key);
                    const newDate = new Date(item.lastPaidDate || '1970-01-01');
                    const oldDate = new Date(existing.lastPaidDate || '1970-01-01');

                    if (newDate > oldDate) {
                      recurringMap.set(key, newItem);
                    }
                  }
                }
              });
            }
          });

          console.log(results);
          if (recurringMap.size > 0) {
            console.log(`Found ${recurringMap.size} unique recurring items due`);
            finalItems = [...finalItems, ...Array.from(recurringMap.values())];
          }
        }
      }

      //update budget
      setItems(finalItems.map((i, idx) => ({
        ...i,
        id: `item-${Date.now()}-${idx}`,
        isActive: true,
        isRecurring: !!(i.recurrenceFreq && i.recurrenceFreq !== "None")
      })));

      // save budget
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          spreadsheetId: getSpreadsheetId(spreadsheetInput),
          sheetName: sheetName.trim() || "MyBudget",
          budgetPeriod: budgetInfo.label,
          netMonthlyIncome: effectiveBudgetIncome,
          incomeData: {
            salary, bonus, state: stateCode,
            payFrequency, budgetDuration, targetDate, salaryFrequency
          },
          items: finalItems,
          syncDesign: true
        })
      });

      setSpreadsheetStatus(`✅ Built: ${budgetInfo.label}`);

    } catch (e) {
      console.error(e);
      setSpreadsheetStatus("❌ Error");
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

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-6 px-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2 max-w-[120px]">
            {/* cateogry color */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase font-mono whitespace-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden"
              title={entry.value}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleSmartImport = (importedData) => {
  const newItems = items.map(item => {
    const matchKey = Object.keys(importedData).find(key => key.toLowerCase() === item.category.toLowerCase());
    if (matchKey) {
      // Add imported amount to existing spent amount
      const currentSpent = item.spent || 0;
      return { ...item, spent: currentSpent + importedData[matchKey] };
    }
    return item;
  });

  setItems(newItems);
  setChartMode('spent'); // Switch view
};

// process slice overlay for budget pie chart (shows fraction spent of each budget in the chart)
const renderProgressSlice = (props) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload 
  } = props;
  
  const budget = payload.amount || 0;
  const spent = payload.spent || 0;
  const pct = budget > 0 ? Math.min(spent / budget, 1.2) : 0; // Cap visual at 120%

  //portion filled based on percentage
  const radiusWidth = outerRadius - innerRadius;
  const spentOuterRadius = innerRadius + (radiusWidth * pct);

  return (
    <g>
      {/* layer 1: og chart w muted background */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.15} 
        cornerRadius={4}
      />
      
      {/* layer 2: % spent overlay */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={spentOuterRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={spent > budget ? "#ef4444" : fill} // alert if over budget
        cornerRadius={4}
      />
      
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill="none"
        stroke={fill}
        strokeOpacity={0.3}
        strokeWidth={1}
      />
    </g>
  );
};

  return (
    <div className='w-full overflow-x-hidden bg-linear-to-br from-[#fdfbf7] to-[#ecfdf5] dark:from-gray-950 dark:to-[#02261d] h-auto'>
      <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-gray-900 dark:text-gray-100 min-h-screen relative transition-colors duration-300">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-linear-to-br from-[#064e3b] to-[#10b981] rounded-lg flex items-center justify-center text-white text-3xl shadow-lg border border-[#34d399]/30">&#x1F4B0;</div><h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight font-serif">Encourage-mint</h1></div>
          <div className="relative flex items-center md:gap-4 bg-white dark:bg-gray-800 md:pl-4 md:pr-2 md:py-2 rounded-full shadow-xs border border-emerald-500 dark:border-emerald-700 hover:shadow-md transition-shadow">
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider font-mono">Welcome back</p>
              <p className="text-sm font-bold font-serif text-gray-800 dark:text-gray-200 leading-none">{user.name}</p>
            </div>
            {user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                referrerPolicy="no-referrer"
                onClick={() => setMobileExpand(!mobileExpand)}
                className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-xs cursor-pointer select-none"
              />
            )}

            <button
              onClick={handleLogout}
              className={`
        w-10 h-10 items-center justify-center rounded-full font-bold transition-colors
        bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 
        hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900 dark:hover:text-rose-300
        
        ${mobileExpand ? 'flex' : 'hidden'} md:flex

        absolute -bottom-12 left-1/2 -translate-x-1/2 z-50 shadow-md border border-gray-200 dark:border-gray-600
        md:static md:translate-x-0 md:bottom-auto md:z-auto md:shadow-none md:border-none
      `}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sync Settings Div */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300">

          <div className="flex flex-wrap gap-4 justify-center md:items-end md:justify-start">

            {/* input 1: sheetlink */}
            <div className="flex-1 w-full md:min-w-[300px]">
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

            {/* input 2: sheet name selector */}
            <div className="w-full md:w-64 relative z-50">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block font-mono">
                  Sheet Name
                </label>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    const realId = getSpreadsheetId(spreadsheetInput);
                    if (!realId) return alert("❌ No ID found in link");

                    setIsLoadingSheets(true);
                    try {
                      const res = await fetch(`${API_URL}?spreadsheetId=${realId}&meta=true`);
                      const text = await res.text();
                      const json = JSON.parse(text);

                      if (json.allSheets) {
                        setAvailableSheets(json.allSheets);
                        setShowSheetDropdown(true);
                        alert(`✅ Success! Found ${json.allSheets.length} sheets.`);
                        if (json.allSheets.length > 0) setSheetName(json.allSheets[0]);
                      } else {
                        alert("⚠️ Connected, but 'allSheets' is missing.");
                      }
                    } catch (err) {
                      alert("❌ Error: " + err.message);
                    } finally {
                      setIsLoadingSheets(false);
                    }
                  }}
                  title="Reload available sheets"
                  className="text-xs text-emerald-800 rounded hover:bg-emerald-200 transition-colors px-2 py-1"
                >
                  🔄
                </button>
              </div>

              {/* dropdown of sheet names */}
              <div className="relative">
                <input
                  type="text"
                  className="w-full font-serif p-3 pr-10 bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  onClick={() => setShowSheetDropdown(true)}
                  onFocus={() => setShowSheetDropdown(true)}
                  placeholder={isLoadingSheets ? "Loading..." : "Select Sheet..."}
                  autoComplete="off"
                />

                {/* click out == exit dropdown */}
                {showSheetDropdown && availableSheets.length > 0 && (
                  <div
                    className="fixed inset-0 z-40 bg-transparent cursor-default"
                    onClick={() => setShowSheetDropdown(false)}
                  ></div>
                )}

                {showSheetDropdown && availableSheets.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border-2 border-emerald-500 rounded-xl shadow-2xl z-50 block animate-in fade-in zoom-in-95 duration-100">
                    {availableSheets.map((name) => (
                      <li
                        key={name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSheetName(name);
                          setShowSheetDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-emerald-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white font-bold border-b border-gray-100 dark:border-gray-700"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}

                {availableSheets.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-yellow-50 text-yellow-800 text-xs text-center border border-yellow-200 rounded hidden group-hover:block pointer-events-none">
                    No sheets loaded yet. Click 'Force Load'.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (availableSheets.includes(sheetName)) {
                  loadBudget();
                } else {
                  setShowSetupWizard(true);
                }
              }}
              className="bg-emerald-900 hover:bg-black dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 uppercase font-mono mt-2 md:mt-0"
            >
              {availableSheets.includes(sheetName) ? "Load Sheet" : "Create New"}
            </button>

          </div>

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
              <div className="flex items-center gap-2">
                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                  <input
                    type="number"
                    className="pl-6 p-3 rounded-xl bg-[#022c22]/60 border border-[#34d399]/30 w-32 md:w-36 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#4ade80] shadow-inner"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                  />
                </div>

                {/* Frequency Dropdown */}
                <select
                  value={salaryFrequency}
                  onChange={(e) => setSalaryFrequency(e.target.value)}
                  className="p-3 rounded-xl bg-black/10 border border-emerald-500/10 text-emerald-100/70 font-mono text-xs font-bold uppercase focus:outline-none focus:bg-black/20 focus:text-emerald-100 [&>option]:text-black cursor-pointer hover:bg-black/20 transition-all"
                >
                  <option value="Annual">/ Year</option>
                  <option value="Monthly">/ Mo</option>
                  <option value="Bi-Weekly">/ 2 Wk</option>
                  <option value="Weekly">/ Wk</option>
                </select>
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
                className="p-4 rounded-xl bg-[#022c22]/60 border border-[#34d399]/30 w-28 focus:outline-none focus:ring-2 focus:ring-[#4ade80] text-white font-mono text-lg [&>option]:text-black cursor-pointer"
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
              >
                {Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* income display */}
            <div className="ml-auto text-right">
              <div className="text-[10px] text-[#86efac] font-bold uppercase tracking-widest mb-2 opacity-80 font-mono flex items-center justify-end gap-1">
                {budgetDuration} Net Income
              </div>
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-b from-white to-[#86efac] drop-shadow-sm tracking-tight font-sans">
                ${effectiveBudgetIncome.toLocaleString()}
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
                <button
                  type="button"
                  onClick={() => setShowTransferHelp(!showTransferHelp)}
                  onMouseEnter={() => setShowTransferHelp(true)}
                  onMouseLeave={() => setShowTransferHelp(false)}
                  className="relative focus:outline-none z-30"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-xs font-bold border border-gray-300 dark:border-gray-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors">
                    ?
                  </div>

                  {/* Tooltip */}
                  <div
                    className={`absolute bottom-full right-0 mb-3 w-64 p-4 bg-gray-900 text-white text-xs rounded-xl shadow-xl transition-all transform z-50 text-left pointer-events-none origin-bottom-right
      ${showTransferHelp ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'} `}
                  >
                    <div className="font-bold uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-700 pb-1">How to Move Money</div>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg leading-none">🪙</span>
                      <span className="leading-tight">Drag <b>Coin</b> to add new money from your Income to a Category.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none">💸</span>
                      <span className="leading-tight">Drag <b>Bill</b> (next to category) to move money between buckets.</span>
                    </div>

                    <div className="absolute top-full right-1 -mt-1 border-8 border-transparent border-t-gray-900"></div>
                  </div>
                </button>

              </div>

              <div className="w-full text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm uppercase h-4 mb-4">
                {/* {status} */}
                {transferStatus}
              </div>

              {/* Config Settings */}
              <div className="mb-4 flex flex-col gap-2 relative z-30">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`self-end text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${showAdvanced ? 'bg-emerald-100 text-emerald-800' : 'text-emerald-600 hover:bg-emerald-50'}`}
                >
                  <span>⚙️ Advanced Settings </span>
                  <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {showAdvanced && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border-2 border-emerald-100 dark:border-gray-700 shadow-2xl w-full animate-in slide-in-from-top-4 fade-in duration-300">

                    <div className="flex justify-between items-end mb-6 px-2">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-white font-serif">Recurring Expenses</h3>
                        <p className="text-xs text-gray-400 mt-1">Set schedules to auto-add expenses to future budgets.</p>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {items.filter(i => i.isRecurring).length} Active Rules
                      </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-4 pr-2">
                      {items.map((item, index) => {
                        const updateItem = (field, value) => {
                          setItems(prevItems => {
                            const newItems = [...prevItems];
                            if (field === 'isRecurring' && value === true && !item.recurrenceFreq) {
                              newItems[index] = { ...newItems[index], [field]: value, recurrenceFreq: 'Monthly' };
                            } else {
                              newItems[index] = { ...newItems[index], [field]: value };
                            }
                            return newItems;
                          });
                        };

                        const isRecurring = item.isRecurring || false;

                        return (
                          <div
                            key={item.id}
                            className={`p-5 rounded-2xl border-2 transition-all duration-300 ${isRecurring
                                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-md'
                                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                              }`}
                          >
                            {/* category info */}
                            <div className="flex justify-between items-start mb-2">

                              <div className="flex flex-col gap-1">
                                <span className={`font-bold text-lg transition-colors ${isRecurring ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {item.category}
                                </span>
                                <span className="font-mono text-gray-400 text-xs">${item.amount.toLocaleString()}</span>
                              </div>

                              {/* toggle */}
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <span className={`text-[10px] font-bold font-mono uppercase tracking-wider transition-colors ${isRecurring ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                  {isRecurring ? 'Recurring' : 'Non-recurring'}
                                </span>
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isRecurring}
                                    onChange={(e) => updateItem('isRecurring', e.target.checked)}
                                  />
                                  <div className={`block w-10 h-6 rounded-full transition-colors ${isRecurring ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                              </label>

                            </div>

                            {/* settings */}
                            {isRecurring && (
                              <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/30 space-y-4 animate-in fade-in slide-in-from-top-1">

                                <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mb-2 block">Frequency</label>
                                  <div className="flex flex-wrap gap-2">
                                    {['Weekly', 'Bi-Weekly', 'Monthly', 'Semi-Annual', 'Annual'].map((opt) => (
                                      <button
                                        key={opt}
                                        onClick={() => updateItem('recurrenceFreq', opt)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 ${item.recurrenceFreq === opt
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                            : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600 hover:border-emerald-300'
                                          }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2 block">
                                    Last Paid Date
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="date"
                                      value={item.lastPaidDate || ''}
                                      onChange={(e) => updateItem('lastPaidDate', e.target.value)}
                                      className="w-full p-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <div className="text-[10px] text-gray-400 w-1/2 leading-tight">
                                      Auto-adds to future budgets based on this date.
                                    </div>
                                  </div>
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Categories List */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col relative h-full transition-colors duration-300">

                <div className="flex-1 grid grid-cols-1 grid-rows-1 overflow-y-auto p-4 smooth-scroll relative min-h-0">

                  {/* layer 1: category div visual */}
                  <div className="col-start-1 row-start-1 z-0">
                    {items.map((item, index) => {
                      const itemColor = item.color || TAILWIND_COLORS[index % TAILWIND_COLORS.length];
                      return (
                        <div key={item.id} className="mb-3 relative group">
                          <div
                            className="min-h-[74px] py-3 md:pr-4 pl-3 rounded-2xl border dark:border-gray-600 relative shadow-xs overflow-hidden flex items-center transition-all"
                            style={{ borderColor: `${itemColor}40` }}
                          >
                            <div className="absolute inset-0 opacity-15 dark:opacity-40 pointer-events-none" style={{ backgroundColor: itemColor }} />

                            <div className="relative z-10 flex items-center gap-3 w-full">

                              <div className="w-10 h-10 flex-shrink-0"></div>

                              {/*color picker*/}
                              <div className="relative group/picker flex-shrink-0" title="Change Color">
                                <div className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: itemColor }} />
                                <input type="color" value={itemColor} onChange={(e) => { const newColor = e.target.value; setItems(prev => prev.map((itm, idx) => idx === index ? { ...itm, color: newColor } : itm)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-0" />
                              </div>

                              <input
                                type="text"
                                value={item.category}
                                onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                                className="font-bold text-gray-700 dark:text-gray-200 text-lg leading-tight flex-1 uppercase font-mono min-w-0 pr-2 bg-transparent outline-none border-b-2 border-transparent focus:border-emerald-500 transition-colors placeholder-gray-400/50 truncate"
                                placeholder="CATEGORY NAME"
                              />

                              {/* amount */}
                              <div className="flex items-center gap-0 md:gap-2 flex-shrink-0 ml-auto">
                                <div className="flex items-center bg-white/60 dark:bg-black/30 backdrop-blur-sm px-1 md:px-3 py-1 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-600/50">
                                  <span className="text-gray-400 mr-1 text-sm">$</span>
                                  <input type="number" className="w-10 md:w-20 text-right font-bold text-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-white rounded-sm" value={item.amount} onChange={(e) => handleAmountChange(index, e.target.value)} />
                                </div>
                                <button onClick={() => handleRemoveCategory(index)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-rose-500 hover:text-white transition-all">✕</button>
                              </div>

                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* layer 2: drag and drop money buttons */}
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

                {/* add new category */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3 z-30 relative mt-auto transition-colors duration-300">
                  <input className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white dark:bg-gray-800 font-mono dark:text-white" placeholder="New Category..." value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addNewCategory(); }} />
                  <button onClick={addNewCategory} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-xl font-bold transition-all active:scale-95 text-lg">+</button>
                </div>
              </div>
            </div>

            {/* Chart Div (Right) */}
<div className="flex-1 w-full lg:w-auto h-full flex flex-col">
  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full justify-between transition-colors duration-300 relative">
    
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs font-mono">
        {chartMode === 'budget' ? 'Funds Allocation' : 'Budget Progress'}
      </h3>
      
      {/* budget or spending view */}
      <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-xl flex shrink-0">
        <button
          onClick={() => setChartMode('budget')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            chartMode === 'budget' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' 
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Plan
        </button>
        <button
          onClick={() => setChartMode('spent')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            chartMode === 'spent' 
              ? 'bg-white dark:bg-gray-700 text-rose-500 shadow-sm' 
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Actual
        </button>
      </div>
    </div>


    {/* Chart Div */}
    
    {chartMode === 'budget' ? (
      
      // option 1: standard budget view
      <div className="w-full font-mono uppercase mb-4 h-[400px] lg:h-auto lg:flex-1 min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items.filter(i => i.isActive !== false)}
              dataKey="amount"
              nameKey="category"
              innerRadius="60%"
              outerRadius="80%"
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
            <Tooltip
              formatter={(val) => `$${val.toLocaleString()}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend
              content={renderLegend}
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text: Total Planned */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Plan</span>
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ${items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
            </span>
        </div>
      </div>

    ) : (

      // option 2: percentage spent overlay
      <div className="w-full font-mono uppercase mb-4 h-[400px] lg:h-auto lg:flex-1 min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items.filter(i => i.isActive !== false)}
              dataKey="amount"
              nameKey="category"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              shape={renderProgressSlice}
              activeShape={renderProgressSlice} 
            >
              {items.map((entry, index) => (
                <Cell
                  key={entry.id || `cell-${index}`}
                  fill={entry.color || TAILWIND_COLORS[index % TAILWIND_COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isOver = (data.spent || 0) > data.amount;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-opacity-95">
                      <p className="font-bold text-gray-800 dark:text-white mb-2 text-sm">{data.category}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-6 text-xs text-gray-500 font-mono">
                          <span>Budget:</span>
                          <span>${data.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-6 text-xs font-mono font-bold">
                          <span className={isOver ? "text-rose-500" : "text-emerald-600"}>Spent:</span>
                          <span className={isOver ? "text-rose-500" : "text-emerald-600"}>${(data.spent || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              content={renderLegend}
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
            Total Spent
          </span>
          <span className="text-2xl font-black font-mono text-rose-500">
            ${items
              .filter(i => i.isActive !== false)
              .reduce((sum, item) => sum + (item.spent || 0), 0)
              .toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            of ${items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>
    )}

    {/* Save */}
    <button
      onClick={saveBudget}
      className="w-full font-mono uppercase py-4 bg-gray-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-lg font-bold rounded-2xl shadow-xl mt-2 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      <span>Save Changes</span>
    </button>
  </div>
</div>

          </div>
        </DragDropContext>

        {/* Widget Buttons */}
<div className="fixed z-50 transition-all duration-300
    bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 
    md:bottom-8 md:right-8 md:left-auto
    flex items-center gap-2 p-2 rounded-full
    bg-white/90 dark:bg-gray-900/90 
    backdrop-blur-xl border border-gray-200 dark:border-gray-800 
    shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
>
    
    {/* 1. Scratchpad */}
    <button
        onClick={() => setIsScratchOpen(!isScratchOpen)}
        className="group relative w-12 h-12 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
        title="Scratchpad"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </svg>
        
        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Notes
        </span>
    </button>

    {/* 2. Calculator */}
    <button
        onClick={() => setIsCalcOpen(!isCalcOpen)}
        className="group relative w-12 h-12 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
        title="Calculator"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>
        </svg>

        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Calculator
        </span>

    </button>

    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

    {/* 3. Spending Tracker */}
    <button 
        onClick={() => setShowImport(true)} 
        className="group relative w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-105 transition-all duration-200"
        title="Spending Tracker"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>

        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Spending Tracker
        </span>
    </button>

    {/* 4. Help */}
    <button
        onClick={() => setIsHelpOpen(!isHelpOpen)}
        className="group relative w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-gray-300 transition-all duration-200"
        title="Help"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>

        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Help
        </span>
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

        <HelpWidget
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
        <div className="fixed bottom-8 right-[240px] z-50 md:right-[200px]">
          <button onClick={() => setIsHelpOpen(true)}>

          </button>
        </div>

        <SpendingTracker 
  isOpen={showImport} 
  onClose={() => setShowImport(false)} 
  categories={items} 
  onImport={handleSmartImport} 
/>


      </div>

      {/* scratch create your own modal */}
      {showSetupWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90vw] md:max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-6 text-white">
              <h2 className="text-2xl font-bold font-serif">Create New Budget</h2>
              <p className="text-emerald-100 text-sm">Define your timeline and rules.</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase font-mono text-gray-500 mb-1">1. Start Date</label>
                <input type="date" className="w-full p-3 border rounded-xl font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase font-mono text-gray-500 mb-1">2. Budget Duration</label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {['Weekly', 'Bi-Weekly', 'Monthly', 'Annual'].map(d => (
                    <button key={d} onClick={() => setBudgetDuration(d)} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-colors ${budgetDuration === d ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}>{d}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1">3. Pay Frequency</label>
                <div className="flex gap-2 font-mono">
                  {['Weekly', 'Bi-Weekly', 'Monthly'].map(f => (
                    <button key={f} onClick={() => setPayFrequency(f)} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${payFrequency === f ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}>{f}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1">4. Copy Previous?</label>
                <select className="w-full p-3 font-serif border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" onChange={(e) => setCopyFromSheet(e.target.value)}>
                  <option value="">(Start from Scratch)</option>
                  {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

            </div>

            <div className="p-4 font-mono bg-gray-50 dark:bg-gray-900 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowSetupWizard(false)} className="px-4 py-2 text-gray-500 font-bold hover:text-red-500">CANCEL</button>
              <button onClick={handleGenerateBudget} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95">
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}