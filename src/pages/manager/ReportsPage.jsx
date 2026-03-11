import React, { useMemo, useState } from 'react';
import { Clock, Download, Filter, TrendingDown, TrendingUp } from 'lucide-react';

import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';

const MOCK_KPIS = [
    {
        id: 'total-missions',
        label: 'Tổng số yêu cầu',
        value: 1284,
        unit: 'nhiệm vụ',
        delta: '+12% so với tháng trước',
        trend: 'up',
    },
    {
        id: 'avg-response-time',
        label: 'Thời gian phản hồi TB',
        value: '4m 15s',
        unit: '',
        delta: '-5% nhanh hơn',
        trend: 'down',
    },
    {
        id: 'completion-rate',
        label: 'Tỷ lệ hoàn thành',
        value: '96.8%',
        unit: '',
        delta: '+2.4% hiệu suất tốt',
        trend: 'up',
    },
];

const MOCK_FILTERS = {
    timeRange: '30 ngày qua',
    area: 'Tất cả các quận',
    team: 'Tất cả đơn vị',
};

const MOCK_LOGS = [
    {
        id: 1,
        time: '14/10/2023 14:32:30',
        action: 'Điều động đội cứu hộ',
        actionLabel: 'Điều động đội cứu hộ',
        actionVariant: 'primary',
        requestCode: '#REQ-8291',
        requester: 'Nguyễn Văn Phúc',
        status: 'Hoàn thành',
        statusColor: 'green',
    },
    {
        id: 2,
        time: '14/10/2023 14:20:10',
        action: 'Xác minh hiện trường',
        actionLabel: 'Xác minh hiện trường',
        actionVariant: 'warning',
        requestCode: '#REQ-8292',
        requester: 'Lê Minh Tâm',
        status: 'Đang xử lý',
        statusColor: 'blue',
    },
    {
        id: 3,
        time: '14/10/2023 13:50:05',
        action: 'Nâng cấp độ khẩn cấp',
        actionLabel: 'Nâng cấp độ khẩn cấp',
        actionVariant: 'danger',
        requestCode: '#REQ-8288',
        requester: 'Trần Huy Hoàng',
        status: 'Khẩn cấp',
        statusColor: 'red',
    },
    {
        id: 4,
        time: '14/10/2023 13:30:00',
        action: 'Bàn giao ca trực',
        actionLabel: 'Bàn giao ca trực',
        actionVariant: 'default',
        requestCode: 'N/A',
        requester: 'Nguyễn Văn Phúc',
        status: 'Lưu trữ',
        statusColor: 'slate',
    },
];

function TrendPill({ trend, delta }) {
    if (!delta) return null;
    const isUp = trend === 'up';
    const Icon = isUp ? TrendingUp : TrendingDown;
    const color = isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${color}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {delta}
        </span>
    );
}

function StatusPill({ color, label }) {
    const map = {
        green: 'bg-emerald-50 text-emerald-700',
        blue: 'bg-blue-50 text-blue-700',
        red: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-100 text-slate-700',
    };
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color] ||
                map.slate}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    color === 'green'
                        ? 'bg-emerald-500'
                        : color === 'blue'
                        ? 'bg-blue-500'
                        : color === 'red'
                        ? 'bg-rose-500'
                        : 'bg-slate-500'
                }`}
            />
            {label}
        </span>
    );
}

function ActionTag({ variant, label }) {
    const map = {
        primary: 'bg-blue-50 text-blue-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-rose-50 text-rose-700',
        default: 'bg-slate-50 text-slate-700',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[variant] ||
                map.default}`}
        >
            {label}
        </span>
    );
}

