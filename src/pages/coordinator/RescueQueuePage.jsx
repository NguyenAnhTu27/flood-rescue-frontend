import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Download,
    Search,
    Calendar,
    Building2,
    Users,
    BarChart3,
    Info,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Filter,
    User,
} from 'lucide-react';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

const KPI_CARDS = [
    {
        id: 'total',
        label: 'Tổng số yêu cầu',
        value: '1,284',
        trend: '+12% so với tháng trước',
        trendUp: true,
        icon: BarChart3,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
    },
    {
        id: 'response',
        label: 'Thời gian phản hồi TB',
        value: '4m 15s',
        trend: '5% nhanh hơn',
        trendUp: false,
        icon: Info,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
    },
    {
        id: 'completion',
        label: 'Tỷ lệ hoàn thành',
        value: '96.8%',
        trend: '2.1% hiệu suất tốt',
        trendUp: true,
        icon: CheckCircle2,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
    },
];

const TIME_OPTIONS = [
    { value: '7', label: '7 ngày qua' },
    { value: '30', label: '30 ngày qua' },
    { value: '90', label: '90 ngày qua' },
];

const AREA_OPTIONS = [
    { value: 'all', label: 'Tất cả các quận' },
    { value: 'q1', label: 'Quận 1' },
    { value: 'q3', label: 'Quận 3' },
    { value: 'q10', label: 'Quận 10' },
];

const TEAM_OPTIONS = [
    { value: 'all', label: 'Tất cả đơn vị' },
    { value: 'team1', label: 'Đội cứu hộ 1' },
    { value: 'team2', label: 'Đội cứu hộ 2' },
];

const STATUS_CONFIG = {
    completed: { label: 'Hoàn thành', dot: 'bg-green-500', text: 'text-green-700' },
    processing: { label: 'Đang xử lý', dot: 'bg-amber-500', text: 'text-amber-700' },
    urgent: { label: 'Khẩn cấp', dot: 'bg-red-500', text: 'text-red-700' },
    archived: { label: 'Lưu trữ', dot: 'bg-slate-400', text: 'text-slate-600' },
};

const MOCK_HISTORY = [
    { id: '1', time: '14/10/2023 14:25:30', action: 'Điều động đội cứu hộ', requestCode: 'REQ-8291', dispatcher: 'Nguyễn Văn Phúc', status: 'completed' },
    { id: '2', time: '14/10/2023 14:10:12', action: 'Xác minh hiện trường', requestCode: 'REQ-8292', dispatcher: 'Lê Minh Tâm', status: 'processing' },
    { id: '3', time: '14/10/2023 13:45:00', action: 'Nâng cấp độ khẩn cấp', requestCode: 'REQ-8280', dispatcher: 'Trần Huy Hoàng', status: 'urgent' },
    { id: '4', time: '14/10/2023 13:30:15', action: 'Bàn giao ca trực', requestCode: null, dispatcher: 'Nguyễn Văn Phúc', status: 'archived' },
    { id: '5', time: '14/10/2023 12:15:00', action: 'Điều động đội cứu hộ', requestCode: 'REQ-8275', dispatcher: 'Lê Minh Tâm', status: 'completed' },
    { id: '6', time: '14/10/2023 11:50:22', action: 'Xác minh hiện trường', requestCode: 'REQ-8270', dispatcher: 'Trần Huy Hoàng', status: 'processing' },
    { id: '7', time: '14/10/2023 10:30:00', action: 'Phân loại ưu tiên', requestCode: 'REQ-8265', dispatcher: 'Nguyễn Văn Phúc', status: 'completed' },
    { id: '8', time: '14/10/2023 09:45:18', action: 'Điều động đội cứu hộ', requestCode: 'REQ-8260', dispatcher: 'Lê Minh Tâm', status: 'completed' },
    { id: '9', time: '14/10/2023 09:00:00', action: 'Bàn giao ca trực', requestCode: null, dispatcher: 'Trần Huy Hoàng', status: 'archived' },
    { id: '10', time: '13/10/2023 18:20:00', action: 'Nâng cấp độ khẩn cấp', requestCode: 'REQ-8255', dispatcher: 'Nguyễn Văn Phúc', status: 'urgent' },
];

