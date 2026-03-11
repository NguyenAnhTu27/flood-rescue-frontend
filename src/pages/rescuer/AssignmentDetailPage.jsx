import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react';
import { escalateRescuerTaskGroup, getRescuerEmergencyAcks, getRescuerTaskById, getRescuerTaskGroupById, updateRescuerTaskGroupStatus } from '../../features/rescuer/api.js';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';
import { FILE_BASE_URL } from '../../app/config/env.js';
import MissionMapView from '../../features/map/components/MissionMapView.jsx';

function fmtDate(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return String(value);
    }
}

function badgeClass(statusRaw) {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'NEW') return 'bg-slate-100 text-slate-700';
    if (s === 'ASSIGNED') return 'bg-blue-100 text-blue-700';
    if (s === 'IN_PROGRESS') return 'bg-amber-100 text-amber-700';
    if (s === 'DONE') return 'bg-emerald-100 text-emerald-700';
    if (s === 'CANCELLED') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
}

function emergencyActionLabel(actionStatus, read) {
    const s = String(actionStatus || '').toUpperCase();
    if (s === 'REASSIGNED') return 'Đã phân công đội cứu hộ khác';
    if (s === 'CONFIRMED') return 'Đã xác nhận yêu cầu khẩn cấp';
    if (s === 'WAITING_OVERLOAD') return 'Điều phối báo quá tải, yêu cầu đang đợi';
    if (s === 'QUEUED') return 'Đã đưa vào hàng đợi';
    if (s === 'VIEWED') return 'Điều phối đã xem';
    if (read) return 'Điều phối đã xem';
    return 'Chưa xem';
}

