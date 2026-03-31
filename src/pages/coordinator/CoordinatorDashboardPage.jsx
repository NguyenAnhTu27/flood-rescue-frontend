import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    List,
    Users,
    MapPin,
    Clock,
    Layers,
    ZoomIn,
    ZoomOut,
    Navigation,
} from 'lucide-react';
import GoogleMap from '../../features/map/components/MapBox.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { getCoordinatorDashboard } from '../../features/coordinator/api.js';
import { getTeam } from '../../features/teams/api.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import httpClient from '../../shared/lib/http.js';

export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const [syncTime, setSyncTime] = useState(new Date());
    const [mapCenter, setMapCenter] = useState({ lat: 16.0544, lng: 108.2022 });
    const [mapZoom, setMapZoom] = useState(12);
    const [mapMarkerPosition, setMapMarkerPosition] = useState(null);

    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mapRefreshSeconds, setMapRefreshSeconds] = useState(20);
    const [focusingTeamId, setFocusingTeamId] = useState(null);

    const toNumberOrNull = (value) => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const normalized = String(value).trim().replace(',', '.');
        if (!normalized) return null;
        const num = Number(normalized);
        return Number.isFinite(num) ? num : null;
    };

    const parseCoordinatesFromText = (text) => {
        const raw = String(text || '');
        const match = raw.match(/(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)/);
        if (!match) return null;
        const lat = toNumberOrNull(match[1]);
        const lng = toNumberOrNull(match[2]);
        if (lat === null || lng === null) return null;
        return { lat, lng };
    };

    const isValidLatLng = (lat, lng) =>
        Number.isFinite(lat)
        && Number.isFinite(lng)
        && lat >= -90
        && lat <= 90
        && lng >= -180
        && lng <= 180
        && !(Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001);

    const isLikelyVietnam = (lat, lng) => lat >= 7.5 && lat <= 24.5 && lng >= 102 && lng <= 110;

    const extractCoordinates = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        const directPairs = [
            [obj.lat, obj.lng],
            [obj.latitude, obj.longitude],
            [obj.currentLat, obj.currentLng],
            [obj.currentLatitude, obj.currentLongitude],
            [obj.lastLat, obj.lastLng],
            [obj.teamLatitude, obj.teamLongitude],
            [obj.location?.lat, obj.location?.lng],
            [obj.location?.latitude, obj.location?.longitude],
            [obj.currentLocation?.lat, obj.currentLocation?.lng],
            [obj.currentLocation?.latitude, obj.currentLocation?.longitude],
        ];
        const normalized = [];
        for (const [rawLat, rawLng] of directPairs) {
            const lat = toNumberOrNull(rawLat);
            const lng = toNumberOrNull(rawLng);
            if (isValidLatLng(lat, lng)) {
                normalized.push({ lat, lng });
            }
            if (isValidLatLng(lng, lat)) {
                normalized.push({ lat: lng, lng: lat });
            }
        }

        const textCandidates = [
            obj.gps,
            obj.locationText,
            obj.currentLocationText,
            obj.teamLocationText,
            obj.locationDescription,
            obj.addressText,
            obj.area,
        ];
        for (const text of textCandidates) {
            const parsed = parseCoordinatesFromText(text);
            if (!parsed) continue;
            if (isValidLatLng(parsed.lat, parsed.lng)) {
                normalized.push(parsed);
            }
            if (isValidLatLng(parsed.lng, parsed.lat)) {
                normalized.push({ lat: parsed.lng, lng: parsed.lat });
            }
        }

        if (normalized.length === 0) return null;
        return normalized.find((coords) => isLikelyVietnam(coords.lat, coords.lng)) || normalized[0];
    };

    const applyMapFocus = (coords) => {
        if (!coords) {
            setError('Không tìm thấy tọa độ hợp lệ để hiển thị trên bản đồ.');
            return;
        }
        setError(null);
        setMapCenter(coords);
        setMapMarkerPosition(coords);
        setMapZoom(15);
    };

    const focusMapEntity = async (entity) => {
        const coords = extractCoordinates(entity);
        if (coords) {
            applyMapFocus(coords);
            return;
        }

        const teamId = entity?.id;
        if (!teamId) {
            setError('Không tìm thấy tọa độ hợp lệ để hiển thị trên bản đồ.');
            return;
        }

        try {
            setFocusingTeamId(Number(teamId));
            setError(null);
            const detail = await getTeam(teamId);
            const detailCoords = extractCoordinates(detail);
            if (!detailCoords) {
                console.warn('[CoordinatorDashboard] Team detail has no coordinates', detail);
                setError(`Đội ${entity?.name || `#${teamId}`} chưa có GPS để hiển thị trên bản đồ.`);
                return;
            }

            setTeams((prev) => prev.map((team) => (
                Number(team?.id) === Number(teamId)
                    ? { ...team, ...detail }
                    : team
            )));
            applyMapFocus(detailCoords);
        } catch (err) {
            console.error('[CoordinatorDashboard] focusMapEntity error:', err);
            setError(err?.message || 'Không thể tải vị trí đội cứu hộ.');
        } finally {
            setFocusingTeamId(null);
        }
    };

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCoordinatorDashboard();
            const requestsFromApi = data?.requests || [];
            const sortedRequests = [...requestsFromApi].sort((a, b) => {
                const tsB = getRequestTimestamp(b);
                const tsA = getRequestTimestamp(a);
                return tsB - tsA;
            });
            setRequests(sortedRequests);
            setTeams(data?.teams || []);
            setSyncTime(new Date());
        } catch (err) {
            console.error('[CoordinatorDashboard] loadDashboard error:', err);
            setError(err?.message || 'Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

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
                console.error('[CoordinatorDashboard] load runtime settings error:', err);
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
    }, [mapRefreshSeconds]);

    const formatSyncTime = (date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const parseRelativeTimeAgo = (text) => {
        if (!text) return 0;
        const normalized = String(text || '').trim().toLowerCase();
        if (!normalized) return 0;
        if (normalized.includes('vừa') || normalized.includes('giây') || normalized.includes('mới')) {
            return Date.now();
        }

        const absolute = Date.now();
        const days = normalized.match(/(\d+)\s*d(?:\w*)/);
        if (days) return absolute - Number(days[1]) * 24 * 60 * 60 * 1000;
        const hours = normalized.match(/(\d+)\s*h(?:\w*)/);
        if (hours) return absolute - Number(hours[1]) * 60 * 60 * 1000;
        const minutes = normalized.match(/(\d+)\s*p(?:\w*)/);
        if (minutes) return absolute - Number(minutes[1]) * 60 * 1000;

        return 0;
    };

    const parseRequestCodeDate = (code) => {
        if (!code || typeof code !== 'string') return 0;
        const m = code.match(/(\d{4})(\d{2})(\d{2})/);
        if (!m) return 0;
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const dt = new Date(y, mo, d);
        return Number.isFinite(dt.getTime()) ? dt.getTime() : 0;
    };

    const getRequestTimestamp = (request) => {
        if (!request || typeof request !== 'object') return 0;

        const candidate = request.updatedAt || request.createdAt || request.createdDate || request.requestedAt || request.time;
        const parsed = candidate ? Date.parse(String(candidate)) : NaN;
        if (Number.isFinite(parsed)) return parsed;

        const codeTs = parseRequestCodeDate(request.code || request.id || '');
        if (codeTs > 0) return codeTs;

        const timeAgoTs = parseRelativeTimeAgo(request.timeAgo);
        if (timeAgoTs > 0) return timeAgoTs;

        return 0;
    };

    const getRequestStatusBadge = (status, waitingForTeam = false) => {
        if (waitingForTeam) {
            return { label: 'CHỜ CÓ ĐỘI', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        }
        const statusMap = {
            PENDING: { label: 'Chờ xử lý', color: 'bg-slate-100 text-slate-700 border-slate-200' },
            VERIFIED: { label: 'Đã xác minh', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
            ASSIGNED: { label: 'Đã phân công', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
            IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            CANCELLED: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700 border-rose-200' },
        };
        return statusMap[String(status || '').toUpperCase()] || statusMap.PENDING;
    };

    const getTeamStatusBadge = (status) => {
        const statusMap = {
            AVAILABLE: { label: 'RẢNH', color: 'bg-green-100 text-green-700 border-green-200' },
            BUSY: { label: 'BẬN', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            MAINTENANCE: { label: 'BẢO TRÌ', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        };
        return statusMap[String(status || '').toUpperCase()] || { label: 'KHÔNG RÕ', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    };

    const pendingRequestsCount = requests.filter((r) => String(r?.status || '').toUpperCase() === 'PENDING' && !r.waitingForTeam).length;
    const availableTeamsCount = teams.filter((t) => String(t?.status || '').toUpperCase() === 'AVAILABLE').length;

    const handleOpenVerifyPage = (request) => {
        if (!request?.id) return;
        navigate(`${COORDINATOR_ROUTES.VERIFY_REQUEST}?id=${request.id}`, { state: { request } });
    };

    return (
        <div className="space-y-4 pb-6">


            <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_22rem]">
                <Card className="order-2 flex max-h-[420px] flex-col overflow-hidden xl:order-1 xl:max-h-[620px]">
                    <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="h-5 w-5 text-blue-600" />
                                <h2 className="text-base font-bold text-slate-900">Hàng đợi yêu cầu</h2>
                            </div>
                            <Badge variant="primary" size="sm">{pendingRequestsCount} mới</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-mono">{formatSyncTime(syncTime)}</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto p-3">
                        {requests.length === 0 ? (
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                                Chưa có yêu cầu cứu hộ.
                            </p>
                        ) : (
                            requests.map((request) => {
                                const statusInfo = getRequestStatusBadge(request.status, Boolean(request.waitingForTeam));
                                return (
                                    <button
                                        key={request.id}
                                        type="button"
                                        onClick={() => handleOpenVerifyPage(request)}
                                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{request.code || `#${request.id}`}</p>
                                                <p className="mt-1 text-xs text-slate-500">Nhấn để mở trang xác minh</p>
                                            </div>
                                            <PriorityBadge level={request.priority || 'MEDIUM'} size="xs" />
                                        </div>
                                        <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                {request.peopleCount ?? request.affectedPeopleCount ?? '—'} người
                                            </span>
                                            <span>{request.timeAgo || 'Vừa cập nhật'}</span>
                                        </div>
                                        <Badge outline size="sm" className={statusInfo.color}>
                                            {statusInfo.label}
                                        </Badge>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50/70 p-4">
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            size="md"
                            onClick={() => navigate(COORDINATOR_ROUTES.BLOCKED_CITIZENS)}
                        >
                            Danh sách đã khóa
                        </Button>
                    </div>
                </Card>

                <Card className="order-1 flex flex-col overflow-hidden xl:order-2">
                    <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">Bản đồ điều phối thời gian thực</p>
                            <span className="text-xs text-slate-500">Lần cuối: {formatSyncTime(syncTime)}</span>
                        </div>
                        {loading && (
                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                Đang đồng bộ dữ liệu dashboard...
                            </div>
                        )}
                        {error && (
                            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="relative h-[360px] sm:h-[480px] xl:h-[620px]">
                        <GoogleMap
                            center={mapCenter}
                            markerPosition={mapMarkerPosition}
                            zoom={mapZoom}
                        />

                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
                            <button
                                type="button"
                                className="rounded-lg p-2 transition hover:bg-slate-50"
                                title="Layers"
                            >
                                <Layers className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMapZoom((prev) => Math.min(prev + 1, 20))}
                                className="rounded-lg p-2 transition hover:bg-slate-50"
                                title="Zoom in"
                            >
                                <ZoomIn className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMapZoom((prev) => Math.max(prev - 1, 1))}
                                className="rounded-lg p-2 transition hover:bg-slate-50"
                                title="Zoom out"
                            >
                                <ZoomOut className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                className="rounded-lg p-2 transition hover:bg-slate-50"
                                title="My location"
                            >
                                <Navigation className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </Card>

                <Card className="order-3 flex max-h-[420px] flex-col overflow-hidden xl:max-h-[620px]">
                    <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <h2 className="text-base font-bold text-slate-900">Đội cứu hộ</h2>
                        </div>
                        <div className="text-xs text-slate-500">
                            {availableTeamsCount}/{teams.length} đội đang rảnh
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                        {teams.length === 0 ? (
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                                Không có dữ liệu đội cứu hộ.
                            </p>
                        ) : (
                            teams.map((team) => {
                                const statusInfo = getTeamStatusBadge(team.status);
                                return (
                                    <Card key={team.id} variant="outlined" className="p-3">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{team.name || `Đội #${team.id}`}</p>
                                                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {team.area || 'Chưa có khu vực'}
                                                </p>
                                                {extractCoordinates(team) && (
                                                    <p className="mt-1 text-[11px] text-blue-700">
                                                        GPS sẵn sàng
                                                    </p>
                                                )}
                                            </div>
                                            <Badge outline size="sm" className={statusInfo.color}>
                                                {statusInfo.label}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={focusingTeamId === Number(team.id)}
                                                onClick={() => focusMapEntity(team)}
                                            >
                                                {focusingTeamId === Number(team.id) ? 'Đang tìm GPS...' : 'Xem bản đồ'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(COORDINATOR_ROUTES.TEAM_WORKLOAD, { state: { teamId: team.id } })}
                                            >
                                                Tải công việc
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
