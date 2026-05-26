import { useState, useCallback } from 'react';

interface NoisePoint {
    latitude: number;
    longitude: number;
    noise_db: number;
}

interface Filters {
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
    minAlt: number;
    maxAlt: number;
}

export function useNoiseData() {
    const [noiseData, setNoiseData] = useState<NoisePoint[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchDataFromDB = useCallback(async (currentFilters: Filters) => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
            if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
            params.append('startHour', String(currentFilters.startHour));
            params.append('endHour', String(currentFilters.endHour));
            params.append('minAlt', String(currentFilters.minAlt));
            params.append('maxAlt', String(currentFilters.maxAlt));

            const response = await fetch(`/api/noise-data?${params.toString()}`);
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal mengambil data dari server.');
            }
            
            const data: NoisePoint[] = await response.json();
            
            if (data && data.length > 0) {
                const formattedData = data.map(p => ({
                    latitude: parseFloat(p.latitude as any),
                    longitude: parseFloat(p.longitude as any),
                    noise_db: parseFloat(p.noise_db as any)
                }));
                setNoiseData(formattedData);
            } else {
                setNoiseData([]);
                setError('Tidak ada data yang cocok dengan filter.');
            }
        } catch (err: any) {
            setError('Error: ' + err.message);
            setNoiseData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { noiseData, loading, error, fetchDataFromDB };
}