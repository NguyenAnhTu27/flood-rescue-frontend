import React, { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Search,
    ShieldAlert,
    Users,
} from 'lucide-react';

import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';

const MOCK_TEAMS = [
    { id: 'T-01', name: 'Đội Cơ Động 01', status: 'ON_MISSION', memberCount: 8, capacity: 2, currentArea: 'Quận Bình Thạnh' },
    { id: 'T-02', name: 'Đội Cứu Hộ Đường Thủy 02', status: 'AVAILABLE', memberCount: 6, capacity: 3, currentArea: 'Quận 7' },
    { id: 'T-03', name: 'Đội Phản Ứng Nhanh 03', status: 'ON_MISSION', memberCount: 7, capacity: 2, currentArea: 'TP. Thủ Đức' },
    { id: 'T-04', name: 'Đội Hậu Cần 04', status: 'BUSY', memberCount: 5, capacity: 1, currentArea: 'Bình Chánh' },
];

const MOCK_TASK_GROUPS = [
    {
        id: 'TG-2201',
        code: 'TG-2201',
        status: 'IN_PROGRESS',
        assignedTeamId: 'T-01',
        priority: 'HIGH',
        rescueRequestIds: ['RRQ-1012', 'RRQ-1015'],
        requestCount: 2,
        peopleCount: 5,
        areaText: 'Phường 25, Quận Bình Thạnh',
        etaMinutes: 18,
    },
    {
        id: 'TG-2202',
        code: 'TG-2202',
        status: 'ASSIGNED',
        assignedTeamId: 'T-01',
        priority: 'MEDIUM',
        rescueRequestIds: ['RRQ-1021'],
        requestCount: 1,
        peopleCount: 3,
        areaText: 'Phường 2, Quận Bình Thạnh',
        etaMinutes: 26,
    },
    {
        id: 'TG-2203',
        code: 'TG-2203',
        status: 'NEW',
        assignedTeamId: 'T-03',
        priority: 'HIGH',
        rescueRequestIds: ['RRQ-1038', 'RRQ-1039', 'RRQ-1040'],
        requestCount: 3,
        peopleCount: 9,
        areaText: 'Linh Trung, TP. Thủ Đức',
        etaMinutes: 34,
    },
    {
        id: 'TG-2204',
        code: 'TG-2204',
        status: 'DONE',
        assignedTeamId: 'T-04',
        priority: 'LOW',
        rescueRequestIds: ['RRQ-0999'],
        requestCount: 1,
        peopleCount: 2,
        areaText: 'Xã Vĩnh Lộc B, Bình Chánh',
        etaMinutes: 0,
    },
];

const ACTIVE_TASK_STATUSES = new Set(['NEW', 'ASSIGNED', 'IN_PROGRESS']);

function getTeamStatusMeta(status) {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'AVAILABLE') return { label: 'Rảnh', variant: 'success' };
    if (normalized === 'ON_MISSION') return { label: 'Đang nhiệm vụ', variant: 'warning' };
    if (normalized === 'BUSY') return { label: 'Bận', variant: 'warning' };
    if (normalized === 'MAINTENANCE') return { label: 'Bảo trì', variant: 'error' };
    return { label: normalized || 'Không rõ', variant: 'default' };
}

