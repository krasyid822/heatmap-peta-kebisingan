'use client';

import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
    rawData: Array<{ latitude: number; longitude: number; noise_db: number }>;
    onMapReady: (mapInstance: any) => void;
    isSidebarCollapsed: boolean;
    onAnalysisStart: () => void;
    onAnalysisComplete: (results: any[], center: any) => void;
    onAnalysisClear: () => void;
    showHeatmap: boolean;
    showMarkers: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
    rawData, onMapReady, isSidebarCollapsed, 
    onAnalysisStart, onAnalysisComplete, onAnalysisClear,
    showHeatmap, showMarkers
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const heatLayer = useRef<any>(null);
    const markersLayer = useRef<any>(null);
    const boundaryLayer = useRef<any>(null);
    const [currentZoom, setCurrentZoom] = React.useState(11);

    const getColor = (d: number) => {
        return d > 85 ? '#ff0000' : d > 75 ? '#ffa500' : d > 65 ? '#ffff00' : d > 55 ? '#00ff00' : '#0000ff';
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('leaflet').then((leaflet) => {
                const L = leaflet.default ? leaflet.default : leaflet;
                // @ts-ignore
                window.L = L;

                // @ts-ignore
                import('leaflet.heat').then(() => {
                    if (!mapInstance.current && mapRef.current) {
                        const map = L.map(mapRef.current).setView([-6.200000, 106.816666], 11);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(map);
                        
                        map.on('zoomend', () => {
                            setCurrentZoom(map.getZoom());
                            toggleLayers(map);
                        });
                        map.on('click', (e: any) => handleMapClick(e, L));

                        onMapReady(map);
                        mapInstance.current = map;
                        setCurrentZoom(map.getZoom());
                    }
                }).catch(err => console.error("Gagal load leaflet.heat", err));
            });
        }
        return () => {
            if (mapInstance.current) {
                mapInstance.current.off('zoomend').off('click');
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    const handleMapClick = (e: any, L: any) => {
        const { lat, lng } = e.latlng;

        const container = document.createElement('div');
        container.className = 'p-1 min-w-[200px]';
        container.innerHTML = `
            <h4 class="font-bold text-center mb-1 text-gray-800 border-b pb-1">Analisis Radius</h4>
            <p class="text-xs mb-2 text-gray-600 text-center">Satuan radius adalah <b>Meter</b>.</p>
            <div class="flex flex-col gap-2">
                <input type="number" class="radius-input w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Radius (Meter)" value="500" min="1" />
                <div class="flex gap-2 w-full mt-1">
                    <button class="radius-submit flex-1 px-2 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium">Cari</button>
                    <button class="radius-clear flex-1 px-2 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors font-medium">Bersihkan</button>
                </div>
            </div>
        `;

        const submitBtn = container.querySelector('.radius-submit') as HTMLButtonElement;
        const clearBtn = container.querySelector('.radius-clear') as HTMLButtonElement;
        const inputField = container.querySelector('.radius-input') as HTMLInputElement;

        submitBtn.onclick = async () => {
            const radius = parseFloat(inputField.value);
            if (radius > 0) {
                submitBtn.innerText = 'Mencari...';
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

                onAnalysisStart();
                try {
                    const response = await fetch('/api/analysis/radius', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude: lat, longitude: lng, radiusMeters: radius }),
                    });
                    const results = await response.json();
                    
                    if (markersLayer.current && mapInstance.current.hasLayer(markersLayer.current)) {
                        mapInstance.current.removeLayer(markersLayer.current);
                    }
                    if (heatLayer.current && mapInstance.current.hasLayer(heatLayer.current)) {
                        mapInstance.current.removeLayer(heatLayer.current);
                    }

                    onAnalysisComplete(results, { lat, lng, radius });
                } catch (error) {
                    console.error("Analysis failed", error);
                    alert("Terjadi kesalahan saat mencari data.");
                }
                mapInstance.current.closePopup();
            } else {
                alert("Masukkan radius yang valid (lebih dari 0).");
            }
        };

        clearBtn.onclick = () => {
            onAnalysisClear();
            mapInstance.current.closePopup();
            toggleLayers(mapInstance.current);
        };

        L.popup()
            .setLatLng(e.latlng)
            .setContent(container)
            .openOn(mapInstance.current);
    };

    useEffect(() => {
        if (mapInstance.current) {
            setTimeout(() => mapInstance.current.invalidateSize(), 300);
        }
    }, [isSidebarCollapsed]);

    // Fit bounds and draw boundary rectangle when rawData changes
    useEffect(() => {
        // @ts-ignore
        const L = typeof window !== 'undefined' ? window.L : null;
        if (!L || !mapInstance.current) return;

        if (boundaryLayer.current) {
            mapInstance.current.removeLayer(boundaryLayer.current);
            boundaryLayer.current = null;
        }

        if (rawData && rawData.length > 0) {
            const bounds = L.latLngBounds(rawData.map(p => [p.latitude, p.longitude]));
            mapInstance.current.fitBounds(bounds);

            // Add deep forest green dashed bounding box around the measurements
            boundaryLayer.current = L.rectangle(bounds, {
                color: '#1b5e20', // Deep Forest Green
                weight: 2,
                dashArray: '6, 6', // Dashed border line
                fillOpacity: 0.0,  // Completely transparent inside
                interactive: false
            }).addTo(mapInstance.current);
        }
    }, [rawData]);

    // Recalculate heatmap and markers when rawData or zoom level changes
    useEffect(() => {
        // @ts-ignore
        const L = typeof window !== 'undefined' ? window.L : null;
        if (!L || !mapInstance.current) return;

        if (heatLayer.current) mapInstance.current.removeLayer(heatLayer.current);
        if (markersLayer.current) mapInstance.current.removeLayer(markersLayer.current);

        if (rawData && rawData.length > 0) {
            // Dynamic cell size based on current zoom level:
            // cellSize doubles for each zoom level we zoom out (resolution halves)
            // Zoom 18: ~2m, Zoom 16: ~8m, Zoom 14: ~32m, Zoom 11: ~256m
            const cellSize = 0.00002 * Math.pow(2, Math.max(0, 18 - currentZoom));
            
            const grid: { [key: string]: { latSum: number; lngSum: number; noiseSum: number; count: number } } = {};
            
            rawData.forEach(p => {
                const latIndex = Math.round(p.latitude / cellSize);
                const lngIndex = Math.round(p.longitude / cellSize);
                const key = `${latIndex},${lngIndex}`;
                if (!grid[key]) {
                    grid[key] = { latSum: 0, lngSum: 0, noiseSum: 0, count: 0 };
                }
                grid[key].latSum += p.latitude;
                grid[key].lngSum += p.longitude;
                grid[key].noiseSum += p.noise_db;
                grid[key].count += 1;
            });
            
            // Map averaged noise to normalized intensity (0.1 to 0.8) so quiet areas remain green
            // and don't sum up to red. Only highly concentrated loud areas or single very loud points turn red.
            // Map averaged noise directly to custom blurred elements using L.divIcon
            const aggregatedPoints = Object.values(grid).map(cell => {
                const avgLat = cell.latSum / cell.count;
                const avgLng = cell.lngSum / cell.count;
                const avgNoise = cell.noiseSum / cell.count;
                return [avgLat, avgLng, avgNoise];
            });

            const blurMarkers = aggregatedPoints.map(p => {
                const lat = p[0];
                const lng = p[1];
                const avgNoise = p[2];
                const glowColor = getColor(avgNoise);
                
                const html = `
                  <div style="
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle, ${glowColor} 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(12px);
                    opacity: 0.65;
                  "></div>
                `;
                const blurIcon = L.divIcon({
                    html: html,
                    className: 'manual-blur-heat',
                    iconSize: [80, 80],
                    iconAnchor: [40, 40]
                });
                return L.marker([lat, lng], {
                    icon: blurIcon,
                    interactive: false
                });
            });
            heatLayer.current = L.layerGroup(blurMarkers);

            const markerPoints = rawData.map(p => {
                const markerColor = getColor(p.noise_db);
                const marker = L.circleMarker([p.latitude, p.longitude], { radius: 8, color: '#fff', weight: 1, fillColor: markerColor, fillOpacity: 0.9 });
                marker.bindPopup(`<div style="text-align: center;"><b>Tingkat Kebisingan</b><br/><span style="font-size: 1.2em; color: ${markerColor}; font-weight: bold;">${p.noise_db.toFixed(2)} dB</span></div>`);
                return marker;
            });
            markersLayer.current = L.layerGroup(markerPoints);

            toggleLayers(mapInstance.current);
        }
    }, [rawData, currentZoom]);

    useEffect(() => {
        if (mapInstance.current) {
            toggleLayers(mapInstance.current);
        }
    }, [showHeatmap, showMarkers]);

    const toggleLayers = (map: any) => {
        if (!map) return;
        
        if (showHeatmap) {
            if (heatLayer.current && !map.hasLayer(heatLayer.current)) map.addLayer(heatLayer.current);
        } else {
            if (heatLayer.current && map.hasLayer(heatLayer.current)) map.removeLayer(heatLayer.current);
        }

        if (showMarkers) {
            if (markersLayer.current && !map.hasLayer(markersLayer.current)) map.addLayer(markersLayer.current);
        } else {
            if (markersLayer.current && map.hasLayer(markersLayer.current)) map.removeLayer(markersLayer.current);
        }
    };

    return (
        <div className="relative flex-grow h-full w-full">
            <div ref={mapRef} className="h-full w-full bg-gray-200 z-0" />
        </div>
    );
};

export default MapComponent;