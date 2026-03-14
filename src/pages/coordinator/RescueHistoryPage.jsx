import React, { useEffect, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { getTaskGroupById, getTaskGroups } from '../../features/coordinator/api.js';

function fmtDate(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return String(value);
    }
}

function badgeClass(status) {
    const s = String(status || '').toUpperCase();
    const map = {
        NEW: 'bg-amber-100 text-amber-800',
        ASSIGNED: 'bg-indigo-100 text-indigo-800',
        IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
        DONE: 'bg-emerald-100 text-emerald-700',
        CANCELLED: 'bg-rose-100 text-rose-700',
    };
    return map[s] || 'bg-slate-100 text-slate-700';
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

function SidebarHistoryButton({ taskGroup, active, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                active
                    ? 'border-emerald-200 bg-emerald-50/90 shadow-[0_12px_32px_rgba(16,185,129,0.12)]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{taskGroup.code || `TG-${taskGroup.id}`}</div>
                    <p className="mt-1 text-xs text-slate-600">Đội: {taskGroup.assignedTeamName || '—'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${badgeClass(taskGroup.status)}`}>
                    {taskGroup.status || '—'}
                </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">{fmtDate(taskGroup.updatedAt || taskGroup.createdAt)}</div>
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

export default function RescueHistoryPage() {
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState('');
    const [taskGroups, setTaskGroups] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError('');
            const resp = await getTaskGroups({ page: 0, size: 100 });
            const list = Array.isArray(resp?.content) ? resp.content : Array.isArray(resp) ? resp : [];
            const filtered = submittedKeyword
                ? list.filter((g) => String(g?.code || '').toLowerCase().includes(submittedKeyword.toLowerCase()))
                : list;
            const sorted = [...filtered].sort((a, b) => {
                const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
                return tb - ta;
            });
            setTaskGroups(sorted);
            setSelectedId((current) => (sorted.some((item) => item.id === current) ? current : sorted[0]?.id || null));
        } catch (e) {
            setError(e?.message || 'Không thể tải lịch sử cứu hộ.');
            setTaskGroups([]);
            setSelectedId(null);
            setDetail(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submittedKeyword]);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            return;
        }
        (async () => {
            try {
                setDetailLoading(true);
                const resp = await getTaskGroupById(selectedId);
                setDetail(resp);
            } catch (e) {
                setError(e?.message || 'Không thể tải chi tiết lịch sử cứu hộ.');
                setDetail(null);
            } finally {
                setDetailLoading(false);
            }
        })();
    }, [selectedId]);

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f6f8fc] shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
                    <div className="border-b border-slate-200 px-5 py-5">
                        <div className="text-lg font-bold tracking-tight text-emerald-600">HistoryBoard</div>
                        <h2 className="mt-3 text-sm font-semibold text-slate-900">Lịch sử cứu hộ</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Theo dõi toàn bộ nhiệm vụ đã và đang diễn ra theo thứ tự cập nhật mới nhất.
                        </p>
                        <form
                            className="relative mt-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setSubmittedKeyword(keyword.trim());
                            }}
                        >
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
                                placeholder="Tìm mã nhiệm vụ..."
                            />
                        </form>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3">
                        {loading ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                Đang tải...
                            </div>
                        ) : taskGroups.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                Chưa có dữ liệu lịch sử.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {taskGroups.map((g) => (
                                    <SidebarHistoryButton
                                        key={g.id}
                                        taskGroup={g}
                                        active={selectedId === g.id}
                                        onSelect={() => setSelectedId(g.id)}
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

                    {!selectedId ? (
                        <div className="flex h-full items-center justify-center px-6 text-center text-slate-500">
                            Chọn một nhiệm vụ để xem chi tiết.
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
                                                Cập nhật: {fmtDate(detail.updatedAt || detail.createdAt)}
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
                                                </article>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500">Không có yêu cầu liên kết.</p>
                                        )}
                                    </div>
                                </DetailSection>

                                <DetailSection title="Thông tin nhiệm vụ">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="text-xs uppercase tracking-wide text-slate-400">Đội phụ trách</div>
                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                                    {getInitials(detail.assignedTeamName)}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900">{detail.assignedTeamName || 'Chưa có đội phụ trách'}</div>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="text-xs uppercase tracking-wide text-slate-400">Thời gian tạo</div>
                                            <div className="mt-2 text-sm font-semibold text-slate-900">{fmtDate(detail.createdAt)}</div>
                                            <div className="mt-1 text-xs text-slate-500">Cập nhật cuối: {fmtDate(detail.updatedAt || detail.createdAt)}</div>
                                        </div>
                                    </div>
                                </DetailSection>

                                <DetailSection title="Lịch sử phân công">
                                    <div className="space-y-3">
                                        {Array.isArray(detail.assignments) && detail.assignments.length > 0 ? (
                                            detail.assignments.map((a) => (
                                                <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
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
                                        ) : (
                                            <p className="text-sm text-slate-500">Chưa có dữ liệu phân công.</p>
                                        )}
                                    </div>
                                </DetailSection>

                                <DetailSection title="Timeline">
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
