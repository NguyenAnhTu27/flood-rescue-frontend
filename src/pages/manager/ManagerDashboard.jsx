import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Warehouse,
    Truck,
    FileInput,
    FileOutput,
    Package,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    TrendingUp,
    TrendingDown,
    Info,
    ChevronRight,
    Search,
    RefreshCw,
} from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import { getManagerDashboard } from '../../features/relief/api.js';
import { listDistributionVouchers } from '../../features/relief/apiDistribution.js';

const mockStats = [
    {
        id: 'central-warehouse',
        label: 'Kho Trung tâm',
        value: '1',
        unit: 'Kho',
        sub: 'Hệ thống chỉ sử dụng 1 kho trung tâm',
        icon: Warehouse,
        color: 'slate',
        trend: null,
    },
    {
        id: 'vehicles',
        label: 'Tổng phương tiện',
        value: '45',
        unit: 'Xe',
        sub: 'Đa dạng loại',
        icon: Truck,
        color: 'slate',
        trend: null,
    },
    {
        id: 'exports',
        label: 'Số phiếu xuất',
        value: '15',
        unit: 'Phiếu',
        sub: '',
        icon: FileOutput,
        color: 'slate',
        trend: null,
    },
    {
        id: 'imports',
        label: 'Số phiếu nhập',
        value: '08',
        unit: 'Phiếu',
        sub: '',
        icon: FileInput,
        color: 'slate',
        trend: null,
    },
    {
        id: 'distributions',
        label: 'Đơn phân phối',
        value: '24',
        unit: 'Đơn',
        sub: 'Đang xử lý',
        icon: Package,
        color: 'blue',
        trend: null,
        highlighted: true,
    },
];

const managementCards = [
    {
        id: 'warehouse',
        title: 'Quản lý kho',
        description:
            'Theo dõi tình trạng tồn kho, phân loại hàng hóa và quản lý vị trí các kho cứu trợ.',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=250&fit=crop',
        route: MANAGER_ROUTES.INVENTORY_OVERVIEW,
    },
    {
        id: 'vehicles',
        title: 'Quản lý phương tiện',
        description:
            'Quản lý lộ trình di chuyển, tình trạng nhân lực và phương tiện vận chuyển cứu trợ.',
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=250&fit=crop',
        route: MANAGER_ROUTES.ASSETS_MANAGEMENT,
    },
    {
        id: 'distribution',
        title: 'Phân phối hàng cứu trợ',
        description:
            'Tối ưu kế hoạch phân phối vận tải đến các địa phương, tạo lịch phát, trích nguồn lực từ các kho.',
        image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=250&fit=crop',
        route: MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD,
    },
];

const mockTransactions = [
    {
        id: '#NH-1235',
        type: 'Nhập kho',
        typeColor: 'blue',
        destination: 'Kho A (Quảng Bình)',
        time: '09:15 AM',
        status: 'Hoàn tất',
        statusColor: 'green',
    },
    {
        id: '#XP-8942',
        type: 'Xuất kho',
        typeColor: 'orange',
        destination: 'Huyện Lệ Thủy',
        time: '08:30 AM',
        status: 'Đang vận chuyển',
        statusColor: 'blue',
    },
    {
        id: '#PP-4521',
        type: 'Phân phối',
        typeColor: 'green',
        destination: 'Xã Phong Nha',
        time: '07:45 AM',
        status: 'Đang chờ',
        statusColor: 'yellow',
    },
    {
        id: '#NH-1230',
        type: 'Nhập kho',
        typeColor: 'blue',
        destination: 'Kho B (Huế)',
        time: 'Hôm qua',
        status: 'Hoàn tất',
        statusColor: 'green',
    },
];

const inventorySummary = [
    { id: 'central-warehouse', label: 'Kho Trung tâm', value: '1' },
    { id: 'current', label: 'Tồn kho hiện tại', value: '12,450' },
    {
        id: 'imports',
        label: 'Nhập trong ngày',
        value: '+1,200',
        color: 'text-blue-600',
        icon: TrendingUp,
    },
    {
        id: 'exports',
        label: 'Xuất trong ngày',
        value: '-850',
        color: 'text-red-500',
        icon: TrendingDown,
    },
];

