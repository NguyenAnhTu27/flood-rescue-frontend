import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import MapBox from '../../features/map/components/MapBox.jsx';
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

function parseCoordinatesFromText(text) {
    const raw = String(text || '');
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
}

function isValidLatLng(lat, lng) {
    return Number.isFinite(lat)
        && Number.isFinite(lng)
        && lat >= -90
        && lat <= 90
        && lng >= -180
        && lng <= 180
        && !(Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001);
}

function isLikelyVietnam(lat, lng) {
    return lat >= 7.5 && lat <= 24.5 && lng >= 102 && lng <= 110;
}

function extractCoordinates(item) {
    if (!item || typeof item !== 'object') return null;
    const directCandidates = [
        [item.latitude, item.longitude],
        [item.lat, item.lng],
        [item.currentLatitude, item.currentLongitude],
        [item.currentLat, item.currentLng],
        [item.citizenLatitude, item.citizenLongitude],
        [item.targetLatitude, item.targetLongitude],
        [item.location?.lat, item.location?.lng],
        [item.location?.latitude, item.location?.longitude],
    ];

    const normalized = [];

    for (const [rawLat, rawLng] of directCandidates) {
        const lat = Number(rawLat);
        const lng = Number(rawLng);
        if (isValidLatLng(lat, lng)) {
            normalized.push({ lat, lng });
        }
        if (isValidLatLng(lng, lat)) {
            normalized.push({ lat: lng, lng: lat });
        }
    }

    const textCandidates = [
        item.locationDescription,
        item.addressText,
        item.targetArea,
        item.citizenLocationDescription,
    ];
    for (const text of textCandidates) {
        const parsed = parseCoordinatesFromText(text);
        if (!parsed) continue;
        if (isValidLatLng(parsed.lat, parsed.lng)) {
            normalized.push(parsed);
        }
        if (isValidLatLng(parsed.lng, parsed.lat)) {
            normalized.push({ lat: parsed.lng, lng: parsed.lat });
        }
    }

    if (normalized.length === 0) return null;

    const vnFirst = normalized.find((c) => isLikelyVietnam(c.lat, c.lng));
    return vnFirst || normalized[0];
}

export default function RescueHistoryPage() {
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [loading, setLoading] = useState(false);
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
            setSelectedId(sorted[0]?.id || null);
        } catch (e) {
            setError(e?.message || 'Không thể tải lịch sử cứu hộ.');
            setTaskGroups([]);
            setSelectedId(null);
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
                const resp = await getTaskGroupById(selectedId);
                setDetail(resp);
            } catch {
                setDetail(null);
            }
        })();
    }, [selectedId]);

    const mapCenter = useMemo(() => {
        const defaultCenter = { lat: 16.0544, lng: 108.2022 };

        const fromDetail = extractCoordinates(detail);
        if (fromDetail) return fromDetail;

        const reqList = Array.isArray(detail?.requests) ? detail.requests : [];
        for (const req of reqList) {
            const coords = extractCoordinates(req);
            if (coords) return coords;
        }

        return defaultCenter;
    }, [detail]);

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex w-[350px] shrink-0 flex-col border-r border-slate-200">
                <div className="border-b border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-900">Lịch sử cứu hộ</h2>
                    <p className="mt-1 text-xs text-slate-500">Hiển thị toàn bộ nhiệm vụ theo mọi trạng thái.</p>
                    <form
                        className="relative mt-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSubmittedKeyword(keyword.trim());
                        }}
                    >
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm"
                            placeholder="Tìm mã nhiệm vụ..."
                        />
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-6 text-sm text-slate-500">Đang tải...</div>
                    ) : taskGroups.length === 0 ? (
                        <div className="p-6 text-sm text-slate-500">Chưa có dữ liệu lịch sử.</div>
                    ) : (
                        taskGroups.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => setSelectedId(g.id)}
                                className={`w-full border-b border-slate-100 px-4 py-3 text-left ${selectedId === g.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-900">{g.code || `TG-${g.id}`}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(g.status)}`}>{g.status || '—'}</span>
                                </div>
                                <div className="mt-1 text-xs text-slate-600">Đội: {g.assignedTeamName || '—'}</div>
                                <div className="mt-1 text-[11px] text-slate-500">{fmtDate(g.updatedAt || g.createdAt)}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                {error && <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
                {!detail ? (
                    <div className="flex h-full items-center justify-center text-slate-500">Chọn một nhiệm vụ để xem chi tiết.</div>
                ) : (
                    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <div className="min-h-0 overflow-y-auto p-4">
                            <h3 className="text-lg font-bold text-slate-900">{detail.code || `Task Group #${detail.id}`}</h3>
                            <p className="mt-1 text-xs text-slate-500">Cập nhật: {fmtDate(detail.updatedAt || detail.createdAt)}</p>
                            <section className="mt-4">
                                <h4 className="text-xs font-semibold uppercase text-slate-500">Yêu cầu trong nhóm</h4>
                                <div className="mt-2 space-y-2">
                                    {Array.isArray(detail.requests) && detail.requests.length > 0 ? (
                                        detail.requests.map((r) => (
                                            <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                                <div className="font-semibold text-slate-900">{r.code || `RR-${r.id}`}</div>
                                                <div className="mt-1 text-xs text-slate-600">{r.addressText || 'Chưa có địa chỉ'}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">Không có yêu cầu liên kết.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                        <div className="min-h-0 overflow-hidden border-l border-slate-200">
                            <div className="border-b border-slate-200 px-4 py-3">
                                <h4 className="text-sm font-semibold text-slate-900">Bản đồ vị trí</h4>
                                <p className="mt-0.5 text-xs text-slate-500 inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Vị trí theo tọa độ hợp lệ đầu tiên của nhiệm vụ.</p>
                            </div>
                            <div className="h-[calc(100%-57px)] min-h-[260px]">
                                <MapBox center={mapCenter} markerPosition={mapCenter} zoom={13} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