export default function ReportsPage() {
    const [filters, setFilters] = useState(MOCK_FILTERS);
    const [search, setSearch] = useState('');

    const filteredLogs = useMemo(() => {
        if (!search) return MOCK_LOGS;
        const keyword = search.toLowerCase();
        return MOCK_LOGS.filter(
            (log) =>
                log.action.toLowerCase().includes(keyword) ||
                log.requestCode.toLowerCase().includes(keyword) ||
                log.requester.toLowerCase().includes(keyword),
        );
    }, [search]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleExport = () => {
        window.alert('Tính năng xuất báo cáo (PDF/Excel) sẽ được tích hợp với backend sau.');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Báo cáo &amp; Lịch sử Điều phối
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Phân tích hiệu suất và tra cứu nhật ký điều phối cứu hộ theo thời gian thực.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            Cập nhật gần nhất:{' '}
                            {new Date().toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                            })}
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
                    >
                        <Download className="h-4 w-4" />
                        Xuất báo cáo PDF/Excel
                    </Button>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {MOCK_KPIS.map((kpi) => (
                    <Card
                        key={kpi.id}
                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                    >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {kpi.label}
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">
                                {typeof kpi.value === 'number'
                                    ? kpi.value.toLocaleString('vi-VN')
                                    : kpi.value}
                            </span>
                            {kpi.unit && (
                                <span className="text-xs font-medium text-slate-500">{kpi.unit}</span>
                            )}
                        </div>
                        <div className="mt-2">
                            <TrendPill trend={kpi.trend} delta={kpi.delta} />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-slate-200 bg-slate-50/80 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Filter className="h-4 w-4 text-slate-500" />
                        Bộ lọc báo cáo
                    </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <div className="space-y-1 text-xs">
                        <p className="font-medium text-slate-600">Thời gian</p>
                        <select
                            value={filters.timeRange}
                            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        >
                            <option>7 ngày qua</option>
                            <option>30 ngày qua</option>
                            <option>3 tháng gần đây</option>
                            <option>12 tháng gần đây</option>
                        </select>
                    </div>
                    <div className="space-y-1 text-xs">
                        <p className="font-medium text-slate-600">Khu vực</p>
                        <select
                            value={filters.area}
                            onChange={(e) => handleFilterChange('area', e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        >
                            <option>Tất cả các quận</option>
                            <option>Quận Hoàn Kiếm</option>
                            <option>Quận Ba Đình</option>
                            <option>Quận Hai Bà Trưng</option>
                        </select>
                    </div>
                    <div className="space-y-1 text-xs">
                        <p className="font-medium text-slate-600">Đội cứu hộ</p>
                        <select
                            value={filters.team}
                            onChange={(e) => handleFilterChange('team', e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        >
                            <option>Tất cả đơn vị</option>
                            <option>Đội Cứu hộ Số 1</option>
                            <option>Đội Cứu hộ Sông Hồng</option>
                            <option>Đội Ứng cứu Khẩn cấp</option>
                        </select>
                    </div>
                    <div className="flex items-end justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            className="inline-flex items-center gap-2 rounded-lg border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
                        >
                            Áp dụng bộ lọc
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Logs table */}
            <Card className="overflow-hidden border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Lịch sử Quyết định &amp; Điều phối
                        </p>
                        <p className="text-xs text-slate-500">
                            Nhật ký chi tiết các hành động nghiệp vụ.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm ID, Tên điều phối..."
                            className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-4 py-2.5 text-left">Thời gian</th>
                                <th className="px-4 py-2.5 text-left">Hành động</th>
                                <th className="px-4 py-2.5 text-left">Mã yêu cầu</th>
                                <th className="px-4 py-2.5 text-left">Người điều phối</th>
                                <th className="px-4 py-2.5 text-left">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-600">
                                        {log.time}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs">
                                        <ActionTag variant={log.actionVariant} label={log.actionLabel} />
                                    </td>
                                    <td className="px-4 py-2.5 text-xs font-medium text-blue-700">
                                        {log.requestCode}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-700">{log.requester}</td>
                                    <td className="px-4 py-2.5 text-xs">
                                        <StatusPill color={log.statusColor} label={log.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                    <span>Hiển thị 1–{filteredLogs.length} trong 1,284 kết quả</span>
                    <div className="flex items-center gap-1 text-xs">
                        <Button variant="ghost" size="sm" className="px-2 py-1 text-xs">
                            Trước
                        </Button>
                        <Button variant="primary" size="sm" className="px-3 py-1 text-xs">
                            1
                        </Button>
                        <Button variant="ghost" size="sm" className="px-2 py-1 text-xs">
                            2
                        </Button>
                        <Button variant="ghost" size="sm" className="px-2 py-1 text-xs">
                            3
                        </Button>
                        <Button variant="ghost" size="sm" className="px-2 py-1 text-xs">
                            Tiếp
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <Badge variant="info" size="sm">
                    i
                </Badge>
                <p>
                    Dữ liệu trên là mock để dựng giao diện. Khi backend sẵn sàng, các bộ lọc và số liệu sẽ
                    được nối trực tiếp với API thống kê.
                </p>
            </div>
        </div>
    );
}

