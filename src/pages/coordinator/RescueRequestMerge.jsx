import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, X, Users, GitMerge, UserPlus } from 'lucide-react';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';
import { createTaskGroup, getCoordinatorRescueQueue } from '../../features/coordinator/api.js';

const RADIUS_OPTIONS = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1,000m' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
];

const PRIORITY_TAG = {
    HIGH: { label: 'KHẨN CẤP', class: 'bg-red-500 text-white' },
    MEDIUM: { label: 'TRUNG BÌNH', class: 'bg-amber-500 text-white' },
    LOW: { label: 'THẤP', class: 'bg-sky-400 text-white' },
    PENDING: { label: 'CHỜ XỬ LÝ', class: 'bg-slate-400 text-white' },
};

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, PENDING: 3 };
const PRIORITY_LABEL_VI = { HIGH: 'Khẩn cấp', MEDIUM: 'Trung bình', LOW: 'Thấp', PENDING: 'Chờ xử lý' };

function toArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function parseDistanceToM(raw) {
    const text = String(raw || '').trim().toLowerCase();
    if (!text) return null;
    const km = text.match(/([0-9]+(?:\.[0-9]+)?)\s*km/);
    if (km) return Math.round(Number(km[1]) * 1000);
    const m = text.match(/([0-9]+(?:\.[0-9]+)?)\s*m/);
    if (m) return Math.round(Number(m[1]));
    return null;
}

