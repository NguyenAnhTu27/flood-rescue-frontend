import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import {
    addCoordinatorNoteToRescueRequest,
    getCoordinatorRescueQueue,
    prioritizeRescueRequest,
} from '../../features/coordinator/api.js';

function toArray(resp) {
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.content)) return resp.content;
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.items)) return resp.items;
    return [];
}

export default function EscalationPage() {
    const location = useLocation();
    const reqFromState = location.state?.request || null;
    const tgFromState = location.state?.taskGroup || null;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [requests, setRequests] = useState([]);

    const defaultRequestId = reqFromState?.id || tgFromState?.requests?.[0]?.id || null;
    const [requestId, setRequestId] = useState(defaultRequestId ? String(defaultRequestId) : '');
    const [reason, setReason] = useState('Nguy cơ ảnh hưởng tính mạng tăng nhanh tại hiện trường.');
    const [severity, setSeverity] = useState('HIGH');
    const [saving, setSaving] = useState(false);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const [pending, verified, assigned, inProgress] = await Promise.all([
                getCoordinatorRescueQueue({ status: 'PENDING', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'VERIFIED', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'ASSIGNED', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'IN_PROGRESS', page: 0, size: 100 }),
            ]);
            const map = new Map();
            [...toArray(pending), ...toArray(verified), ...toArray(assigned), ...toArray(inProgress)].forEach((r) => {
                if (r?.id) map.set(String(r.id), r);
            });
            setRequests(Array.from(map.values()));
        } catch (e) {
            setRequests([]);
            setError(e?.message || 'Không thể tải dữ liệu để leo thang.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const selected = useMemo(() => requests.find((r) => String(r.id) === String(requestId)) || null, [requests, requestId]);

    const handleEscalate = async () => {
        const id = Number(requestId);
        if (!Number.isFinite(id)) {
            window.alert('Vui lòng chọn yêu cầu cần leo thang.');
            return;
        }

        try {
            setSaving(true);
            const priority = severity === 'HIGH' ? 'HIGH' : 'MEDIUM';
            await prioritizeRescueRequest(id, priority);
            await addCoordinatorNoteToRescueRequest(
                id,
                `[ESCALATION/${severity}] ${reason.trim() || 'Không có lý do chi tiết.'}`
            );
            window.alert('Đã leo thang yêu cầu thành công (ưu tiên + ghi chú đã lưu DB).');
            await loadRequests();
        } catch (e) {
            window.alert(e?.message || 'Không thể leo thang yêu cầu.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leo thang yêu cầu cứu hộ</h1>
                    <p className="mt-1 text-sm text-slate-600">Thực hiện leo thang bằng API thật: cập nhật ưu tiên và lưu ghi chú điều phối.</p>
                </div>
                <button
                    type="button"
                    onClick={loadRequests}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tải lại
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
                {loading ? (
                    <p className="text-sm text-slate-500">Đang tải danh sách yêu cầu...</p>
                ) : error ? (
                    <p className="text-sm text-rose-700">{error}</p>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-700">Yêu cầu cần leo thang</label>
                            <select
                                value={requestId}
                                onChange={(e) => setRequestId(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="">-- Chọn yêu cầu --</option>
                                {requests.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.code || `#${r.id}`} • {r.status} • {r.priority} • {r.addressText || 'Không địa chỉ'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Mức leo thang</label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="HIGH">HIGH</option>
                                <option value="CRITICAL">CRITICAL (vẫn đẩy priority HIGH)</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Ưu tiên sau leo thang</label>
                            <input value="HIGH" readOnly className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-700">Lý do leo thang</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Nhập mô tả rủi ro và lý do cần leo thang"
                            />
                        </div>

                        {selected && (
                            <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <div className="mb-1 inline-flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />Thông tin yêu cầu sẽ leo thang</div>
                                <div>Mã: {selected.code || `#${selected.id}`} • Trạng thái: {selected.status} • Ưu tiên hiện tại: {selected.priority}</div>
                                <div className="mt-1">Địa chỉ: {selected.addressText || '—'}</div>
                            </div>
                        )}

                        <div className="lg:col-span-2">
                            <button
                                type="button"
                                onClick={handleEscalate}
                                disabled={saving || !requestId}
                                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? 'Đang leo thang...' : 'Xác nhận leo thang'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
