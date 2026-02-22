import React, { useState } from 'react';

export default function HelpWidget({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('setup');

    const tabs = [
        { id: 'setup', label: 'Sheet Setup'},
        { id: 'workflow', label: 'Workflow'},
        { id: 'recurring', label: 'Recurring'},
        { id: 'transfer', label: 'Moving Money'},
        { id: 'colors', label: 'Color Guide' },
        { id: 'ai_template', label: 'AI Templates'},
        { id: 'ai_analyst', label: 'AI Analyst' },
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
            <div className="relative bg-white dark:bg-gray-800 w-[90vw] md:max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-auto max-h-[85vh] animate-in zoom-in-95 duration-200">

                {/* header */}
                <div className="bg-emerald-600 p-4 md:p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-serif">Encourage-mint Guide</h2>
                        <p className="text-emerald-100 text-xs md:text-sm opacity-90 font-sans">Master the Smart Budgeting features.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white text-2xl font-bold transition-colors"
                    >
                        &times;
                    </button>
                </div>

                {/* navigation tabs with scroll indicator */}
                <div className="relative border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
                    <div className="flex overflow-x-auto custom-scrollbar snap-x snap-mandatory">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 md:py-4 px-4 text-xs md:text-sm font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center justify-center gap-2 snap-start
                ${activeTab === tab.id
                                        ? 'text-emerald-600 dark:text-emerald-400 border-b-4 border-emerald-500 bg-white dark:bg-gray-800'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Scroll Right Hint Overlay (Visible mainly on mobile) */}
                    <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none flex items-center justify-end pr-2 md:hidden">
                        <span className="text-gray-400 dark:text-gray-500 animate-pulse text-lg">▶</span>
                    </div>
                </div>

                <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar text-gray-700 dark:text-gray-200 leading-relaxed flex-1">

                    {/* tab 1: sheet setup */}
                    {activeTab === 'setup' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1 font-sans text-sm md:text-base">&#x26A0; Strict Formatting Rule</h3>
                                <p className="text-xs md:text-sm">Your Google Sheet <b>must</b> follow this layout for the sync to work correctly.</p>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                                <h4 className="font-bold text-emerald-600 mb-2 flex items-center gap-2 text-sm md:text-base">
                                    <span>Full Sheet Structure</span>
                                    <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Rows 1+</span>
                                </h4>

                                <div className="mt-4">
                                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        <b>Rows 1-4</b> are system headers. <b>Row 5</b> defines columns. <b>Row 6+</b> is your data.
                                    </p>

                                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs bg-white dark:bg-gray-800">
                                        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">

                                            <thead className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 uppercase text-[10px] md:text-xs tracking-wider">
                                                <tr>
                                                    <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 w-10 text-center border-r border-emerald-100/50">#</th>
                                                    <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 border-r border-emerald-100/50">Col A</th>
                                                    <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 border-r border-emerald-100/50">Col B</th>
                                                    <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 border-r border-emerald-100/50">Col C</th>
                                                    <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 border-r border-emerald-100/50">Col D</th>
                                                    <th className="p-2 md:p-3 font-extrabold border-b border-emerald-100 dark:border-emerald-800/30 text-center">Col E</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono">

                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-2 md:p-3 font-bold text-gray-400 text-center bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700">1</td>
                                                    <td className="p-2 md:p-3 text-gray-700 dark:text-gray-300 font-sans font-bold border-r border-gray-100 dark:border-gray-700">Budget Period</td>
                                                    <td className="p-2 md:p-3 text-gray-900 dark:text-white font-bold border-r border-gray-100 dark:border-gray-700">Weekly (2/1/2026)</td>
                                                    <td colSpan="3" className="bg-gray-50/30 dark:bg-gray-900/30"></td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-2 md:p-3 font-bold text-gray-400 text-center bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700">2</td>
                                                    <td className="p-2 md:p-3 text-gray-700 dark:text-gray-300 font-sans font-bold border-r border-gray-100 dark:border-gray-700">Pay Frequency</td>
                                                    <td className="p-2 md:p-3 text-gray-900 dark:text-white font-bold border-r border-gray-100 dark:border-gray-700">Bi-Weekly</td>
                                                    <td colSpan="3" className="bg-gray-50/30 dark:bg-gray-900/30"></td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-2 md:p-3 font-bold text-gray-400 text-center bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700">3</td>
                                                    <td className="p-2 md:p-3 text-gray-700 dark:text-gray-300 font-sans font-bold border-r border-gray-100 dark:border-gray-700">Net Income</td>
                                                    <td className="p-2 md:p-3 text-emerald-600 dark:text-emerald-400 font-bold border-r border-gray-100 dark:border-gray-700">$XXXXX</td>
                                                    <td colSpan="3" className="bg-gray-50/30 dark:bg-gray-900/30"></td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-2 md:p-3 font-bold text-gray-400 text-center bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700">4</td>
                                                    <td className="p-2 md:p-3 text-gray-700 dark:text-gray-300 font-sans font-bold border-r border-gray-100 dark:border-gray-700">Annual Total</td>
                                                    <td className="p-2 md:p-3 text-gray-900 dark:text-white font-bold border-r border-gray-100 dark:border-gray-700">$XXXXXXXX</td>
                                                    <td colSpan="3" className="bg-gray-50/30 dark:bg-gray-900/30"></td>
                                                </tr>

                                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] md:text-xs uppercase tracking-wider font-sans font-bold">
                                                    <td className="p-2 md:p-3 text-center border-r border-gray-200 dark:border-gray-600">5</td>
                                                    <td className="p-2 md:p-3 border-r border-gray-200 dark:border-gray-600">Category</td>
                                                    <td className="p-2 md:p-3 border-r border-gray-200 dark:border-gray-600">Budgeted</td>
                                                    <td className="p-2 md:p-3 border-r border-gray-200 dark:border-gray-600">Frequency</td>
                                                    <td className="p-2 md:p-3 border-r border-gray-200 dark:border-gray-600">Last Paid</td>
                                                    <td className="p-2 md:p-3 text-center">Active?</td>
                                                </tr>

                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="p-2 md:p-3 font-bold text-gray-400 text-center bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700">6</td>
                                                    <td className="p-2 md:p-3 font-bold border-r border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-2"></span>
                                                        Cat. A
                                                    </td>
                                                    <td className="p-2 md:p-3 border-r border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400">$50</td>
                                                    <td className="p-2 md:p-3 border-r border-gray-100 dark:border-gray-700 text-xs text-gray-500">Weekly</td>
                                                    <td className="p-2 md:p-3 border-r border-gray-100 dark:border-gray-700 text-xs text-gray-500">2026-01-28</td>
                                                    <td className="p-2 md:p-3 text-center">
                                                        <input type="checkbox" checked readOnly className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-default" />
                                                    </td>
                                                </tr>

                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* tab 2: workflow*/}
                    {activeTab === 'workflow' && (
                        <div className="space-y-6 md:space-y-8 animate-in fade-in">

                            {/* income freq */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-start gap-4">
                                <div className="text-2xl">&#x1F4B0;</div>
                                <div>
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-wide text-xs md:text-sm mb-1">Defining Income</h4>
                                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mb-2">
                                        Use the dropdown next to your Salary input to specify frequency.
                                    </p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border text-[10px] font-mono text-gray-600 dark:text-gray-300">/ Year</span>
                                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border text-[10px] font-mono text-gray-600 dark:text-gray-300">/ Month</span>
                                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border text-[10px] font-mono text-gray-600 dark:text-gray-300">/ Week</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg md:text-xl font-bold font-serif text-center mb-4 md:mb-6">Choose your Workflow</h3>

                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative">

                                {/* option a: existing budget*/}
                                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 md:p-5 border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h4 className="font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide text-xs md:text-sm">Use Existing</h4>
                                    </div>
                                    <ol className="space-y-4 relative border-l-2 border-blue-200 dark:border-blue-700 ml-2 pl-4 md:pl-6">
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-blue-100 text-blue-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">1</span>
                                            <p className="text-xs md:text-sm">Paste your <b>Google Sheet Link</b>.</p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-blue-100 text-blue-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">2</span>
                                            <p className="text-xs md:text-sm">Select an <b>existing tab</b> (e.g. "Jan-2026") and click <b>Load Sheet</b>.</p>
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
                                        <h4 className="font-bold text-purple-900 dark:text-purple-100 uppercase tracking-wide text-xs md:text-sm">Create New</h4>
                                    </div>
                                    <ol className="space-y-4 relative border-l-2 border-purple-200 dark:border-purple-700 ml-2 pl-4 md:pl-6">
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-purple-100 text-purple-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">1</span>
                                            <p className="text-xs md:text-sm">Type a <b>New Name</b> and click Create to customize your budget. </p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-purple-100 text-purple-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">2</span>
                                            <p className="text-xs md:text-sm">Set <b>Start Date</b>,  <b>Frequency</b>, and <b>Duration</b>.</p>
                                        </li>
                                        <li className="relative">
                                            <span className="absolute -left-[23px] md:-left-[31px] bg-purple-100 text-purple-600 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white dark:border-gray-800">3</span>
                                            <p className="text-xs md:text-sm">
                                                Select <b>"Start from Scratch"</b> or a specific <b>Sheet Name</b> to copy—the system will auto-scan for recurring bills!
                                            </p>
                                        </li>
                                    </ol>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* tab 3: recurrance*/}
                    {activeTab === 'recurring' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold font-serif mb-2">Setting up Recurring Expenses</h3>
                                <p className="text-sm text-gray-500">Configure what expenses are tracked using Advanced Settings.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/*non rec */}
                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 opacity-80">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-500">Groceries</span>
                                        <div className="w-8 h-4 bg-gray-300 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5"></div></div>
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">One-Off Expense</h4>
                                    <p className="text-xs text-gray-500">
                                        Use this for variable costs (Food, Gas, Fun). These <b>do not</b> carry over automatically to new budgets unless you manually copy the sheet.
                                    </p>
                                </div>

                                {/* recur */}
                                <div className="p-4 border border-emerald-500 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-emerald-800 dark:text-emerald-300">Netflix</span>
                                        <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div></div>
                                    </div>
                                    <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1">Recurring Bill</h4>
                                    <p className="text-xs text-emerald-800/70 dark:text-emerald-200/70">
                                        Toggle <b>ON</b> for recurring expenses. Set the <b>Frequency</b> and <b>Last Paid Date</b>. The application will scan all history and auto-add this to future budgets if it's due!
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-xs md:text-sm">
                                <strong>💡 Pro Tip: Pausing Recurring Expenses</strong> <br />
                                To pause a recurring expense without deleting the data, simply <b>Toggle it OFF</b>. It will turn gray. The system will ignore it until you toggle it back ON.
                            </div>
                        </div>
                    )}

                    {/* tab 4: transfers */}
                    {activeTab === 'transfer' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center p-4 md:p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <h3 className="font-bold text-base md:text-lg mb-4 font-serif">Drag & Drop Magic</h3>

                                <div className="flex flex-col md:flex-row justify-around items-center gap-6 md:gap-0 mb-6">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">&#x1FA99;</div>
                                        <div className="font-bold text-xs uppercase text-gray-500">The Coin</div>
                                        <div className="text-[10px] text-gray-400 w-24 mx-auto">Drag to move <b>New Income</b> into a bucket.</div>
                                    </div>
                                    <div className="text-2xl text-gray-300 rotate-90 md:rotate-0">➜</div>
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">&#x1F4B8;</div>
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

                    {/*tab 5: colors */}
                    {activeTab === 'colors' && (
                        <div className="space-y-4 animate-in fade-in">
                            <h3 className="text-lg md:text-xl font-bold mb-4 font-serif">What do the colors mean?</h3>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500 shadow-md shrink-0"></div>
                                <div>
                                    <strong className="text-emerald-800 dark:text-emerald-300 text-sm md:text-base">Healthy Green</strong>
                                    <p className="text-xs">You are under budget! The bar fills up as you spend/allocate money.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-400 shadow-md shrink-0"></div>
                                <div>
                                    <strong className="text-yellow-800 dark:text-yellow-300 text-sm md:text-base">Cautionary Gold</strong>
                                    <p className="text-xs">You are getting close to your limit (usually &#x003E; 85% utilized).</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-500 shadow-md shrink-0"></div>
                                <div>
                                    <strong className="text-rose-800 dark:text-rose-300 text-sm md:text-base">Over-Budget Red</strong>
                                    <p className="text-xs">You have exceeded the allocated amount for this category.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* tab 6: AI Templates */}
                    {activeTab === 'ai_template' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold font-serif mb-2">AI Budget Generator</h3>
                                <p className="text-sm text-gray-500">Let AI build your baseline budget instantly.</p>
                            </div>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-3 uppercase tracking-wide text-xs">How to use it:</h4>
                                <ol className="list-decimal pl-5 space-y-3 text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                                    <li>Click the <b>&#10024;  (Budget Template Generator) </b> widget at the bottom of the screen.</li>
                                    <li>The AI automatically reads your calculated Net Income and chosen Budget Duration.</li>
                                    <li>Type in your specific financial goals (e.g., <i>"I want to save for a wedding"</i> or <i>"Aggressive student loan payoff"</i>).</li>
                                    <li>Click <b>Generate</b>. The AI will formulate a customized category split using established financial models (like the 50/30/20 rule).</li>
                                    <li>Review the template, and click <b>Apply</b> to automatically load those buckets into your dashboard!</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* tab 7: AI Analyst */}
                    {activeTab === 'ai_analyst' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold font-serif mb-2">AI Spending Analyst</h3>
                                <p className="text-sm text-gray-500">Analyze raw bank statements and optimize your spending.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 uppercase tracking-wide text-xs"> Deep Analysis</h4>
                                    <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                        Paste your raw bank statement text directly into the widget. The AI will instantly categorize your transactions, compare them against your <b>currently active budget</b>, and provide a structured feedback report highlighting overspending.
                                    </p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-800">
                                    <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2 uppercase tracking-wide text-xs">Auto-Adjust</h4>
                                    <p className="text-xs md:text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                                        Along with the feedback report, the AI generates a new, recommended budget split based on your actual, real-world spending habits. Click <b>"Apply Optimized Budget"</b> to instantly update your buckets!
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-xs md:text-sm flex items-start gap-3">
                                <span className="text-xl">&#x2709;</span>
                                <div>
                                    <strong>Export your reports</strong> <br />
                                    Use the <b>Email Analysis</b> button inside the widget to send the generated markdown report and optimized numbers directly to yourself or a partner for review.
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* footer */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 text-center shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 text-sm md:text-base font-mono uppercase tracking-wider"
                    >
                        Got it, let's budget!
                    </button>
                </div>

            </div>
        </div>
    );
}