const inventoryItems = [
    {
        code: '#ITEM-001',
        name: 'Gạo sẻ (25kg)',
        category: 'Lương thực',
        unit: 'Bao',
        qty: 400,
        status: 'Còn hàng',
        statusColor: 'green',
    },
    {
        code: '#ITEM-002',
        name: 'Mì tôm (Thùng 30 gói)',
        category: 'Lương thực',
        unit: 'Thùng',
        qty: 1200,
        status: 'Còn hàng',
        statusColor: 'green',
    },
    {
        code: '#ITEM-003',
        name: 'Nước suối (Lốc 6 chai 1.5L)',
        category: 'Nhu yếu phẩm',
        unit: 'Lốc',
        qty: 85,
        status: 'Sắp hết',
        statusColor: 'red',
    },
    {
        code: '#ITEM-004',
        name: 'Áo phao cứu sinh',
        category: 'Thiết bị bảo hộ',
        unit: 'Chiếc',
        qty: 300,
        status: 'Còn hàng',
        statusColor: 'green',
    },
    {
        code: '#ITEM-005',
        name: 'Thuốc sát & đèn cứu',
        category: 'Y tế',
        unit: 'Bộ',
        qty: 500,
        status: 'Còn hàng',
        statusColor: 'green',
    },
];

function parseArrayResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

