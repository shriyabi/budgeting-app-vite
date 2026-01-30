import React, { useState, useEffect } from 'react';

// const BACKEND_URL = "http://127.0.0.1:8000"; 
const BACKEND_URL = "https://budgeting-app-vite.onrender.com"; 

//parse user inputted text from statement
const parseBankText = (text) => {
  const lines = text.split('\n');
  const transactions = [];
  const currentYear = new Date().getFullYear();

  const datePattern = /(\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{4}-\d{2}-\d{2})/;
  const amountPattern = /(-?\$?[\d,]+\.\d{2})/; 

  lines.forEach((line, index) => {
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);

    if (dateMatch && amountMatch) {
      let dateStr = dateMatch[0];
      if (dateStr.length <= 5 && dateStr.includes('/')) {
        dateStr = `${dateStr}/${currentYear}`; // year
      }

      let rawAmount = amountMatch[0].replace(/[$,]/g, ''); 
      let amount = parseFloat(rawAmount);
      amount = Math.abs(amount); 

      let description = line
        .replace(dateMatch[0], '')
        .replace(amountMatch[0], '')
        .replace(/\b\d{4,}\b/g, '####') 
        .replace(/Purchase authorized on/i, '')
        .trim();

      if (description.length > 1) {
        transactions.push({
          id: index, 
          date: dateStr,
          description: description,
          amount: amount,
          category: "Uncategorized" 
        });
      }
    }
  });
  return transactions;
};

export default function SpendingTracker({ isOpen, onClose, categories, onImport }) {
  const [step, setStep] = useState('input');
  const [rawText, setRawText] = useState('');
  const [parsedTxns, setParsedTxns] = useState([]);
  const [aggregatedData, setAggregatedData] = useState({}); 

  useEffect(() => {
    if (step === 'review') {
      recalculateTotals();
    }
  }, [parsedTxns]);

  const recalculateTotals = () => {
    const summary = {};
    parsedTxns.forEach((txn) => {
      const cat = txn.category || "Uncategorized";
      if (!summary[cat]) summary[cat] = 0;
      summary[cat] += txn.amount;
    });
    setAggregatedData(summary);
  };

  const handleCategoryChange = (txnId, newCategory) => {
    setParsedTxns(prev => prev.map(t => 
      t.id === txnId ? { ...t, category: newCategory } : t
    ));
  };

  if (!isOpen) return null;

  const handleParse = () => {
    const data = parseBankText(rawText);
    if (data.length === 0) return alert("No valid data found.");
    setParsedTxns(data);
    setStep('preview');
  };

  const handleClassify = async () => {
    setStep('processing');
    try {
      // keys payload
      const payload = {
        transaction_descriptions: parsedTxns.map(t => t.description),
        categories: categories.map(c => c.category)
      };

      const response = await fetch(`${BACKEND_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Backend Error");

      const categoryMapping = await response.json(); 

      //given the classification and payload where indexes match, merch classification + prices
      const newTxns = [...parsedTxns];
      const summary = {};

      newTxns.forEach((txn, index) => {
        const cat = categoryMapping[index.toString()] || "Uncategorized";
        txn.category = cat;
        if (!summary[cat]) summary[cat] = 0;
        summary[cat] += txn.amount;
      });

      setParsedTxns(newTxns);
      setAggregatedData(summary);
      setStep('review');

    } catch (error) {
      console.error(error);
      alert("Backend Connection Failed. Is the server running?");
      setStep('preview');
    }
  };

  const handleFinalImport = () => {
    onImport(aggregatedData); 
    onClose();
    setStep('input');
    setRawText('');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-bold font-serif">Smart Import</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {step === 'input' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Paste transactions directly from your bank website.</p>
              <textarea className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none" 
                placeholder={`STORE [price]`}
                value={rawText} onChange={(e) => setRawText(e.target.value)} />
              <button onClick={handleParse} disabled={!rawText} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">1. Parse Data</button>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
               <div className="max-h-60 overflow-y-auto border rounded-xl dark:border-gray-700">
                 <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0"><tr><th className="p-2">Desc</th><th className="p-2 text-right">Amount</th></tr></thead>
                    <tbody>{parsedTxns.map((t, i) => (<tr key={i} className="border-b dark:border-gray-700"><td className="p-2 truncate max-w-[200px]">{t.description}</td><td className="p-2 text-right">${t.amount}</td></tr>))}</tbody>
                 </table>
               </div>
               <button onClick={handleClassify} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">✨ Auto-Classify (AI)</button>
            </div>
          )}

          {step === 'processing' && (
             <div className="flex flex-col items-center justify-center h-64"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-emerald-600 font-bold">Analyzing...</p></div>
          )}

          {/* fix misclassifications */}
          {step === 'review' && (
            <div className="space-y-6">
               <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 text-center">
                 <h3 className="font-bold text-emerald-800 dark:text-emerald-200">Review & Categorize</h3>
               </div>
               
               <div className="max-h-60 overflow-y-auto border rounded-xl dark:border-gray-700">
                 <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="p-2">Description</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTxns.map((t) => (
                        <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 truncate max-w-[150px]">{t.description}</td>
                          <td className="p-2 font-mono">${t.amount.toFixed(2)}</td>
                          <td className="p-2">
                            <select 
                              value={t.category} 
                              onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                              className={`w-full bg-transparent border-none outline-none font-bold cursor-pointer ${
                                t.category === "Uncategorized" ? "text-rose-500" : "text-emerald-600"
                              }`}
                            >
                              <option value="Uncategorized">⚠️ Uncategorized</option>
                              {categories.map(c => (
                                <option key={c.category} value={c.category}>{c.category}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-4 border-t dark:border-gray-700">
                 <div className="col-span-2 text-xs font-bold text-gray-400 uppercase">Impact on Budget</div>
                 {Object.entries(aggregatedData).map(([cat, amount]) => (
                   cat !== "Uncategorized" && amount > 0 && (
                     <div key={cat} className="p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                        <span className="text-xs truncate font-medium">{cat}</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">+${amount.toFixed(0)}</span>
                     </div>
                   )
                 ))}
               </div>
               
               <button onClick={handleFinalImport} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                 Confirm & Save
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}