import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Users, MapPin, Phone } from 'lucide-react';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';
import { getTeams, deleteTeam } from '../../features/teams/api.js';

const ITEMS_PER_PAGE = 10;

export default function TeamsManagementPage() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const loadTeams = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTeams();
            // Parse response format
            let teamsList = [];
            if (Array.isArray(data)) {
                teamsList = data;
            } else if (Array.isArray(data?.content)) {
                teamsList = data.content;
            } else if (Array.isArray(data?.data)) {
                teamsList = data.data;
            } else if (Array.isArray(data?.teams)) {
                teamsList = data.teams;
            }
            setTeams(teamsList);
        } catch (e) {
            console.error('[TeamsManagementPage] load error:', e);
            setError(e?.message || 'Không thể tải danh sách đội cứu hộ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeams();
    }, []);

    const filteredTeams = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter((t) =>
            String(t?.name || '').toLowerCase().includes(q) ||
            String(t?.code || '').toLowerCase().includes(q) ||
            String(t?.leaderName || '').toLowerCase().includes(q)
        );
    }, [teams, search]);

    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTeams.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTeams, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredTeams.length / ITEMS_PER_PAGE));

    const handleDelete = async (teamId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đội cứu hộ này?')) {
            return;
        }
        try {
            await deleteTeam(teamId);
            await loadTeams();
            window.alert('Xóa đội cứu hộ thành công!');
        } catch (e) {
            console.error('[TeamsManagementPage] delete error:', e);
            window.alert(e?.message || 'Không thể xóa đội cứu hộ');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Đội Cứu Hộ</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tạo và quản lý các đội cứu hộ trong hệ thống
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={loadTeams}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm đội cứu hộ..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {/* Teams Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                        <p className="mt-2">Đang tải danh sách đội cứu hộ...</p>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-sm text-rose-600">{error}</div>
                ) : paginatedTeams.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        Chưa có đội cứu hộ nào. Hãy tạo đội mới.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Mã đội
                                        </th>
                                        <th className="pb-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Tên đội
                                        </th>
                                        <th className="pb-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Đội trưởng
                                        </th>
                                        <th className="pb-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Số thành viên
                                        </th>
                                        <th className="pb-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Vị trí
                                        </th>
                                        <th className="pb-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Trạng thái
                                        </th>
                                        <th className="pb-3 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTeams.map((team) => (
                                        <tr
                                            key={team.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                        >
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                                {team.code || `#${team.id}`}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-700">
                                                {team.name || 'Chưa có tên'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {team.leaderName || team.leader?.name || 'Chưa có'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {team.memberCount || team.members?.length || 0} người
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {team.location || team.area || 'Chưa có'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${team.status === 'active' || team.isActive !== false
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {team.status === 'active' || team.isActive !== false
                                                        ? 'Hoạt động'
                                                        : 'Ngừng hoạt động'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`${ADMIN_ROUTES.CREATE_TEAM}?id=${team.id}`)}
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(team.id)}
                                                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                                <p className="text-sm text-slate-500">
                                    Hiển thị {paginatedTeams.length} trên {filteredTeams.length} đội
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ←
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = i + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-8 w-8 rounded-lg text-sm font-medium ${page === currentPage
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
