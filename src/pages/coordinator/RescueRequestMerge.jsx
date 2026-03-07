import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, X, Users, GitMerge, UserPlus } from 'lucide-react';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import { COORDINATOR_ROUTES } from '../../app/routes/route.constants.js';

const RADIUS_OPTIONS = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1,000m' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
];

const PRIORITY_TAG = {
    URGENT: { label: 'KHẨN CẤP', class: 'bg-red-500 text-white' },
    MEDIUM: { label: 'TRUNG BÌNH', class: 'bg-amber-500 text-white' },
    LOW: { label: 'THẤP', class: 'bg-sky-400 text-white' },
    PENDING: { label: 'CHỜ XỬ LÝ', class: 'bg-slate-400 text-white' },
};

const PRIORITY_ORDER = { URGENT: 0, MEDIUM: 1, LOW: 2, PENDING: 3 };
const PRIORITY_LABEL_VI = { URGENT: 'Khẩn cấp', MEDIUM: 'Trung bình', LOW: 'Thấp', PENDING: 'Chờ xử lý' };

const MOCK_REQUESTS = [
    { id: 'REQ-8821', address: '12 Lã Thánh Tông', distance: '240m', priority: 'URGENT', personnel: 2, lat: 21.0265, lng: 105.8512 },
    { id: 'REQ-8825', address: '28 Hàng Bài', distance: '180m', priority: 'MEDIUM', personnel: 2, lat: 21.0221, lng: 105.8534 },
    { id: 'REQ-8830', address: '45 Tràng Tiền', distance: '320m', priority: 'LOW', personnel: 2, lat: 21.0245, lng: 105.8556 },
    { id: 'REQ-8832', address: '7 Phố Huế', distance: '410m', priority: 'PENDING', personnel: 2, lat: 21.0189, lng: 105.8498 },
];

const AREA_CENTER = { lat: 21.0245, lng: 105.8532 }; // Hoàn Kiếm, Hà Nội

export default function RescueRequestMerge() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [radiusIndex, setRadiusIndex] = useState(1); // 1,000m
    const [selectedIds, setSelectedIds] = useState(['REQ-8821', 'REQ-8825', 'REQ-8830']);
    const [highlightId, setHighlightId] = useState(null);

    const radius = RADIUS_OPTIONS[radiusIndex]?.value ?? 1000;

    const filteredRequests = useMemo(() => {
        let list = [...MOCK_REQUESTS];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (r) =>
                    r.id.toLowerCase().includes(q) ||
                    r.address.toLowerCase().includes(q)
            );
        }
        return list;
    }, [searchQuery]);

    const selectedRequests = useMemo(() => {
        return MOCK_REQUESTS.filter((r) => selectedIds.includes(r.id));
    }, [selectedIds]);

    const totalPersonnel = useMemo(() => {
        return selectedRequests.reduce((sum, r) => sum + (r.personnel || 2), 0);
    }, [selectedRequests]);

    const highestPriority = useMemo(() => {
        if (selectedRequests.length === 0) return null;
        const sorted = [...selectedRequests].sort(
            (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
        );
        return sorted[0].priority;
    }, [selectedRequests]);

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const removeSelected = (id) => {
        setSelectedIds((prev) => prev.filter((x) => x !== id));
    };

    const handleMerge = () => {
        // TODO: Gọi API gộp nhiệm vụ
        navigate(COORDINATOR_ROUTES.TASK_MONITOR);
    };

    const handleAssignIndividual = () => {
        // TODO: Giao từng nhiệm vụ riêng
        navigate(COORDINATOR_ROUTES.ASSIGN_RESCUE);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-slate-100">
            {/* Top: Search */}
            <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
                <h1 className="text-lg font-semibold text-slate-900">Hệ thống Điều phối Cứu hộ</h1>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm yêu cầu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* ===== LEFT: Danh sách yêu cầu ===== */}
                <div className="flex w-[320px] shrink-0 flex-col border-r border-slate-200 bg-white">
                    <div className="border-b border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-900">Danh sách yêu cầu</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Khu vực: Quận Hoàn Kiếm, Hà Nội
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredRequests.map((req) => {
                            const isSelected = selectedIds.includes(req.id);
                            const isHighlight = highlightId === req.id;
                            const tag = PRIORITY_TAG[req.priority] || PRIORITY_TAG.PENDING;
                            return (
                                <div
                                    key={req.id}
                                    onMouseEnter={() => setHighlightId(req.id)}
                                    onMouseLeave={() => setHighlightId(null)}
                                    className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 p-4 transition ${
                                        isHighlight ? 'bg-blue-50 ring-inset ring-2 ring-blue-200' : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => toggleSelect(req.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(req.id)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-900">#{req.id}</p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            {req.address}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Cách tâm: {req.distance}
                                        </p>
                                        <span
                                            className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${tag.class}`}
                                        >
                                            {tag.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredRequests.length === 0 && (
                            <div className="p-6 text-center text-sm text-slate-500">
                                Không có yêu cầu nào trong bán kính
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-200 p-4">
                        <p className="mb-2 text-xs font-medium text-slate-600">
                            Bán kính quét khu vực
                        </p>
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

                {/* ===== CENTER: Bản đồ ===== */}
                <div className="relative flex-1 min-w-0">
                    <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                        >
                            <span className="text-lg font-bold text-slate-600">+</span>
                        </button>
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                        >
                            <span className="text-lg font-bold text-slate-600">−</span>
                        </button>
                    </div>
                    <div className="h-full w-full">
                        <GoogleMap
                            center={AREA_CENTER}
                            zoom={15}
                            markerPosition={AREA_CENTER}
                        />
                    </div>
                </div>

                {/* ===== RIGHT: Thao tác Gộp ===== */}
                <div className="flex w-[340px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-900">Thao tác Gộp</h2>
                        <p className="mt-0.5 text-xs text-slate-500">Tổng hợp lựa chọn</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                            <p className="text-xs font-medium uppercase text-slate-500">
                                Số lượng yêu cầu
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                                {String(selectedIds.length).padStart(2, '0')}
                            </p>
                        </div>
                        <div className="mt-4">
                            <p className="mb-2 text-xs font-medium text-slate-600">
                                Yêu cầu đã chọn:
                            </p>
                            <ul className="space-y-2">
                                {selectedRequests.map((req) => (
                                    <li
                                        key={req.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                    >
                                        <span className="font-medium text-slate-800">#{req.id}</span>
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
                                    </li>
                                ))}
                            </ul>
                            {selectedRequests.length === 0 && (
                                <p className="text-sm text-slate-400">Chưa chọn yêu cầu nào</p>
                            )}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600">
                                Tổng nhân lực dự kiến:
                            </span>
                            <span className="font-semibold text-slate-900">{totalPersonnel} người</span>
                        </div>
                        <div className="mt-3">
                            <p className="mb-1 text-xs font-medium text-slate-600">
                                Ưu tiên cao nhất:
                            </p>
                            {highestPriority ? (
                                <span
                                    className={`inline-block rounded px-3 py-1 text-xs font-semibold uppercase ${
                                        (PRIORITY_TAG[highestPriority] || PRIORITY_TAG.PENDING).class
                                    }`}
                                >
                                    {PRIORITY_LABEL_VI[highestPriority]}
                                </span>
                            ) : (
                                <span className="text-sm text-slate-400">—</span>
                            )}
                        </div>
                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={handleMerge}
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
                            Thao tác này sẽ tạo một nhiệm vụ/báo gồm tất cả các yêu cầu đã chọn.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
