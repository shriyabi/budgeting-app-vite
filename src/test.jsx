import React, { useState } from 'react';

export default function DesignShowcase() {
  // Mock State for the preview
  const [salary, setSalary] = useState(60000);
  const [bonus, setBonus] = useState(5000);
  const [stateCode, setStateCode] = useState('TX');
  
  // Mock Data
  const netMonthlyIncome = 4250; 
  const progressPercent = 65; 
  const STATE_TAX_RATES = { 'TX': 0.00, 'CA': 0.093, 'NY': 0.06 };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 space-y-12 font-sans">
      
      {/* HEADER */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">Design Options</h1>
        <p className="text-gray-500">Which vibe fits your app best?</p>
      </div>

      {/* --- OPTION 1: MIDNIGHT FINTECH --- */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest">Option 1: Midnight Fintech (Blue/Cyan)</h2>
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden border border-blue-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-wrap gap-8 items-end relative z-10">
            <div><label className="text-xs text-blue-200/80 font-bold uppercase mb-2 block">Salary</label><input type="number" className="pl-4 p-3 rounded-xl bg-slate-800/80 border border-blue-500/30 w-32 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-white" value={salary} onChange={e => setSalary(e.target.value)} /></div>
            <div><label className="text-xs text-blue-200/80 font-bold uppercase mb-2 block">Bonus</label><input type="number" className="pl-4 p-3 rounded-xl bg-slate-800/80 border border-blue-500/30 w-32 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-white" value={bonus} onChange={e => setBonus(e.target.value)} /></div>
            <div><label className="text-xs text-blue-200/80 font-bold uppercase mb-2 block">State</label><select className="p-3 rounded-xl bg-slate-800/80 border border-blue-500/30 w-24 focus:outline-hidden text-white [&>option]:text-black" value={stateCode} onChange={e => setStateCode(e.target.value)}>{Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="ml-auto text-right"><div className="text-xs text-blue-200/80 font-bold uppercase mb-1">Est. Monthly Net</div><div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-blue-400 drop-shadow-sm">${netMonthlyIncome.toLocaleString()}</div></div>
          </div>
          <div className="mt-6 relative z-10">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80 text-blue-200"><span>Budget Utilized</span><span>{Math.round(progressPercent)}%</span></div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(progressPercent, 100)}%` }}></div></div>
          </div>
        </div>
      </div>

      {/* --- OPTION 2: EXECUTIVE GOLD --- */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest">Option 2: Executive Gold (Black/Gold)</h2>
        <div className="bg-linear-to-br from-neutral-900 via-neutral-950 to-black p-8 rounded-3xl shadow-xl text-white relative overflow-hidden border border-yellow-600/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-wrap gap-8 items-end relative z-10">
            <div><label className="text-xs text-neutral-400 font-bold uppercase mb-2 block">Salary</label><input type="number" className="pl-4 p-3 rounded-xl bg-neutral-800 border border-neutral-700 w-32 focus:outline-hidden focus:ring-2 focus:ring-yellow-600 text-white" value={salary} onChange={e => setSalary(e.target.value)} /></div>
            <div><label className="text-xs text-neutral-400 font-bold uppercase mb-2 block">Bonus</label><input type="number" className="pl-4 p-3 rounded-xl bg-neutral-800 border border-neutral-700 w-32 focus:outline-hidden focus:ring-2 focus:ring-yellow-600 text-white" value={bonus} onChange={e => setBonus(e.target.value)} /></div>
            <div><label className="text-xs text-neutral-400 font-bold uppercase mb-2 block">State</label><select className="p-3 rounded-xl bg-neutral-800 border border-neutral-700 w-24 focus:outline-hidden text-white [&>option]:text-black" value={stateCode} onChange={e => setStateCode(e.target.value)}>{Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="ml-auto text-right"><div className="text-xs text-neutral-400 font-bold uppercase mb-1">Est. Monthly Net</div><div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-sm">${netMonthlyIncome.toLocaleString()}</div></div>
          </div>
          <div className="mt-6 relative z-10">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80 text-neutral-400"><span>Budget Utilized</span><span>{Math.round(progressPercent)}%</span></div>
            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-rose-600' : 'bg-yellow-500'}`} style={{ width: `${Math.min(progressPercent, 100)}%` }}></div></div>
          </div>
        </div>
      </div>

      {/* --- OPTION 3: MODERN SAAS --- */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest">Option 3: Modern SaaS (Indigo/Violet)</h2>
        <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-violet-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-wrap gap-8 items-end relative z-10">
            <div><label className="text-xs text-indigo-100 font-bold uppercase mb-2 block">Salary</label><input type="number" className="pl-4 p-3 rounded-xl bg-white/10 border border-white/20 w-32 focus:outline-hidden focus:ring-2 focus:ring-white text-white placeholder-white/50" value={salary} onChange={e => setSalary(e.target.value)} /></div>
            <div><label className="text-xs text-indigo-100 font-bold uppercase mb-2 block">Bonus</label><input type="number" className="pl-4 p-3 rounded-xl bg-white/10 border border-white/20 w-32 focus:outline-hidden focus:ring-2 focus:ring-white text-white" value={bonus} onChange={e => setBonus(e.target.value)} /></div>
            <div><label className="text-xs text-indigo-100 font-bold uppercase mb-2 block">State</label><select className="p-3 rounded-xl bg-white/10 border border-white/20 w-24 focus:outline-hidden text-white [&>option]:text-black" value={stateCode} onChange={e => setStateCode(e.target.value)}>{Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="ml-auto text-right"><div className="text-xs text-indigo-100 font-bold uppercase mb-1">Est. Monthly Net</div><div className="text-5xl font-extrabold text-white drop-shadow-md">${netMonthlyIncome.toLocaleString()}</div></div>
          </div>
          <div className="mt-6 relative z-10">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80 text-indigo-100"><span>Budget Utilized</span><span>{Math.round(progressPercent)}%</span></div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-rose-300' : 'bg-white'}`} style={{ width: `${Math.min(progressPercent, 100)}%` }}></div></div>
          </div>
        </div>
      </div>

      {/* --- OPTION 4: CLEAN MINIMALIST --- */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest">Option 4: Clean Minimalist (White/Gray)</h2>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm text-gray-900 dark:text-white relative overflow-hidden border-2 border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-8 items-end relative z-10">
            <div><label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Salary</label><input type="number" className="pl-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 w-32 focus:outline-hidden focus:ring-2 focus:ring-gray-400 text-gray-900 dark:text-white" value={salary} onChange={e => setSalary(e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Bonus</label><input type="number" className="pl-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 w-32 focus:outline-hidden focus:ring-2 focus:ring-gray-400 text-gray-900 dark:text-white" value={bonus} onChange={e => setBonus(e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 font-bold uppercase mb-2 block">State</label><select className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 w-24 focus:outline-hidden text-gray-900 dark:text-white" value={stateCode} onChange={e => setStateCode(e.target.value)}>{Object.keys(STATE_TAX_RATES).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="ml-auto text-right"><div className="text-xs text-gray-400 font-bold uppercase mb-1">Est. Monthly Net</div><div className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">${netMonthlyIncome.toLocaleString()}</div></div>
          </div>
          <div className="mt-6 relative z-10">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-80 text-gray-400"><span>Budget Utilized</span><span>{Math.round(progressPercent)}%</span></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-rose-500' : 'bg-gray-900 dark:bg-white'}`} style={{ width: `${Math.min(progressPercent, 100)}%` }}></div></div>
          </div>
        </div>
      </div>

    </div>
  );
}