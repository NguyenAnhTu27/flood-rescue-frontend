import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Filter, RefreshCcw, Search } from 'lucide-react';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import { getCoordinatorRescueQueue } from '../../features/coordinator/api.js';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'VERIFIED', label: 'VERIFIED' },
    { value: 'ASSIGNED', label: 'ASSIGNED' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
    { value: 'DUPLICATE', label: 'DUPLICATE' },
];

const PRIORITY_OPTIONS = [
    { value: '', label: 'Tất cả mức ưu tiên' },
    { value: 'HIGH', label: 'HIGH' },
    { value: 'MEDIUM', label: 'MEDIUM' },
    { value: 'LOW', label: 'LOW' },
];

function fmtDate(value) {
    if (!value) return '—';
    try {
        const d = new Date(value);
        return d.toLocaleString('vi-VN');
    } catch {
        return String(value);
    }
}

function statusClass(status) {
    const map = {
        PENDING: 'bg-amber-100 text-amber-800',
        VERIFIED: 'bg-blue-100 text-blue-800',
        ASSIGNED: 'bg-indigo-100 text-indigo-800',
        IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
        COMPLETED: 'bg-emerald-100 text-emerald-800',
        CANCELLED: 'bg-rose-100 text-rose-800',
        DUPLICATE: 'bg-slate-200 text-slate-700',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
}

function priorityClass(priority) {
    const map = {
        HIGH: 'bg-rose-100 text-rose-700',
        MEDIUM: 'bg-amber-100 text-amber-700',
        LOW: 'bg-emerald-100 text-emerald-700',
    };
    return map[priority] || 'bg-slate-100 text-slate-700';
}

export default function RescueQueuePage() {
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const resp = await getCoordinatorRescueQueue({
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                keyword: submittedKeyword || undefined,
                page: page - 1,
                size: PAGE_SIZE,
            });

            const content = Array.isArray(resp?.content) ? resp.content : Array.isArray(resp) ? resp : [];
            setRows(content);
            setTotalPages(Math.max(1, Number(resp?.totalPages || 1)));
            setTotalElements(Number(resp?.totalElements || content.length || 0));
        } catch (e) {
            setRows([]);
            setTotalPages(1);
            setTotalElements(0);
            setError(e?.message || 'Không thể tải danh sách yêu cầu từ hệ thống.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, priorityFilter, submittedKeyword, page]);

    const stats = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                const s = String(r.status || '').toUpperCase();
                if (s === 'PENDING') acc.pending += 1;
                if (s === 'IN_PROGRESS') acc.inProgress += 1;
                if (s === 'COMPLETED') acc.completed += 1;
                return acc;
            },
            { pending: 0, inProgress: 0, completed: 0 }
        );
    }, [rows]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        setSubmittedKeyword(keyword.trim());
    };

    const handleResetFilters = () => {
        setStatusFilter('');
        setPriorityFilter('');
        setKeyword('');
        setSubmittedKeyword('');
        setPage(1);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách yêu cầu cứu hộ</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Dữ liệu lấy trực tiếp từ database qua API điều phối viên.
                    </p>
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

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">PENDING (trang hiện tại)</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">IN_PROGRESS (trang hiện tại)</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-700">{stats.inProgress}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Tổng kết quả lọc</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">{totalElements}</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Filter className="h-4 w-4" />
                    Bộ lọc
                </div>
                <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm theo mã, tên công dân, số điện thoại..."
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => {
                            setPriorityFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                        {PRIORITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button type="submit" className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                            Lọc
                        </button>
                        <button type="button" onClick={handleResetFilters} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-10 text-center text-slate-500">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="p-10 text-center text-rose-600">
                        <div className="mb-2 inline-flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />Lỗi tải dữ liệu</div>
                        <div className="text-sm">{error}</div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">Không có yêu cầu phù hợp.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mã</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Công dân</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Địa chỉ</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Số người</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Khẩn cấp</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Ưu tiên</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tạo lúc</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-t border-slate-100 align-top">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{r.code || `#${r.id}`}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            <div>{r.citizenName || '—'}</div>
                                            <div className="text-xs text-slate-500">{r.citizenPhone || '—'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.addressText || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.affectedPeopleCount ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {r.emergency ? (
                                                <div className="space-y-1">
                                                    <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                                        #{r.emergencyNo || 1}
                                                    </span>
                                                    {String(r.emergencyActionStatus || '').toUpperCase() === 'WAITING_OVERLOAD' && (
                                                        <div className="text-[11px] font-semibold text-amber-700">ĐANG ĐỢI (QUÁ TẢI)</div>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(r.priority)}`}>
                                                {r.priority || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(r.status)}`}>
                                                {Boolean(r.waitingForTeam) ? 'CHỜ CÓ ĐỘI' : (r.status || '—')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{fmtDate(r.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`${COORDINATOR_ROUTES.VERIFY_REQUEST}?id=${r.id}`, { state: { request: r } })}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Xác minh
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(COORDINATOR_ROUTES.PRIORITIZE_REQUEST, { state: { request: r } })}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Phân loại
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(COORDINATOR_ROUTES.DUPLICATE_MANAGEMENT, { state: { sourceRequest: r } })}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Trùng lặp
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
                    <p className="text-sm text-slate-500">Trang {page}/{totalPages} • Tổng {totalElements} bản ghi</p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Tiếp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
