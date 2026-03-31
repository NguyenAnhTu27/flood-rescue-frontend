import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    RefreshCcw,
    Search,
} from 'lucide-react';
import { getTaskGroupById, getTaskGroups } from '../../features/coordinator/api.js';

const STATUS_FILTERS = [
    { label: 'Tất cả', value: '' },
    { label: 'NEW', value: 'NEW' },
    { label: 'ASSIGNED', value: 'ASSIGNED' },
    { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'CANCELLED', value: 'CANCELLED' },
];

const TIMELINE_STEPS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE'];

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
    const normalized = String(status || '').toUpperCase();
    const map = {
        NEW: 'bg-amber-100 text-amber-800',
        ASSIGNED: 'bg-indigo-100 text-indigo-800',
        IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
        DONE: 'bg-emerald-100 text-emerald-800',
        CANCELLED: 'bg-rose-100 text-rose-800',
    };
    return map[normalized] || 'bg-slate-100 text-slate-700';
}

function getInitials(value) {
    const parts = String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
    if (parts.length === 0) return 'TG';
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function timelineState(step, currentStatus) {
    const normalizedStatus = String(currentStatus || '').toUpperCase();
    if (normalizedStatus === 'CANCELLED') return 'cancelled';

    const currentIndex = TIMELINE_STEPS.indexOf(normalizedStatus);
    const stepIndex = TIMELINE_STEPS.indexOf(step);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
}

function timelineDotClass(state) {
    if (state === 'done') return 'border-emerald-500 bg-emerald-500';
    if (state === 'current') return 'border-blue-600 bg-blue-600';
    return 'border-slate-200 bg-white';
}

function timelineLabelClass(state) {
    if (state === 'done') return 'text-emerald-700';
    if (state === 'current') return 'text-blue-700';
    return 'text-slate-400';
}

function SidebarTaskButton({ taskGroup, active, onSelect, showTeamName = false }) {
    const updatedText = fmtDate(taskGroup.updatedAt || taskGroup.createdAt);
    const supportingText = showTeamName
        ? `Đội: ${taskGroup.assignedTeamName || 'Chưa gán'}`
        : taskGroup.note || 'Đang theo dõi tiến độ nhiệm vụ';

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                active
                    ? 'border-blue-200 bg-blue-50/90 shadow-[0_12px_32px_rgba(37,99,235,0.10)]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{taskGroup.code || `TG-${taskGroup.id}`}</div>
                    <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-slate-500">{supportingText}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${badgeClass(taskGroup.status)}`}>
                    {taskGroup.status || '—'}
                </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">{updatedText}</div>
        </button>
    );
}

function DetailSection({ title, children }) {
    return (
        <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
            <div className="mt-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
                {children}
            </div>
        </section>
    );
}

