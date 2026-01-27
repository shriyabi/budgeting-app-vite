import React, { useState } from 'react'; 

const Calculator = ({ isOpen, onClose }) => {
  const [calcInput, setCalcInput] = useState('');
  const [result, setResult] = useState('');
  const handleBtn = (val) => {
    if (val === 'C') { setCalcInput(''); setResult(''); return; }
    if (val === '=') {
      try {
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
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider pl-2">Calculator</span>
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

export default Calculator; 