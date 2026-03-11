import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    Clock,
    Layers,
    List,
    MapPin,
    Navigation,
    Phone,
    RefreshCw,
    Search,
    Ship,
    Users,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';

import GoogleMap from '../../features/map/components/MapBox.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { getCoordinatorDashboard, getCoordinatorRescueQueue } from '../../features/coordinator/api.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

export default function CoordinatorDashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [syncTime, setSyncTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 16.0544, lng: 108.2022 }); // Đà Nẵng mặc định
    const [mapZoom, setMapZoom] = useState(12);

    // Data from BE (map/toạ độ làm sau)
    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCoordinatorDashboard();

            // Lấy requests từ dashboard (có thể chỉ có PENDING)
            const dashboardRequests = data?.requests || [];

            // Lấy thêm IN_PROGRESS requests để đảm bảo hiển thị đầy đủ
            let inProgressRequests = [];
            try {
                const inProgressData = await getCoordinatorRescueQueue({
                    status: 'IN_PROGRESS',
                    page: 0,
                    size: 100,
                });
                // Parse response format
                if (Array.isArray(inProgressData)) {
                    inProgressRequests = inProgressData;
                } else if (inProgressData?.content && Array.isArray(inProgressData.content)) {
                    inProgressRequests = inProgressData.content;
                } else if (inProgressData?.data) {
                    inProgressRequests = Array.isArray(inProgressData.data)
                        ? inProgressData.data
                        : inProgressData.data?.content || [];
                }
            } catch (err) {
                console.warn('[CoordinatorDashboard] Could not load IN_PROGRESS requests:', err);
            }

            // Merge và loại bỏ duplicate dựa trên ID
            const allRequestsMap = new Map();
            [...dashboardRequests, ...inProgressRequests].forEach(req => {
                if (req && req.id) {
                    allRequestsMap.set(req.id, req);
                }
            });
            const allRequests = Array.from(allRequestsMap.values());

            setRequests(allRequests);
            setSelectedRequest((prev) => {
                if (!allRequests.length) return null;
                if (prev && allRequests.some((r) => r.id === prev.id)) return prev;
                return allRequests[0];
            });
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

    // Reload dashboard khi quay lại từ trang phân công
    useEffect(() => {
        if (location.state?.refresh) {
            loadDashboard();
            // Clear refresh flag để không reload lại lần sau
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.refresh]);

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
            IN_PROGRESS: { label: 'Đang xử lí', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            INPROGRESS: { label: 'Đang xử lí', color: 'bg-blue-100 text-blue-700 border-blue-200' },
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
        ? requests.filter((r) => {
              const keyword = searchQuery.toLowerCase();
              return (
                  (r.code || '').toLowerCase().includes(keyword) ||
                  (r.address || '').toLowerCase().includes(keyword) ||
                  (r.reporterName || '').toLowerCase().includes(keyword)
              );
          })
        : requests;

    const newRequestsCount = filteredRequests.filter((r) => r.status === 'PENDING').length;
    const onlineTeamsCount = teams.filter((t) => t.online).length;
    const activeVehiclesCount = vehicles.filter((v) => v.online).length;

    const current = selectedRequest || filteredRequests[0] || null;

    return (
        <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 pb-6">
            {/* Top header giống thanh tiêu đề */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                                <Navigation className="h-4 w-4 rotate-45" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-slate-900">Giám sát Cứu hộ</h1>
                                <p className="text-xs text-slate-500">
                                    Theo dõi nhiệm vụ, đội cứu hộ và bản đồ theo thời gian thực.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs điều hướng (hiện tại chỉ là UI, chưa đổi trang) */}
                    <div className="hidden items-center gap-1 rounded-full bg-slate-100 px-1 py-1 text-xs font-medium text-slate-600 md:flex">
                        <button className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">
                            Bảng điều khiển
                        </button>
                        <button className="rounded-full px-3 py-1 hover:bg-slate-200/80">Bản đồ</button>
                        <button className="rounded-full px-3 py-1 hover:bg-slate-200/80">Tài nguyên</button>
                        <button className="rounded-full px-3 py-1 hover:bg-slate-200/80">Báo cáo</button>
                    </div>

                    {/* Đồng hồ + KPI nhỏ */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-mono">{formatSyncTime(syncTime)}</span>
                        </div>
                        <div className="hidden items-center gap-4 text-xs text-slate-600 md:flex">
                            <div className="flex items-center gap-1">
                                <Activity className="h-3.5 w-3.5 text-blue-600" />
                                <span className="font-semibold text-slate-900">{newRequestsCount}</span>
                                <span>yêu cầu mới</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="font-semibold text-slate-900">
                                    {onlineTeamsCount}/{teams.length}
                                </span>
                                <span>đội trực tuyến</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Ship className="h-3.5 w-3.5 text-sky-600" />
                                <span className="font-semibold text-slate-900">{activeVehiclesCount}</span>
                                <span>phương tiện</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thân màn hình: 3 cột */}
            <div className="flex flex-1 gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg">
                {/* Cột trái: Danh sách nhiệm vụ */}
                <Card className="flex w-80 flex-shrink-0 flex-col bg-slate-50/80">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="h-4 w-4 text-blue-600" />
                                <h2 className="text-sm font-semibold text-slate-900">Danh sách Nhiệm vụ</h2>
                            </div>
                            {newRequestsCount > 0 && (
                                <Badge variant="primary" size="sm">
                                    {newRequestsCount} mới
                                </Badge>
                            )}
                        </div>

                        <div className="relative mb-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Mã NV, đội, địa điểm..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px]">
                            <button className="rounded-full bg-slate-900 px-3 py-1 font-medium text-white shadow-sm">
                                Tất cả
                            </button>
                            <button className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                                Đang di chuyển
                            </button>
                            <button className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                                Tại hiện trường
                            </button>
                            <button className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                                Hoàn tất
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3">
                        {filteredRequests.length === 0 && (
                            <div className="mt-8 text-center text-xs text-slate-500">
                                Chưa có yêu cầu nào phù hợp bộ lọc.
                            </div>
                        )}
                        <div className="space-y-2">
                            {filteredRequests.map((request) => {
                                const statusInfo = getStatusBadge(request.status);
                                const isActive = current && current.id === request.id;
                                return (
                                    <button
                                        key={request.id}
                                        type="button"
                                        className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                                            isActive
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                                        }`}
                                        onClick={() => setSelectedRequest(request)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="mb-1 text-[11px] font-semibold text-slate-900">
                                                    #{request.code || 'NV-XXXX'}
                                                </div>
                                                <div className="mb-1 text-[11px] text-slate-600">
                                                    {request.teamName || 'Đội cứu hộ chưa gán'}
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="line-clamp-1">
                                                        {request.address || 'Địa chỉ đang cập nhật'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <PriorityBadge level={request.priority} size="xs" />
                                                <Badge outline size="sm" className={statusInfo.color}>
                                                    {statusInfo.label}
                                                </Badge>
                                                {request.timeAgo && (
                                                    <span className="text-[10px] text-slate-400">{request.timeAgo}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-3">
                        <Button
                            type="button"
                            variant="gradient"
                            fullWidth
                            size="md"
                            disabled={loading || filteredRequests.length === 0}
                            onClick={() => {
                                const pendingRequests = filteredRequests.filter(
                                    (r) => !r.status || r.status === 'PENDING' || r.status === 'pending',
                                );
                                navigate(COORDINATOR_ROUTES.ASSIGN_RESCUE, {
                                    state: {
                                        requests: pendingRequests.length > 0 ? pendingRequests : filteredRequests,
                                    },
                                });
                            }}
                        >
                            <Users className="h-4 w-4" />
                            Phân công đội &amp; phương tiện
                        </Button>
                    </div>
                </Card>

                {/* Cột giữa: Bản đồ */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-900">Bảng điều khiển bản đồ</span>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                    Thời gian thực
                                </span>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={loadDashboard}>
                                <RefreshCw className="h-3.5 w-3.5" />
                                Tải lại
                            </Button>
                        </div>
                        {error && (
                            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="relative flex-1">
                        <GoogleMap center={mapCenter} zoom={mapZoom} />

                        {/* Nút zoom / layer */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
                            <button
                                type="button"
                                className="rounded-lg p-2 hover:bg-slate-50"
                                title="Chế độ bản đồ"
                            >
                                <Layers className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMapZoom((prev) => Math.min(prev + 1, 20))}
                                className="rounded-lg p-2 hover:bg-slate-50"
                                title="Phóng to"
                            >
                                <ZoomIn className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMapZoom((prev) => Math.max(prev - 1, 1))}
                                className="rounded-lg p-2 hover:bg-slate-50"
                                title="Thu nhỏ"
                            >
                                <ZoomOut className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                className="rounded-lg p-2 hover:bg-slate-50"
                                title="Vị trí trung tâm"
                            >
                                <Navigation className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>

                        {/* Chú giải bản đồ (legend) */}
                        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[10px] text-slate-600 shadow-sm">
                            <div className="mb-1 font-semibold text-slate-900">Chú giải bản đồ</div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                                    <span>Đội cứu hộ (đang di chuyển)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    <span>Điểm sự cố / Chưa xử lý</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span>Tại hiện trường</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Cột phải: Chi tiết nhiệm vụ + đội & phương tiện */}
                <div className="flex w-80 flex-shrink-0 flex-col gap-4">
                    {/* Chi tiết nhiệm vụ giống cột phải design */}
                    <Card className="flex flex-1 flex-col bg-slate-50/80">
                        <div className="border-b border-slate-200 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                        Chi tiết Nhiệm vụ
                                    </p>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-blue-700 hover:underline"
                                        disabled={!current}
                                        onClick={() => {
                                            if (!current) return;
                                            navigate(COORDINATOR_ROUTES.VERIFY_REQUEST, {
                                                state: { request: current },
                                            });
                                        }}
                                    >
                                        #{current?.code || 'Chưa chọn'}{' '}
                                        {current ? '' : '(chọn một nhiệm vụ ở danh sách)'}
                                    </button>
                                </div>
                                <Badge variant="info" size="sm">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Ưu tiên</span>
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs text-slate-700">
                            {/* Thông tin hiện trường */}
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Thông tin hiện trường
                                </p>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {current?.address || 'Địa chỉ chưa cập nhật'}
                                        </p>
                                        {current?.district && (
                                            <p className="text-[11px] text-slate-500">{current.district}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <User className="mt-0.5 h-3.5 w-3.5 text-slate-600" />
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {current?.reporterName || 'Người báo tin chưa rõ'}
                                        </p>
                                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                            <Phone className="h-3 w-3" />
                                            <span>{current?.reporterPhone || 'Số điện thoại đang cập nhật'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tài nguyên phân bổ */}
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Tài nguyên phân bổ
                                </p>
                                {(current?.resources || []).length === 0 && (
                                    <p className="text-[11px] text-slate-500">
                                        Chưa có thông tin tài nguyên. Bạn có thể phân công tại bước tiếp theo.
                                    </p>
                                )}
                                {(current?.resources || []).map((res) => {
                                    const statusInfo = getStatusBadge(res.status);
                                    return (
                                        <div
                                            key={res.id}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="text-blue-600">{getVehicleIcon(res.type)}</div>
                                                <div>
                                                    <p className="text-[11px] font-semibold text-slate-900">
                                                        {res.name}
                                                    </p>
                                                    {res.teamName && (
                                                        <p className="text-[10px] text-slate-500">{res.teamName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge outline size="sm" className={statusInfo.color}>
                                                {statusInfo.label}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Nhật ký nhiệm vụ */}
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Nhật ký nhiệm vụ
                                </p>
                                {(current?.timeline || []).length === 0 && (
                                    <p className="text-[11px] text-slate-500">
                                        Chưa có nhật ký. Nhật ký sẽ hiển thị các sự kiện điều phối mới nhất.
                                    </p>
                                )}
                                <div className="space-y-1.5">
                                    {(current?.timeline || []).map((item) => (
                                        <div key={item.id} className="flex items-start gap-2">
                                            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-900">
                                                    {item.time}{' '}
                                                    <span className="font-normal text-slate-600">· {item.action}</span>
                                                </p>
                                                {item.note && (
                                                    <p className="text-[10px] text-slate-500">{item.note}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 px-4 py-3">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    disabled={!current}
                                >
                                    Điều chỉnh
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    disabled={!current}
                                >
                                    Tách / Gộp
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="danger"
                                size="md"
                                fullWidth
                                className="mt-2"
                                disabled={!current}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Leo thang (Escalation)
                            </Button>
                        </div>
                    </Card>

                    {/* Nhóm đội & phương tiện (rút gọn so với bản cũ, dưới chi tiết) */}
                    <Card className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                            <div className="flex items-center gap-2 text-xs">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-slate-900">Đội & Phương tiện</span>
                            </div>
                            <span className="text-[11px] text-slate-500">Cập nhật {formatSyncTime(syncTime)}</span>
                        </div>
                        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto px-3 py-2 text-[11px]">
                            {teams.slice(0, 3).map((team) => {
                                const statusInfo = getStatusBadge(team.status);
                                return (
                                    <div
                                        key={team.id}
                                        className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 hover:border-blue-300 hover:bg-blue-50"
                                        onClick={() => {
                                            if (team.lat && team.lng) {
                                                setMapCenter({ lat: team.lat, lng: team.lng });
                                                setMapZoom(15);
                                            }
                                        }}
                                    >
                                        <p className="line-clamp-1 font-semibold text-slate-900">{team.name}</p>
                                        <Badge outline size="sm" className={`${statusInfo.color} mt-0.5`}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                );
                            })}
                            {vehicles.slice(0, 3).map((vehicle) => {
                                const statusInfo = getStatusBadge(vehicle.status);
                                return (
                                    <div
                                        key={vehicle.id}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="text-blue-600">{getVehicleIcon(vehicle.type)}</span>
                                            <p className="line-clamp-1 font-semibold text-slate-900">{vehicle.name}</p>
                                        </div>
                                        <Badge outline size="sm" className={`${statusInfo.color} mt-0.5`}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

