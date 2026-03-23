import React, { useState } from 'react';
import {
    AlertTriangle,
    ChevronRight,
    Layers,
    MapPin,
    Search,
    Users,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';

import GoogleMap from '../../features/map/components/MapBox.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';

const MOCK_REQUESTS = [
    {
        id: 'REQ-8821',
        code: '#REQ-8821',
        address: '12 Lê Thánh Tông',
        distance: '240m',
        priority: 'Khẩn cấp',
        priorityColor: 'bg-rose-100 text-rose-700',
        people: 3,
    },
    {
        id: 'REQ-8825',
        code: '#REQ-8825',
        address: '45 Trần Hưng Đạo',
        distance: '410m',
        priority: 'Trung bình',
        priorityColor: 'bg-amber-100 text-amber-700',
        people: 2,
    },
    {
        id: 'REQ-8830',
        code: '#REQ-8830',
        address: '22 Ngô Quyền',
        distance: '650m',
        priority: 'Thấp',
        priorityColor: 'bg-sky-100 text-sky-700',
        people: 1,
    },
    {
        id: 'REQ-8832',
        code: '#REQ-8832',
        address: '91 Lý Thường Kiệt',
        distance: '1.2km',
        priority: 'Chờ xử lý',
        priorityColor: 'bg-slate-100 text-slate-600',
        people: 4,
        disabled: true,
    },
];

export default function GroupRequestsByAreaPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState(['REQ-8821', 'REQ-8825', 'REQ-8830']);
    const [radius, setRadius] = useState(1000); // mét

    const filteredRequests = MOCK_REQUESTS.filter((req) => {
        if (!searchQuery) return true;
        const keyword = searchQuery.toLowerCase();
        return (
            req.code.toLowerCase().includes(keyword) ||
            req.address.toLowerCase().includes(keyword) ||
            req.distance.toLowerCase().includes(keyword)
        );
    });

    const handleToggle = (req) => {
        if (req.disabled) return;
        setSelectedIds((current) =>
            current.includes(req.id) ? current.filter((id) => id !== req.id) : [...current, req.id],
        );
    };

    const selectedRequests = MOCK_REQUESTS.filter((req) => selectedIds.includes(req.id));
    const totalPeople = selectedRequests.reduce((sum, r) => sum + (r.people || 0), 0);
    const highestPriority = selectedRequests.some((r) => r.priority === 'Khẩn cấp')
        ? 'Khẩn cấp'
        : selectedRequests.some((r) => r.priority === 'Trung bình')
        ? 'Trung bình'
        : selectedRequests.length > 0
        ? 'Thấp'
        : '—';

    return (
        <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 pb-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-slate-900">
                                    Gộp Yêu cầu theo Khu vực
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Chọn nhiều yêu cầu gần nhau để xử lý trong cùng một nhiệm vụ.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden items-center gap-1 rounded-full bg-slate-100 px-1 py-1 text-[11px] font-medium text-slate-600 md:flex">
                        <button className="rounded-full px-3 py-1 hover:bg-slate-200/80">Bảng điều khiển</button>
                        <button className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">
                            Yêu cầu
                        </button>
                        <button className="rounded-full px-3 py-1 hover:bg-slate-200/80">Nhiệm vụ</button>
                        <button className="rounded-full px-3 py-1 hover:bg-slate-200/80">Bản đồ</button>
                    </div>
                </div>
            </div>

            {/* Body: 3 columns */}
            <div className="flex flex-1 gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg">
                {/* Left column: list of requests */}
                <Card className="flex w-80 flex-shrink-0 flex-col bg-slate-50/80">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Danh sách yêu cầu</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Khu vực quét: Quận Hoàn Kiếm, Hà Nội
                        </p>
                        <div className="relative mt-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm yêu cầu..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3">
                        <div className="space-y-2">
                            {filteredRequests.map((req) => {
                                const isSelected = selectedIds.includes(req.id);
                                return (
                                    <button
                                        key={req.id}
                                        type="button"
                                        onClick={() => handleToggle(req)}
                                        className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                                            req.disabled
                                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                                : isSelected
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="text-[11px] font-semibold text-slate-900">
                                                    {req.code}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="line-clamp-1">{req.address}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[11px] font-medium text-slate-700">
                                                    {req.distance}
                                                </span>
                                                <Badge
                                                    outline
                                                    size="sm"
                                                    className={`${req.priorityColor} border-transparent`}
                                                >
                                                    {req.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* Middle column: map + radius slider */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-900">Bản đồ khu vực</span>
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                    Tâm điều phối
                                </span>
                            </div>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Layers className="h-3.5 w-3.5" />
                                Lớp bản đồ
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-1">
                        <GoogleMap center={{ lat: 21.0278, lng: 105.8342 }} zoom={14} />

                        {/* Map controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
                            <button
                                type="button"
                                className="rounded-lg p-2 hover:bg-slate-50"
                                title="Phóng to"
                            >
                                <ZoomIn className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                type="button"
                                className="rounded-lg p-2 hover:bg-slate-50"
                                title="Thu nhỏ"
                            >
                                <ZoomOut className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>

                        {/* Radius slider */}
                        <div className="absolute bottom-4 left-1/2 w-full max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-[11px] text-slate-700 shadow-lg backdrop-blur">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">Bán kính quét khu vực</span>
                                <span className="font-semibold text-blue-700">
                                    {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                                </span>
                            </div>
                            <div className="mt-2">
                                <input
                                    type="range"
                                    min={500}
                                    max={5000}
                                    step={500}
                                    value={radius}
                                    onChange={(e) => setRadius(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                                    <span>500m</span>
                                    <span>1km</span>
                                    <span>2km</span>
                                    <span>5km</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right column: grouping actions */}
                <Card className="flex w-80 flex-shrink-0 flex-col bg-slate-50/80">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Thao tác Gộp
                                </p>
                                <p className="text-xs text-slate-700">
                                    Tổng hợp yêu cầu theo vùng quét hiện tại.
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs text-slate-700">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Số lượng yêu cầu
                            </p>
                            <div className="mt-1 text-3xl font-extrabold text-slate-900">
                                {selectedRequests.length.toString().padStart(2, '0')}
                            </div>
                        </div>

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Yêu cầu đã chọn
                            </p>
                            <div className="mt-2 space-y-1.5">
                                {selectedRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-2 py-1"
                                    >
                                        <span className="text-[11px] font-medium text-slate-900">
                                            {req.code}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-[11px] text-slate-400 hover:text-slate-600"
                                            onClick={() => handleToggle(req)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {selectedRequests.length === 0 && (
                                    <p className="text-[11px] text-slate-500">
                                        Chưa chọn yêu cầu nào. Hãy chọn từ danh sách bên trái.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">Tổng nhân lực dự kiến</span>
                                <span className="text-sm font-semibold text-slate-900">{totalPeople} người</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">Ưu tiên cao nhất</span>
                                <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>{highestPriority}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                            <p className="font-semibold">Lưu ý:</p>
                            <p className="mt-0.5">
                                Nên gộp các yêu cầu cùng tuyến đường và mức độ ưu tiên tương đồng để tối ưu thời gian
                                xử lý.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-3">
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            fullWidth
                            disabled={selectedRequests.length === 0}
                            className="mb-2"
                        >
                            Gộp vào nhiệm vụ chung
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            fullWidth
                            disabled={selectedRequests.length === 0}
                            className="text-xs"
                        >
                            Giao nhiệm vụ riêng lẻ
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