const PAGE_SIZE = 10;
const TOTAL_RESULTS = 1284;

export default function RescueQueuePage() {
    const [timeFilter, setTimeFilter] = useState('30');
    const [areaFilter, setAreaFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredHistory = useMemo(() => {
        let list = [...MOCK_HISTORY];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (row) =>
                    (row.requestCode && row.requestCode.toLowerCase().includes(q)) ||
                    (row.dispatcher && row.dispatcher.toLowerCase().includes(q)) ||
                    (row.action && row.action.toLowerCase().includes(q))
            );
        }
        return list;
    }, [searchQuery]);

    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredHistory.slice(start, start + PAGE_SIZE);
    }, [filteredHistory, currentPage]);

    const totalPages = Math.max(1, Math.ceil(TOTAL_RESULTS / PAGE_SIZE));
    const startItem = (currentPage - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(currentPage * PAGE_SIZE, TOTAL_RESULTS);

    const handleExport = () => {
        // TODO: Xuất PDF/Excel
        console.log('[RescueQueuePage] Export report');
    };

    return (
        <div className="space-y-6">
            {/* ===== HEADER + EXPORT ===== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Báo cáo & Lịch sử Điều phối
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Phân tích hiệu suất và tra cứu nhật ký điều phối cứu hộ thời gian thực
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                    <Download className="h-4 w-4" />
                    Xuất báo cáo PDF/Excel
                </button>
            </div>

            {/* ===== KPI CARDS ===== */}
            <div className="grid gap-4 sm:grid-cols-3">
                {KPI_CARDS.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {kpi.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{kpi.value}</p>
                            <p
                                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                                    kpi.trendUp ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                {kpi.trendUp ? (
                                    <TrendingUp className="h-3.5 w-3.5" />
                                ) : (
                                    <TrendingDown className="h-3.5 w-3.5" />
                                )}
                                {kpi.trend}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ===== BỘ LỌC BÁO CÁO ===== */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <h2 className="font-semibold text-slate-900">Bộ lọc báo cáo</h2>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                            Thời gian
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[160px]"
                            >
                                {TIME_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                            Khu vực
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[180px]"
                            >
                                {AREA_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                            Đội cứu hộ
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[160px]"
                            >
                                {TEAM_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        Áp dụng bộ lọc
                    </button>
                </div>
            </div>

            {/* ===== LỊCH SỬ QUYẾT ĐỊNH & ĐIỀU PHỐI ===== */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Lịch sử Quyết định & Điều phối
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Nhật ký chi tiết các hành động nghiệp vụ
                        </p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm ID, Tên điều phối..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Thời gian
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Hành động
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Mã yêu cầu
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Người điều phối
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedList.map((row) => {
                                const statusInfo = STATUS_CONFIG[row.status] || STATUS_CONFIG.archived;
                                return (
                                    <tr
                                        key={row.id}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                    >
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {row.time}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                                                {row.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.requestCode ? (
                                                <Link
                                                    to={`${COORDINATOR_ROUTES.VERIFY_REQUEST}?id=${row.requestCode}`}
                                                    className="text-sm font-medium text-blue-600 underline hover:text-blue-700"
                                                >
                                                    #{row.requestCode}
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-slate-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {row.dispatcher}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${statusInfo.dot}`}
                                                />
                                                <span className={`text-sm font-medium ${statusInfo.text}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION ===== */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
                    <p className="text-sm text-slate-500">
                        Hiển thị {startItem}-{endItem} trên {TOTAL_RESULTS.toLocaleString()} kết quả
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Trước
                        </button>
                        {[1, 2, 3].map((p) => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                                    currentPage === p
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                        <span className="px-1 text-slate-400">...</span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tiếp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
