import { useState, useRef } from 'react';

// Helper untuk mendapatkan warna yang sama dengan di legenda
const getColor = (d: number) => {
    return d > 85 ? '#ff0000' : 
           d > 75 ? '#ffa500' : 
           d > 65 ? '#ffff00' :
           d > 55 ? '#00ff00' :
           '#0000ff';
};

export function useAnalysis(mapInstanceRef: React.RefObject<any>) {
    const [analysisResults, setAnalysisResults] = useState<any[]>([]);
    const [isAnalyzing, setAnalyzing] = useState(false);
    const analysisDisplayLayer = useRef<any>(null);

    const handleAnalysisStart = () => {
        setAnalyzing(true);
    };

    const handleAnalysisComplete = (results: any[], center: any) => {
        setAnalyzing(false);
        setAnalysisResults(results);
        
        // @ts-ignore
        const L = window.L;
        if (!L || !mapInstanceRef.current) return;

        if (analysisDisplayLayer.current) {
            mapInstanceRef.current.removeLayer(analysisDisplayLayer.current);
        }

        const circle = L.circle([center.lat, center.lng], {
            radius: center.radius,
            color: '#1e90ff',
            fillOpacity: 0.1,
        });

        const resultMarkers = results.map(p => {
            const markerColor = getColor(p.noise_db);
            return L.circleMarker([p.latitude, p.longitude], {
                radius: 8,
                color: '#fff',
                weight: 2,
                fillColor: markerColor, 
                fillOpacity: 1,
            }).bindPopup(`
                <div style="text-align: center;">
                    <b>Tingkat Kebisingan</b><br/>
                    <span style="font-size: 1.2em; color: ${markerColor}; font-weight: bold;">
                        ${parseFloat(p.noise_db).toFixed(2)} dB
                    </span><br/>
                    <span style="font-size: 0.9em; color: #666;">
                        Jarak: ${parseFloat(p.distance_meters).toFixed(1)} m
                    </span>
                </div>
            `);
        });

        analysisDisplayLayer.current = L.layerGroup([circle, ...resultMarkers]).addTo(mapInstanceRef.current);
        mapInstanceRef.current.fitBounds(circle.getBounds());
    };

    const handleAnalysisClear = () => {
        if (analysisDisplayLayer.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(analysisDisplayLayer.current);
        }
        setAnalysisResults([]);
        
        if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            mapInstanceRef.current.setZoom(currentZoom);
        }
    };

    return {
        analysisResults,
        isAnalyzing,
        handleAnalysisStart,
        handleAnalysisComplete,
        handleAnalysisClear,
    };
}