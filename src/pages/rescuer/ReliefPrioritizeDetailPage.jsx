import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, FileText, User, Clock } from 'lucide-react';
import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import MapBox from '../../features/map/components/MapBox.jsx';
import { getInventoryIssue, getReliefRequest, updateRescuerReliefStatus } from '../../features/relief/api.js';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';

const DELIVERY_STATUS_LABELS = {
    REQUESTED: 'Mới tạo',
    MANAGER_APPROVED: 'Đã duyệt',
    RESCUER_RECEIVED: 'Đã nhận',
    ARRIVED_WAREHOUSE: 'Đã tới kho',
    ARRIVED_RELIEF_POINT: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    RETURNED_TO_WAREHOUSE: 'Trả kho',
    REJECTED: 'Từ chối',
};

const STATUS_LABELS = {
    DRAFT: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    DONE: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
};

function getNextActions(deliveryStatus) {
    const s = String(deliveryStatus || '').toUpperCase();
    switch (s) {
        case 'MANAGER_APPROVED':
            return [{ status: 'RESCUER_RECEIVED', label: 'Đã nhận', variant: 'primary' }];
        case 'RESCUER_RECEIVED':
            return [{ status: 'ARRIVED_WAREHOUSE', label: 'Đã tới kho', variant: 'primary' }];
        case 'ARRIVED_WAREHOUSE':
            return [{ status: 'ARRIVED_RELIEF_POINT', label: 'Đã tới điểm cứu trợ', variant: 'primary' }];
        case 'ARRIVED_RELIEF_POINT':
            return [
                { status: 'COMPLETED', label: 'Hoàn thành', variant: 'primary' },
                { status: 'RETURNED_TO_WAREHOUSE', label: 'Trả kho', variant: 'secondary' },
            ];
        default:
            return [];
    }
}

function extractCoordinates(req) {
    const lat = Number(req?.citizenLatitude ?? req?.latitude ?? req?.lat);
    const lng = Number(req?.citizenLongitude ?? req?.longitude ?? req?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    const raw = String(req?.citizenLocationDescription || req?.locationDescription || req?.citizenAddressText || '');
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const mLat = Number(match[1]);
    const mLng = Number(match[2]);
    if (!Number.isFinite(mLat) || !Number.isFinite(mLng)) return null;
    return { lat: mLat, lng: mLng };
}

function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
}

function extractPhoneFromNote(note) {
    const raw = String(note || '');
    if (!raw) return null;
    const lines = raw.split('\n');
    const phoneLine = lines.find((line) => /SĐT\s*liên\s*hệ|SDT\s*lien\s*he|SĐT|SDT/i.test(line));
    if (phoneLine) {
        const val = phoneLine.replace(/.*(?:SĐT\s*liên\s*hệ|SDT\s*lien\s*he|SĐT|SDT)\s*:\s*/i, '').trim();
        if (val) return val;
    }
    const fallbackMatch = raw.match(/(?:\+?84|0)\d{8,10}/);
    return fallbackMatch ? fallbackMatch[0] : null;
}

