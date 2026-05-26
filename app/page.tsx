'use client';

import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import ControlPanel from './components/ControlPanel';
import MapComponent from './components/MapComponent';
import { useNoiseData } from './hooks/useNoiseData';
import { useAnalysis } from './hooks/useAnalysis';

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

export default function Home() {
    const mapInstanceRef = useRef<any>(null);
    
    // Menggunakan custom hooks
    const { noiseData, loading, error, fetchDataFromDB } = useNoiseData();
    const { analysisResults, isAnalyzing, handleAnalysisStart, handleAnalysisComplete, handleAnalysisClear } = useAnalysis(mapInstanceRef);

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Toggle Layer State
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        startDate: '',
        endDate: '',
        startHour: 0,
        endHour: 23,
        minAlt: 0,
        maxAlt: 5000, 
    });

    const [metadata, setMetadata] = useState<Metadata>({
        minTime: null,
        maxTime: null,
        minAlt: 0,
        maxAlt: 5000,
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch('/api/metadata');
                const data = await response.json();
                if (data.minTime && data.maxTime) {
                    const initialFilters = {
                        startDate: new Date(data.minTime).toISOString().split('T')[0],
                        endDate: new Date(data.maxTime).toISOString().split('T')[0],
                        minAlt: data.minAlt,
                        maxAlt: data.maxAlt,
                        startHour: 0,
                        endHour: 23,
                    };
                    setMetadata(data);
                    setFilters(initialFilters);
                    fetchDataFromDB(initialFilters); // Fetch data awal setelah metadata didapat
                }
            } catch (e) {
                console.error("Gagal mengambil metadata:", e);
            }
        };
        fetchMetadata();
    }, [fetchDataFromDB]);

    const handleMapReady = (map: any) => {
        mapInstanceRef.current = map;
    };

    const handleFilterChange = (newFilters: Partial<Filters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        fetchDataFromDB(updatedFilters);
    };

    const handleFileUploadToServer = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = '';

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mengunggah file.');
            alert(result.message);
            fetchDataFromDB(filters);
        } catch (err: any) {
            alert('Upload error: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const zoomToData = () => {
        if (noiseData.length > 0 && mapInstanceRef.current) {
            // @ts-ignore
            const L = window.L;
            if (L) {
                const bounds = L.latLngBounds(noiseData.map(p => [p.latitude, p.longitude]));
                mapInstanceRef.current.fitBounds(bounds);
            }
        }
    };

    return (
        <div className="flex h-screen font-sans bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <Head>
                <title>Heatmap Peta Kebisingan</title>
            </Head>

            <ControlPanel
                filters={filters}
                metadata={metadata}
                onFilterChange={handleFilterChange}
                onFileUpload={handleFileUploadToServer}
                onReload={() => fetchDataFromDB(filters)}
                onZoom={zoomToData}
                isLoading={loading}
                isUploading={uploading}
                isAnalyzing={isAnalyzing}
                error={error}
                dataCount={noiseData.length}
                analysisCount={analysisResults.length}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
                onClearAnalysis={handleAnalysisClear}
                showHeatmap={showHeatmap}
                onToggleHeatmap={setShowHeatmap}
                showMarkers={showMarkers}
                onToggleMarkers={setShowMarkers}
            />

            <MapComponent 
                rawData={noiseData}
                onMapReady={handleMapReady}
                isSidebarCollapsed={isSidebarCollapsed}
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisClear={handleAnalysisClear}
                showHeatmap={showHeatmap}
                showMarkers={showMarkers}
            />
        </div>
    );
}