export default function ManagerDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState(mockStats);
    const [transactions, setTransactions] = useState(mockTransactions);
    const [inventorySummaryState, setInventorySummaryState] = useState(inventorySummary);
    const [inventoryItemsState, setInventoryItemsState] = useState(inventoryItems);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const dateStr = now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError(null);

                const [dashboardRes, distributionsRes] = await Promise.allSettled([
                    getManagerDashboard(),
                    listDistributionVouchers({ size: 200 }),
                ]);

                const data = dashboardRes.status === 'fulfilled' ? dashboardRes.value : {};
                const payload = data?.data || data; // phòng trường hợp BE bọc trong data

                const distributionList =
                    distributionsRes.status === 'fulfilled'
                        ? parseArrayResponse(distributionsRes.value)
                        : [];
                const processingStatuses = new Set(['PLANNED', 'ASSIGNED', 'IN_TRANSIT', 'DRAFT']);
                const processingCount = distributionList.filter((d) =>
                    processingStatuses.has(String(d?.status || '').toUpperCase())
                ).length;

                // --------- Tổng quan (stats) ---------
                // Kỳ vọng payload.overview hoặc payload.stats là mảng
                let apiStats = payload?.overview || payload?.stats || [];
                if (!Array.isArray(apiStats)) {
                    apiStats = [];
                }
                const normalizedApiStats = apiStats.map((item, idx) => ({
                    id: item?.id || item?.key || item?.code || `stat-${idx}`,
                    label: item?.label || item?.name || '',
                    value: String(item?.value ?? item?.total ?? ''),
                    unit: item?.unit || '',
                    sub: item?.sub || item?.description || '',
                    trend: item?.trend || null,
                    highlighted: item?.highlighted ?? false,
                }));

                // Giữ đủ bộ card theo mockStats để UI luôn có:
                // Kho trung tâm / Tổng phương tiện / Phiếu xuất / Phiếu nhập / Đơn phân phối.
                const mergedStats = mockStats.map((base, idx) => {
                    const byId = normalizedApiStats.find((s) => s.id === base.id);
                    const byIdx = normalizedApiStats[idx];
                    const source = byId || byIdx;
                    return {
                        ...base,
                        ...(source || {}),
                        id: base.id,
                        label: source?.label || base.label,
                        value: source?.value || base.value,
                        unit: source?.unit || base.unit,
                        sub: source?.sub || base.sub,
                        icon: base.icon, // icon cố định theo từng card
                        color: base.color || 'slate',
                        trend: source?.trend || base.trend || null,
                        highlighted: source?.highlighted ?? base.highlighted ?? false,
                    };
                });
                const statsWithDistribution = mergedStats.map((stat) => {
                    if (stat.id !== 'distributions') return stat;
                    return {
                        ...stat,
                        value: distributionList.length > 0 ? String(distributionList.length) : stat.value,
                        sub:
                            distributionList.length > 0
                                ? `${processingCount} đang xử lý`
                                : stat.sub,
                    };
                });

                // --------- Giao dịch gần đây ---------
                // Kỳ vọng payload.recentTransactions hoặc payload.transactions
                let apiTransactions =
                    payload?.recentTransactions || payload?.transactions || [];
                if (!Array.isArray(apiTransactions) || apiTransactions.length === 0) {
                    apiTransactions = mockTransactions;
                } else {
                    apiTransactions = apiTransactions.map((tx) => ({
                        id: tx.code || tx.id || '#TX-' + (tx.index || Math.random().toString(36).slice(2, 7)),
                        type: tx.typeLabel || tx.type || 'Giao dịch',
                        typeColor: tx.typeColor || 'blue',
                        destination: tx.destination || tx.warehouseName || tx.location || '',
                        time: tx.time || tx.createdTime || tx.createdAt || '',
                        status: tx.statusLabel || tx.status || 'Đang xử lý',
                        statusColor: tx.statusColor || 'blue',
                    }));
                }

                // --------- Tóm tắt tồn kho ---------
                // Kỳ vọng payload.inventorySummary
                let apiInvSummary = payload?.inventorySummary || [];
                if (!Array.isArray(apiInvSummary) || apiInvSummary.length === 0) {
                    apiInvSummary = inventorySummary;
                } else {
                    apiInvSummary = apiInvSummary.map((item, idx) => {
                        const base = inventorySummary[idx] || inventorySummary[0];
                        return {
                            id: item.id || base.id || `inv-summary-${idx}`,
                            label: item.label || item.name || base.label,
                            value:
                                typeof item.value === 'number'
                                    ? item.value.toLocaleString()
                                    : item.value || base.value,
                            color: item.color || base.color,
                            icon: base.icon || item.icon,
                        };
                    });
                }

                // --------- Danh sách hàng tồn ---------
                // Kỳ vọng payload.inventoryItems hoặc payload.items
                let apiInvItems = payload?.inventoryItems || payload?.items || [];
                if (!Array.isArray(apiInvItems) || apiInvItems.length === 0) {
                    apiInvItems = inventoryItems;
                } else {
                    apiInvItems = apiInvItems.map((item) => ({
                        code: item.code || item.itemCode || '#ITEM',
                        name: item.name || item.itemName || 'Mặt hàng',
                        category: item.category || item.categoryName || 'Khác',
                        unit: item.unit || item.uom || 'Đơn vị',
                        qty: typeof item.qty === 'number' ? item.qty : Number(item.quantity || 0),
                        status: item.statusLabel || item.status || 'Còn hàng',
                        statusColor: item.statusColor || 'green',
                    }));
                }

                setStats(statsWithDistribution);
                setTransactions(apiTransactions);
                setInventorySummaryState(apiInvSummary);
                setInventoryItemsState(apiInvItems);
            } catch (err) {
                console.error('[ManagerDashboard] loadDashboard error:', err);
                setError(err?.message || 'Không thể tải dữ liệu dashboard cứu trợ');
                // Giữ nguyên mock data nếu có lỗi
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    return (
        <div className="space-y-6">
            {/* ===== HEADER ===== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Trang chủ quản lý cứu trợ
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Hệ thống giám sát vận hành và điều phối logistics cứu trợ thiên tai
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm dữ liệu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
                    />
                </div>
            </div>

            {/* ===== STATS CARDS ===== */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const isHighlighted = stat.highlighted;
                    return (
                        <div
                            key={stat.id}
                            className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition hover:shadow-md ${isHighlighted
                                ? 'border-blue-200 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${isHighlighted
                                        ? 'bg-white/20'
                                        : 'bg-slate-100'
                                        }`}
                                >
                                    <Icon
                                        className={`h-5 w-5 ${isHighlighted
                                            ? 'text-white'
                                            : 'text-slate-600'
                                            }`}
                                    />
                                </div>
                                {isHighlighted && (
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                        Đơn phân phối
                                    </span>
                                )}
                            </div>

                            <div className="mt-3">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold">
                                        {stat.value}
                                    </span>
                                    <span
                                        className={`text-sm font-medium ${isHighlighted
                                            ? 'text-blue-100'
                                            : 'text-slate-500'
                                            }`}
                                    >
                                        {stat.unit}
                                    </span>
                                </div>
                                <p
                                    className={`mt-0.5 text-xs ${isHighlighted
                                        ? 'text-blue-100'
                                        : 'text-slate-500'
                                        }`}
                                >
                                    {stat.label}
                                </p>
                            </div>

                            {stat.sub && (
                                <p
                                    className={`mt-2 text-[11px] ${isHighlighted
                                        ? 'text-blue-100'
                                        : 'text-slate-400'
                                        }`}
                                >
                                    {stat.sub}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ===== MANAGEMENT SHORTCUTS ===== */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Lối tắt Quản lý
                    </h2>
                    <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                        Xem tất cả tính năng
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {managementCards.map((card) => (
                        <div
                            key={card.id}
                            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                            <div className="relative h-44 overflow-hidden">
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>

                            <div className="p-5">
                                <h3 className="text-base font-bold text-slate-900">
                                    {card.title}
                                </h3>
                                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
                                    {card.description}
                                </p>

                                <Link
                                    to={card.route}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    Truy cập
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== BOTTOM TWO-COLUMN: TRANSACTIONS + INVENTORY ===== */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Transactions */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">
                            Giao dịch gần đây
                        </h2>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {loading ? 'Đang tải...' : `Cập nhật lúc ${timeStr}`}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-medium uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3">Mã phiếu</th>
                                    <th className="px-5 py-3">Loại</th>
                                    <th className="px-5 py-3">Kho / Điểm đến</th>
                                    <th className="px-5 py-3">Thời gian</th>
                                    <th className="px-5 py-3">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">
                                            {tx.id}
                                        </td>
                                        <td className="px-5 py-3">
                                            <TypeBadge
                                                color={tx.typeColor}
                                                label={tx.type}
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {tx.destination}
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">
                                            {tx.time}
                                        </td>
                                        <td className="px-5 py-3">
                                            <StatusBadge
                                                color={tx.statusColor}
                                                label={tx.status}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-3 text-center">
                        <Link
                            to={MANAGER_ROUTES.INVENTORY_OVERVIEW}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Xem toàn bộ danh sách hàng hóa
                        </Link>
                    </div>
                </div>

                {/* Inventory Quick View */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">
                            Bảng tồn kho hiện có
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mặt hàng..."
                                className="h-8 w-44 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-600 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* Inventory mini-stats */}
                    <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                        {inventorySummaryState.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.id} className="px-4 py-3 text-center">
                                    <p className="text-[11px] text-slate-500">
                                        {item.label}
                                    </p>
                                    <p
                                        className={`mt-0.5 text-lg font-bold ${item.color || 'text-slate-900'
                                            }`}
                                    >
                                        {item.value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-medium uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-2.5">Mã hàng</th>
                                    <th className="px-4 py-2.5">Tên mặt hàng</th>
                                    <th className="px-4 py-2.5">Phân loại</th>
                                    <th className="px-4 py-2.5">Đơn vị</th>
                                    <th className="px-4 py-2.5 text-right">SL tồn</th>
                                    <th className="px-4 py-2.5">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventoryItemsState.map((item) => (
                                    <tr
                                        key={item.code}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-slate-700">
                                            {item.code}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-700">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {item.category}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {item.unit}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                                            {item.qty.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <StatusBadge
                                                color={item.statusColor}
                                                label={item.status}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-3 text-center">
                        <Link
                            to={MANAGER_ROUTES.INVENTORY_OVERVIEW}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Xem toàn bộ danh sách hàng hóa
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== SYSTEM NOTICE ===== */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                    <p className="text-sm font-semibold text-blue-900">
                        Lưu ý điều phối
                    </p>
                    <p className="mt-0.5 text-sm text-blue-700">
                        Hệ thống đang xử lý đơn đợt lũ Quảng Trị đợt mới nhất. Mọi
                        phiếu nhập/xuất sẽ được gửi nhận thực hiện trên hàng tồn kho.
                    </p>
                </div>
            </div>


        </div>
    );
}

function TypeBadge({ color, label }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-700',
        orange: 'bg-orange-50 text-orange-700',
        green: 'bg-green-50 text-green-700',
    };
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color] || 'bg-slate-100 text-slate-700'
                }`}
        >
            {label}
        </span>
    );
}

function StatusBadge({ color, label }) {
    const colorMap = {
        green: 'text-green-700',
        blue: 'text-blue-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
    };
    const dotMap = {
        green: 'bg-green-500',
        blue: 'bg-blue-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorMap[color] || 'text-slate-600'
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${dotMap[color] || 'bg-slate-400'
                    }`}
            />
            {label}
        </span>
    );
}