export default function ReliefPrioritizeDetailPage() {
    const navigate = useNavigate();
    const params = useParams();
    const id = Number(params.id || 0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [request, setRequest] = useState(null);
    const [issue, setIssue] = useState(null);
    const [updateNote, setUpdateNote] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError('');
                const req = await getReliefRequest(id);
                setRequest(req || null);

                const issueId = Number(req?.assignedIssueId || 0);
                if (issueId > 0) {
                    try {
                        const issueDetail = await getInventoryIssue(issueId);
                        setIssue(issueDetail || null);
                    } catch {
                        setIssue(null);
                    }
                } else {
                    setIssue(null);
                }
            } catch (e) {
                setError(e?.message || 'Không thể tải chi tiết yêu cầu cứu trợ.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const coords = useMemo(() => extractCoordinates(request), [request]);
    const requestLines = useMemo(() => {
        if (Array.isArray(request?.lines) && request.lines.length > 0) return request.lines;
        if (Array.isArray(issue?.lines) && issue.lines.length > 0) return issue.lines;
        return [];
    }, [request, issue]);

    const issueCode = issue?.code || (request?.assignedIssueId ? `#${request.assignedIssueId}` : '—');
    const requestPhone = useMemo(() => {
        // Ưu tiên số điện thoại liên hệ trong chính nội dung yêu cầu (note),
        // vì createdByPhone có thể là số tài khoản tạo thay mặt.
        return (
            extractPhoneFromNote(request?.note)
            || request?.contactPhone
            || request?.citizenPhone
            || request?.createdByPhone
            || null
        );
    }, [request?.note, request?.contactPhone, request?.citizenPhone, request?.createdByPhone]);

    const deliveryLabel = useMemo(() => {
        const s = String(request?.deliveryStatus || '').toUpperCase();
        return DELIVERY_STATUS_LABELS[s] || s || 'REQUESTED';
    }, [request]);

    const statusLabel = useMemo(() => {
        const s = String(request?.status || '').toUpperCase();
        return STATUS_LABELS[s] || s || '';
    }, [request]);

    const nextActions = useMemo(() => {
        if (String(request?.status || '').toUpperCase() === 'DONE' ||
            String(request?.status || '').toUpperCase() === 'CANCELLED') {
            return [];
        }
        return getNextActions(request?.deliveryStatus);
    }, [request]);

    const handleUpdateStatus = async (status) => {
        if (!request?.id) return;
        try {
            setUpdating(true);
            setError('');
            await updateRescuerReliefStatus(Number(request.id), {
                status,
                note: updateNote.trim() || undefined,
            });
            setUpdateNote('');
            const latest = await getReliefRequest(Number(request.id));
            setRequest(latest || null);
        } catch (e) {
            const msg = e?.message || 'Không thể cập nhật trạng thái.';
            setError(msg);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Button type="button" variant="secondary" onClick={() => navigate(RESCUER_ROUTES.RELIEF_PRIORITIZE)}>
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại sắp xếp cứu trợ
                </Button>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Đơn: {statusLabel}
                    </span>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        Giao: {deliveryLabel}
                    </span>
                    {nextActions.map((action) => (
                        <Button
                            key={action.status}
                            type="button"
                            variant={action.variant}
                            disabled={updating}
                            onClick={() => handleUpdateStatus(action.status)}
                        >
                            {updating ? 'Đang xử lý...' : action.label}
                        </Button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
            )}

            {loading ? (
                <Card className="p-6 text-sm text-slate-500">Đang tải dữ liệu chi tiết...</Card>
            ) : (
                <>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <Card className="p-0 overflow-hidden">
                            <div className="border-b border-slate-200 px-4 py-3">
                                <div className="text-lg font-bold text-slate-900">Vị trí yêu cầu cứu trợ</div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {request?.code || `#${id}`} - {request?.targetArea || request?.citizenAddressText || 'Chưa có địa chỉ'}
                                </div>
                            </div>
                            <div className="h-[460px]">
                                <MapBox
                                    center={coords || { lat: 10.8231, lng: 106.6297 }}
                                    markerPosition={coords || null}
                                    zoom={coords ? 15 : 11}
                                />
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Liên hệ khẩn</div>
                            <div className="mt-2 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                                <div className="flex items-center gap-2 text-red-700">
                                    <Phone className="h-5 w-5" />
                                    <span className="text-sm font-semibold">Số điện thoại yêu cầu</span>
                                </div>
                                <div className="mt-2 text-2xl font-extrabold tracking-wide text-red-700">
                                    {requestPhone || 'Chưa có số điện thoại'}
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-700">
                                <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-500" />{request?.createdByName || '—'}</div>
                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" />{request?.citizenAddressText || request?.targetArea || '—'}</div>
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" />{formatDateTime(request?.updatedAt || request?.createdAt)}</div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Thông tin yêu cầu gốc của khách
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                                <div><span className="font-semibold">Mã task:</span> {request?.code || `#${id}`}</div>
                                <div><span className="font-semibold">Mức độ:</span> {request?.priority || '—'}</div>
                                <div><span className="font-semibold">Mô tả vị trí:</span> {request?.citizenLocationDescription || '—'}</div>
                                <div><span className="font-semibold">Ghi chú khách gửi:</span> {request?.note || '—'}</div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                Thông tin phiếu xuất kho
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                                <div><span className="font-semibold">Mã phiếu xuất:</span> {issueCode}</div>
                                <div><span className="font-semibold">Trạng thái phiếu:</span> {issue?.status || '—'}</div>
                                <div><span className="font-semibold">Đội giao:</span> {issue?.assignedTeamName || issue?.assignedTeamCode || request?.assignedTeamId || '—'}</div>
                                <div><span className="font-semibold">Ghi chú phiếu:</span> {issue?.note || request?.deliveryNote || '—'}</div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-4">
                        <div className="mb-3 text-sm font-semibold text-slate-900">Danh sách hàng cần giao</div>
                        {requestLines.length === 0 ? (
                            <div className="text-sm text-slate-500">Không có dữ liệu hàng cần giao.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-left text-slate-600">
                                            <th className="px-2 py-2 font-semibold">Mã hàng</th>
                                            <th className="px-2 py-2 font-semibold">Tên hàng</th>
                                            <th className="px-2 py-2 font-semibold text-right">Số lượng</th>
                                            <th className="px-2 py-2 font-semibold">Đơn vị</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestLines.map((line, idx) => (
                                            <tr key={line.id || `${line.itemCategoryId}-${idx}`} className="border-b border-slate-100 last:border-0">
                                                <td className="px-2 py-2 font-semibold text-slate-900">{line.itemCode || `#${line.itemCategoryId}`}</td>
                                                <td className="px-2 py-2 text-slate-700">{line.itemName || '—'}</td>
                                                <td className="px-2 py-2 text-right text-slate-700">{String(line.qty ?? '0')}</td>
                                                <td className="px-2 py-2 text-slate-700">{line.unit || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {nextActions.length > 0 && (
                        <Card className="p-4">
                            <div className="mb-2 text-sm font-semibold text-slate-900">Ghi chú cập nhật (tuỳ chọn)</div>
                            <textarea
                                value={updateNote}
                                onChange={(e) => setUpdateNote(e.target.value)}
                                rows={2}
                                placeholder="Ghi chú khi cập nhật trạng thái..."
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                            />
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
