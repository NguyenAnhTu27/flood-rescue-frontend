import { useCallback, useEffect, useState } from 'react';
import { getManagerReliefDispatchDashboard } from '../api.js';
import { listReliefRequests } from '../../relief/api.js';
import { reverseGeocodeAddress } from '../../map/lib/geocoding.js';

const toUpper = (value) => String(value || '').trim().toUpperCase();

const normalizeListResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const parseCoordinatesFromText = (text) => {
    const raw = String(text || '');
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
};

const extractCoordinates = (detail, queueItem) => {
    const fromDetailLat = Number(detail?.citizenLatitude);
    const fromDetailLng = Number(detail?.citizenLongitude);
    if (Number.isFinite(fromDetailLat) && Number.isFinite(fromDetailLng)) {
        return { lat: fromDetailLat, lng: fromDetailLng };
    }

    const fromQueueLat = Number(queueItem?.lat);
    const fromQueueLng = Number(queueItem?.lng);
    if (Number.isFinite(fromQueueLat) && Number.isFinite(fromQueueLng)) {
        return { lat: fromQueueLat, lng: fromQueueLng };
    }

    const fromQueueText = parseCoordinatesFromText(
        queueItem?.locationDescription || queueItem?.addressText
    );
    if (fromQueueText) {
        return fromQueueText;
    }

    const fromDetailText = parseCoordinatesFromText(
        detail?.citizenLocationDescription ||
            detail?.citizenAddressText ||
            detail?.targetArea
    );
    if (fromDetailText) {
        return fromDetailText;
    }
    return null;
};

const isReliefAlreadyApprovedIssue = (req) => {
    const assignedIssueId = Number(req?.assignedIssueId ?? req?.issueId ?? 0);
    if (Number.isFinite(assignedIssueId) && assignedIssueId > 0) return true;
    const deliveryStatus = toUpper(req?.deliveryStatus);
    if (
        [
            'MANAGER_APPROVED',
            'RESCUER_RECEIVED',
            'ARRIVED_WAREHOUSE',
            'ARRIVED_RELIEF_POINT',
            'COMPLETED',
        ].includes(deliveryStatus)
    ) {
        return true;
    }
    return false;
};

export function useManagerReliefDashboard() {
    const [syncTime, setSyncTime] = useState(new Date());
    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const geocodeCacheRef = useState(() => new Map())[0];

    const reverseGeocode = useCallback(
        async (lat, lng) => {
            const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
            if (geocodeCacheRef.has(key)) {
                return geocodeCacheRef.get(key);
            }

            const address = await reverseGeocodeAddress(lat, lng);
            geocodeCacheRef.set(key, address);
            return address;
        },
        [geocodeCacheRef]
    );

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [dispatchData, pendingReliefData] = await Promise.all([
                getManagerReliefDispatchDashboard(),
                listReliefRequests({ status: 'DRAFT', page: 0, size: 100 }),
            ]);
            const pendingReliefs = normalizeListResponse(pendingReliefData);
            const reliefById = new Map(
                pendingReliefs
                    .filter((r) => r?.id != null)
                    .map((r) => [Number(r.id), r])
            );
            const mergedRequests = (dispatchData?.requests || []).map((r) => {
                const detail = reliefById.get(Number(r?.id));
                const coords = extractCoordinates(detail, r);
                const coordKey = coords
                    ? `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`
                    : null;
                const cachedAddress = coordKey
                    ? geocodeCacheRef.get(coordKey)
                    : null;
                return {
                    ...r,
                    senderName:
                        detail?.createdByName ||
                        detail?.senderName ||
                        'Người gửi chưa rõ',
                    locationDescription:
                        cachedAddress ||
                        detail?.citizenLocationDescription ||
                        detail?.citizenAddressText ||
                        detail?.targetArea ||
                        'Chưa có mô tả vị trí',
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    status: detail?.status || r?.status,
                    deliveryStatus: detail?.deliveryStatus || r?.deliveryStatus,
                    assignedIssueId:
                        detail?.assignedIssueId || r?.assignedIssueId,
                };
            });
            const queueRequests = mergedRequests.filter((req) => {
                const status = toUpper(req?.status);
                if (status && status !== 'DRAFT') return false;
                return !isReliefAlreadyApprovedIssue(req);
            });
            setRequests(queueRequests);
            setTeams(dispatchData?.teams || []);
            setVehicles(dispatchData?.vehicles || []);
            setSyncTime(new Date());
        } catch (err) {
             
            console.error('[ManagerReliefDashboard] loadDashboard error:', err);
            setError(
                err?.message || 'Không thể tải dữ liệu điều phối cứu trợ'
            );
        } finally {
            setLoading(false);
        }
    }, [geocodeCacheRef]);

    useEffect(() => {
        const id = window.setInterval(() => setSyncTime(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    return {
        syncTime,
        requests,
        teams,
        vehicles,
        loading,
        error,
        loadDashboard,
        setRequests,
        reverseGeocode,
    };
}

