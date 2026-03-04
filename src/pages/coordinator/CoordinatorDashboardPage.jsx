import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    List,
    Search,
    RefreshCw,
    Users,
    Ship,
    Layers,
    ZoomIn,
    ZoomOut,
    Navigation,
} from 'lucide-react';

import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { getCoordinatorDashboard } from '../../features/coordinator/api.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

export default function CoordinatorDashboardPage() {
    const navigate = useNavigate();
    const [syncTime, setSyncTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 16.0544, lng: 108.2022 }); // Da Nang
    const [mapZoom, setMapZoom] = useState(12);

    // Data from BE (map/toạ độ làm sau)
    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCoordinatorDashboard();
            setRequests(data?.requests || []);
            setTeams(data?.teams || []);
            setVehicles(data?.vehicles || []);
            setSyncTime(new Date());
        } catch (err) {
            console.error('[CoordinatorDashboard] loadDashboard error:', err);
            setError(err?.message || 'Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Update sync time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setSyncTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatSyncTime = (date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            AVAILABLE: { label: 'RẢNH', color: 'bg-green-100 text-green-700 border-green-200' },
            BUSY: { label: 'BẬN', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            ON_MISSION: { label: 'ĐANG NHIỆM VỤ', color: 'bg-amber-100 text-amber-800 border-amber-200' },
            MAINTENANCE: { label: 'BẢO TRÌ', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            PENDING: { label: 'Chờ xử lý', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        };
        return statusMap[status] || statusMap.PENDING;
    };

    const getVehicleIcon = (type) => {
        switch ((type || '').toLowerCase()) {
            case 'cano':
            case 'boat':
            case 'ship':
                return <Ship className="h-4 w-4" />;
            case 'helicopter':
                return <Navigation className="h-4 w-4" />;
            default:
                return <Ship className="h-4 w-4" />;
        }
    };

    const filteredRequests = searchQuery
        ? requests.filter((r) => (r.code || '').toLowerCase().includes(searchQuery.toLowerCase()))
        : requests;

    const newRequestsCount = filteredRequests.filter((r) => r.status === 'PENDING').length;
    const onlineTeamsCount = teams.filter((t) => t.online).length;
    const activeVehiclesCount = vehicles.filter((v) => v.online).length;

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4 pb-6">
            {/* Left Column: Request Queue */}
            <Card className="w-80 flex-shrink-0 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <List className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">Hàng đợi Yêu cầu</h2>
                        </div>
                        {newRequestsCount > 0 && (
                            <Badge variant="primary" size="sm">
                                {newRequestsCount} mới
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium">ĐỒNG BỘ:</span>
                        <span className="font-mono">{formatSyncTime(syncTime)}</span>
                    </div>
                </div>

                {/* Request List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-600 uppercase">
                            <div className="col-span-5">MÃ / MỨC ĐỘ</div>
                            <div className="col-span-2 text-center">NGƯỜI</div>
                            <div className="col-span-5 text-right">THỜI GIAN</div>
                        </div>

                        {/* Request Items */}
                        <div className="space-y-2">
                            {filteredRequests.map((request) => {
                                const statusInfo = getStatusBadge(request.status);
                                return (
                                    <div
                                        key={request.id}
                                        className="group p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                                        onClick={(e) => {
                                            // Nếu click vào request, mở trang xác minh
                                            // Nếu muốn phân công trực tiếp, có thể thêm option khác
                                            navigate(COORDINATOR_ROUTES.VERIFY_REQUEST, {
                                                state: { request },
                                            });
                                        }}
                                        onDoubleClick={(e) => {
                                            // Double click để phân công trực tiếp
                                            e.stopPropagation();
                                            navigate(COORDINATOR_ROUTES.ASSIGN_RESCUE, {
                                                state: { request },
                                            });
                                        }}
                                    >
                                        <div className="grid grid-cols-12 gap-2 items-start">
                                            <div className="col-span-5">
                                                <div className="font-semibold text-sm text-slate-900 mb-1">
                                                    {request.code}
                                                </div>
                                                <PriorityBadge level={request.priority} size="xs" />
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {request.peopleCount}
                                                </div>
                                            </div>
                                            <div className="col-span-5 text-right">
                                                <div className="text-xs text-slate-500 mb-1">{request.timeAgo}</div>
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

                {/* Assign button */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/60">
                    <Button
                        type="button"
                        variant="gradient"
                        fullWidth
                        size="md"
                        disabled={loading}
                        onClick={() => {
                            // Truyền tất cả requests PENDING hiện tại để phân công
                            const pendingRequests = filteredRequests.filter(r =>
                                !r.status || r.status === 'PENDING' || r.status === 'pending'
                            );
                            navigate(COORDINATOR_ROUTES.ASSIGN_RESCUE, {
                                state: {
                                    requests: pendingRequests.length > 0 ? pendingRequests : filteredRequests,
                                },
                            });
                        }}
                    >
                        <Users className="h-4 w-4" />
                        Phân công đội &amp; Phương tiện
                    </Button>
                </div>
            </Card>

            {/* Center Column: Map */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Map Header */}
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

                {/* Map Area */}
                <div className="flex-1 relative">
                    <GoogleMap center={mapCenter} zoom={mapZoom} />

                    {/* Map Controls */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-1.5">
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-50 rounded-lg transition"
                            title="Layers"
                        >
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
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-50 rounded-lg transition"
                            title="My location"
                        >
                            <Navigation className="h-4 w-4 text-slate-600" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Right Column: Teams & Vehicles */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                {/* Teams Section */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">Đội cứu hộ</h2>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>LẦN CUỐI: {formatSyncTime(syncTime)}</span>
                            <span className="font-semibold text-blue-600">
                                {onlineTeamsCount}/{teams.length} Trực tuyến
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {teams.map((team) => {
                            const statusInfo = getStatusBadge(team.status);
                            return (
                                <Card
                                    key={team.id}
                                    variant="outlined"
                                    className="p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => {
                                        if (team.lat && team.lng) {
                                            setMapCenter({ lat: team.lat, lng: team.lng });
                                            setMapZoom(15);
                                        }
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <span className="font-semibold text-sm text-slate-900">{team.name}</span>
                                        </div>
                                        <div
                                            className={`h-2 w-2 rounded-full ${team.online ? 'bg-green-500' : 'bg-slate-400'}`}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge outline size="sm" className={statusInfo.color}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                    {team.lastUpdate && <div className="text-xs text-slate-400">{team.lastUpdate}</div>}
                                </Card>
                            );
                        })}
                    </div>
                </Card>

                {/* Vehicles Section */}
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
                            const statusInfo = getStatusBadge(vehicle.status);
                            return (
                                <Card
                                    key={vehicle.id}
                                    variant="outlined"
                                    className="p-3 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="text-blue-600">{getVehicleIcon(vehicle.type)}</div>
                                            <span className="font-semibold text-sm text-slate-900">{vehicle.name}</span>
                                        </div>
                                        <div
                                            className={`h-2 w-2 rounded-full ${vehicle.online ? 'bg-green-500' : 'bg-slate-400'}`}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge outline size="sm" className={statusInfo.color}>
                                            {statusInfo.label}
                                        </Badge>
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

