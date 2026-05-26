'use client';

import React from 'react';

const Legend = () => {
    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 w-full mt-6">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                Keterangan Warna
            </h4>
            
            <div className="flex flex-col gap-3">
                {/* Mode Heatmap */}
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Mode Heatmap (Zoom Out)</span>
                    <div className="flex items-center">
                        <div 
                            className="w-full h-3 rounded-sm border border-gray-300 dark:border-gray-600"
                            style={{ background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)' }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>Rendah</span>
                        <span>Tinggi</span>
                    </div>
                </div>

                {/* Mode Titik */}
                <div className="mt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Mode Titik (Zoom In)</span>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between"><span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-600 mr-2 shadow-sm"></span> &gt; 85 dB</span> <span className="text-gray-500">Sangat Bising</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2 shadow-sm"></span> 75 - 85 dB</span> <span className="text-gray-500">Bising</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-300 mr-2 shadow-sm"></span> 65 - 75 dB</span> <span className="text-gray-500">Agak Bising</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center"><span className="w-3 h-3 rounded-full bg-lime-500 mr-2 shadow-sm"></span> 55 - 65 dB</span> <span className="text-gray-500">Normal</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-600 mr-2 shadow-sm"></span> &lt; 55 dB</span> <span className="text-gray-500">Tenang</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Legend;