function formatDistance(raw) {
    if (!raw) return '—';
    const m = parseDistanceToM(raw);
    if (m == null) return String(raw);
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${m}m`;
}

function fmtId(req) {
    return req?.code || `REQ-${req?.id}`;
}

export default function RescueRequestMerge() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [radiusIndex, setRadiusIndex] = useState(1); // 1,000m
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [highlightId, setHighlightId] = useState(null);

    const [mergeOpen, setMergeOpen] = useState(false);
    const [mergeNote, setMergeNote] = useState('');
    const [mergeNoteError, setMergeNoteError] = useState('');
    const [merging, setMerging] = useState(false);

    const radius = RADIUS_OPTIONS[radiusIndex]?.value ?? 1000;

    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoading(true);
                setError('');
                const [pendingResp, verifiedResp] = await Promise.all([
                    getCoordinatorRescueQueue({ status: 'PENDING', page: 0, size: 200 }),
                    getCoordinatorRescueQueue({ status: 'VERIFIED', page: 0, size: 200 }),
                ]);
                const merged = [...toArray(pendingResp), ...toArray(verifiedResp)];
                const unique = merged.filter((r, idx, arr) => arr.findIndex((x) => Number(x?.id) === Number(r?.id)) === idx);
                setAllRequests(unique);
                setSelectedIds(unique.slice(0, 2).map((r) => Number(r.id)));
            } catch (e) {
                setAllRequests([]);
                setSelectedIds([]);
                setError(e?.message || 'Không thể tải yêu cầu từ hệ thống.');
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        let list = [...allRequests];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (r) =>
                    String(r?.code || r?.id || '').toLowerCase().includes(q) ||
                    String(r?.addressText || '').toLowerCase().includes(q) ||
                    String(r?.citizenName || '').toLowerCase().includes(q)
            );
        }

        // Best-effort radius filter if BE provided distance-like field
        list = list.filter((r) => {
            const dRaw = r?.distance || r?.distanceText || r?.distanceMeters;
            if (dRaw == null || dRaw === '') return true;
            if (typeof dRaw === 'number') return dRaw <= radius;
            const m = parseDistanceToM(dRaw);
            return m == null ? true : m <= radius;
        });

        return list;
    }, [allRequests, radius, searchQuery]);

    const selectedRequests = useMemo(() => {
        return allRequests.filter((r) => selectedIds.includes(Number(r.id)));
    }, [allRequests, selectedIds]);

    const totalPersonnel = useMemo(() => {
        return selectedRequests.reduce((sum, r) => sum + Number(r.affectedPeopleCount || 1), 0);
    }, [selectedRequests]);

    const highestPriority = useMemo(() => {
        if (selectedRequests.length === 0) return null;
        const sorted = [...selectedRequests].sort(
            (a, b) => (PRIORITY_ORDER[String(a.priority || 'PENDING').toUpperCase()] ?? 99) - (PRIORITY_ORDER[String(b.priority || 'PENDING').toUpperCase()] ?? 99)
        );
        return String(sorted[0].priority || 'PENDING').toUpperCase();
    }, [selectedRequests]);

    const areaCenter = useMemo(() => {
        const first = selectedRequests[0] || filteredRequests[0];
        const lat = Number(first?.latitude || first?.lat);
        const lng = Number(first?.longitude || first?.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        return { lat: 16.0544, lng: 108.2022 };
    }, [filteredRequests, selectedRequests]);

    const toggleSelect = (id) => {
        const numId = Number(id);
        setSelectedIds((prev) =>
            prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]
        );
    };

    const removeSelected = (id) => {
        const numId = Number(id);
        setSelectedIds((prev) => prev.filter((x) => x !== numId));
    };

    const handleMerge = async () => {
        if (selectedIds.length === 0) return;
        try {
            const reason = String(mergeNote || '').trim();
            if (!reason) {
                setMergeNoteError('Vui lòng nhập lý do gộp trước khi tạo nhiệm vụ.');
                return;
            }
            setMerging(true);
            const response = await createTaskGroup({
                rescueRequestIds: selectedIds,
                note: reason,
            });
            const createdId = Number(response?.id || response?.taskGroupId || response?.data?.id);
            setMergeOpen(false);
            setMergeNote('');
            setMergeNoteError('');
            window.alert('Đã gộp yêu cầu thành nhiệm vụ chung thành công.');
            navigate(COORDINATOR_ROUTES.TASK_MONITOR, {
                state: {
                    refresh: true,
                    selectedTaskGroupId: Number.isFinite(createdId) ? createdId : null,
                },
            });
        } catch (e) {
            window.alert(e?.message || 'Không thể gộp yêu cầu.');
        } finally {
            setMerging(false);
        }
    };

    const handleAssignIndividual = () => {
        if (selectedRequests.length === 0) return;
        navigate(COORDINATOR_ROUTES.ASSIGN_RESCUE, {
            state: {
                requests: selectedRequests,
                autoSelectRequestId: selectedRequests[0]?.id,
            },
        });
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-slate-100">
            <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
                <h1 className="text-lg font-semibold text-slate-900">Gộp yêu cầu cứu hộ</h1>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã yêu cầu, địa chỉ, công dân..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            <div className="flex flex-1 min-h-0">
                <div className="flex w-[340px] shrink-0 flex-col border-r border-slate-200 bg-white">
                    <div className="border-b border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-900">Danh sách yêu cầu thực</h2>
                        <p className="mt-1 text-xs text-slate-500">Dữ liệu lấy trực tiếp từ API điều phối</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
                        ) : error ? (
                            <div className="p-6 text-center text-sm text-rose-600">{error}</div>
                        ) : filteredRequests.map((req) => {
                            const id = Number(req.id);
                            const isSelected = selectedIds.includes(id);
                            const isHighlight = highlightId === id;
                            const tag = PRIORITY_TAG[String(req.priority || 'PENDING').toUpperCase()] || PRIORITY_TAG.PENDING;
                            return (
                                <div
                                    key={id}
                                    onMouseEnter={() => setHighlightId(id)}
                                    onMouseLeave={() => setHighlightId(null)}
                                    className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 p-4 transition ${
                                        isHighlight ? 'bg-blue-50 ring-inset ring-2 ring-blue-200' : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => toggleSelect(id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(id)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-900">#{fmtId(req)}</p>
                                        <p className="mt-0.5 text-xs text-slate-600">{req.citizenName || '—'} • {req.citizenPhone || '—'}</p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            {req.addressText || 'Chưa có địa chỉ'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">Khoảng cách: {formatDistance(req.distance || req.distanceText || req.distanceMeters)}</p>
                                        <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${tag.class}`}>
                                            {tag.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {!loading && !error && filteredRequests.length === 0 && (
                            <div className="p-6 text-center text-sm text-slate-500">Không có yêu cầu nào phù hợp</div>
                        )}
                    </div>
                    <div className="border-t border-slate-200 p-4">
                        <p className="mb-2 text-xs font-medium text-slate-600">Bán kính quét khu vực</p>
                        <div className="flex gap-2">
                            {RADIUS_OPTIONS.map((opt, i) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setRadiusIndex(i)}
                                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                                        radiusIndex === i
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative flex-1 min-w-0">
                    <div className="h-full w-full">
                        <GoogleMap center={areaCenter} zoom={14} markerPosition={areaCenter} />
                    </div>
                </div>

                <div className="flex w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-900">Thao tác gộp</h2>
                        <p className="mt-0.5 text-xs text-slate-500">Tạo nhiệm vụ mới từ các yêu cầu đã chọn</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                            <p className="text-xs font-medium uppercase text-slate-500">Số lượng yêu cầu</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">{String(selectedIds.length).padStart(2, '0')}</p>
                        </div>
                        <div className="mt-4">
                            <p className="mb-2 text-xs font-medium text-slate-600">Yêu cầu đã chọn:</p>
                            <ul className="space-y-2">
                                {selectedRequests.map((req) => (
                                    <li key={req.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-800">#{fmtId(req)}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSelected(req.id);
                                                }}
                                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600">{req.citizenName || '—'} • {req.citizenPhone || '—'}</div>
                                        <div className="mt-1 text-xs text-slate-500">{req.addressText || 'Chưa có địa chỉ'}</div>
                                    </li>
                                ))}
                            </ul>
                            {selectedRequests.length === 0 && (
                                <p className="text-sm text-slate-400">Chưa chọn yêu cầu nào</p>
                            )}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600">Tổng nhân lực dự kiến:</span>
                            <span className="font-semibold text-slate-900">{totalPersonnel} người</span>
                        </div>
                        <div className="mt-3">
                            <p className="mb-1 text-xs font-medium text-slate-600">Ưu tiên cao nhất:</p>
                            {highestPriority ? (
                                <span className={`inline-block rounded px-3 py-1 text-xs font-semibold uppercase ${(PRIORITY_TAG[highestPriority] || PRIORITY_TAG.PENDING).class}`}>
                                    {PRIORITY_LABEL_VI[highestPriority]}
                                </span>
                            ) : (
                                <span className="text-sm text-slate-400">—</span>
                            )}
                        </div>
                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setMergeNoteError('');
                                    setMergeOpen(true);
                                }}
                                disabled={selectedIds.length === 0}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <GitMerge className="h-4 w-4" />
                                Gộp vào nhiệm vụ chung
                            </button>
                            <button
                                type="button"
                                onClick={handleAssignIndividual}
                                disabled={selectedIds.length === 0}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UserPlus className="h-4 w-4" />
                                Giao nhiệm vụ riêng lẻ
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                            Nhiệm vụ mới sẽ giữ liên kết đầy đủ tới toàn bộ yêu cầu cũ đã chọn để theo dõi chi tiết.
                        </p>
                    </div>
                </div>
            </div>

            {mergeOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                        <h3 className="text-sm font-bold text-slate-900">Lý do gộp yêu cầu</h3>
                        <p className="mt-1 text-xs text-slate-600">Mô tả nghiệp vụ gộp sẽ lưu vào database của nhiệm vụ mới.</p>
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Yêu cầu cũ</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Công dân</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Địa chỉ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRequests.map((req) => (
                                        <tr key={req.id} className="border-t border-slate-100">
                                            <td className="px-3 py-2 font-semibold text-slate-800">{fmtId(req)}</td>
                                            <td className="px-3 py-2 text-slate-700">{req.citizenName || req.citizenPhone || '—'}</td>
                                            <td className="px-3 py-2 text-slate-700">{req.addressText || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <textarea
                            rows={5}
                            value={mergeNote}
                            onChange={(e) => {
                                setMergeNote(e.target.value);
                                if (mergeNoteError) setMergeNoteError('');
                            }}
                            placeholder="Nhập lý do gộp (ví dụ: cùng khu vực, cùng mức rủi ro, tối ưu điều phối đội...)"
                            className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-sm"
                        />
                        {mergeNoteError && (
                            <p className="mt-1 text-xs font-medium text-rose-600">{mergeNoteError}</p>
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                    setMergeOpen(false);
                                    setMergeNoteError('');
                                }}
                                disabled={merging}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                disabled={merging}
                                onClick={handleMerge}
                            >
                                {merging ? 'Đang gộp...' : 'Xác nhận gộp'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
