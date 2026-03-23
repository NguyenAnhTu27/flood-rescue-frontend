import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock, MapPin, Users } from 'lucide-react';
import GoogleMap from '../../features/map/components/MapBox.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import {
    getCoordinatorRescueQueue,
    getCoordinatorRescueRequestByCode,
    getCoordinatorRescueRequestById,
    setCitizenBlockByRequest,
    verifyRescueRequest,
} from '../../features/coordinator/api.js';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import { FILE_BASE_URL } from '../../app/config/env.js';

function parseId(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtDate(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return String(value);
    }
}

function statusChip(status) {
    const s = String(status || 'PENDING').toUpperCase();
    const map = {
        PENDING: { label: 'Chờ xác minh', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        VERIFIED: { label: 'Đã xác minh', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
        ASSIGNED: { label: 'Đã phân công', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        IN_PROGRESS: { label: 'Đang xử lý', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
        COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        CANCELLED: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
        DUPLICATE: { label: 'Trùng lặp', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    return map[s] || map.PENDING;
}

export default function RescueVerifyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const stateRequest = location.state?.request || null;
    const queryId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cancelSaving, setCancelSaving] = useState(false);
    const [blockSaving, setBlockSaving] = useState(false);
    const [error, setError] = useState('');
    const [request, setRequest] = useState(stateRequest);
    const [note, setNote] = useState('');
    const [cancelAction, setCancelAction] = useState('DELETE');
    const [cancelReason, setCancelReason] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const [verifiedRequests, setVerifiedRequests] = useState([]);
    const [loadingVerifiedList, setLoadingVerifiedList] = useState(false);
    const [notice, setNotice] = useState(null);

    const requestId = useMemo(() => parseId(stateRequest?.id) || parseId(queryId), [stateRequest?.id, queryId]);

    useEffect(() => {
        if (!notice) return undefined;
        const timeoutId = window.setTimeout(() => setNotice(null), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [notice]);

    const loadDetail = async (idOrCode, byCode = false) => {
        setLoading(true);
        setError('');
        try {
            const detail = byCode
                ? await getCoordinatorRescueRequestByCode(idOrCode)
                : await getCoordinatorRescueRequestById(idOrCode);
            setRequest(detail);
            setNote('');
            setCancelAction('DELETE');
            setCancelReason('');
            setBlockReason('');
            setNotice(null);
        } catch (e) {
            setRequest(null);
            setError(e?.message || 'Không thể tải dữ liệu yêu cầu từ hệ thống.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (requestId) {
            loadDetail(requestId, false);
            return;
        }
        if (queryId) {
            loadDetail(queryId, true);
            return;
        }
        if (stateRequest?.id) {
            loadDetail(stateRequest.id, false);
            return;
        }
        setRequest(null);
        setError('');
        setLoading(false);
    }, [queryId, requestId, stateRequest?.id]);

    useEffect(() => {
        const loadVerified = async () => {
            try {
                setLoadingVerifiedList(true);
                const resp = await getCoordinatorRescueQueue({ status: 'VERIFIED', page: 0, size: 50 });
                const list = Array.isArray(resp?.content) ? resp.content : Array.isArray(resp) ? resp : [];
                setVerifiedRequests(list);
            } catch {
                setVerifiedRequests([]);
            } finally {
                setLoadingVerifiedList(false);
            }
        };
        loadVerified();
    }, []);

    const mapCenter = {
        lat: Number(request?.latitude) || Number(request?.lat) || 16.0544,
        lng: Number(request?.longitude) || Number(request?.lng) || 108.2022,
    };

    const handleVerify = async () => {
        if (!request?.id) return;
        try {
            setSaving(true);
            await verifyRescueRequest(request.id, {
                locationVerified: true,
                note,
                cancelRequest: false,
                cancelAction: null,
                cancelReason: null,
            });
            const refreshed = await getCoordinatorRescueRequestById(request.id);
            setRequest(refreshed);
            navigate(COORDINATOR_ROUTES.ASSIGN_RESCUE, {
                state: {
                    request: refreshed,
                    autoSelectRequestId: refreshed.id,
                    fromVerify: true,
                    successMessage: 'Đã xác minh yêu cầu thành công.',
                },
            });
        } catch (e) {
            setNotice({
                type: 'error',
                text: e?.message || 'Xác minh thất bại.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!request?.id) return;
        if (!cancelReason.trim()) {
            setNotice({
                type: 'warning',
                text: 'Vui lòng nhập lý do hủy/chờ đội.',
            });
            return;
        }
        try {
            setCancelSaving(true);
            await verifyRescueRequest(request.id, {
                locationVerified: false,
                note: note || null,
                cancelRequest: true,
                cancelAction,
                cancelReason: cancelReason.trim(),
            });
            const refreshed = await getCoordinatorRescueRequestById(request.id);
            setRequest(refreshed);
            setNotice({
                type: 'success',
                text: 'Đã xử lý hủy yêu cầu thành công.',
            });
        } catch (e) {
            setNotice({
                type: 'error',
                text: e?.message || 'Không thể hủy yêu cầu.',
            });
        } finally {
            setCancelSaving(false);
        }
    };

    const handleBlockCitizen = async () => {
        if (!request?.id) return;
        if (!blockReason.trim()) {
            setNotice({
                type: 'warning',
                text: 'Vui lòng nhập lý do khóa citizen.',
            });
            return;
        }
        try {
            setBlockSaving(true);
            await setCitizenBlockByRequest(request.id, {
                blocked: true,
                reason: blockReason.trim(),
            });
            setBlockReason('');
            setNotice({
                type: 'success',
                text: 'Đã khóa citizen thành công.',
            });
        } catch (e) {
            setNotice({
                type: 'error',
                text: e?.message || 'Không thể khóa citizen.',
            });
        } finally {
            setBlockSaving(false);
        }
    };

    if (loading) {
        return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải chi tiết yêu cầu...</div>;
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
                <div className="mb-2 inline-flex items-center gap-2 font-semibold text-rose-700"><AlertCircle className="h-4 w-4" />Không thể mở trang xác minh</div>
                <p className="text-sm text-rose-600">{error}</p>
                <button
                    type="button"
                    onClick={() => navigate(COORDINATOR_ROUTES.DASHBOARD)}
                    className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700"
                >
                    Về dashboard
                </button>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="space-y-4">
                <Card className="p-4">
                    <h1 className="text-lg font-bold text-slate-900">Danh sách yêu cầu đã xác minh</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Chọn một yêu cầu `VERIFIED` từ danh sách bên dưới để xem chi tiết xác minh.
                    </p>
                </Card>

                <Card className="p-4">
                    {loadingVerifiedList ? (
                        <p className="text-sm text-slate-500">Đang tải danh sách yêu cầu đã xác minh...</p>
                    ) : verifiedRequests.length === 0 ? (
                        <p className="text-sm text-slate-500">Hiện chưa có yêu cầu nào ở trạng thái VERIFIED.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px]">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Mã</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Công dân</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Địa chỉ</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Thời gian</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {verifiedRequests.map((r) => (
                                        <tr key={r.id} className="border-t border-slate-100">
                                            <td className="px-4 py-2 text-sm font-semibold text-slate-900">{r.code || `#${r.id}`}</td>
                                            <td className="px-4 py-2 text-sm text-slate-700">{r.citizenName || '—'}</td>
                                            <td className="px-4 py-2 text-sm text-slate-700">{r.addressText || '—'}</td>
                                            <td className="px-4 py-2 text-sm text-slate-600">{fmtDate(r.updatedAt || r.createdAt)}</td>
                                            <td className="px-4 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => loadDetail(r.id, false)}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    const chip = statusChip(request?.status);
    const noticeClass = notice?.type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : notice?.type === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-rose-200 bg-rose-50 text-rose-700';

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4">
                {notice && (
                    <div className={`rounded-lg border px-3 py-2 text-sm ${noticeClass}`}>
                        {notice.text}
                    </div>
                )}

                <Card className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                            >
                                <ArrowLeft className="h-3 w-3" /> Quay lại
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900">Xác minh yêu cầu #{request.code || request.id}</h1>
                                <Badge outline size="sm" className={chip.cls}>{chip.label}</Badge>
                                <PriorityBadge level={request.priority || 'MEDIUM'} size="sm" />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Tất cả dữ liệu bên dưới được lấy từ database hiện tại.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            {fmtDate(request.createdAt)}
                        </div>
                    </div>
                </Card>

                <Card className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Công dân</p>
                            <p className="text-sm font-medium text-slate-900">{request.citizenName || '—'}</p>
                            <p className="text-xs text-slate-500">{request.citizenPhone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Số người cần hỗ trợ</p>
                            <p className="text-sm font-medium text-slate-900 inline-flex items-center gap-1"><Users className="h-4 w-4" />{request.affectedPeopleCount ?? '—'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">Địa chỉ</p>
                        <p className="mt-1 text-sm text-slate-800 inline-flex gap-1"><MapPin className="mt-0.5 h-4 w-4 text-slate-500" />{request.addressText || '—'}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">Mô tả tình huống</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{request.description || '—'}</p>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Ghi chú điều phối</label>
                        <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nhập ghi chú xác minh"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        />
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                        <div className="text-xs font-semibold text-rose-800">Vùng thao tác nhạy cảm: Hủy yêu cầu</div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <select
                                value={cancelAction}
                                onChange={(e) => setCancelAction(e.target.value)}
                                className="h-10 rounded-lg border border-rose-200 bg-white px-3 text-sm"
                            >
                                <option value="DELETE">Hủy yêu cầu</option>
                                <option value="WAITING_TEAM">Đưa về hàng đợi: chờ có đội</option>
                            </select>
                            <input
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Lý do hủy/chờ đội"
                                className="h-10 rounded-lg border border-rose-200 bg-white px-3 text-sm"
                            />
                        </div>
                        <div className="mt-2">
                            <Button variant="outline" size="sm" onClick={handleCancelRequest} disabled={cancelSaving}>
                                {cancelSaving ? 'Đang xử lý...' : 'Xác nhận hủy yêu cầu'}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-900">
                            Khóa citizen (nghi ngờ spam), không cho gửi yêu cầu mới
                        </div>
                        <input
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Lý do khóa"
                            className="mt-2 h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm"
                        />
                        <div className="mt-2">
                            <Button variant="outline" size="sm" onClick={handleBlockCitizen} disabled={blockSaving}>
                                {blockSaving ? 'Đang xử lý...' : 'Khóa citizen'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button variant="primary" size="sm" onClick={handleVerify} disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Xác minh yêu cầu'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(COORDINATOR_ROUTES.PRIORITIZE_REQUEST, { state: { request } })}
                        >
                            Phân loại ưu tiên
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(COORDINATOR_ROUTES.DUPLICATE_MANAGEMENT, { state: { sourceRequest: request } })}
                        >
                            Đánh dấu trùng lặp
                        </Button>
                    </div>
                </Card>

                <Card className="p-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Ảnh đính kèm</p>
                    {!Array.isArray(request.attachments) || request.attachments.length === 0 ? (
                        <p className="text-sm text-slate-500">Không có ảnh đính kèm.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {request.attachments.map((att) => {
                                const raw = att.fileUrl || '';
                                const src = raw.startsWith('http') ? raw : `${FILE_BASE_URL}${raw}`;
                                return (
                                    <a key={att.id || raw} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-slate-200">
                                        <img src={src} alt="attachment" className="h-28 w-full object-cover" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-4">
                <Card className="overflow-hidden p-0">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Vị trí yêu cầu</h2>
                    </div>
                    <div className="h-[280px] sm:h-[360px]">
                        <GoogleMap center={mapCenter} zoom={14} />
                    </div>
                </Card>

                <Card className="p-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Timeline từ hệ thống</p>
                    {!Array.isArray(request.timeline) || request.timeline.length === 0 ? (
                        <p className="text-sm text-slate-500">Chưa có timeline.</p>
                    ) : (
                        <div className="space-y-2">
                            {request.timeline.map((t) => (
                                <div key={t.id || `${t.eventType}-${t.createdAt}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                    <div className="text-xs font-semibold text-slate-800">{t.eventType || 'EVENT'}</div>
                                    <div className="mt-0.5 text-xs text-slate-600">{t.note || '—'}</div>
                                    <div className="mt-0.5 text-[11px] text-slate-500">{fmtDate(t.createdAt)} • {t.actorName || 'Hệ thống'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
