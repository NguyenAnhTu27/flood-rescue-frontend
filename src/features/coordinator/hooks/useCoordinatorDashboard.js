import { useCallback, useEffect, useState } from 'react';
import { getCoordinatorDashboard, getCoordinatorRescueRequestById } from '../api.js';
import httpClient from '../../../shared/lib/http.js';

const parseCoordinatesFromText = (text) => {
    const raw = String(text || '');
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
};

const extractCoordinates = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const directPairs = [
        [obj.lat, obj.lng],
        [obj.latitude, obj.longitude],
        [obj.currentLat, obj.currentLng],
        [obj.lastLat, obj.lastLng],
    ];
    for (const [rawLat, rawLng] of directPairs) {
        const lat = Number(rawLat);
        const lng = Number(rawLng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }
    }
    if (obj.location && typeof obj.location === 'object') {
        const lat = Number(obj.location.lat ?? obj.location.latitude);
        const lng = Number(obj.location.lng ?? obj.location.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }
    }
    return (
        parseCoordinatesFromText(obj.gps) ||
        parseCoordinatesFromText(obj.locationText) ||
        parseCoordinatesFromText(obj.locationDescription) ||
        parseCoordinatesFromText(obj.addressText) ||
        null
    );
};

export function useCoordinatorDashboard() {
    const [syncTime, setSyncTime] = useState(new Date());
    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mapRefreshSeconds, setMapRefreshSeconds] = useState(20);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCoordinatorDashboard();
            const nextRequests = data?.requests || [];
            setRequests(nextRequests);
            setTeams(data?.teams || []);
            setSyncTime(new Date());
            if (
                selectedRequestId &&
                !nextRequests.some(
                    (r) => Number(r?.id) === Number(selectedRequestId)
                )
            ) {
                setSelectedRequestId(null);
                setSelectedRequestDetail(null);
                setDetailError('');
            }
        } catch (err) {
             
            console.error('[CoordinatorDashboard] loadDashboard error:', err);
            setError(err?.message || 'Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    }, [selectedRequestId]);

    const loadRequestDetail = useCallback(async (requestId) => {
        if (!requestId) return null;
        try {
            setDetailLoading(true);
            setDetailError('');
            const detail = await getCoordinatorRescueRequestById(requestId);
            setSelectedRequestDetail(detail);
            return detail;
        } catch (e) {
            setSelectedRequestDetail(null);
            setDetailError(e?.message || 'Không thể tải chi tiết yêu cầu.');
            return null;
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setSyncTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const loadRuntimeSettings = async () => {
            try {
                const config = await httpClient.get('/public/runtime-settings');
                if (config?.mapRefreshSeconds) {
                    setMapRefreshSeconds(Number(config.mapRefreshSeconds));
                }
            } catch (err) {
                 
                console.error(
                    '[CoordinatorDashboard] load runtime settings error:',
                    err
                );
            }
        };
        loadRuntimeSettings();
    }, []);

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(() => {
            loadDashboard();
        }, Math.max(5, Number(mapRefreshSeconds) || 20) * 1000);
        return () => clearInterval(interval);
    }, [loadDashboard, mapRefreshSeconds]);

    useEffect(() => {
        if (!selectedRequestId) return;
        loadRequestDetail(selectedRequestId);
    }, [loadRequestDetail, selectedRequestId]);

    return {
        syncTime,
        requests,
        teams,
        loading,
        error,
        mapRefreshSeconds,
        setMapRefreshSeconds,
        selectedRequestId,
        setSelectedRequestId,
        selectedRequestDetail,
        detailLoading,
        detailError,
        extractCoordinates,
        loadRequestDetail,
    };
}