export default function AssignmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detail, setDetail] = useState(null);
    const [requestDetailsById, setRequestDetailsById] = useState({});
    const [savingStatus, setSavingStatus] = useState(false);
    const [statusValue, setStatusValue] = useState('IN_PROGRESS');
    const [statusNote, setStatusNote] = useState('');
    const [escalating, setEscalating] = useState(false);
    const [severity, setSeverity] = useState('HIGH');
    const [escalationReason, setEscalationReason] = useState('');
    const [emergencyAcks, setEmergencyAcks] = useState([]);

    const loadDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError('');
            const resp = await getRescuerTaskGroupById(id);
            setDetail(resp);
        } catch (e) {
            setDetail(null);
            setError(e?.message || 'Không thể tải chi tiết nhiệm vụ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        const ids = Array.isArray(detail?.requests) ? detail.requests.map((r) => Number(r?.id)).filter(Number.isFinite) : [];
        if (!ids.length) {
            setRequestDetailsById({});
            return;
        }

        (async () => {
            const results = await Promise.allSettled(ids.map((rid) => getRescuerTaskById(rid)));
            const next = {};
            for (let i = 0; i < ids.length; i += 1) {
                const rid = ids[i];
                const res = results[i];
                if (res.status === 'fulfilled' && res.value) {
                    next[rid] = res.value;
                }
            }
            setRequestDetailsById(next);
        })();
    }, [detail?.requests]);

    useEffect(() => {
        if (!detail?.id) {
            setEmergencyAcks([]);
            return;
        }
        (async () => {
            try {
                const ack = await getRescuerEmergencyAcks(detail.id);
                setEmergencyAcks(Array.isArray(ack) ? ack : []);
            } catch {
                setEmergencyAcks([]);
            }
        })();
    }, [detail?.id]);

    const requestCount = useMemo(() => (Array.isArray(detail?.requests) ? detail.requests.length : 0), [detail]);

    const handleUpdateStatus = async () => {
        if (!detail?.id) return;
        let finalNote = statusNote;
        if (String(statusValue).toUpperCase() === 'CANCELLED' && !String(statusNote || '').trim()) {
            const reason = window.prompt('Vui lòng nhập lý do hủy nhiệm vụ/yêu cầu:');
            if (!reason || !reason.trim()) {
                window.alert('Cần có lý do khi chuyển trạng thái CANCELLED.');
                return;
            }
            finalNote = reason.trim();
            setStatusNote(finalNote);
        }
        try {
            setSavingStatus(true);
            await updateRescuerTaskGroupStatus(detail.id, statusValue, finalNote || undefined);
            await loadDetail();
            window.alert('Cập nhật trạng thái nhiệm vụ thành công.');
        } catch (e) {
            window.alert(e?.message || 'Không thể cập nhật trạng thái nhiệm vụ.');
        } finally {
            setSavingStatus(false);
        }
    };

    const handleEscalate = async () => {
        if (!detail?.id) return;
        if (!String(escalationReason || '').trim()) {
            window.alert('Vui lòng nhập lý do khẩn cấp.');
            return;
        }
        try {
            setEscalating(true);
            await escalateRescuerTaskGroup(detail.id, {
                severity,
                reason: escalationReason.trim(),
            });
            setEscalationReason('');
            await loadDetail();
            const ack = await getRescuerEmergencyAcks(detail.id);
            setEmergencyAcks(Array.isArray(ack) ? ack : []);
            window.alert('Đã gửi khẩn cấp thành công.');
        } catch (e) {
            window.alert(e?.message || 'Không thể gửi khẩn cấp.');
        } finally {
            setEscalating(false);
        }
    };

    const resolveFileUrl = (urlRaw) => {
        const u = String(urlRaw || '').trim();
        if (!u) return '';
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        const base = String(FILE_BASE_URL || '').replace(/\/+$/, '');
        const path = u.startsWith('/') ? u : `/${u}`;
        return `${base}${path}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <button
                    type="button"
                    onClick={() => navigate(RESCUER_ROUTES.MY_ASSIGNMENTS)}
                    className="inline-flex items-center gap-1 hover:text-blue-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Danh sách nhiệm vụ
                </button>
                <span>/</span>
                <span className="font-medium text-slate-900">Chi tiết #{id}</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
                {loading ? (
                    <div className="py-8 text-center text-sm text-slate-500">Đang tải dữ liệu chi tiết...</div>
                ) : error ? (
                    <div className="py-8 text-center text-sm text-rose-700">{error}</div>
                ) : !detail ? (
                    <div className="py-8 text-center text-sm text-slate-500">Không có dữ liệu nhiệm vụ.</div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{detail.code || `Task Group #${detail.id}`}</h1>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{detail.assignedTeamName || '—'}</span>
                                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{fmtDate(detail.updatedAt || detail.createdAt)}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(detail.status)}`}>{detail.status || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <section className="rounded-lg border border-slate-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900">Thông tin nhiệm vụ</h2>
                                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                                    <div>Mã nhóm: <span className="font-semibold">{detail.code || `TG-${detail.id}`}</span></div>
                                    <div>Đội phụ trách: <span className="font-semibold">{detail.assignedTeamName || '—'}</span></div>
                                    <div>Tạo bởi: <span className="font-semibold">{detail.createdByName || '—'}</span></div>
                                    <div>Ghi chú điều phối: <span className="font-semibold">{detail.note || '—'}</span></div>
                                    <div>Tạo lúc: <span className="font-semibold">{fmtDate(detail.createdAt)}</span></div>
                                    <div>Cập nhật: <span className="font-semibold">{fmtDate(detail.updatedAt)}</span></div>
                                </div>
                                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cập nhật trạng thái nhiệm vụ</h3>
                                    <div className="mt-2 grid gap-2">
                                        <select
                                            value={statusValue}
                                            onChange={(e) => setStatusValue(e.target.value)}
                                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                        >
                                            <option value="ASSIGNED">ASSIGNED</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="DONE">DONE</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </select>
                                        <textarea
                                            value={statusNote}
                                            onChange={(e) => setStatusNote(e.target.value)}
                                            rows={3}
                                            placeholder="Ghi chú cập nhật trạng thái (tuỳ chọn)"
                                            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleUpdateStatus}
                                            disabled={savingStatus}
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                        >
                                            {savingStatus ? 'Đang cập nhật...' : 'Lưu trạng thái'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-700">Khẩn cấp nhiệm vụ (RESCUER)</h3>
                                    <div className="mt-2 grid gap-2">
                                        <select
                                            value={severity}
                                            onChange={(e) => setSeverity(e.target.value)}
                                            className="h-10 rounded-lg border border-rose-200 bg-white px-3 text-sm"
                                        >
                                            <option value="HIGH">HIGH</option>
                                            <option value="CRITICAL">CRITICAL</option>
                                        </select>
                                        <textarea
                                            value={escalationReason}
                                            onChange={(e) => setEscalationReason(e.target.value)}
                                            rows={3}
                                            placeholder="Lý do khẩn cấp: thiếu phương tiện, rủi ro tăng nhanh, cần hỗ trợ bổ sung..."
                                            className="w-full rounded-lg border border-rose-200 bg-white p-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleEscalate}
                                            disabled={escalating}
                                            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                        >
                                            {escalating ? 'Đang gửi khẩn cấp...' : 'Gửi khẩn cấp'}
                                        </button>
                                    </div>
                                    <div className="mt-3 rounded-lg border border-rose-200 bg-white p-2 text-xs">
                                        <div className="font-semibold text-rose-700">Trạng thái khẩn cấp</div>
                                        {emergencyAcks.length === 0 ? (
                                            <div className="mt-1 text-slate-600">Chưa gửi hoặc chưa có điều phối nhận thông báo.</div>
                                        ) : (
                                            <div className="mt-1 space-y-1 text-slate-700">
                                                <div className="font-medium text-emerald-700">Đã gửi</div>
                                                {emergencyAcks.map((a) => (
                                                    <div key={a.coordinatorId}>
                                                        {a.coordinatorName || `Điều phối #${a.coordinatorId}`}: {emergencyActionLabel(a.actionStatus, a.read)}
                                                        {a.queueRequestId ? ` (RR#${a.queueRequestId})` : ''} {a.acknowledgedAt ? `• ${fmtDate(a.acknowledgedAt)}` : ''}
                                                        {a.actionNote ? ` • ${a.actionNote}` : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-lg border border-slate-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900">Yêu cầu trong nhiệm vụ ({requestCount})</h2>
                                <div className="mt-3 space-y-2">
                                    {Array.isArray(detail.requests) && detail.requests.length > 0 ? (
                                        detail.requests.map((r) => {
                                            const full = requestDetailsById[Number(r.id)] || {};
                                            const merged = { ...r, ...full };
                                            const attachments = Array.isArray(merged.attachments) ? merged.attachments : [];
                                            const address = merged.addressText || 'Chưa có địa chỉ';
                                            const lat = Number(merged.latitude || merged.lat);
                                            const lng = Number(merged.longitude || merged.lng);
                                            const hasGps = Number.isFinite(lat) && Number.isFinite(lng);
                                            const mapPosition = hasGps ? { lat, lng } : null;
                                            return (
                                            <div key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{merged.code || `RR-${merged.id || r.id}`}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(merged.status)}`}>{merged.status || '—'}</span>
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600 inline-flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {address}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">Ưu tiên: {merged.priority || '—'} • Người: {merged.affectedPeopleCount ?? '—'}</div>
                                                <div className="mt-1 text-xs text-slate-600">SĐT công dân: {merged.citizenPhone || '—'}</div>
                                                <div className="mt-1 text-xs text-slate-600">GPS: {hasGps ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Chưa có'}</div>
                                                <div className="mt-1 text-xs text-slate-600">Mô tả vị trí: {merged.locationDescription || '—'}</div>
                                                <div className="mt-1 text-xs text-slate-600">Mô tả: {merged.description || '—'}</div>

                                                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    {mapPosition ? (
                                                        <div className="h-44 w-full">
                                                            <MissionMapView
                                                                center={mapPosition}
                                                                markerPosition={mapPosition}
                                                                zoom={15}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-44 w-full items-center justify-center text-xs text-slate-500">
                                                            Chua co toa do de hien thi ban do
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-2">
                                                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Ảnh/đính kèm</div>
                                                    {attachments.length === 0 ? (
                                                        <p className="text-xs text-slate-500">Không có ảnh đính kèm.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                            {attachments.map((att) => {
                                                                const src = resolveFileUrl(att?.fileUrl);
                                                                return (
                                                                    <a key={att.id || src} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                                        <img src={src} alt={`attachment-${att.id || 'x'}`} className="h-24 w-full object-cover" />
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-slate-500">Không có yêu cầu liên kết.</p>
                                    )}
                                </div>
                            </section>
                            <section className="rounded-lg border border-slate-200 p-4 lg:col-span-2">
                                <h2 className="text-sm font-semibold text-slate-900">Timeline nhiệm vụ</h2>
                                <div className="mt-3 space-y-2">
                                    {Array.isArray(detail.timeline) && detail.timeline.length > 0 ? (
                                        detail.timeline.map((t) => (
                                            <div key={t.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                <div className="text-xs font-semibold text-slate-800">{t.eventType || 'EVENT'}</div>
                                                <div className="mt-1 text-xs text-slate-600">{t.note || '—'}</div>
                                                <div className="mt-1 text-[11px] text-slate-500">{t.actorName || 'Hệ thống'} • {fmtDate(t.createdAt)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">Chưa có timeline.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
