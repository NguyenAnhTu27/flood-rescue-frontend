import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    List,
    Search,
    RefreshCw,
    Users,
    Ship,
    Clock,
    Layers,
    ZoomIn,
    ZoomOut,
    Navigation,
    Trash2,
} from 'lucide-react';
import GoogleMap from '../../features/map/components/MapBox.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import httpClient from '../../shared/lib/http.js';
import { getManagerReliefDispatchDashboard } from '../../features/manager-relief-dispatch/api.js';
import { listReliefRequests, rejectReliefRequestByManager } from '../../features/relief/api.js';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import { reverseGeocodeAddress } from '../../features/map/lib/geocoding.js';

export default function ReliefRequestsPage() {
    const navigate = useNavigate();
    const [syncTime, setSyncTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 16.0544, lng: 108.2022 });
    const [mapZoom, setMapZoom] = useState(12);
    const [mapMarkerPosition, setMapMarkerPosition] = useState(null);

    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mapRefreshSeconds, setMapRefreshSeconds] = useState(20);
    const [rejectingRequestId, setRejectingRequestId] = useState(null);
    const geocodeCacheRef = useRef(new Map());

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
            queueItem?.locationDescription
            || queueItem?.addressText
        );
        if (fromQueueText) {
            return fromQueueText;
        }

        const fromDetailText = parseCoordinatesFromText(
            detail?.citizenLocationDescription
            || detail?.citizenAddressText
            || detail?.targetArea
        );
        if (fromDetailText) {
            return fromDetailText;
        }
        return null;
    };

    const toUpper = (value) => String(value || '').trim().toUpperCase();

    const isReliefAlreadyApprovedIssue = (req) => {
        const assignedIssueId = Number(req?.assignedIssueId ?? req?.issueId ?? 0);
        if (Number.isFinite(assignedIssueId) && assignedIssueId > 0) return true;
        const deliveryStatus = toUpper(req?.deliveryStatus);
        if (['MANAGER_APPROVED', 'RESCUER_RECEIVED', 'ARRIVED_WAREHOUSE', 'ARRIVED_RELIEF_POINT', 'COMPLETED'].includes(deliveryStatus)) {
            return true;
        }
        return false;
    };

    const reverseGeocode = async (lat, lng) => {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (geocodeCacheRef.current.has(key)) {
            return geocodeCacheRef.current.get(key);
        }

        const address = await reverseGeocodeAddress(lat, lng);
        geocodeCacheRef.current.set(key, address);
        return address;
    };

    const loadDashboard = async () => {
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
                const coordKey = coords ? `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}` : null;
                const cachedAddress = coordKey ? geocodeCacheRef.current.get(coordKey) : null;
                return {
                    ...r,
                    senderName: detail?.createdByName || detail?.senderName || 'Người gửi chưa rõ',
                    locationDescription:
                        cachedAddress
                        || detail?.citizenLocationDescription
                        || detail?.citizenAddressText
                        || detail?.targetArea
                        || 'Chưa có mô tả vị trí',
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    status: detail?.status || r?.status,
                    deliveryStatus: detail?.deliveryStatus || r?.deliveryStatus,
                    assignedIssueId: detail?.assignedIssueId || r?.assignedIssueId,
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
            console.error('[ManagerDashboard] loadDashboard error:', err);
            setError(err?.message || 'Không thể tải dữ liệu điều phối cứu trợ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const resolveRequestAddresses = async () => {
            if (!Array.isArray(requests) || requests.length === 0) return;

            const next = [...requests];
            let changed = false;
            for (let i = 0; i < next.length; i += 1) {
                const req = next[i];
                const lat = Number(req?.latitude);
                const lng = Number(req?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                if (geocodeCacheRef.current.has(key)) {
                    const cached = geocodeCacheRef.current.get(key);
                    if (cached && req.locationDescription !== cached) {
                        next[i] = { ...req, locationDescription: cached };
                        changed = true;
                    }
                    continue;
                }
                const address = await reverseGeocode(lat, lng);
                if (cancelled) return;
                if (address && req.locationDescription !== address) {
                    next[i] = { ...req, locationDescription: address };
                    changed = true;
                }
            }
            if (!cancelled && changed) {
                setRequests(next);
            }
        };

        const timer = window.setTimeout(resolveRequestAddresses, 300);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [requests]);

    useEffect(() => {
        const interval = setInterval(() => setSyncTime(new Date()), 1000);
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
                console.error('[ManagerDashboard] load runtime settings error:', err);
            }
        };
        loadRuntimeSettings();
    }, []);

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(() => loadDashboard(), Math.max(5, Number(mapRefreshSeconds) || 20) * 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRefreshSeconds]);

    const formatSyncTime = (date) =>
        date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const getRequestStatusBadge = (status, waitingForTeam = false) => {
        if (waitingForTeam) {
            return { label: 'CHỜ CÓ ĐỘI', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        }
        const statusMap = {
            DRAFT: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            APPROVED: { label: 'Đã duyệt', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
            DONE: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            CANCELLED: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700 border-rose-200' },
        };
        return statusMap[String(status || '').toUpperCase()] || statusMap.DRAFT;
    };

    const getTeamStatusBadge = (status) => {
        const statusMap = {
            AVAILABLE: { label: 'RẢNH', color: 'bg-green-100 text-green-700 border-green-200' },
            BUSY: { label: 'BẬN', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        };
        return statusMap[String(status || '').toUpperCase()] || statusMap.AVAILABLE;
    };

    const getVehicleIcon = (type) => {
        switch (type) {
            case 'cano':
            case 'boat':
                return <Ship className="h-4 w-4" />;
            case 'helicopter':
                return <Navigation className="h-4 w-4" />;
            default:
                return <Ship className="h-4 w-4" />;
        }
    };

    const handleRejectFromQueue = async (request, event) => {
        event.stopPropagation();
        if (!request?.id) return;
        const confirmed = window.confirm(`Xoá yêu cầu ${request?.code || `#${request.id}`} khỏi hàng đợi và từ chối yêu cầu này?`);
        if (!confirmed) return;
        const reason = window.prompt('Nhập lý do từ chối yêu cầu cứu trợ:', 'Manager từ chối yêu cầu cứu trợ.');
        if (reason === null) return;
        try {
            setRejectingRequestId(Number(request.id));
            await rejectReliefRequestByManager(Number(request.id), String(reason || '').trim() || 'Manager từ chối yêu cầu cứu trợ.');
            setRequests((prev) => prev.filter((item) => Number(item?.id) !== Number(request.id)));
        } catch (err) {
            window.alert(err?.message || 'Không thể từ chối yêu cầu cứu trợ.');
        } finally {
            setRejectingRequestId(null);
        }
    };

    const filteredRequests = searchQuery
        ? requests.filter((r) => (r.code || '').toLowerCase().includes(searchQuery.toLowerCase()))
        : requests;

    const pendingRequestsCount = filteredRequests.filter((r) => String(r.status || '').toUpperCase() === 'DRAFT').length;
    const waitingTeamCount = filteredRequests.filter((r) => Boolean(r.waitingForTeam)).length;
    const onlineTeamsCount = teams.filter((t) => t.online).length;
    const activeVehiclesCount = vehicles.filter((v) => v.online).length;

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4 pb-6">
            <Card className="w-80 flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <List className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">Hàng đợi Phân phối</h2>
                        </div>
                        {pendingRequestsCount > 0 && (
                            <Badge variant="primary" size="sm">
                                {pendingRequestsCount} mới
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium">ĐỒNG BỘ:</span>
                        <span className="font-mono">{formatSyncTime(syncTime)}</span>
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                            Chờ có đội: {waitingTeamCount}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-3">
                        <div className="space-y-2">
                            {filteredRequests.map((request) => {
                                const statusInfo = getRequestStatusBadge(request.status, Boolean(request.waitingForTeam));
                                return (
                                    <div
                                        key={request.id}
                                        className="group p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                                        onClick={() => {
                                            navigate(MANAGER_ROUTES.CREATE_ISSUE, {
                                                state: {
                                                    prefillFromReliefRequest: {
                                                        id: request.id,
                                                        code: request.code,
                                                        addressText: request.locationDescription,
                                                        description: request.note || '',
                                                    },
                                                },
                                            });
                                        }}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-base font-bold text-slate-900">
                                                    {request.senderName}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRejectFromQueue(request, e)}
                                                    disabled={rejectingRequestId === Number(request.id)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Xoá task / Từ chối yêu cầu"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    {rejectingRequestId === Number(request.id) ? 'Đang xoá...' : 'Xoá'}
                                                </button>
                                            </div>
                                            <div className="text-sm text-slate-700 line-clamp-2">
                                                {request.locationDescription}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500">
                                                Mã: {request.code}
                                            </div>
                                            <div>
                                                <PriorityBadge level={request.priority || 'MEDIUM'} size="xs" />
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="text-xs text-slate-500">
                                                {request.timeAgo}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {request.peopleCount || 1} người
                                                </span>
                                                <Badge outline size="sm" className={statusInfo.color}>
                                                    {statusInfo.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50/60">
                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="gradient"
                            fullWidth
                            size="md"
                            onClick={() => navigate(MANAGER_ROUTES.RELIEF_REQUEST_CREATE)}
                        >
                            Tạo yêu cầu cứu trợ mới
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            size="md"
                            onClick={() => navigate(MANAGER_ROUTES.RELIEF_APPROVED_ISSUES)}
                        >
                            Xem yêu cầu đã duyệt
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm vị trí cụ thể..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                            />
                        </div>
                        <Button type="button" variant="primary" size="md" onClick={loadDashboard}>
                            <RefreshCw className="h-4 w-4" />
                            Cập nhật bản đồ
                        </Button>
                    </div>
                    {error && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex-1 relative">
                    <GoogleMap center={mapCenter} markerPosition={mapMarkerPosition} zoom={mapZoom} />

                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-1.5">
                        <button type="button" className="p-2 hover:bg-slate-50 rounded-lg transition" title="Layers">
                            <Layers className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapZoom((prev) => Math.min(prev + 1, 20))}
                            className="p-2 hover:bg-slate-50 rounded-lg transition"
                            title="Zoom in"
                        >
                            <ZoomIn className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapZoom((prev) => Math.max(prev - 1, 1))}
                            className="p-2 hover:bg-slate-50 rounded-lg transition"
                            title="Zoom out"
                        >
                            <ZoomOut className="h-4 w-4 text-slate-600" />
                        </button>
                        <button type="button" className="p-2 hover:bg-slate-50 rounded-lg transition" title="My location">
                            <Navigation className="h-4 w-4 text-slate-600" />
                        </button>
                    </div>
                </div>
            </Card>

            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">Đội cứu trợ</h2>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>LẦN CUỐI: {formatSyncTime(syncTime)}</span>
                            <span className="font-semibold text-blue-600">{onlineTeamsCount}/{teams.length} Trực tuyến</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {teams.map((team) => {
                            const statusInfo = getTeamStatusBadge(team.status);
                            return (
                                <Card
                                    key={team.id}
                                    variant="outlined"
                                    className="p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => {
                                        if (Number.isFinite(Number(team.lat)) && Number.isFinite(Number(team.lng))) {
                                            setMapCenter({ lat: Number(team.lat), lng: Number(team.lng) });
                                            setMapMarkerPosition({ lat: Number(team.lat), lng: Number(team.lng) });
                                            setMapZoom(15);
                                        }
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <span className="font-semibold text-slate-900">{team.name}</span>
                                        </div>
                                        <div className={`h-3 w-3 rounded-full ${team.online ? 'bg-green-500' : 'bg-slate-400'}`} />
                                    </div>
                                    <div className="text-sm text-slate-600 mb-2">{team.area || 'Chưa có khu vực mô tả'}</div>
                                    <div className="flex items-center justify-between">
                                        <Badge outline size="sm" className={statusInfo.color}>
                                            {statusInfo.label}
                                        </Badge>
                                        <span className="text-xs text-slate-500">{team.distance ? `${team.distance} km` : 'km tới mục tiêu'}</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </Card>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Ship className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">Phương tiện</h2>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>LẦN CUỐI: {formatSyncTime(syncTime)}</span>
                            <span className="font-semibold text-blue-600">{activeVehiclesCount} Hoạt động</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {vehicles.map((vehicle) => {
                            const statusInfo = getTeamStatusBadge(vehicle.status === 'IN_USE' ? 'BUSY' : 'AVAILABLE');
                            return (
                                <Card key={vehicle.id} variant="outlined" className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getVehicleIcon(vehicle.type)}
                                            <span className="font-semibold text-slate-900">{vehicle.name || vehicle.code}</span>
                                        </div>
                                        <div className={`h-3 w-3 rounded-full ${vehicle.online ? 'bg-green-500' : 'bg-slate-400'}`} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Badge outline size="sm" className={statusInfo.color}>
                                            {statusInfo.label}
                                        </Badge>
                                        <span className="text-xs text-slate-500">{vehicle.distance ? `${vehicle.distance} km` : 'km tới mục tiêu'}</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
