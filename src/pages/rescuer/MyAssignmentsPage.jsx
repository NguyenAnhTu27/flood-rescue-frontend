import React, { useEffect, useMemo, useState } from 'react';
import { Clock, RefreshCcw, X } from 'lucide-react';
import { getRescuerTaskGroupById, getRescuerTaskGroups } from '../../features/rescuer/api.js';
import { getReliefRequest, getRescuerReliefRequests } from '../../features/relief/api.js';

function toArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

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

function prettifyKey(key) {
    if (!key) return '—';
    return String(key)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (s) => s.toUpperCase());
}

function formatDetailValue(key, value) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (typeof value === 'number') {
        if (String(key).toLowerCase().includes('latitude') || String(key).toLowerCase().includes('longitude')) {
            return value.toFixed(6);
        }
        return String(value);
    }
    if (typeof value === 'string') {
        const lowerKey = String(key || '').toLowerCase();
        if (lowerKey.includes('at') && value.includes('T')) {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString('vi-VN');
        }
        return value;
    }
    return String(value);
}

export default function MyAssignmentsPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [timeSort, setTimeSort] = useState('desc');
    const [taskGroups, setTaskGroups] = useState([]);
    const [reliefRequests, setReliefRequests] = useState([]);
    const [detailModal, setDetailModal] = useState({
        open: false,
        title: '',
        type: '',
        data: null,
        loading: false,
        error: '',
    });

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError('');
            const resp = await getRescuerTaskGroups({
                status: statusFilter || undefined,
                page: 0,
                size: 100,
            });
            setTaskGroups(toArray(resp));
            const reliefResp = await getRescuerReliefRequests({ page: 0, size: 100 });
            setReliefRequests(toArray(reliefResp));
        } catch (e) {
            setTaskGroups([]);
            setReliefRequests([]);
            setError(e?.message || 'Không thể tải danh sách nhiệm vụ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const counts = useMemo(() => {
        const acc = { total: taskGroups.length, active: 0, done: 0 };
        for (const g of taskGroups) {
            const s = String(g?.status || '').toUpperCase();
            if (['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(s)) acc.active += 1;
            if (s === 'DONE') acc.done += 1;
        }
        return acc;
    }, [taskGroups]);

    const toTime = (item) => {
        const ts = new Date(item?.updatedAt || item?.createdAt || 0).getTime();
        return Number.isFinite(ts) ? ts : 0;
    };

    const sortedTaskGroups = useMemo(() => {
        const list = [...taskGroups];
        list.sort((a, b) => (timeSort === 'asc' ? toTime(a) - toTime(b) : toTime(b) - toTime(a)));
        return list;
    }, [taskGroups, timeSort]);

    const sortedReliefRequests = useMemo(() => {
        const list = [...reliefRequests];
        list.sort((a, b) => (timeSort === 'asc' ? toTime(a) - toTime(b) : toTime(b) - toTime(a)));
        return list;
    }, [reliefRequests, timeSort]);

    const openTaskGroupDetail = async (item) => {
        setDetailModal({
            open: true,
            title: `Chi tiết yêu cầu cứu hộ ${item?.code || `TG-${item?.id}`}`,
            type: 'rescue',
            data: item || null,
            loading: true,
            error: '',
        });
        try {
            const detail = await getRescuerTaskGroupById(item.id);
            setDetailModal((prev) => ({ ...prev, loading: false, data: detail || item || null }));
        } catch (e) {
            setDetailModal((prev) => ({
                ...prev,
                loading: false,
                error: e?.message || 'Không thể tải chi tiết yêu cầu cứu hộ.',
                data: item || null,
            }));
        }
    };

    const openReliefRequestDetail = async (item) => {
        setDetailModal({
            open: true,
            title: `Chi tiết yêu cầu cứu trợ ${item?.code || `#${item?.id}`}`,
            type: 'relief',
            data: item || null,
            loading: true,
            error: '',
        });
        try {
            const detail = await getReliefRequest(item.id);
            setDetailModal((prev) => ({ ...prev, loading: false, data: detail || item || null }));
        } catch (e) {
            setDetailModal((prev) => ({
                ...prev,
                loading: false,
                error: e?.message || 'Không thể tải chi tiết yêu cầu cứu trợ.',
                data: item || null,
            }));
        }
    };

    const closeDetailModal = () => {
        setDetailModal({
            open: false,
            title: '',
            type: '',
            data: null,
            loading: false,
            error: '',
        });
    };

    const renderNestedData = (value, keyPrefix = '') => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <div className="text-xs text-slate-500">Không có dữ liệu.</div>;
            }
            return (
                <div className="space-y-2">
                    {value.map((item, idx) => (
                        <div key={`${keyPrefix}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            {item && typeof item === 'object' ? (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {Object.entries(item).map(([k, v]) => (
                                        <div key={`${keyPrefix}-${idx}-${k}`} className="rounded-md bg-white px-3 py-2">
                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{prettifyKey(k)}</div>
                                            <div className="mt-1 text-sm text-slate-800">
                                                {v && typeof v === 'object'
                                                    ? <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(v, null, 2)}</pre>
                                                    : formatDetailValue(k, v)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-slate-800">{formatDetailValue('', item)}</div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (value && typeof value === 'object') {
            return (
                <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(value).map(([k, v]) => (
                        <div key={`${keyPrefix}-${k}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{prettifyKey(k)}</div>
                            <div className="mt-1 text-sm text-slate-800">
                                {v && typeof v === 'object'
                                    ? <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(v, null, 2)}</pre>
                                    : formatDetailValue(k, v)}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="text-sm text-slate-800">{formatDetailValue(keyPrefix, value)}</div>;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Lịch sử cứu hộ và cứu trợ</h1>
                    <p className="mt-1 text-sm text-slate-600">Dữ liệu lấy trực tiếp từ database qua API rescuer/task-groups và relief requests.</p>
                </div>
                <button
                    type="button"
                    onClick={loadTasks}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tải lại
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Tổng nhiệm vụ</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{counts.total}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Đang thực hiện</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{counts.active}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Hoàn thành</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.done}</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Lọc trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                        >
                            <option value="">Tất cả</option>
                            <option value="NEW">NEW</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="DONE">DONE</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sắp xếp thời gian</label>
                        <select
                            value={timeSort}
                            onChange={(e) => setTimeSort(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                        >
                            <option value="desc">Mới cập nhật trước</option>
                            <option value="asc">Cũ cập nhật trước</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="p-8 text-center text-sm text-rose-700">{error}</div>
                ) : sortedTaskGroups.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">Không có nhiệm vụ nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mã nhiệm vụ</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Đội</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTaskGroups.map((g) => (
                                    <tr
                                        key={g.id}
                                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                                        onClick={() => openTaskGroupDetail(g)}
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{g.code || `TG-${g.id}`}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{g.assignedTeamName || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(g.status)}`}>
                                                {g.status || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 inline-flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {fmtDate(g.updatedAt || g.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Yêu cầu cứu trợ được giao cho đội</h2>
                </div>
                {loading ? (
                    <div className="p-6 text-sm text-slate-500">Đang tải...</div>
                ) : sortedReliefRequests.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">Chưa có yêu cầu cứu trợ nào được giao.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mã yêu cầu</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Khu vực</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Trạng thái cứu trợ</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cập nhật cuối</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedReliefRequests.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                                        onClick={() => openReliefRequestDetail(r)}
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{r.code || `#${r.id}`}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.targetArea || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.deliveryStatus || 'MANAGER_APPROVED'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{fmtDate(r.updatedAt || r.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {detailModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{detailModal.title}</h3>
                                <p className="text-xs text-slate-500">
                                    {detailModal.type === 'rescue' ? 'Yêu cầu cứu hộ' : 'Yêu cầu cứu trợ'} - hiển thị toàn bộ thông tin
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDetailModal}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <X className="h-4 w-4" />
                                Đóng
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-78px)] overflow-auto p-5">
                            {detailModal.loading && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Đang tải chi tiết...</div>
                            )}

                            {!detailModal.loading && detailModal.error && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{detailModal.error}</div>
                            )}

                            {!detailModal.loading && detailModal.data && (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {['code', 'status', 'deliveryStatus', 'priority', 'citizenName', 'citizenPhone', 'addressText', 'targetArea', 'createdAt', 'updatedAt']
                                            .filter((k) => detailModal.data?.[k] !== undefined)
                                            .map((k) => (
                                                <div key={`summary-${k}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{prettifyKey(k)}</div>
                                                    <div className="mt-1 text-sm font-medium text-slate-900">
                                                        {formatDetailValue(k, detailModal.data[k])}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    <div className="rounded-lg border border-slate-200">
                                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Chi tiết đầy đủ
                                        </div>
                                        <div className="space-y-3 p-4">
                                            {Object.entries(detailModal.data).map(([key, value]) => (
                                                <div key={key} className="rounded-lg border border-slate-200 p-3">
                                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{prettifyKey(key)}</div>
                                                    {renderNestedData(value, key)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
