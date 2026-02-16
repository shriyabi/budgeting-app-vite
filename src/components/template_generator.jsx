import React, { useState } from 'react';

const BACKEND_URL = "http://127.0.0.1:8000"; 
//const BACKEND_URL = "https://budgeting-app-vite.onrender.com"; 

const TemplateGenerator = ({ netIncome, onApply, onClose }) => {
  const [formData, setFormData] = useState({
    occupation: '',
    //housingStatus: 'Renting',
    financialGoals: '',
    mustHaveExpenses: '', 
    lifestyleValue: 50 
  });
  const [loading, setLoading] = useState(false);

  //user ranks their spending levels
  const getLifestyleLabel = (val) => {
    if (val <= 15) return { 
      label: "Extremely Frugal", 
      prompt: "extremely frugal, prioritizing maximum savings above all else" 
    };
    if (val <= 35) return { 
      label: "Frugal leaning Balanced", 
      prompt: "mostly frugal but allowing for essential comforts" 
    };
    if (val <= 65) return { 
      label: "Balanced", 
      prompt: "a balanced lifestyle with a 50/30/20 split between needs, wants, and savings" 
    };
    if (val <= 85) return { 
      label: "Balanced leaning Lavish", 
      prompt: "balanced but with a higher allocation for high-quality experiences and discretionary spending" 
    };
    return { 
      label: "Lavish", 
      prompt: "lavish, prioritizing lifestyle, convenience, and luxury spending" 
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    
    //construct a prompt to pass to gemini as context when generating prompt
    const lifestyle = getLifestyleLabel(formData.lifestyleValue);
    const constructedPrompt = `I am a ${formData.occupation}.
    My specific financial goals are: ${formData.financialGoals}. 
    My must have expenses are: ${formData.mustHaveExpenses}. 
    My spending lifestyle is ${lifestyle.prompt}.`;

    try {
      const res = await fetch(`${BACKEND_URL}/generate-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: constructedPrompt, 
          net_income: Number(netIncome) 
        })
      });

      if (!res.ok) throw new Error("Server error");
      const template = await res.json();
      onApply(template);
    } catch (err) {
      console.error("AI Generation failed:", err);
      alert("AI Architect encountered an error. Is the Python server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90vw] md:max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 p-6 text-white flex-shrink-0">
          <h2 className="text-2xl font-bold font-serif">AI Budget Architect</h2>
          <p className="text-emerald-100 text-sm">Fine-tune your financial blueprint.</p>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-bold uppercase font-mono text-gray-500 mb-1">1. Occupation / Current Phase</label>
            <input 
              name="occupation"
              type="text" 
              placeholder="e.g. U-M Student, Junior Dev..."
              className="w-full text-sm font-semibold p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
              value={formData.occupation} 
              onChange={handleInputChange} 
            />
          </div>

          {/* goals time */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1">2. What are your goals and priorites? List any expenses you know for sure you have</label>
            <textarea 
              name="financialGoals"
              placeholder="e.g. Saving $5k for an emergency fund and $1k for a new laptop..."
              className="w-full p-3 border rounded-xl font-medium text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
              value={formData.financialGoals}
              onChange={handleInputChange}
            />
          </div>

          {/* goals time */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1">3. List out mandatory expenses. </label>
            <textarea 
              name="mustHaveExpenses"
              placeholder="e.g. 2000 in Rent every month. $25 for Spotify a month."
              className="w-full p-3 border rounded-xl font-medium text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
              value={formData.mustHaveExpenses}
              onChange={handleInputChange}
            />
          </div>

          {/* spending slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-mono font-bold uppercase text-gray-500">
                4. Spending Lifestyle
              </label>
              <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 transition-all">
                {getLifestyleLabel(formData.lifestyleValue).label}
              </span>
            </div>

            <input 
              type="range"
              name="lifestyleValue"
              min="0"
              max="100"
              step="1"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              value={formData.lifestyleValue}
              onChange={handleInputChange}
            />
            
            <div className="flex justify-between mt-1 text-[8px] font-mono text-gray-400 uppercase tracking-tighter">
              <span>Frugal</span>
              <span>Balanced</span>
              <span>Lavish</span>
            </div>
          </div>
        </div>

        <div className="p-4 font-mono bg-gray-50 dark:bg-gray-900 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-500 font-bold hover:text-red-500"
          >
            CANCEL
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={loading || !formData.occupation || !formData.financialGoals}
            className="px-6 py-2 bg-emerald-800 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "ARCHITECTING..." : "GENERATE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGenerator;