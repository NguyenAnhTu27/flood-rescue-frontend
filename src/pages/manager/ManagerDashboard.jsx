import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Warehouse,
    Truck,
    FileInput,
    FileOutput,
    Package,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Info,
    ChevronRight,
    Search,
    RefreshCw,
    Clock,
} from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import {
    getManagerDashboard,
    listInventoryReceipts,
    listInventoryIssues,
    getInventoryStock,
    listReliefRequests,
} from '../../features/relief/api.js';
import { getAssets } from '../../features/assets/api.js';

function parseArrayResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toUpper(value) {
    return String(value || '').trim().toUpperCase();
}

function formatTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function statusColorFromQty(qty) {
    if (qty <= 0) return 'red';
    if (qty < 20) return 'yellow';
    return 'green';
}

export default function ManagerDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [inventorySummaryState, setInventorySummaryState] = useState([]);
    const [inventoryItemsState, setInventoryItemsState] = useState([]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });

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
            title: 'Phân phối',
            description:
                'Theo dõi hàng đợi phân phối cứu trợ và điều phối xử lý theo mức độ ưu tiên.',
            image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=250&fit=crop',
            route: MANAGER_ROUTES.RELIEF_REQUESTS,
        },
    ];

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                dashboardRes,
                receiptsRes,
                issuesRes,
                stockRes,
                assetsRes,
                reliefRes,
            ] = await Promise.allSettled([
                getManagerDashboard(),
                listInventoryReceipts({ page: 0, size: 50 }),
                listInventoryIssues({ page: 0, size: 50 }),
                getInventoryStock({ page: 0, size: 200 }),
                getAssets({ page: 0, size: 200 }),
                listReliefRequests({ page: 0, size: 200 }),
            ]);

            const dashboardData = dashboardRes.status === 'fulfilled' ? (dashboardRes.value?.data || dashboardRes.value || {}) : {};
            const receipts = receiptsRes.status === 'fulfilled' ? parseArrayResponse(receiptsRes.value) : [];
            const issues = issuesRes.status === 'fulfilled' ? parseArrayResponse(issuesRes.value) : [];
            const stockItems = stockRes.status === 'fulfilled' ? parseArrayResponse(stockRes.value) : [];
            const assets = assetsRes.status === 'fulfilled' ? parseArrayResponse(assetsRes.value) : [];
            const reliefRequests = reliefRes.status === 'fulfilled' ? parseArrayResponse(reliefRes.value) : [];

            const warehouseCount = toNumber(
                dashboardData?.warehouseCount
                ?? dashboardData?.centralWarehouseCount
                ?? dashboardData?.summary?.warehouseCount,
                0
            );

            const processingStatuses = new Set(['DRAFT', 'PLANNED', 'ASSIGNED', 'IN_TRANSIT', 'MANAGER_APPROVED', 'RESCUER_RECEIVED', 'ARRIVED_WAREHOUSE']);
            const processingDistributionCount = reliefRequests.filter((r) => processingStatuses.has(toUpper(r?.deliveryStatus || r?.status))).length;

            setStats([
                {
                    id: 'central-warehouse',
                    label: 'Kho Trung tâm',
                    value: String(warehouseCount),
                    unit: 'Kho',
                    sub: warehouseCount > 0 ? 'Dữ liệu theo hệ thống' : 'Chưa có dữ liệu',
                    icon: Warehouse,
                    highlighted: false,
                },
                {
                    id: 'vehicles',
                    label: 'Tổng phương tiện',
                    value: String(assets.length),
                    unit: 'Xe',
                    sub: 'Dữ liệu phương tiện hiện có',
                    icon: Truck,
                    highlighted: false,
                },
                {
                    id: 'exports',
                    label: 'Số phiếu xuất',
                    value: String(issues.length),
                    unit: 'Phiếu',
                    sub: 'Theo dữ liệu phiếu xuất',
                    icon: FileOutput,
                    highlighted: false,
                },
                {
                    id: 'imports',
                    label: 'Số phiếu nhập',
                    value: String(receipts.length),
                    unit: 'Phiếu',
                    sub: 'Theo dữ liệu phiếu nhập',
                    icon: FileInput,
                    highlighted: false,
                },
                {
                    id: 'distributions',
                    label: 'Đơn phân phối',
                    value: String(reliefRequests.length),
                    unit: 'Đơn',
                    sub: `${processingDistributionCount} đang xử lý`,
                    icon: Package,
                    highlighted: true,
                },
            ]);

            const txRows = [
                ...receipts.map((r) => ({
                    id: r?.code || `#NH-${r?.id || ''}`,
                    type: 'Nhập kho',
                    typeColor: 'blue',
                    destination: r?.warehouseName || r?.source || 'Kho trung tâm',
                    timeRaw: r?.createdAt || r?.updatedAt,
                    status: r?.status || '—',
                    statusColor: toUpper(r?.status) === 'DONE' ? 'green' : 'blue',
                })),
                ...issues.map((r) => ({
                    id: r?.code || `#XP-${r?.id || ''}`,
                    type: 'Xuất kho',
                    typeColor: 'orange',
                    destination: r?.targetArea || r?.deliveryAddress || 'Điểm cứu trợ',
                    timeRaw: r?.createdAt || r?.updatedAt,
                    status: r?.status || '—',
                    statusColor: toUpper(r?.status) === 'DONE' ? 'green' : 'blue',
                })),
                ...reliefRequests.map((r) => ({
                    id: r?.code || `#PP-${r?.id || ''}`,
                    type: 'Phân phối',
                    typeColor: 'green',
                    destination: r?.targetArea || r?.citizenAddressText || 'Điểm cứu trợ',
                    timeRaw: r?.updatedAt || r?.createdAt,
                    status: r?.deliveryStatus || r?.status || '—',
                    statusColor: processingStatuses.has(toUpper(r?.deliveryStatus || r?.status)) ? 'yellow' : 'green',
                })),
            ]
                .filter((x) => x.id)
                .sort((a, b) => new Date(b.timeRaw || 0).getTime() - new Date(a.timeRaw || 0).getTime())
                .slice(0, 12)
                .map((x) => ({ ...x, time: formatTime(x.timeRaw) }));
            setTransactions(txRows);

            const totalCurrentStock = stockItems.reduce((sum, item) => {
                const qty = toNumber(item?.totalQty ?? item?.qty ?? item?.quantity ?? item?.balance, 0);
                return sum + qty;
            }, 0);

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const importedToday = receipts.filter((r) => new Date(r?.createdAt || r?.updatedAt || 0) >= todayStart).length;
            const exportedToday = issues.filter((r) => new Date(r?.createdAt || r?.updatedAt || 0) >= todayStart).length;

            setInventorySummaryState([
                { id: 'central-warehouse', label: 'Kho Trung tâm', value: String(warehouseCount) },
                { id: 'current', label: 'Tồn kho hiện tại', value: totalCurrentStock.toLocaleString('vi-VN') },
                { id: 'imports', label: 'Nhập trong ngày', value: `+${importedToday}`, color: 'text-blue-600', icon: TrendingUp },
                { id: 'exports', label: 'Xuất trong ngày', value: `-${exportedToday}`, color: 'text-red-500', icon: TrendingDown },
            ]);

            const mappedInventory = stockItems
                .map((item) => {
                    const qty = toNumber(item?.totalQty ?? item?.qty ?? item?.quantity ?? item?.balance, 0);
                    const color = statusColorFromQty(qty);
                    return {
                        code: item?.itemCode || item?.code || `#ITEM-${item?.itemCategoryId || item?.id || ''}`,
                        name: item?.itemName || item?.name || 'Mặt hàng',
                        category: item?.classificationName || item?.categoryName || item?.category || 'Khác',
                        unit: item?.unit || 'Đơn vị',
                        qty,
                        status: qty <= 0 ? 'Hết hàng' : qty < 20 ? 'Sắp hết' : 'Còn hàng',
                        statusColor: color,
                    };
                })
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 20);
            setInventoryItemsState(mappedInventory);
        } catch (err) {
            console.error('[ManagerDashboard] loadDashboard error:', err);
            setError(err?.message || 'Không thể tải dữ liệu dashboard cứu trợ');
            setStats([]);
            setTransactions([]);
            setInventorySummaryState([]);
            setInventoryItemsState([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const filteredTransactions = useMemo(() => {
        const q = String(searchQuery || '').trim().toLowerCase();
        if (!q) return transactions;
        return transactions.filter((tx) =>
            [tx.id, tx.type, tx.destination, tx.status].some((v) => String(v || '').toLowerCase().includes(q))
        );
    }, [searchQuery, transactions]);

    const filteredInventoryItems = useMemo(() => {
        const q = String(searchQuery || '').trim().toLowerCase();
        if (!q) return inventoryItemsState;
        return inventoryItemsState.filter((item) =>
            [item.code, item.name, item.category, item.status].some((v) => String(v || '').toLowerCase().includes(q))
        );
    }, [searchQuery, inventoryItemsState]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Trang chủ quản lý cứu trợ</h1>
                    <p className="mt-1 text-sm text-slate-500">Hệ thống giám sát vận hành và điều phối logistics cứu trợ thiên tai</p>
                </div>

                <div className="flex items-center gap-2">
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
                    <button
                        type="button"
                        onClick={loadDashboard}
                        disabled={loading}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const isHighlighted = Boolean(stat.highlighted);
                    return (
                        <div
                            key={stat.id}
                            className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition hover:shadow-md ${isHighlighted ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isHighlighted ? 'bg-white/20' : 'bg-slate-100'}`}>
                                    <Icon className={`h-5 w-5 ${isHighlighted ? 'text-white' : 'text-slate-600'}`} />
                                </div>
                                {isHighlighted && (
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">Đơn phân phối</span>
                                )}
                            </div>

                            <div className="mt-3">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold">{stat.value}</span>
                                    <span className={`text-sm font-medium ${isHighlighted ? 'text-blue-100' : 'text-slate-500'}`}>{stat.unit}</span>
                                </div>
                                <p className={`mt-0.5 text-xs ${isHighlighted ? 'text-blue-100' : 'text-slate-500'}`}>{stat.label}</p>
                            </div>

                            {stat.sub && (
                                <p className={`mt-2 text-[11px] ${isHighlighted ? 'text-blue-100' : 'text-slate-400'}`}>{stat.sub}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Lối tắt Quản lý</h2>
                    <div className="flex items-center gap-3">
                        <Link to={MANAGER_ROUTES.ASSETS_MANAGEMENT} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                            Quản lý phương tiện
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                        <Link to={MANAGER_ROUTES.RELIEF_REQUESTS} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                            Xem tất cả tính năng
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {managementCards.map((card) => (
                        <div key={card.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <div className="relative h-44 overflow-hidden">
                                <img src={card.image} alt={card.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>

                            <div className="p-5">
                                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{card.description}</p>

                                <Link to={card.route} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                                    Truy cập
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">Giao dịch gần đây</h2>
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
                                {filteredTransactions.map((tx) => (
                                    <tr key={`${tx.type}-${tx.id}-${tx.timeRaw || ''}`} className="transition hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">{tx.id}</td>
                                        <td className="px-5 py-3"><TypeBadge color={tx.typeColor} label={tx.type} /></td>
                                        <td className="px-5 py-3 text-slate-600">{tx.destination}</td>
                                        <td className="px-5 py-3 text-slate-500">{tx.time}</td>
                                        <td className="px-5 py-3"><StatusBadge color={tx.statusColor} label={tx.status} /></td>
                                    </tr>
                                ))}
                                {!loading && filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">Chưa có dữ liệu giao dịch.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-3 text-center">
                        <Link to={MANAGER_ROUTES.INVENTORY_OVERVIEW} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Xem toàn bộ dữ liệu kho
                        </Link>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">Bảng tồn kho hiện có</h2>
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                        {inventorySummaryState.map((item) => (
                            <div key={item.id} className="px-4 py-3 text-center">
                                <p className="text-[11px] text-slate-500">{item.label}</p>
                                <p className={`mt-0.5 text-lg font-bold ${item.color || 'text-slate-900'}`}>{item.value}</p>
                            </div>
                        ))}
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
                                {filteredInventoryItems.map((item) => (
                                    <tr key={item.code} className="transition hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-slate-700">{item.code}</td>
                                        <td className="px-4 py-2.5 text-slate-700">{item.name}</td>
                                        <td className="px-4 py-2.5 text-slate-500">{item.category}</td>
                                        <td className="px-4 py-2.5 text-slate-500">{item.unit}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{Number(item.qty || 0).toLocaleString('vi-VN')}</td>
                                        <td className="px-4 py-2.5"><StatusBadge color={item.statusColor} label={item.status} /></td>
                                    </tr>
                                ))}
                                {!loading && filteredInventoryItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">Chưa có dữ liệu tồn kho.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-3 text-center">
                        <Link to={MANAGER_ROUTES.INVENTORY_OVERVIEW} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Xem toàn bộ danh sách hàng hóa
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Lưu ý điều phối</p>
                    <p className="mt-0.5 text-sm text-blue-700">
                        Dữ liệu trên trang được đồng bộ trực tiếp từ hệ thống kho, phiếu nhập/xuất và yêu cầu cứu trợ hiện hành.
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
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color] || 'bg-slate-100 text-slate-700'}`}>
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
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorMap[color] || 'text-slate-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dotMap[color] || 'bg-slate-400'}`} />
            {label}
        </span>
    );
}
