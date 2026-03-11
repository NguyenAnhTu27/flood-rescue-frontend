import React, { useEffect, useState } from 'react';
import { Lock, RefreshCcw, Unlock } from 'lucide-react';
import { getBlockedCitizens, unblockCitizen } from '../../features/coordinator/api.js';

export default function BlockedCitizensPage() {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState(null);

    const loadBlocked = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getBlockedCitizens();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setItems([]);
            setError(e?.message || 'Không thể tải danh sách citizen đã khóa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlocked();
    }, []);

    const handleUnblock = async (citizen) => {
        const reason = window.prompt('Nhập ghi chú gỡ khóa (không bắt buộc):', '');
        if (reason === null) return;

        try {
            setSavingId(citizen.id);
            await unblockCitizen(citizen.id, reason.trim());
            window.alert('Đã gỡ khóa citizen thành công.');
            await loadBlocked();
        } catch (e) {
            window.alert(e?.message || 'Không thể gỡ khóa citizen.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Citizen Đã Khóa</h1>
                    <p className="mt-1 text-sm text-slate-600">Danh sách các citizen bị khóa gửi yêu cầu cứu hộ.</p>
                </div>
                <button
                    type="button"
                    onClick={loadBlocked}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tải lại
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="p-8 text-center text-sm text-rose-600">{error}</div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">Chưa có citizen nào bị khóa.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Họ tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Điện thoại</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Lý do khóa</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((u) => (
                                    <tr key={u.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">#{u.id}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{u.fullName || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{u.phone || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{u.email || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                                                <Lock className="h-3.5 w-3.5" />
                                                {u.blockedReason || 'Không có mô tả'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                disabled={savingId === u.id}
                                                onClick={() => handleUnblock(u)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                            >
                                                <Unlock className="h-3.5 w-3.5" />
                                                {savingId === u.id ? 'Đang gỡ...' : 'OK - Gỡ khóa'}
                                            </button>
                                        </td>
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
