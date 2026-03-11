import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCcw, Users } from 'lucide-react';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import { getTaskGroups } from '../../features/coordinator/api.js';
import { getTeams } from '../../features/teams/api.js';

function toArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

export default function TeamWorkloadPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);
    const [taskGroups, setTaskGroups] = useState([]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [teamsResp, tasksResp] = await Promise.all([
                getTeams(),
                getTaskGroups({ page: 0, size: 500 }),
            ]);
            setTeams(toArray(teamsResp));
            setTaskGroups(toArray(tasksResp));
        } catch (e) {
            setTeams([]);
            setTaskGroups([]);
            setError(e?.message || 'Không thể tải dữ liệu đội cứu hộ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const rows = useMemo(() => {
        const activeStatus = new Set(['NEW', 'ASSIGNED', 'IN_PROGRESS']);

        return teams.map((t) => {
            const assigned = taskGroups.filter((g) => Number(g.assignedTeamId) === Number(t.id));
            const inRescue = assigned.filter((g) => String(g.status || '').toUpperCase() === 'IN_PROGRESS').length;
            const active = assigned.filter((g) => activeStatus.has(String(g.status || '').toUpperCase())).length;
            const done = assigned.filter((g) => String(g.status || '').toUpperCase() === 'DONE').length;
            const cancelled = assigned.filter((g) => String(g.status || '').toUpperCase() === 'CANCELLED').length;

            return {
                id: t.id,
                code: t.code,
                name: t.name || `Team #${t.id}`,
                leader: t.leaderName || t.teamLeaderName || 'Chưa có',
                memberCount: Number(t.memberCount || t.members?.length || 0),
                inRescue,
                workloadStatus: inRescue > 0 ? 'ĐANG ĐI CỨU HỘ' : 'ĐANG RẢNH',
                active,
                done,
                cancelled,
                total: assigned.length,
            };
        });
    }, [teams, taskGroups]);

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.teams += 1;
                acc.active += r.active;
                acc.done += r.done;
                return acc;
            },
            { teams: 0, active: 0, done: 0 }
        );
    }, [rows]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Theo dõi tải công việc đội cứu hộ</h1>
                    <p className="mt-1 text-sm text-slate-600">Số liệu tổng hợp trực tiếp từ database (teams + task-groups).</p>
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tải lại
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Tổng số đội</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{totals.teams}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Nhiệm vụ đang hoạt động</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-700">{totals.active}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Nhiệm vụ đã hoàn tất</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{totals.done}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-10 text-center text-slate-500">Đang tải dữ liệu đội...</div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-700">
                        <div className="mb-2 inline-flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />Lỗi tải dữ liệu</div>
                        <div className="text-sm">{error}</div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">Chưa có đội cứu hộ nào trong hệ thống.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Đội</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Đội trưởng</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Thành viên</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Trạng thái hiện tại</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Đang hoạt động</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Hoàn tất</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Hủy</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tổng nhiệm vụ</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                            {r.name}
                                            <div className="text-xs font-normal text-slate-500">{r.code || `ID ${r.id}`}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.leader}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700 inline-flex items-center gap-1"><Users className="h-4 w-4" />{r.memberCount}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.inRescue > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {r.workloadStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-cyan-700">{r.active}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{r.done}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-rose-700">{r.cancelled}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.total}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`${COORDINATOR_ROUTES.TASK_MONITOR}?teamId=${r.id}`, {
                                                        state: { teamId: r.id, teamName: r.name },
                                                    })
                                                }
                                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Xem nhiệm vụ
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