export default function RescueRequestHandle() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [statusFilter, setStatusFilter] = useState('');
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(() => {
        const message = String(location.state?.successMessage || '').trim();
        return message ? message : '';
    });

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

    useEffect(() => {
        if (!notice) return undefined;
        const timeoutId = window.setTimeout(() => setNotice(''), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [notice]);

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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f6f8fc] shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
                    <div className="border-b border-slate-200 px-5 py-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-bold tracking-tight text-blue-600">TaskStore</div>
                                <h2 className="mt-3 text-sm font-semibold text-slate-900">
                                    {selectedTeamId ? `Nhiệm vụ của đội ${selectedTeamName || `#${selectedTeamId}`}` : 'Giám sát nhiệm vụ'}
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Theo dõi trạng thái và chi tiết xử lý của từng nhóm nhiệm vụ.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={loadGroups}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-2 transition hover:bg-slate-100"
                                title="Tải lại"
                            >
                                <RefreshCcw className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="mt-4 space-y-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Tìm mã nhóm, đội..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                {!selectedTeamId && (
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    >
                                        {STATUS_FILTERS.map((f) => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="submit"
                                    className="h-11 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                                >
                                    Lọc
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3">
                        {loading ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                Đang tải...
                            </div>
                        ) : taskGroups.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                Không có nhóm nhiệm vụ.
                            </div>
                        ) : selectedTeamId ? (
                            <div className="space-y-5">
                                <div>
                                    <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Nhiệm vụ đang làm ({activeTaskGroups.length})
                                    </div>
                                    <div className="space-y-3">
                                        {activeTaskGroups.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-xs text-slate-500">
                                                Không có nhiệm vụ đang làm.
                                            </div>
                                        ) : (
                                            activeTaskGroups.map((g) => (
                                                <SidebarTaskButton
                                                    key={g.id}
                                                    taskGroup={g}
                                                    active={selectedId === g.id}
                                                    onSelect={() => setSelectedId(g.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Nhiệm vụ đã hoàn thành ({doneTaskGroups.length})
                                    </div>
                                    <div className="space-y-3">
                                        {doneTaskGroups.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-xs text-slate-500">
                                                Không có nhiệm vụ đã hoàn thành.
                                            </div>
                                        ) : (
                                            doneTaskGroups.map((g) => (
                                                <SidebarTaskButton
                                                    key={g.id}
                                                    taskGroup={g}
                                                    active={selectedId === g.id}
                                                    onSelect={() => setSelectedId(g.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {taskGroups.map((g) => (
                                    <SidebarTaskButton
                                        key={g.id}
                                        taskGroup={g}
                                        active={selectedId === g.id}
                                        onSelect={() => setSelectedId(g.id)}
                                        showTeamName
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-col">
                    {error && (
                        <div className="mx-4 mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    {notice && (
                        <div className="mx-4 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {notice}
                        </div>
                    )}

                    {!selectedId ? (
                        <div className="flex h-full items-center justify-center px-6 text-center text-slate-500">
                            Chọn một nhóm nhiệm vụ để xem chi tiết.
                        </div>
                    ) : detailLoading ? (
                        <div className="flex h-full items-center justify-center px-6 text-center text-slate-500">
                            Đang tải chi tiết...
                        </div>
                    ) : !detail ? (
                        <div className="flex h-full items-center justify-center px-6 text-center text-slate-500">
                            Không có dữ liệu chi tiết.
                        </div>
                    ) : (
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                                                {detail.code || `Task Group #${detail.id}`}
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Tạo lúc: {fmtDate(detail.createdAt)}
                                            </p>
                                        </div>
                                        <span className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${badgeClass(detail.status)}`}>
                                            {detail.status || '—'}
                                        </span>
                                    </div>
                                </div>

                                <DetailSection title="Yêu cầu trong nhóm">
                                    <div className="space-y-3">
                                        {Array.isArray(detail.requests) && detail.requests.length > 0 ? (
                                            detail.requests.map((r) => (
                                                <article key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900">{r.code || `RR-${r.id}`}</div>
                                                            <p className="mt-1 text-xs leading-5 text-slate-600">{r.addressText || 'Chưa có địa chỉ'}</p>
                                                        </div>
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${badgeClass(r.status)}`}>
                                                            {r.status || '—'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-xs text-slate-600">
                                                        Công dân: {r.citizenName || '—'} • {r.citizenPhone || '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Ưu tiên: {r.priority || '—'} • Người: {r.affectedPeopleCount ?? '—'} • Xác minh vị trí: {r.locationVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                                                    </p>
                                                    <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                                                        {r.description || 'Không có mô tả thêm.'}
                                                    </p>
                                                    {r.emergency && (
                                                        <p className="mt-3 text-[11px] font-semibold text-rose-700">
                                                            Yêu cầu khẩn cấp #{r.emergencyNo || '—'} • Đội báo khẩn cấp: {r.sourceTeamId || '—'}
                                                        </p>
                                                    )}
                                                </article>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500">Không có yêu cầu liên kết.</p>
                                        )}
                                    </div>
                                </DetailSection>

                                <DetailSection title="Phân công hiện tại">
                                    <div className="space-y-3">
                                        {Array.isArray(detail.assignments) && detail.assignments.length > 0 ? (
                                            detail.assignments.map((a) => (
                                                <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                                        {getInitials(a.teamName || detail.assignedTeamName)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-semibold text-slate-900">{a.teamName || 'Không rõ đội'}</div>
                                                        <div className="mt-1 text-xs text-slate-600">Asset: {a.assetName || a.assetCode || '—'}</div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Assigned by: {a.assignedByName || '—'} • {fmtDate(a.assignedAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : detail.assignedTeamName ? (
                                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                                    {getInitials(detail.assignedTeamName)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">{detail.assignedTeamName}</div>
                                                    <div className="mt-1 text-xs text-slate-500">Đội đang được phân công hiện tại.</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">Chưa có phân công.</p>
                                        )}
                                    </div>
                                </DetailSection>

                                <DetailSection title="Timeline">
                                    {String(detail.status || '').toUpperCase() === 'CANCELLED' ? (
                                        <div className="text-sm font-semibold text-rose-700">Nhiệm vụ đã bị hủy.</div>
                                    ) : (
                                        <div className="relative pt-1">
                                            <div className="absolute left-3 right-3 top-4 hidden h-px bg-slate-200 sm:block" />
                                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                                {TIMELINE_STEPS.map((step) => {
                                                    const state = timelineState(step, detail.status);
                                                    return (
                                                        <div key={step} className="relative flex flex-col items-center text-center">
                                                            <div className={`relative z-10 h-6 w-6 rounded-full border-4 ${timelineDotClass(state)}`} />
                                                            <div className={`mt-3 text-[11px] font-semibold uppercase tracking-wide ${timelineLabelClass(state)}`}>
                                                                {step}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4 text-xs text-slate-600">
                                        Trạng thái hiện tại: <span className="font-semibold">{detail.status || '—'}</span>
                                    </div>
                                </DetailSection>

                                <DetailSection title="Nhật ký timeline">
                                    <div className="space-y-3">
                                        {Array.isArray(detail.timeline) && detail.timeline.length > 0 ? (
                                            detail.timeline.map((t) => (
                                                <div key={t.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
                                                    <div className="font-semibold text-slate-900">{t.eventType || 'EVENT'}</div>
                                                    <div className="mt-1 leading-5">{t.note || '—'}</div>
                                                    <div className="mt-2 text-slate-500">
                                                        {t.actorName || 'Hệ thống'} • {fmtDate(t.createdAt)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500">Chưa có timeline.</p>
                                        )}
                                    </div>
                                </DetailSection>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