function getPriorityMeta(priority) {
    const normalized = (priority || '').toUpperCase();
    if (normalized === 'HIGH') return { label: 'Cao', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (normalized === 'LOW') return { label: 'Thấp', className: 'bg-slate-50 text-slate-700 border-slate-200' };
    return { label: 'Trung bình', className: 'bg-amber-50 text-amber-700 border-amber-200' };
}

function formatPercent(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return `${Math.max(0, Math.min(100, Math.round(safe)))}%`;
}

export default function TeamWorkloadPage() {
    const [teams, setTeams] = useState(MOCK_TEAMS);
    const [taskGroups, setTaskGroups] = useState(MOCK_TASK_GROUPS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedTeamId, setSelectedTeamId] = useState('');

    const loadData = () => {
        setLoading(true);
        setError('');
        setTeams(MOCK_TEAMS);
        setTaskGroups(MOCK_TASK_GROUPS);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const workloadRows = useMemo(() => {
        return teams.map((team) => {
            const teamTasks = taskGroups.filter((task) => String(task.assignedTeamId) === String(team.id));
            const activeTasks = teamTasks.filter((task) => ACTIVE_TASK_STATUSES.has(String(task.status).toUpperCase()));

            const capacity = team.capacity > 0 ? team.capacity : 1;
            const loadPercent = (activeTasks.length / capacity) * 100;
            const overload = activeTasks.length > capacity;

            const avgEta = activeTasks.length > 0
                ? Math.round(
                    activeTasks.reduce((sum, task) => sum + (task.etaMinutes > 0 ? task.etaMinutes : 0), 0) /
                    activeTasks.length,
                )
                : 0;

            const totalPeople = activeTasks.reduce((sum, task) => sum + (task.peopleCount || 0), 0);

            return {
                ...team,
                tasks: teamTasks,
                activeTasks,
                activeTaskCount: activeTasks.length,
                doneTaskCount: teamTasks.filter((task) => String(task.status).toUpperCase() === 'DONE').length,
                overload,
                loadPercent,
                avgEta,
                totalPeople,
            };
        });
    }, [teams, taskGroups]);

    const filteredRows = useMemo(() => {
        return workloadRows.filter((row) => {
            const keywordMatched = !search
                || row.name.toLowerCase().includes(search.toLowerCase())
                || row.currentArea.toLowerCase().includes(search.toLowerCase());

            if (!keywordMatched) return false;

            if (statusFilter === 'ALL') return true;
            if (statusFilter === 'OVERLOAD') return row.overload;
            return String(row.status).toUpperCase() === statusFilter;
        });
    }, [workloadRows, search, statusFilter]);

    const selectedRow = useMemo(() => {
        if (!selectedTeamId && filteredRows.length > 0) return filteredRows[0];
        return filteredRows.find((row) => String(row.id) === String(selectedTeamId)) || null;
    }, [filteredRows, selectedTeamId]);

    useEffect(() => {
        if (filteredRows.length === 0) {
            setSelectedTeamId('');
            return;
        }

        const stillVisible = filteredRows.some((row) => String(row.id) === String(selectedTeamId));
        if (!stillVisible) {
            setSelectedTeamId(String(filteredRows[0].id));
        }
    }, [filteredRows, selectedTeamId]);

    const summary = useMemo(() => {
        const totalTeams = workloadRows.length;
        const overloadedTeams = workloadRows.filter((row) => row.overload).length;
        const activeTasks = workloadRows.reduce((sum, row) => sum + row.activeTaskCount, 0);

        const avgLoad = totalTeams > 0
            ? workloadRows.reduce((sum, row) => sum + row.loadPercent, 0) / totalTeams
            : 0;

        return {
            totalTeams,
            overloadedTeams,
            activeTasks,
            avgLoad,
        };
    }, [workloadRows]);

    return (
        <div className="flex flex-col gap-4 pb-10">
            <Card className="border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Theo dõi tải công việc đội cứu hộ</h1>
                        <p className="mt-1 text-xs text-slate-600">
                            Giám sát mức tải theo đội để cân bằng phân công trước khi quá tải.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={loadData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Đang tải...' : 'Làm mới'}
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Card variant="outlined" className="p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span>Tổng đội</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900">{summary.totalTeams}</div>
                    </Card>

                    <Card variant="outlined" className="p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <span>Nhiệm vụ đang xử lý</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900">{summary.activeTasks}</div>
                    </Card>

                    <Card variant="outlined" className="p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldAlert className="h-4 w-4 text-rose-600" />
                            <span>Đội quá tải</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-rose-600">{summary.overloadedTeams}</div>
                    </Card>

                    <Card variant="outlined" className="p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="h-4 w-4 text-emerald-600" />
                            <span>Tải trung bình</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-emerald-600">{formatPercent(summary.avgLoad)}</div>
                    </Card>
                </div>

                {error && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        {error}
                    </div>
                )}
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <Card className="overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                            <label className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên đội hoặc khu vực..."
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="AVAILABLE">Rảnh</option>
                                <option value="ON_MISSION">Đang nhiệm vụ</option>
                                <option value="BUSY">Bận</option>
                                <option value="OVERLOAD">Chỉ đội quá tải</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50/60 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Đội cứu hộ</th>
                                    <th className="px-4 py-3 text-left">Trạng thái</th>
                                    <th className="px-4 py-3 text-center">Nhiệm vụ</th>
                                    <th className="px-4 py-3 text-center">Tải đội</th>
                                    <th className="px-4 py-3 text-center">ETA TB</th>
                                    <th className="px-4 py-3 text-center">Người hỗ trợ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Không có dữ liệu phù hợp bộ lọc.
                                        </td>
                                    </tr>
                                )}

                                {filteredRows.map((row) => {
                                    const statusMeta = getTeamStatusMeta(row.status);
                                    const isSelected = selectedRow && String(selectedRow.id) === String(row.id);

                                    return (
                                        <tr
                                            key={row.id}
                                            className={`cursor-pointer transition hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/60' : ''}`}
                                            onClick={() => setSelectedTeamId(String(row.id))}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">{row.name}</div>
                                                <div className="text-xs text-slate-500">{row.currentArea}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={statusMeta.variant} size="sm">{statusMeta.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="font-semibold text-slate-900">
                                                    {row.activeTaskCount}/{row.capacity > 0 ? row.capacity : 1}
                                                </div>
                                                <div className="text-[11px] text-slate-500">xong: {row.doneTaskCount}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className={`font-semibold ${row.overload ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {formatPercent(row.loadPercent)}
                                                </div>
                                                <div className="mx-auto mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${row.overload ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: formatPercent(row.loadPercent) }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                                                {row.avgEta > 0 ? `${row.avgEta} phút` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                                                {row.totalPeople}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="flex flex-col overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Chi tiết đội đang chọn</h2>
                        <p className="mt-1 text-xs text-slate-500">Theo dõi các task group và cảnh báo quá tải.</p>
                    </div>

                    {!selectedRow ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                            Chọn một đội để xem chi tiết workload.
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col gap-3 px-4 py-4">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{selectedRow.name}</div>
                                        <div className="mt-1 text-xs text-slate-500">{selectedRow.currentArea}</div>
                                    </div>
                                    <Badge
                                        variant={selectedRow.overload ? 'error' : 'success'}
                                        size="sm"
                                    >
                                        {selectedRow.overload ? 'Quá tải' : 'Ổn định'}
                                    </Badge>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="rounded-md bg-slate-50 px-2 py-2">
                                        <div className="text-slate-500">Thành viên</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.memberCount}</div>
                                    </div>
                                    <div className="rounded-md bg-slate-50 px-2 py-2">
                                        <div className="text-slate-500">Tải hiện tại</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(selectedRow.loadPercent)}</div>
                                    </div>
                                    <div className="rounded-md bg-slate-50 px-2 py-2">
                                        <div className="text-slate-500">ETA TB</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedRow.avgEta > 0 ? `${selectedRow.avgEta}p` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 overflow-y-auto pr-1">
                                {selectedRow.activeTasks.length === 0 && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                                        Đội này hiện chưa có nhiệm vụ đang hoạt động.
                                    </div>
                                )}

                                {selectedRow.activeTasks.map((task) => {
                                    const priorityMeta = getPriorityMeta(task.priority);
                                    return (
                                        <div key={task.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900">{task.code}</div>
                                                    <div className="mt-1 text-[11px] text-slate-500">{task.areaText}</div>
                                                </div>
                                                <Badge outline size="sm" className={priorityMeta.className}>
                                                    {priorityMeta.label}
                                                </Badge>
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                                    {task.requestCount} yêu cầu
                                                </span>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                                    {task.peopleCount} người
                                                </span>
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                                                    ETA {task.etaMinutes > 0 ? `${task.etaMinutes}p` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedRow.overload && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>
                                            <div className="font-semibold">Cảnh báo quá tải</div>
                                            <p className="mt-0.5">
                                                Đội đang vượt công suất, cân nhắc điều chuyển bớt task group để giảm thời gian phản hồi.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">
                                <Button type="button" variant="outline" size="sm" className="flex-1">
                                    Xem lịch sử đội
                                </Button>
                                <Button type="button" variant="primary" size="sm" className="flex-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Cân bằng phân công
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
