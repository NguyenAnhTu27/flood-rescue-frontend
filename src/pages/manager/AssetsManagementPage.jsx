import React, { useState, useMemo } from 'react';
import { Sailboat, Truck, Zap, MapPin, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_FILTERS = [
    { id: 'all', label: 'Tất cả', value: null },
    { id: 'available', label: 'Rảnh', value: 'available' },
    { id: 'in-use', label: 'Đang dùng', value: 'in-use' },
    { id: 'maintenance', label: 'Bảo trì', value: 'maintenance' },
];

const TYPE_FILTERS = [
    { id: 'canoe', label: 'Cano', value: 'canoe', Icon: Sailboat },
    { id: 'generator', label: 'Máy phát điện', value: 'generator', Icon: Zap },
    { id: 'water-vehicle', label: 'Xe lội nước', value: 'water-vehicle', Icon: Truck },
];

const STATUS_LABELS = {
    available: { label: 'Rảnh', color: 'bg-green-100 text-green-700' },
    'in-use': { label: 'Đang dùng', color: 'bg-amber-100 text-amber-700' },
    maintenance: { label: 'Bảo trì', color: 'bg-red-100 text-red-700' },
};

const TYPE_CONFIG = {
    canoe: { Icon: Sailboat, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    generator: { Icon: Zap, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    'water-vehicle': { Icon: Truck, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
};

const mockAssets = [
    { id: '1', code: '#CN-042', name: 'Cano Cứu Hộ #CN-042', desc: 'CANO CAO TỐC', type: 'canoe', status: 'available', location: 'Bến Chương Dương, Quận 1', task: 'Chưa có nhiệm vụ' },
    { id: '2', code: '#AM-108', name: 'Xe Lội Nước #AM-108', desc: 'PHƯƠNG TIỆN LỘI NƯỚC', type: 'water-vehicle', status: 'in-use', location: 'Huyện Bình Chánh, TPHCM', task: 'Cứu trợ vùng ngập lụt' },
    { id: '3', code: '#GEN-22', name: 'Máy Phát Điện #GEN-22', desc: 'CÔNG SUẤT 5KW', type: 'generator', status: 'maintenance', location: 'Kho Tổng Thủ Đức', task: 'Đang sửa chữa định kỳ' },
    { id: '4', code: '#CN-091', name: 'Cano Phao #CN-091', desc: 'CANO PHÃO CAO TỐC', type: 'canoe', status: 'available', location: 'Bến Ninh Kiều, Cần Thơ', task: 'Sẵn sàng điều động' },
    { id: '5', code: '#AM-202', name: 'Xe Lội Nước #AM-202', desc: 'PHƯƠNG TIỆN LỘI NƯỚC', type: 'water-vehicle', status: 'available', location: 'Kho Tổng Thủ Đức', task: 'Chưa có nhiệm vụ' },
    { id: '6', code: '#GEN-07', name: 'Máy Phát Điện #GEN-07', desc: 'CÔNG SUẤT 5KW', type: 'generator', status: 'in-use', location: 'Trạm y tế xã Phong Nha', task: 'Cấp điện khẩn cấp' },
];

const ITEMS_PER_PAGE = 6;

export default function AssetsManagementPage() {
    const [statusFilter, setStatusFilter] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredAssets = useMemo(() => {
        let list = [...mockAssets];
        if (statusFilter) {
            list = list.filter((a) => a.status === statusFilter);
        }
        if (typeFilter) {
            list = list.filter((a) => a.type === typeFilter);
        }
        return list;
    }, [statusFilter, typeFilter]);

    const paginatedAssets = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAssets, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ITEMS_PER_PAGE));

    const handleAddNew = () => {
        // TODO: Navigate to add asset form
    };

    const handleViewDetail = (asset) => {
        // TODO: Navigate to asset detail
    };

    const handleDispatch = (asset) => {
        if (asset.status !== 'available') return;
        // TODO: Open dispatch modal
    };

    return (
        <div className="space-y-6">
            {/* ===== HEADER ===== */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Danh sách Phương tiện & Thiết bị
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Quản lý và điều phối tài sản cứu trợ trực tuyến theo thời gian thực
                </p>
            </div>

            {/* ===== FILTER & ACTION BAR ===== */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status filters */}
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.value)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                statusFilter === f.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                    {/* Type filters */}
                    {TYPE_FILTERS.map((f) => {
                        const Icon = f.Icon;
                        const isActive = typeFilter === f.value;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setTypeFilter(typeFilter === f.value ? null : f.value)}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {f.label}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
                >
                    <Plus className="h-4 w-4" />
                    Thêm mới
                </button>
            </div>

            {/* ===== ASSET CARDS GRID ===== */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedAssets.map((asset) => {
                    const config = TYPE_CONFIG[asset.type];
                    const statusInfo = STATUS_LABELS[asset.status];
                    const Icon = config.Icon;
                    const canDispatch = asset.status === 'available';
                    return (
                        <div
                            key={asset.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                            <h3 className="mt-3 font-semibold text-slate-900">{asset.name}</h3>
                            <p className="text-xs uppercase tracking-wide text-slate-500">{asset.desc}</p>
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                    <span className="line-clamp-1">{asset.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                    <span className="line-clamp-1">{asset.task}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleViewDetail(asset)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Xem chi tiết
                                </button>
                                <button
                                    onClick={() => handleDispatch(asset)}
                                    disabled={!canDispatch}
                                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                        canDispatch
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    Điều phối
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {paginatedAssets.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <p className="text-slate-500">Không có phương tiện nào phù hợp với bộ lọc.</p>
                </div>
            )}

            {/* ===== PAGINATION ===== */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-slate-500">
                    Hiển thị {paginatedAssets.length} trên {filteredAssets.length} phương tiện
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const page = i + 1;
                        const isActive = page === currentPage;
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                                    isActive ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
