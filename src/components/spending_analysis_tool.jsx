import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

//const BACKEND_URL = "http://127.0.0.1:8000"; 
let BACKEND_URL = import.meta.BACKEND_URL; 

// --- PARSING FUNCTION ---
const parseBankText = (text) => {
  const lines = text.split('\n');
  const transactions = [];
  const currentYear = new Date().getFullYear();
  const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const datePattern = /(\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{4}-\d{2}-\d{2}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2})/i;
  const amountPattern = /([+-]?\$?[\d,]+\.\d{2})/; 
  const junkPatterns = [ /Purchase authorized on \d{2}\/\d{2}/i, /Payment to Chase/i, /Recurring Payment/i, /Card Ending \d{4}/i, /\b\d{4,}\b/g, /\s\s+/g ];

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);

    if (dateMatch && amountMatch) {
      const isIncome = line.includes('+') || /deposit|credit|payroll/i.test(line);
      const isBillPay = /payment to|payment thank you|online payment/i.test(line);

      if (!isIncome && !isBillPay) {
          let dateStr = dateMatch[0];
          const textMonthMatch = dateStr.match(/([a-zA-Z]+)\.?\s+(\d+)/);
          if (textMonthMatch) {
            const monthStr = textMonthMatch[1].toLowerCase().substring(0, 3);
            const dayStr = textMonthMatch[2].padStart(2, '0');
            dateStr = `${monthMap[monthStr] || '01'}/${dayStr}/${currentYear}`;
          } else if (dateStr.length <= 5 && dateStr.includes('/')) {
            dateStr = `${dateStr}/${currentYear}`;
          }

          let rawAmount = amountMatch[0].replace(/[$,]/g, ''); 
          let amount = Math.abs(parseFloat(rawAmount));
          let description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
          junkPatterns.forEach(p => { description = description.replace(p, ''); });
          description = description.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();

          if (description.length > 1 && amount > 0) {
            transactions.push({ id: `txn-${index}-${Date.now()}`, date: dateStr, description: description, amount: amount, category: "Uncategorized" });
          }
      }
    }
  });
  return transactions;
};

// --- MAIN COMPONENT ---
export default function SpendingAnalyzer({ isOpen, onClose, currentItems = [], netIncome = 0, onApply }) {
  const [statements, setStatements] = useState(['']);
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [recommendedBudget, setRecommendedBudget] = useState(null);

  if (!isOpen) return null;

  const handleStatementChange = (index, value) => {
    const newStatements = [...statements];
    newStatements[index] = value;
    setStatements(newStatements);
  };

  const addStatementField = () => setStatements([...statements, '']);
  const removeStatementField = (index) => {
    if (statements.length > 1) setStatements(statements.filter((_, i) => i !== index));
  };

  const hasActiveBudget = currentItems && currentItems.filter(i => i.amount > 0).length > 0;

  const handleAnalyze = async () => {
    setLoading(true);
    setAiResponse(null);
    setRecommendedBudget(null);

    const cleanedStatements = statements
      .filter(s => s.trim() !== '')
      .map(rawText => {
        const parsedTxns = parseBankText(rawText);
        return parsedTxns.map(t => `${t.date} | ${t.description} | $${t.amount.toFixed(2)}`).join('\n');
      });

    const payload = {
      statements: cleanedStatements,
      goals: goals,
      income: netIncome,
      hasBudget: hasActiveBudget,
      currentBudget: hasActiveBudget ? currentItems : null 
    };

    try {
      const res = await fetch(`${BACKEND_URL}/analyze-spending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      
      setAiResponse(data.analysis || "Analysis complete.");
      if (data.recommended_budget) {
        setRecommendedBudget(data.recommended_budget);
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Error connecting to AI Architect. Ensure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAnalysis = () => {
    const subject = encodeURIComponent("My Financial Analysis & Budget");
    let bodyText = aiResponse;
    if (recommendedBudget) {
       bodyText += "\n\nRecommended Budget \n";
       Object.entries(recommendedBudget).forEach(([cat, amt]) => {
         bodyText += `${cat}: $${amt}\n`;
       });
    }
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90vw] md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-emerald-500/20">
        
        {/* HEADER */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-start flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
               A.I. Spending Analyst
            </h2>
            <p className="text-slate-200 text-sm mt-1">
              {hasActiveBudget 
                ? "Analyzing statements against your current budget." 
                : "General spending analysis and goal planning."}
            </p>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors text-xl">✕</button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-gray-50 dark:bg-gray-900">
          {aiResponse ? (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-600 font-mono">Analysis Complete</h3>
                <button onClick={() => { setAiResponse(null); setRecommendedBudget(null); }} className="text-xs text-gray-400 hover:text-emerald-500 underline font-mono">← New Analysis</button>
              </div>
              
              {/* BEAUTIFUL MARKDOWN RENDERER */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm leading-relaxed shadow-inner font-sans">
                <ReactMarkdown 
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-6 mb-2 font-serif border-b border-gray-200 dark:border-gray-700 pb-1" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
                    li: ({node, ...props}) => <li className="marker:text-emerald-500" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-extrabold text-gray-900 dark:text-white" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3" {...props} />
                  }}
                >
                  {aiResponse}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold uppercase font-mono text-gray-500 mb-2">1. List your Financial Goals</label>
                <textarea 
                  placeholder="e.g., I want to save $5,000 for a trip to Japan..."
                  className="w-full p-4 font-semibold font-sans rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm min-h-[80px]"
                  value={goals} onChange={(e) => setGoals(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold uppercase font-mono text-gray-500">2. Add Bank Statements</label>
                  <span className="text-[9px] text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded font-bold uppercase">{statements.length} Added</span>
                </div>
                <div className="space-y-3">
                  {statements.map((stmt, index) => (
                    <div key={index} className="relative group">
                      <textarea 
                        placeholder={`Paste Statement ${index + 1} here...`}
                        className="w-full p-4 pr-10 font-sans rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none font-semibold focus:ring-2 focus:ring-emerald-500 shadow-sm min-h-[100px]"
                        value={stmt} onChange={(e) => handleStatementChange(index, e.target.value)}
                      />
                      {statements.length > 1 && (
                        <button onClick={() => removeStatementField(index)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white" title="Remove statement">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addStatementField} className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">
                  <span className="text-lg font-sans leading-none">+</span> Add another statement
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-white dark:bg-gray-800 flex flex-wrap justify-end gap-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          {aiResponse ? (
            <>
              <button onClick={handleEmailAnalysis} className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-bold font-mono text-sm transition-colors flex items-center gap-2">
                ✉️ Email Analysis
              </button>
              {recommendedBudget && (
                <button onClick={() => onApply(recommendedBudget)} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 font-mono text-sm flex items-center gap-2">
                  ✨ {hasActiveBudget ? "Apply Optimized Budget" : "Build Budget Template"}
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:text-red-500 font-mono text-sm">CANCEL</button>
              <button onClick={handleAnalyze} disabled={loading || statements.every(s => s.trim() === '')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 disabled:opacity-50 font-mono text-sm flex items-center gap-2">
                {loading ? <><span className="animate-spin">⚙️</span> ANALYZING...</> : "RUN ANALYSIS"}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
