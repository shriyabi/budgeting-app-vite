import React from 'react';

const calculateFutureValue = (principal, years = 30, rate = 0.08) => {
  // Formula: FV = P * (1 + r)^t
  // principal: The coin amount (e.g., 50)
  // rate: 8% historical S&P 500 return (0.08)
  const fv = principal * Math.pow((1 + rate), years);
  return fv;
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function FutureMoney({ coinAmount, categoryType, isDragging }) {
  // Only render when the user is actively dragging a coin
  if (!isDragging) return null;

  // 1. Calculate the "Future Weight" of this coin
  // We project out 10 and 30 years assuming 8% growth
  const val10 = calculateFutureValue(coinAmount, 10);
  const val30 = calculateFutureValue(coinAmount, 30);

  // 2. Determine Mode (Spending vs Investing)
  // Check if the hover target is an investment bucket
  const isInvesting = 
    categoryType === 'Savings' || 
    categoryType === 'Investments' || 
    categoryType === 'Emergency Fund';
  
  // 3. Dynamic Styling
  const accentColor = isInvesting ? 'text-emerald-500' : 'text-rose-500';
  const bgColor = isInvesting ? 'bg-emerald-50' : 'bg-rose-50';
  const borderColor = isInvesting ? 'border-emerald-100' : 'border-rose-100';
  const shadowColor = isInvesting ? 'shadow-emerald-500/50' : 'shadow-rose-500/50';

  return (
    <div className={`
      fixed z-[999] pointer-events-none 
      top-24 left-1/2 -translate-x-1/2
      w-80 p-4 rounded-2xl shadow-2xl backdrop-blur-xl
      border ${borderColor} bg-white/95 dark:bg-gray-900/95
      transition-all duration-300 animate-in slide-in-from-top-4 fade-in
    `}>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {isInvesting ? 'Wealth Potential' : 'Opportunity Cost'}
        </span>
        <span className={`font-mono font-black text-xl ${accentColor}`}>
          {formatCurrency(coinAmount)}
        </span>
      </div>

      <div className="space-y-3">
        {/* Timeline Visualization */}
        <div className="relative pt-2">
           {/* Vertical Line */}
           <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 ml-1"></div>
           
           {/* 10 Years Milestone */}
           <div className="flex items-center gap-3 relative z-10">
             <div className={`w-2 h-2 rounded-full ${isInvesting ? 'bg-emerald-300' : 'bg-rose-300'}`}></div>
             <div className="flex-1 flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">In 10 Years</span>
                <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{formatCurrency(val10)}</span>
             </div>
           </div>

           {/* 30 Years Milestone */}
           <div className="flex items-center gap-3 relative z-10 mt-3">
             <div className={`w-3 h-3 rounded-full ${isInvesting ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg ${shadowColor}`}></div>
             <div className="flex-1 flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-bold">In 30 Years</span>
                <span className={`font-mono font-black ${accentColor}`}>{formatCurrency(val30)}</span>
             </div>
           </div>
        </div>

        {/* Insight Text */}
        <p className={`text-[10px] p-2 rounded-lg ${bgColor} ${accentColor} bg-opacity-50 dark:bg-opacity-20 leading-tight`}>
           {isInvesting 
             ? "🚀 Putting this to work! Compound interest makes this coin heavy." 
             : "💸 Spending this now removes its ability to grow for your future."}
        </p>
      </div>
    </div>
  );
}