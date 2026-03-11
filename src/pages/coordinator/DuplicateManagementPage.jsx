import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CopyCheck, RefreshCcw } from 'lucide-react';
import { getCoordinatorRescueQueue, markDuplicateRescueRequest } from '../../features/coordinator/api.js';

function toArray(resp) {
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.content)) return resp.content;
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.items)) return resp.items;
    return [];
}

export default function DuplicateManagementPage() {
    const location = useLocation();
    const sourceFromState = location.state?.sourceRequest || null;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [requests, setRequests] = useState([]);

    const [sourceId, setSourceId] = useState(sourceFromState?.id ? String(sourceFromState.id) : '');
    const [masterId, setMasterId] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const [pending, verified, assigned, inProgress, duplicate] = await Promise.all([
                getCoordinatorRescueQueue({ status: 'PENDING', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'VERIFIED', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'ASSIGNED', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'IN_PROGRESS', page: 0, size: 100 }),
                getCoordinatorRescueQueue({ status: 'DUPLICATE', page: 0, size: 100 }),
            ]);

            const combined = [...toArray(pending), ...toArray(verified), ...toArray(assigned), ...toArray(inProgress), ...toArray(duplicate)];
            const uniqMap = new Map();
            combined.forEach((r) => {
                if (!r?.id) return;
                uniqMap.set(String(r.id), r);
            });
            setRequests(Array.from(uniqMap.values()));
        } catch (e) {
            setRequests([]);
            setError(e?.message || 'Không thể tải dữ liệu yêu cầu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const selectableMaster = useMemo(() => {
        return requests.filter((r) => String(r.id) !== String(sourceId) && String(r.status || '').toUpperCase() !== 'DUPLICATE');
    }, [requests, sourceId]);

    const duplicateList = useMemo(() => requests.filter((r) => String(r.status || '').toUpperCase() === 'DUPLICATE'), [requests]);

    const handleSubmit = async () => {
        const sid = Number(sourceId);
        const mid = Number(masterId);
        if (!Number.isFinite(sid) || !Number.isFinite(mid)) {
            window.alert('Vui lòng chọn đầy đủ yêu cầu trùng lặp và yêu cầu chính.');
            return;
        }
        if (sid === mid) {
            window.alert('Yêu cầu trùng lặp không được trùng yêu cầu chính.');
            return;
        }

        try {
            setSaving(true);
            await markDuplicateRescueRequest(sid, { masterRequestId: mid, note: note.trim() || undefined });
            window.alert('Đã đánh dấu trùng lặp thành công.');
            setNote('');
            await loadRequests();
        } catch (e) {
            window.alert(e?.message || 'Không thể đánh dấu trùng lặp.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý yêu cầu trùng lặp</h1>
                    <p className="mt-1 text-sm text-slate-600">Thao tác thật với API `POST /rescue/coordinator/requests/{'{id}'}/duplicate`.</p>
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
                    <div className="text-sm text-slate-500">Đang tải danh sách yêu cầu...</div>
                ) : error ? (
                    <div className="text-sm text-rose-700 inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Yêu cầu bị đánh dấu trùng (source)</label>
                            <select
                                value={sourceId}
                                onChange={(e) => setSourceId(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="">-- Chọn yêu cầu --</option>
                                {requests.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.code || `#${r.id}`} • {r.status} • {r.addressText || 'Không địa chỉ'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Yêu cầu chính (master)</label>
                            <select
                                value={masterId}
                                onChange={(e) => setMasterId(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="">-- Chọn yêu cầu chính --</option>
                                {selectableMaster.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.code || `#${r.id}`} • {r.status} • {r.addressText || 'Không địa chỉ'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-700">Ghi chú</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Ví dụ: Cùng địa chỉ, cùng người gọi, tạo trùng trong 2 phút"
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving || !sourceId || !masterId}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CopyCheck className="h-4 w-4" />
                                {saving ? 'Đang lưu...' : 'Đánh dấu trùng lặp'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">Danh sách đã đánh dấu DUPLICATE ({duplicateList.length})</div>
                {duplicateList.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">Chưa có yêu cầu nào ở trạng thái DUPLICATE.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Mã</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Công dân</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Địa chỉ</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Master</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicateList.map((r) => (
                                    <tr key={r.id} className="border-t border-slate-100">
                                        <td className="px-4 py-2 text-sm font-semibold text-slate-900">{r.code || `#${r.id}`}</td>
                                        <td className="px-4 py-2 text-sm text-slate-700">{r.citizenName || '—'} ({r.citizenPhone || '—'})</td>
                                        <td className="px-4 py-2 text-sm text-slate-700">{r.addressText || '—'}</td>
                                        <td className="px-4 py-2 text-sm text-slate-700">{r.masterRequestCode || (r.masterRequestId ? `#${r.masterRequestId}` : '—')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
