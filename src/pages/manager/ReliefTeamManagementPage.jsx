import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, MapPin, Clock, RefreshCw, X } from 'lucide-react';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import { getTeams } from '../../features/teams/api.js';
import { listReliefRequests, getInventoryIssue, rejectReliefRequestByManager } from '../../features/relief/api.js';
import { getAssets } from '../../features/assets/api.js';

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function extractCoords(team) {
    const lat = Number(team?.currentLatitude ?? team?.lat ?? team?.latitude);
    const lng = Number(team?.currentLongitude ?? team?.lng ?? team?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
}

function isActiveTask(req) {
    const status = String(req?.status || '').toUpperCase();
    return !['DONE', 'CANCELLED'].includes(status);
}

function deliveryLabel(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED') return 'Hoàn thành';
    if (s === 'ARRIVED_RELIEF_POINT') return 'Đã tới điểm cứu trợ';
    if (s === 'ARRIVED_WAREHOUSE') return 'Đã tới kho';
    if (s === 'RESCUER_RECEIVED') return 'Đội đã nhận';
    if (s === 'MANAGER_APPROVED') return 'Đã duyệt';
    if (s === 'REJECTED') return 'Từ chối';
    return s || 'REQUESTED';
}

function isRemovedTask(req) {
    const status = String(req?.status || '').toUpperCase();
    const delivery = String(req?.deliveryStatus || '').toUpperCase();
    return status === 'CANCELLED' || delivery === 'REJECTED';
}

export default function ReliefTeamManagementPage() {
    const location = useLocation();
    const preselectTeamId = Number(location.state?.preselectTeamId || 0) || null;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(preselectTeamId);
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [issueDetail, setIssueDetail] = useState(null);
    const [issueLoading, setIssueLoading] = useState(false);
    const [issueError, setIssueError] = useState('');
    const [deletingTaskId, setDeletingTaskId] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 10.8231, lng: 106.6297 });
    const [mapMarkerPosition, setMapMarkerPosition] = useState(null);
    const [mapZoom, setMapZoom] = useState(11);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [teamsResp, requestsResp, assetsResp] = await Promise.all([
                getTeams(),
                listReliefRequests({ page: 0, size: 500 }),
                getAssets({ page: 0, size: 500 }),
            ]);
            setTeams(normalizeList(teamsResp));
            setRequests(normalizeList(requestsResp));
            setAssets(normalizeList(assetsResp));
        } catch (e) {
            setError(e?.message || 'Không thể tải dữ liệu quản lý đội cứu trợ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const teamStats = useMemo(() => {
        return teams.map((team) => {
            const teamRequests = requests.filter((r) => Number(r?.assignedTeamId) === Number(team?.id));
            const activeCount = teamRequests.filter(isActiveTask).length;
            const doneCount = teamRequests.filter((r) => !isActiveTask(r)).length;
            const teamAssets = assets.filter((asset) => {
                const holderTeamId = Number(
                    asset?.assignedTeamId
                    ?? asset?.teamId
                    ?? asset?.currentTeamId
                    ?? asset?.holderTeamId
                );
                return holderTeamId > 0 && holderTeamId === Number(team?.id);
            });
            return {
                ...team,
                coords: extractCoords(team),
                teamRequests,
                teamAssets,
                activeCount,
                doneCount,
                totalCount: teamRequests.length,
            };
        });
    }, [teams, requests, assets]);

    const selectedTeam = useMemo(() => {
        if (selectedTeamId) {
            return teamStats.find((t) => Number(t.id) === Number(selectedTeamId)) || null;
        }
        return teamStats[0] || null;
    }, [teamStats, selectedTeamId]);

    useEffect(() => {
        if (!selectedTeam && teamStats.length > 0) {
            setSelectedTeamId(Number(teamStats[0].id));
            return;
        }
        if (selectedTeam?.coords) {
            setMapCenter(selectedTeam.coords);
            setMapMarkerPosition(selectedTeam.coords);
            setMapZoom(14);
        }
    }, [selectedTeam, teamStats]);

    const markers = useMemo(
        () => teamStats
            .filter((t) => t.coords)
            .map((t) => ({
                lat: t.coords.lat,
                lng: t.coords.lng,
                title: `${t.name || t.code}: ${t.activeCount} task`,
            })),
        [teamStats]
    );

    const selectedTask = useMemo(() => {
        const tasks = selectedTeam?.teamRequests || [];
        if (!tasks.length || selectedTaskId == null) return null;
        return tasks.find((t) => Number(t.id) === Number(selectedTaskId)) || null;
    }, [selectedTeam, selectedTaskId]);

    useEffect(() => {
        if (!showTasksModal) return;
        setSelectedTaskId(null);
    }, [showTasksModal, selectedTeamId]);

    const handleOpenIssueDetail = async (issueId) => {
        if (!issueId) return;
        try {
            setIssueLoading(true);
            setIssueError('');
            setIssueDetail(null);
            setShowIssueModal(true);
            const data = await getInventoryIssue(issueId);
            setIssueDetail(data || null);
        } catch (e) {
            setIssueError(e?.message || 'Không thể tải chi tiết phiếu xuất');
        } finally {
            setIssueLoading(false);
        }
    };

    const handleDeleteTask = async (req) => {
        if (!req?.id || deletingTaskId) return;
        const confirmed = window.confirm(`Xóa task ${req.code || `#${req.id}`} khỏi đội hiện tại?`);
        if (!confirmed) return;
        const reason = 'Manager xóa task khỏi danh sách đội cứu trợ.';
        try {
            setDeletingTaskId(Number(req.id));
            await rejectReliefRequestByManager(Number(req.id), reason);
            setRequests((prev) => prev.map((item) => (
                Number(item?.id) === Number(req.id)
                    ? { ...item, status: 'CANCELLED', deliveryStatus: 'REJECTED', deliveryNote: reason }
                    : item
            )));
            if (Number(selectedTaskId) === Number(req.id)) {
                setSelectedTaskId(null);
            }
        } catch (e) {
            window.alert(e?.message || 'Không thể xóa task.');
        } finally {
            setDeletingTaskId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý đội cứu hộ đi cứu trợ</h1>
                    <p className="text-sm text-slate-500">Theo dõi số lượng task và vị trí hiện tại của từng đội.</p>
                </div>
                <Button type="button" variant="primary" onClick={loadData} disabled={loading}>
                    <RefreshCw className="h-4 w-4" />
                    Làm mới
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
            )}

            <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                <Card className="max-h-[70vh] overflow-y-auto p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Users className="h-4 w-4 text-blue-600" />
                        Danh sách đội
                    </div>
                    <div className="space-y-2">
                        {teamStats.map((team) => {
                            const isSelected = Number(selectedTeamId) === Number(team.id);
                            return (
                                <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => setSelectedTeamId(Number(team.id))}
                                    className={`w-full rounded-lg border p-3 text-left transition ${isSelected
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-slate-900">{team.name || team.code}</div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTeamId(Number(team.id));
                                                setShowTasksModal(true);
                                            }}
                                            className="rounded-full"
                                        >
                                            <Badge variant="primary" size="sm">{team.activeCount} task</Badge>
                                        </button>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">Tổng: {team.totalCount} | Hoàn thành: {team.doneCount}</div>
                                    <div className="mt-1 text-xs text-slate-600">
                                        Phương tiện giữ: {team.teamAssets.length > 0
                                            ? team.teamAssets
                                                .slice(0, 3)
                                                .map((asset) => asset.code || asset.assetCode || asset.licensePlate || `PT-${asset.id}`)
                                                .join(', ')
                                            : 'Chưa có'}
                                        {team.teamAssets.length > 3 ? ` (+${team.teamAssets.length - 3})` : ''}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {team.currentLocationText || team.description || 'Chưa có mô tả vị trí'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="p-0 overflow-hidden">
                        <div className="h-[420px]">
                            <GoogleMap
                                center={mapCenter}
                                markerPosition={mapMarkerPosition}
                                additionalMarkers={markers}
                                zoom={mapZoom}
                            />
                        </div>
                    </Card>

                    <Card className="p-4 text-sm text-slate-600">
                        <div>Bấm vào một đội ở cột bên trái để xem bảng danh sách task của đội đó.</div>
                        {selectedTeam && (
                            <div className="mt-2 text-xs text-slate-700">
                                Phương tiện đội đang giữ:{' '}
                                {selectedTeam.teamAssets.length > 0
                                    ? selectedTeam.teamAssets
                                        .map((asset) => asset.code || asset.assetCode || asset.licensePlate || `PT-${asset.id}`)
                                        .join(', ')
                                    : 'Chưa có'}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {showTasksModal && selectedTeam && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <div className="text-base font-semibold text-slate-900">
                                    Danh sách task của {selectedTeam.name || selectedTeam.code}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {(selectedTeam.teamRequests || []).length} task
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTasksModal(false);
                                    setSelectedTaskId(null);
                                }}
                                className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] space-y-4 overflow-auto p-5">
                            {(selectedTeam.teamRequests || []).length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    Đội này chưa có task cứu trợ nào.
                                </div>
                            ) : (
                                <>
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-left text-slate-600">
                                                <th className="px-3 py-2 font-semibold">Mã yêu cầu</th>
                                                <th className="px-3 py-2 font-semibold">Trạng thái</th>
                                                <th className="px-3 py-2 font-semibold">Địa chỉ</th>
                                                <th className="px-3 py-2 font-semibold text-right">Cập nhật</th>
                                                <th className="px-3 py-2 font-semibold text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedTeam.teamRequests || []).map((req) => {
                                                const isActive = Number(selectedTask?.id) === Number(req.id);
                                                const isRemoved = isRemovedTask(req);
                                                return (
                                                    <tr
                                                        key={req.id}
                                                        onClick={() => setSelectedTaskId(Number(req.id))}
                                                        className={`cursor-pointer border-b border-slate-100 last:border-0 ${isActive ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                                                            } ${isRemoved ? 'opacity-50' : ''}`}
                                                    >
                                                        <td className="px-3 py-2 font-semibold text-slate-900">{req.code || `#${req.id}`}</td>
                                                        <td className="px-3 py-2 text-slate-700">
                                                            <span className="inline-flex items-center gap-1 text-xs">
                                                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                                                {deliveryLabel(req.deliveryStatus)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600">{req.targetArea || req.citizenAddressText || 'Chưa có địa chỉ'}</td>
                                                        <td className="px-3 py-2 text-right text-slate-500">
                                                            {req.updatedAt ? new Date(req.updatedAt).toLocaleString('vi-VN') : '—'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isActive) {
                                                                            setSelectedTaskId(null);
                                                                        } else {
                                                                            setSelectedTaskId(Number(req.id));
                                                                        }
                                                                    }}
                                                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                                                >
                                                                    {isActive ? 'Thu gọn' : 'Xem chi tiết'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        void handleDeleteTask(req);
                                                                    }}
                                                                    disabled={isRemoved || Number(deletingTaskId) === Number(req.id)}
                                                                    className="rounded-md border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                                                >
                                                                    {Number(deletingTaskId) === Number(req.id) ? 'Đang xóa...' : 'Xóa task'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {selectedTask ? (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-3 text-sm font-semibold text-slate-900">Chi tiết task</div>
                                            <div className="grid gap-3 text-sm md:grid-cols-2">
                                                <div>
                                                    <div className="text-xs text-slate-500">Mã yêu cầu</div>
                                                    <div className="font-semibold text-slate-900">{selectedTask.code || `#${selectedTask.id}`}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Trạng thái hiện tại</div>
                                                    <div className="font-semibold text-blue-700">{deliveryLabel(selectedTask.deliveryStatus)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Địa chỉ mục tiêu</div>
                                                    <div className="text-slate-800">{selectedTask.targetArea || selectedTask.citizenAddressText || 'Chưa có địa chỉ'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Cập nhật gần nhất</div>
                                                    <div className="text-slate-800">{selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleString('vi-VN') : '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Mã phiếu xuất</div>
                                                    <div className="text-slate-800">
                                                        {selectedTask.assignedIssueId ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenIssueDetail(selectedTask.assignedIssueId)}
                                                                className="font-semibold text-blue-700 underline"
                                                            >
                                                                #{selectedTask.assignedIssueId}
                                                            </button>
                                                        ) : '—'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Người tạo yêu cầu</div>
                                                    <div className="text-slate-800">{selectedTask.createdByName || selectedTask.createdByPhone || '—'}</div>
                                                </div>
                                            </div>
                                            {(selectedTask.deliveryNote || selectedTask.note) && (
                                                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                                    <div className="text-xs font-semibold text-slate-500">Ghi chú</div>
                                                    <div className="mt-1 text-sm text-slate-700">{selectedTask.deliveryNote || selectedTask.note}</div>
                                                </div>
                                            )}

                                            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <div className="text-xs font-semibold text-blue-700">Dữ liệu gốc công dân gửi</div>
                                                <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                                                    <div>
                                                        <div className="text-xs text-slate-500">Địa chỉ công dân gửi</div>
                                                        <div className="text-slate-800">{selectedTask.citizenAddressText || selectedTask.addressText || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">Tọa độ gốc</div>
                                                        <div className="text-slate-800">
                                                            {(selectedTask.citizenLatitude != null && selectedTask.citizenLongitude != null)
                                                                ? `${selectedTask.citizenLatitude}, ${selectedTask.citizenLongitude}`
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">Mô tả vị trí gốc</div>
                                                        <div className="text-slate-800">{selectedTask.citizenLocationDescription || selectedTask.locationDescription || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">Nội dung yêu cầu gốc</div>
                                                        <div className="text-slate-800">{selectedTask.note || '—'}</div>
                                                    </div>
                                                </div>
                                                {Array.isArray(selectedTask.lines) && selectedTask.lines.length > 0 && (
                                                    <div className="mt-2 rounded-md border border-blue-100 bg-white p-2 text-xs text-slate-700">
                                                        {selectedTask.lines.map((line) => (
                                                            <div key={line.id || `${line.itemCategoryId}-${line.itemCode}`}>
                                                                {line.itemCode || line.itemName || `#${line.itemCategoryId}`}: {line.qty} {line.unit || ''}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                                            Bấm vào một task trong bảng để xem chi tiết và dữ liệu gốc công dân gửi.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showIssueModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div className="text-base font-semibold text-slate-900">Chi tiết phiếu xuất</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowIssueModal(false);
                                    setIssueDetail(null);
                                    setIssueError('');
                                }}
                                className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="max-h-[70vh] space-y-3 overflow-auto p-5 text-sm">
                            {issueLoading ? (
                                <div className="text-slate-500">Đang tải chi tiết phiếu xuất...</div>
                            ) : issueError ? (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">{issueError}</div>
                            ) : !issueDetail ? (
                                <div className="text-slate-500">Không có dữ liệu phiếu xuất.</div>
                            ) : (
                                <>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <div className="text-xs text-slate-500">Mã phiếu</div>
                                            <div className="font-semibold text-slate-900">{issueDetail.code || `#${issueDetail.id}`}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Trạng thái</div>
                                            <div className="font-semibold text-blue-700">{String(issueDetail.status || '—')}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Đội giao hàng</div>
                                            <div className="text-slate-800">{issueDetail.assignedTeamName || issueDetail.assignedTeamCode || issueDetail.assignedTeamId || '—'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Phương tiện</div>
                                            <div className="text-slate-800">{issueDetail.assetName || issueDetail.assetCode || issueDetail.assetId || '—'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Yêu cầu cứu trợ</div>
                                            <div className="text-slate-800">{issueDetail.reliefRequestCode || issueDetail.reliefRequestId || '—'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Cập nhật</div>
                                            <div className="text-slate-800">
                                                {issueDetail.updatedAt ? new Date(issueDetail.updatedAt).toLocaleString('vi-VN') : '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-2 text-xs font-semibold text-slate-500">Danh sách hàng xuất</div>
                                        {Array.isArray(issueDetail.lines) && issueDetail.lines.length > 0 ? (
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-slate-600">
                                                        <th className="px-2 py-2 font-semibold">Mã hàng</th>
                                                        <th className="px-2 py-2 font-semibold">Tên hàng</th>
                                                        <th className="px-2 py-2 font-semibold text-right">SL</th>
                                                        <th className="px-2 py-2 font-semibold">Đơn vị</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {issueDetail.lines.map((line) => (
                                                        <tr key={line.id || `${line.itemCategoryId}-${line.itemCode}`} className="border-b border-slate-100 last:border-0">
                                                            <td className="px-2 py-2">{line.itemCode || `#${line.itemCategoryId}`}</td>
                                                            <td className="px-2 py-2">{line.itemName || '—'}</td>
                                                            <td className="px-2 py-2 text-right">{line.qty ?? '—'}</td>
                                                            <td className="px-2 py-2">{line.unit || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-slate-500">Không có dòng hàng.</div>
                                        )}
                                    </div>
                                    {issueDetail.note && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <div className="text-xs font-semibold text-slate-500">Ghi chú</div>
                                            <div className="mt-1 text-slate-700">{issueDetail.note}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
