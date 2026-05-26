'use client';

import React from 'react';
import Legend from './Legend';

interface Filters {
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
    minAlt: number;
    maxAlt: number;
}

interface Metadata {
    minTime: number | null;
    maxTime: number | null;
    minAlt: number;
    maxAlt: number;
}

interface ControlPanelProps {
    filters: Filters;
    metadata: Metadata;
    onFilterChange: (newFilters: Partial<Filters>) => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onReload: () => void;
    onZoom: () => void;
    isLoading: boolean;
    isUploading: boolean;
    isAnalyzing: boolean;
    error: string;
    dataCount: number;
    analysisCount: number;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onClearAnalysis: () => void;
    showHeatmap: boolean;
    onToggleHeatmap: (val: boolean) => void;
    showMarkers: boolean;
    onToggleMarkers: (val: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    filters, metadata, onFilterChange, onFileUpload, onReload, onZoom, isLoading, isUploading, isAnalyzing,
    error, dataCount, analysisCount, isCollapsed, onToggleCollapse, onClearAnalysis,
    showHeatmap, onToggleHeatmap, showMarkers, onToggleMarkers
}) => {
    const baseButtonClass = "w-full px-4 py-2 font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center gap-3";
    const secondaryButtonClass = `${baseButtonClass} bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600`;
    const primaryButtonClass = `${baseButtonClass} bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600`;

    const normalizeToMidnightUTC = (time: number | null) => {
        if (!time) return 0;
        const dateStr = new Date(time).toISOString().split('T')[0];
        return new Date(`${dateStr}T00:00:00Z`).getTime();
    };

    const normalizedMinTime = normalizeToMidnightUTC(metadata.minTime);
    const normalizedMaxTime = normalizeToMidnightUTC(metadata.maxTime);

    const getSliderTime = (dateStr: string, fallbackNormalized: number) => {
        if (!dateStr) return fallbackNormalized;
        const time = new Date(`${dateStr}T00:00:00Z`).getTime();
        return isNaN(time) ? fallbackNormalized : time;
    };

    const handleDateSlider = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
        const time = parseInt(e.target.value);
        const dateObj = new Date(time);
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        onFilterChange({ [field]: `${year}-${month}-${day}` });
    };

    const startDateSliderValue = getSliderTime(filters.startDate, normalizedMinTime);
    const endDateSliderValue = getSliderTime(filters.endDate, normalizedMaxTime);

    return (
        <div className={`relative h-full bg-white dark:bg-gray-900 shadow-lg z-20 transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-16' : 'w-96'}`}>
            
            <button 
                onClick={onToggleCollapse} 
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <svg className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>

            <div className={`p-4 flex-grow overflow-y-auto transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Kontrol Peta</h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className={`${primaryButtonClass} ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
                            {isUploading ? 'Mengunggah...' : 'Unggah CSV ke DB'}
                            <input type="file" accept=".csv" onChange={onFileUpload} className="hidden" disabled={isUploading} />
                        </label>
                        <button onClick={onReload} disabled={isLoading || isUploading} className={secondaryButtonClass}>
                            {isLoading ? 'Memuat Ulang...' : 'Muat Ulang Data'}
                        </button>
                        <button onClick={onZoom} disabled={dataCount === 0} className={secondaryButtonClass}>
                            Zoom ke Data
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                            Alat Pengumpul Data
                        </h4>
                        <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-100/80 dark:border-indigo-900/30 rounded-lg space-y-2.5">
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                Rekam dan kumpulkan data kebisingan sekitar Anda langsung ke dalam berkas CSV menggunakan aplikasi <strong>Noise Map Collector</strong>.
                            </p>
                            <a 
                                href="https://github.com/krasyid822/noise_map_collector/releases/latest"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
                                </svg>
                                <span>Unduh Rilis Terbaru di GitHub</span>
                            </a>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-md mb-2.5 text-gray-800 dark:text-gray-200">Layer Tampilan</h4>
                        <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-750 dark:text-gray-350 select-none">
                                <input 
                                    type="checkbox" 
                                    checked={showHeatmap} 
                                    onChange={e => onToggleHeatmap(e.target.checked)} 
                                    className="w-4.5 h-4.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span>Tampilkan Heatmap</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-750 dark:text-gray-350 select-none">
                                <input 
                                    type="checkbox" 
                                    checked={showMarkers} 
                                    onChange={e => onToggleMarkers(e.target.checked)} 
                                    className="w-4.5 h-4.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span>Tampilkan Titik Detail (Marker)</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-md mb-3 text-gray-800 dark:text-gray-200">Filter Data</h4>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rentang Tanggal</label>
                            {normalizedMinTime && normalizedMaxTime ? (
                                <div className="space-y-2">
                                    <input 
                                        type="range" 
                                        min={normalizedMinTime} 
                                        max={normalizedMaxTime} 
                                        step={86400000}
                                        value={startDateSliderValue} 
                                        onChange={e => handleDateSlider(e, 'startDate')} 
                                    />
                                    <input 
                                        type="range" 
                                        min={normalizedMinTime} 
                                        max={normalizedMaxTime} 
                                        step={86400000}
                                        value={endDateSliderValue} 
                                        onChange={e => handleDateSlider(e, 'endDate')} 
                                    />
                                    <div className="text-xs text-gray-500 flex justify-between">
                                        <span>{new Date(normalizedMinTime).toLocaleDateString()}</span>
                                        <span>{new Date(normalizedMaxTime).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">Data tanggal tidak tersedia.</p>
                            )}
                            <div className="flex gap-2 mt-2">
                                <input type="date" value={filters.startDate || ''} onChange={e => onFilterChange({ startDate: e.target.value })} className="p-2 text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 flex-1 min-w-0"/>
                                <input type="date" value={filters.endDate || ''} onChange={e => onFilterChange({ endDate: e.target.value })} className="p-2 text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 flex-1 min-w-0"/>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rentang Jam ({filters.startHour}:00 - {filters.endHour}:00)</label>
                             <input type="range" min="0" max="23" value={filters.startHour} onChange={e => onFilterChange({ startHour: parseInt(e.target.value) })} />
                             <input type="range" min="0" max="23" value={filters.endHour} onChange={e => onFilterChange({ endHour: parseInt(e.target.value) })} />
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rentang Ketinggian ({filters.minAlt}m - {filters.maxAlt}m)</label>
                             <input type="range" min={metadata.minAlt} max={metadata.maxAlt} value={filters.minAlt} onChange={e => onFilterChange({ minAlt: parseInt(e.target.value) })} />
                             <input type="range" min={metadata.minAlt} max={metadata.maxAlt} value={filters.maxAlt} onChange={e => onFilterChange({ maxAlt: parseInt(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm space-y-2">
                    {isAnalyzing && <p className="text-purple-600 dark:text-purple-400">Menganalisis radius...</p>}
                    {analysisCount > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md">
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Ditemukan {analysisCount} titik.</p>
                            <button onClick={onClearAnalysis} className="text-xs text-red-500 hover:underline mt-1">Bersihkan</button>
                        </div>
                    )}
                    {isLoading && <p className="text-blue-600 dark:text-blue-400">Memuat data...</p>}
                    {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
                    {dataCount > 0 && !isLoading && !isUploading && (
                        <p className="text-green-600 dark:text-green-400">Menampilkan {dataCount} titik.</p>
                    )}
                </div>

                <Legend />
            </div>
        </div>
    );
};

export default ControlPanel;