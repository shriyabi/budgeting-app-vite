import React, { useState } from 'react';

export default function HelpWidget({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('setup');

    const tabs = [
        { id: 'setup', label: 'Sheet Setup', icon: '📋' },
        { id: 'categories', label: 'Budgeting', icon: '🏷️' },
        { id: 'transfer', label: 'Moving Money', icon: '💸' },
        { id: 'colors', label: 'Color Guide', icon: '🎨' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">

            {/* 1. backdrop; close if clicked outside */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* 2. modal content */}
            <div className="relative bg-white dark:bg-gray-800 w-[90vw] md:max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-auto max-h-[80vh] animate-bounce-in">

                {/* header */}
                <div className="bg-emerald-600 p-4 md:p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-serif">How to use Encourage-mint</h2>
                        <p className="text-emerald-100 text-xs md:text-sm opacity-90 font-sans">Make your budget make cents with these simple rules.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white text-2xl font-bold transition-colors"
                    >
                        &times;
                    </button>
                </div>

                {/* navigation tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center justify-center gap-2
                ${activeTab === tab.id
                                    ? 'text-emerald-600 dark:text-emerald-400 border-b-4 border-emerald-500 bg-white dark:bg-gray-800'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                }`}
                        >
                            <span className="text-base md:text-lg">{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar text-gray-700 dark:text-gray-200 leading-relaxed flex-1">

                    {/* 1. sheet setup */}
                    {activeTab === 'setup' && (
                        <div className="space-y-6">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1 font-sans text-sm md:text-base">⚠️ Strict Formatting Rule</h3>
                                <p className="text-xs md:text-sm">Your Google Sheet <b>must</b> follow this layout for the sync to work correctly.</p>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto">

                                {/* left col: Rows 1-3 (Income) */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                                    <h4 className="font-bold text-emerald-600 mb-2 flex items-center gap-2 text-sm md:text-base">
                                        <span>Rows 1-3</span>
                                        <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Income Only</span>
                                    </h4>
                                    <div className="mt-4">
                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            The first 3 rows are strictly reserved for your income data. Please follow this exact structure:
                                        </p>

                                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                                            <table className="w-full text-xs md:text-sm text-left">

                                                <thead className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 uppercase text-[10px] md:text-xs tracking-wider">
                                                    <tr>
                                                        <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 w-10 md:w-16 text-center">Row</th>
                                                        <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30">Col A</th>
                                                        <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30">Col B</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">

                                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="p-2 md:p-3 font-mono font-bold text-gray-400 text-center">1</td>
                                                        <td className="p-2 md:p-3 text-gray-700 dark:text-gray-200">Net Income</td>
                                                        <td className="p-2 md:p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">$4,250</td>
                                                    </tr>

                                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="p-2 md:p-3 font-mono font-bold text-gray-400 text-center">2</td>
                                                        <td className="p-2 md:p-3 text-gray-700 dark:text-gray-200">Salary</td>
                                                        <td className="p-2 md:p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">$60k</td>
                                                    </tr>

                                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="p-2 md:p-3 font-mono font-bold text-gray-400 text-center">3</td>
                                                        <td className="p-2 md:p-3 text-gray-700 dark:text-gray-200">State</td>
                                                        <td className="p-2 md:p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">TX</td>
                                                    </tr>

                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* right col */}
                                <div className="grid flex flex-col gap-4">

                                    {/* A. Rows 4+ Card */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 shadow-sm">
                                        <h4 className="font-bold text-emerald-600 mb-1 flex items-center gap-2 text-sm md:text-base">
                                            <span>Rows 4+</span>
                                            <span className="text-[10px] md:text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Expenses</span>
                                        </h4>
                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-snug">
                                            All rows starting from Row 4 are automatically treated as <b>Expense Categories</b> (e.g., Rent, Groceries, Savings).
                                        </p>
                                    </div>

                                    {/* B. Column Structure */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm h-full flex flex-col bg-white dark:bg-gray-800">


                                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600 shrink-0">
                                            <h4 className="font-bold text-gray-700 dark:text-gray-200 text-[10px] md:text-xs uppercase tracking-wider">Column Rules</h4>
                                        </div>

                                        <table className="w-full flex-1 text-xs md:text-sm text-left">
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                <tr>
                                                    <td className="p-2 md:p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 w-12 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-r border-gray-100 dark:border-gray-700">A</td>
                                                    <td className="p-2 md:p-3 text-gray-700 dark:text-gray-300 align-middle">
                                                        <span className="block font-bold text-[10px] md:text-xs text-gray-400 uppercase mb-0.5">Name</span>
                                                        Category Name
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 md:p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 w-12 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border-r border-gray-100 dark:border-gray-700">B</td>
                                                    <td className="p-2 md:p-3 text-gray-700 dark:text-gray-300 align-middle">
                                                        <span className="block font-bold text-[10px] md:text-xs text-gray-400 uppercase mb-0.5">Value</span>
                                                        Budget Amount ($)
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/*2. categories tab */}
                    {activeTab === 'categories' && (
                        <div className="space-y-6 md:space-y-8">
                            <h3 className="text-lg md:text-xl font-bold font-serif text-center mb-4 md:mb-6">Choose your Workflow</h3>

                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative">

                                {/* option a: existing budget*/}
                                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 md:p-5 border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        {/* <span className="text-2xl"></span> */}
                                        <h4 className="font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide text-xs md:text-sm">Use Existing</h4>
                                    </div>
                                    <ol className="space-y-4 relative border-l-2 border-blue-200 dark:border-blue-700 ml-2 pl-4 md:pl-6">
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-blue-100 text-blue-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">1</span>
                                            <p className="text-xs md:text-sm">Paste your <b>Google Sheet Link</b>.</p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-blue-100 text-blue-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">2</span>
                                            <p className="text-xs md:text-sm">Select the <b>Sheet Name</b> from the dropdown (e.g. "Jan-2026"). If the dropdown does not have your sheetname, select the reload button.</p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-blue-100 text-blue-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">3</span>
                                            <p className="text-xs md:text-sm">Click <b>Sync</b>. The app will pull all your categories & amounts instantly.</p>
                                        </li>
                                    </ol>
                                </div>

                                <div className="flex items-center justify-center relative md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 z-10 -my-3 md:my-0">
                                    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-[10px] md:text-xs text-gray-400 shadow-sm">
                                        OR
                                    </div>
                                </div>

                                {/* option b: new budget */}
                                <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 md:p-5 border border-purple-100 dark:border-purple-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        {/* <span className="text-2xl"></span> */}
                                        <h4 className="font-bold text-purple-900 dark:text-purple-100 uppercase tracking-wide text-xs md:text-sm">Create New</h4>
                                    </div>
                                    <ol className="space-y-4 relative border-l-2 border-purple-200 dark:border-purple-700 ml-2 pl-4 md:pl-6">
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-purple-100 text-purple-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">1</span>
                                            <p className="text-xs md:text-sm">Paste your <b>Google Sheet Link</b>.</p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-purple-100 text-purple-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">2</span>
                                            <p className="text-xs md:text-sm">Type a <b>New Name</b> (e.g. "Feb-2026").</p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-purple-100 text-purple-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">3</span>
                                            <p className="text-xs md:text-sm">Click <b>Sync</b>. The app will detect it's new and prepare a blank canvas.</p>
                                        </li>
                                    </ol>
                                </div>
                            </div>

                            {/* universal steps */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="font-bold text-center text-emerald-600 dark:text-emerald-400 mb-4 uppercase text-[10px] md:text-xs tracking-widest">Then, Customize & Save</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-lg md:text-xl">🎨</div>
                                        <div>
                                            <strong className="text-xs md:text-sm text-gray-900 dark:text-white block">Customize</strong>
                                            <p className="text-[10px] md:text-xs text-gray-500">Add categories, drag money coins to buckets, and set colors.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="text-lg md:text-xl">💾</div>
                                        <div>
                                            <strong className="text-xs md:text-sm text-gray-900 dark:text-white block">Save Changes</strong>
                                            <p className="text-[10px] md:text-xs text-gray-500">Clicking <b>Save</b> pushes everything (names, amounts, and new categories) back to your Google Sheet.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/*3. transfers tab*/}
                    {activeTab === 'transfer' && (
                        <div className="space-y-6">
                            <div className="text-center p-4 md:p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <h3 className="font-bold text-base md:text-lg mb-4 font-serif">Drag & Drop Magic</h3>

                                {/* RESPONSIVE: flex-col on mobile to stack icons */}
                                <div className="flex flex-col md:flex-row justify-around items-center gap-6 md:gap-0 mb-6">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🪙</div>
                                        <div className="font-bold text-xs uppercase text-gray-500">The Coin</div>
                                        <div className="text-[10px] text-gray-400 w-24 mx-auto">Drag to move <b>New Income</b> into a bucket.</div>
                                    </div>
                                    {/* RESPONSIVE: rotate arrow on mobile */}
                                    <div className="text-2xl text-gray-300 rotate-90 md:rotate-0">➜</div>
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">💸</div>
                                        <div className="font-bold text-xs uppercase text-gray-500">The Bill</div>
                                        <div className="text-[10px] text-gray-400 w-24 mx-auto">Drag to move money <b>between</b> buckets.</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-center">
                                <b>Tip:</b> Set the "Transfer Amount" at the top before dragging. <br />
                                Example: Type "50" &#x2192; Drag Coin &#x2192; Adds $50 to that category or  Type "50" &#x2192; Drag Dollar from one category to another category &#x2192; Adds $50 to target category + Deduct $50 from source category.
                            </p>
                        </div>
                    )}

                    {/* 4. color coordingaitng */}
                    {activeTab === 'colors' && (
                        <div className="space-y-4">
                            <h3 className="text-lg md:text-xl font-bold mb-4 font-serif">What do the colors mean?</h3>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500 shadow-md"></div>
                                <div>
                                    <strong className="text-emerald-800 dark:text-emerald-300 text-sm md:text-base">Healthy Green</strong>
                                    <p className="text-xs">You are under budget! The bar fills up as you spend/allocate money.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-400 shadow-md"></div>
                                <div>
                                    <strong className="text-yellow-800 dark:text-yellow-300 text-sm md:text-base">Cautionary Gold</strong>
                                    <p className="text-xs">You are getting close to your limit (usually &#x003E; 85% utilized).</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-100">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-500 shadow-md"></div>
                                <div>
                                    <strong className="text-rose-800 dark:text-rose-300 text-sm md:text-base">Over-Budget Red</strong>
                                    <p className="text-xs">You have exceeded the allocated amount for this category.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* footer */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 text-center shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 text-sm md:text-base"
                    >
                        Got it, let's budget!
                    </button>
                </div>

            </div>
        </div>
    );
}