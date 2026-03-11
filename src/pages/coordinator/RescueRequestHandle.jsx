import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    RefreshCcw,
    Search,
} from 'lucide-react';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import { getTaskGroupById, getTaskGroups } from '../../features/coordinator/api.js';

const STATUS_FILTERS = [
    { label: 'Tất cả', value: '' },
    { label: 'NEW', value: 'NEW' },
    { label: 'ASSIGNED', value: 'ASSIGNED' },
    { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'CANCELLED', value: 'CANCELLED' },
];

function toArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function toNumberOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function fmtDate(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return String(value);
    }
}

function badgeClass(status) {
    const map = {
        NEW: 'bg-amber-100 text-amber-800',
        ASSIGNED: 'bg-indigo-100 text-indigo-800',
        IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
        DONE: 'bg-emerald-100 text-emerald-800',
        CANCELLED: 'bg-rose-100 text-rose-800',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
}

const TIMELINE_STEPS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE'];

function stepClass(step, currentStatus) {
    const currentIndex = TIMELINE_STEPS.indexOf(String(currentStatus || '').toUpperCase());
    const stepIndex = TIMELINE_STEPS.indexOf(step);
    if (currentStatus === 'CANCELLED') return 'bg-slate-200 text-slate-500';
    if (stepIndex < currentIndex) return 'bg-emerald-500 text-white';
    if (stepIndex === currentIndex) return 'bg-blue-600 text-white';
    return 'bg-slate-200 text-slate-600';
}

export default function RescueRequestHandle() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [statusFilter, setStatusFilter] = useState('');
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [taskGroups, setTaskGroups] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const teamIdFromQuery = toNumberOrNull(searchParams.get('teamId'));
    const teamIdFromState = toNumberOrNull(location.state?.teamId);
    const preferredTaskGroupId = toNumberOrNull(location.state?.selectedTaskGroupId);
    const selectedTeamId = teamIdFromQuery ?? teamIdFromState;
    const selectedTeamName = location.state?.teamName || null;

    const loadGroups = async () => {
        try {
            setLoading(true);
            setError('');
            const resp = await getTaskGroups({ status: statusFilter || undefined, page: 0, size: 100 });
            const content = toArray(resp);
            const byTeam = selectedTeamId
                ? content.filter((g) => Number(g?.assignedTeamId) === Number(selectedTeamId))
                : content;
            const visible = selectedTeamId
                ? byTeam.filter((g) => ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE'].includes(String(g?.status || '').toUpperCase()))
                : statusFilter
                    ? byTeam
                    : byTeam.filter((g) => !['DONE', 'CANCELLED'].includes(String(g?.status || '').toUpperCase()));
            const filtered = submittedKeyword
                ? visible.filter((g) =>
                      [g.code, g.assignedTeamName, g.note].some((v) =>
                          String(v || '')
                              .toLowerCase()
                              .includes(submittedKeyword.toLowerCase())
                      )
                  )
                : visible;

            setTaskGroups(filtered);
            if (filtered.length > 0) {
                const preferredId = preferredTaskGroupId && filtered.some((g) => Number(g.id) === Number(preferredTaskGroupId))
                    ? preferredTaskGroupId
                    : null;
                const nextId = preferredId || (selectedId && filtered.some((g) => g.id === selectedId) ? selectedId : filtered[0].id);
                setSelectedId(nextId);
            } else {
                setSelectedId(null);
                setDetail(null);
            }
        } catch (e) {
            setTaskGroups([]);
            setSelectedId(null);
            setDetail(null);
            setError(e?.message || 'Không thể tải danh sách nhiệm vụ.');
        } finally {
            setLoading(false);
        }
    };

    const loadDetail = async (id) => {
        if (!id) return;
        try {
            setDetailLoading(true);
            const resp = await getTaskGroupById(id);
            setDetail(resp);
        } catch (e) {
            setDetail(null);
            setError(e?.message || 'Không thể tải chi tiết nhiệm vụ.');
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, submittedKeyword, selectedTeamId, preferredTaskGroupId]);

    useEffect(() => {
        if (selectedId) loadDetail(selectedId);
    }, [selectedId]);

    const activeTaskGroups = useMemo(
        () => taskGroups.filter((g) => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(String(g?.status || '').toUpperCase())),
        [taskGroups]
    );
    const doneTaskGroups = useMemo(
        () => taskGroups.filter((g) => String(g?.status || '').toUpperCase() === 'DONE'),
        [taskGroups]
    );

    const handleSearch = (e) => {
        e.preventDefault();
        setSubmittedKeyword(keyword.trim());
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex w-[350px] shrink-0 flex-col border-r border-slate-200">
                <div className="border-b border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">
                            {selectedTeamId ? `Nhiệm vụ của đội ${selectedTeamName || `#${selectedTeamId}`}` : 'Giám sát nhiệm vụ'}
                        </h2>
                        <button type="button" onClick={loadGroups} className="rounded-lg p-1.5 hover:bg-slate-100" title="Tải lại">
                            <RefreshCcw className="h-4 w-4 text-slate-600" />
                        </button>
                    </div>
                    <form onSubmit={handleSearch} className="space-y-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm mã nhóm, đội..."
                                className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            {!selectedTeamId && (
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
                                >
                                    {STATUS_FILTERS.map((f) => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            )}
                            <button type="submit" className="h-10 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">Lọc</button>
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-6 text-center text-sm text-slate-500">Đang tải...</div>
                    ) : taskGroups.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">Không có nhóm nhiệm vụ.</div>
                    ) : selectedTeamId ? (
                        <div className="space-y-3 p-3">
                            <div>
                                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                                    Nhiệm vụ đang làm ({activeTaskGroups.length})
                                </div>
                                <div className="overflow-hidden rounded-lg border border-cyan-100">
                                    {activeTaskGroups.length === 0 ? (
                                        <div className="p-3 text-xs text-slate-500">Không có nhiệm vụ đang làm.</div>
                                    ) : (
                                        activeTaskGroups.map((g) => {
                                            const active = selectedId === g.id;
                                            return (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => setSelectedId(g.id)}
                                                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                                                        active ? 'bg-blue-50' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-900">{g.code || `TG-${g.id}`}</span>
                                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(g.status)}`}>
                                                            {g.status || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-500">{fmtDate(g.updatedAt || g.createdAt)}</div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                    Nhiệm vụ đã hoàn thành ({doneTaskGroups.length})
                                </div>
                                <div className="overflow-hidden rounded-lg border border-emerald-100">
                                    {doneTaskGroups.length === 0 ? (
                                        <div className="p-3 text-xs text-slate-500">Không có nhiệm vụ đã hoàn thành.</div>
                                    ) : (
                                        doneTaskGroups.map((g) => {
                                            const active = selectedId === g.id;
                                            return (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => setSelectedId(g.id)}
                                                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                                                        active ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-900">{g.code || `TG-${g.id}`}</span>
                                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(g.status)}`}>
                                                            {g.status || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-500">{fmtDate(g.updatedAt || g.createdAt)}</div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        taskGroups.map((g) => {
                            const active = selectedId === g.id;
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setSelectedId(g.id)}
                                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition ${
                                        active ? 'bg-blue-50' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-900">{g.code || `TG-${g.id}`}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(g.status)}`}>
                                            {g.status || '—'}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">Đội: {g.assignedTeamName || 'Chưa gán'}</div>
                                    <div className="mt-1 text-[11px] text-slate-500">{fmtDate(g.updatedAt || g.createdAt)}</div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                {error && (
                    <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 inline-flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {!selectedId ? (
                    <div className="flex h-full items-center justify-center text-slate-500">Chọn một nhóm nhiệm vụ để xem chi tiết.</div>
                ) : detailLoading ? (
                    <div className="flex h-full items-center justify-center text-slate-500">Đang tải chi tiết...</div>
                ) : !detail ? (
                    <div className="flex h-full items-center justify-center text-slate-500">Không có dữ liệu chi tiết.</div>
                ) : (
                    <div className="grid h-full min-h-0 grid-cols-1">
                        <div className="flex min-h-0 flex-col">
                            <div className="border-b border-slate-200 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{detail.code || `Task Group #${detail.id}`}</h3>
                                        <p className="text-xs text-slate-500">Tạo lúc: {fmtDate(detail.createdAt)}</p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(detail.status)}`}>{detail.status}</span>
                                </div>
                                <div className="mt-3" />
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                <section>
                                    <h4 className="text-xs font-semibold uppercase text-slate-500">Yêu cầu trong nhóm</h4>
                                    <div className="mt-2 space-y-2">
                                        {Array.isArray(detail.requests) && detail.requests.length > 0 ? (
                                            detail.requests.map((r) => (
                                                <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-900">{r.code || `RR-${r.id}`}</span>
                                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(r.status)}`}>{r.status || '—'}</span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-600">{r.addressText || 'Chưa có địa chỉ'}</p>
                                                    <p className="mt-1 text-xs text-slate-600">Công dân: {r.citizenName || '—'} • {r.citizenPhone || '—'}</p>
                                                    <p className="mt-1 text-xs text-slate-500">Ưu tiên: {r.priority || '—'} • Người: {r.affectedPeopleCount ?? '—'} • Xác minh vị trí: {r.locationVerified ? 'Đã xác minh' : 'Chưa xác minh'}</p>
                                                    <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{r.description || 'Không có mô tả thêm.'}</p>
                                                    {r.emergency && (
                                                        <p className="mt-1 text-[11px] font-semibold text-rose-700">
                                                            Yêu cầu khẩn cấp #{r.emergencyNo || '—'} • Đội báo khẩn cấp: {r.sourceTeamId || '—'}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500">Không có yêu cầu liên kết.</p>
                                        )}
                                    </div>
                                </section>

                                <section className="mt-5">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500">Phân công hiện tại</h4>
                                    <div className="mt-2 space-y-2">
                                        {Array.isArray(detail.assignments) && detail.assignments.length > 0 ? (
                                            detail.assignments.map((a) => (
                                                <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                                                    <div className="font-semibold text-slate-900">{a.teamName || 'Không rõ đội'}</div>
                                                    <div className="mt-1 text-xs text-slate-600">Asset: {a.assetName || a.assetCode || '—'}</div>
                                                    <div className="mt-1 text-xs text-slate-500">Assigned by: {a.assignedByName || '—'} • {fmtDate(a.assignedAt)}</div>
                                                </div>
                                            ))
                                        ) : detail.assignedTeamName ? (
                                            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                                                <div className="font-semibold text-slate-900">{detail.assignedTeamName}</div>
                                                <div className="mt-1 text-xs text-slate-500">Đội đang được phân công hiện tại.</div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">Chưa có phân công.</p>
                                        )}
                                    </div>
                                </section>

                                <section className="mt-5">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500">Timeline</h4>
                                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                        {String(detail.status || '').toUpperCase() === 'CANCELLED' ? (
                                            <div className="text-sm font-semibold text-rose-700">Nhiệm vụ đã bị hủy.</div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {TIMELINE_STEPS.map((step, index) => (
                                                    <React.Fragment key={step}>
                                                        <div className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[10px] font-bold ${stepClass(step, String(detail.status || '').toUpperCase())}`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-semibold text-slate-700">{step}</div>
                                                        </div>
                                                        {index < TIMELINE_STEPS.length - 1 && (
                                                            <div className="h-[2px] w-8 bg-slate-200" />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs text-slate-600">
                                            Trạng thái hiện tại: <span className="font-semibold">{detail.status || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {Array.isArray(detail.timeline) && detail.timeline.length > 0 ? (
                                            detail.timeline.map((t) => (
                                                <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700">
                                                    <div className="font-semibold">{t.eventType || 'EVENT'}</div>
                                                    <div className="mt-0.5">{t.note || '—'}</div>
                                                    <div className="mt-0.5 text-slate-500">{t.actorName || 'Hệ thống'} • {fmtDate(t.createdAt)}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500">Chưa có timeline.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
