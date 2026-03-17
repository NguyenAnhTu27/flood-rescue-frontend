import React, { useState } from 'react';
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
import MapBox from '../../features/map/components/MapBox.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { useCoordinatorDashboard } from '../../features/coordinator/hooks/useCoordinatorDashboard.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import { FILE_BASE_URL } from '../../app/config/env.js';

export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const [searchQuery] = useState('');
    const [error, setError] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 16.0544, lng: 108.2022 }); // Da Nang
    const [mapZoom, setMapZoom] = useState(12);
    const [mapMarkerPosition, setMapMarkerPosition] = useState(null);

    const {
        syncTime,
        requests,
        teams,
        selectedRequestId,
        setSelectedRequestId,
        selectedRequestDetail,
        detailLoading,
        detailError,
        extractCoordinates,
    } = useCoordinatorDashboard();

    const focusMapForRequest = (requestLike) => {
        const coords = extractCoordinates(requestLike);
        if (!coords) return;
        setMapCenter(coords);
        setMapMarkerPosition(coords);
        setMapZoom(15);
    };

    const formatSyncTime = (date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getStatusBadge = (status, waitingForTeam = false) => {
        if (waitingForTeam) {
            return { label: 'CHỜ CÓ ĐỘI', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        }
        const statusMap = {
            AVAILABLE: { label: 'RẢNH', color: 'bg-green-100 text-green-700 border-green-200' },
            BUSY: { label: 'BẬN', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            MAINTENANCE: { label: 'BẢO TRÌ', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            PENDING: { label: 'Chờ xử lý', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        };
        return statusMap[status] || statusMap.PENDING;
    };

    const filteredRequests = searchQuery
        ? requests.filter((r) => (r.code || '').toLowerCase().includes(searchQuery.toLowerCase()))
        : requests;

    const newRequestsCount = filteredRequests.filter((r) => r.status === 'PENDING' && !r.waitingForTeam).length;
    const waitingTeamCount = filteredRequests.filter((r) => Boolean(r.waitingForTeam)).length;

    const handleSelectRequest = (request) => {
        setSelectedRequestId(Number(request?.id) || null);
        focusMapForRequest(request);
    };

    const handleGoToVerifyPage = () => {
        const req = selectedRequestDetail || requests.find((r) => Number(r?.id) === Number(selectedRequestId));
        if (!req?.id) return;
        navigate(`${COORDINATOR_ROUTES.VERIFY_REQUEST}?id=${req.id}`, { state: { request: req } });
    };

    return (
        <div className="space-y-4 pb-6">
            <div className="h-[calc(100vh-8rem)] flex gap-4">
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
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                            Chờ có đội: {waitingTeamCount}
                        </span>
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
                                const statusInfo = getStatusBadge(request.status, Boolean(request.waitingForTeam));
                                const isActive = Number(selectedRequestId) === Number(request.id);
                                return (
                                    <div
                                        key={request.id}
                                        className={`group p-3 rounded-md border transition-all cursor-pointer ${isActive ? 'border-blue-400 bg-blue-50/60 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:shadow-md bg-white'}`}
                                        onClick={() => handleSelectRequest(request)}
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
                                                <div className="text-xs text-slate-500 mb-1">
                                                    {request.timeAgo}
                                                </div>
                                                <Badge
                                                    outline
                                                    size="sm"
                                                    className={statusInfo.color}
                                                >
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
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        size="md"
                        onClick={() => navigate(COORDINATOR_ROUTES.BLOCKED_CITIZENS)}
                    >
                        Đã khóa
                    </Button>
                </div>

            </Card>

            {/* Center Column: Map */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Map Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                    {error && (
                        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Map Area */}
                <div className="flex-1 relative">
                    <MapBox
                        center={mapCenter}
                        markerPosition={mapMarkerPosition}
                        zoom={mapZoom}
                    />

                    {/* Map Controls */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 p-1.5">
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-50 rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                            title="Layers"
                            aria-label="Chọn lớp bản đồ"
                        >
                            <Layers className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
                            className="p-2 hover:bg-slate-50 rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                            title="Zoom in"
                            aria-label="Phóng to bản đồ"
                        >
                            <ZoomIn className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
                            className="p-2 hover:bg-slate-50 rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                            title="Zoom out"
                            aria-label="Thu nhỏ bản đồ"
                        >
                            <ZoomOut className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-50 rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                            title="My location"
                            aria-label="Tâm bản đồ về vị trí đội"
                        >
                            <Navigation className="h-4 w-4 text-slate-600" />
                        </button>
                    </div>

                </div>
            </Card>

            {/* Right Column: Request Detail */}
            <div className="w-80 flex-shrink-0 flex flex-col">
                <Card className="shrink-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                        <h2 className="text-base font-bold text-slate-900">Chi tiết yêu cầu</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {!selectedRequestId ? (
                            <p className="text-sm text-slate-500">Chọn một yêu cầu trong hàng đợi để xem chi tiết và xác minh.</p>
                        ) : detailLoading ? (
                            <p className="text-sm text-slate-500">Đang tải chi tiết yêu cầu...</p>
                        ) : detailError ? (
                            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{detailError}</div>
                        ) : selectedRequestDetail ? (
                            <>
                                <div>
                                    <div className="text-xs text-slate-500">Mã yêu cầu</div>
                                    <div className="text-sm font-semibold text-slate-900">{selectedRequestDetail.code || `#${selectedRequestDetail.id}`}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-xs text-slate-500">Số người</div>
                                        <div className="text-sm font-semibold text-slate-900">{selectedRequestDetail.affectedPeopleCount ?? selectedRequestDetail.peopleCount ?? '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Ưu tiên</div>
                                        <PriorityBadge level={selectedRequestDetail.priority || 'MEDIUM'} size="xs" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Công dân</div>
                                    <div className="text-sm text-slate-800">{selectedRequestDetail.citizenName || '—'}</div>
                                    <div className="text-xs text-slate-500">{selectedRequestDetail.citizenPhone || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Địa chỉ</div>
                                    <div className="text-sm text-slate-800">{selectedRequestDetail.addressText || selectedRequestDetail.locationDescription || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Mô tả vị trí</div>
                                    <div className="text-sm text-slate-800">{selectedRequestDetail.locationDescription || selectedRequestDetail.citizenLocationDescription || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Mô tả</div>
                                    <div className="text-sm text-slate-800 line-clamp-4 whitespace-pre-wrap">{selectedRequestDetail.description || '—'}</div>
                                </div>
                                <div>
                                    <div className="mb-1 text-xs text-slate-500">Ảnh đính kèm</div>
                                    {!Array.isArray(selectedRequestDetail.attachments) || selectedRequestDetail.attachments.length === 0 ? (
                                        <div className="text-sm text-slate-500">Không có ảnh đính kèm.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedRequestDetail.attachments.map((att) => {
                                                const raw = String(att?.fileUrl || att?.url || '').trim();
                                                const src = raw.startsWith('http') ? raw : `${FILE_BASE_URL}${raw}`;
                                                return (
                                                    <a
                                                        key={att?.id || raw}
                                                        href={src}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="overflow-hidden rounded-lg border border-slate-200"
                                                    >
                                                        <img src={src} alt="attachment" className="h-20 w-full object-cover" />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    fullWidth
                                    onClick={handleGoToVerifyPage}
                                >
                                    Xác minh
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Không có dữ liệu chi tiết.</p>
                        )}
                    </div>
                </Card>
            </div>
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900">Bảng đội cứu hộ</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Đội</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Khu vực</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Không có dữ liệu đội cứu hộ.</td>
                                </tr>
                            ) : (
                                teams.map((team) => {
                                    const statusInfo = getStatusBadge(team.status);
                                    return (
                                        <tr key={team.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{team.name || `Đội #${team.id}`}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{team.area || '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge outline size="sm" className={statusInfo.color}>
                                                    {statusInfo.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const coords = extractCoordinates(team);
                                                            if (!coords) {
                                                                setError(`Không tìm thấy tọa độ hợp lệ cho đội ${team.name || ''}`.trim());
                                                                return;
                                                            }
                                                            setMapCenter(coords);
                                                            setMapMarkerPosition(coords);
                                                            setMapZoom(15);
                                                        }}
                                                    >
                                                        Xem trên bản đồ
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(COORDINATOR_ROUTES.TEAM_WORKLOAD, { state: { teamId: team.id } })}
                                                    >
                                                        Xem chi tiết
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
