import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Info, Tag, RefreshCw } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { getInventoryStock, getManagerDashboard, listInventoryReceipts, listInventoryIssues, getItemCategories } from '../../../features/relief/api.js';

const mockStats = [
    { id: 'total-items', label: 'TỔNG MẶT HÀNG', value: '24', color: 'text-slate-800' },
    { id: 'current-stock', label: 'TỒN KHO HIỆN TẠI', value: '12,450', color: 'text-blue-600' },
    { id: 'import-today', label: 'NHẬP TRONG NGÀY', value: '+1,200', color: 'text-green-600' },
    { id: 'export-today', label: 'XUẤT TRONG NGÀY', value: '-850', color: 'text-red-600' },
];

const mockInventory = [
    { id: '1', code: '#ITEM-001', name: 'Gạo tẻ (25kg)', category: 'Lương thực', unit: 'Bao', qty: 450, status: 'Ổn định', statusType: 'stable' },
    { id: '2', code: '#ITEM-002', name: 'Mì tôm (Thùng 30 gói)', category: 'Lương thực', unit: 'Thùng', qty: 1200, status: 'Ổn định', statusType: 'stable' },
    { id: '3', code: '#ITEM-003', name: 'Nước suối (Lốc 6 chai 1.5L)', category: 'Nhu yếu phẩm', unit: 'Lốc', qty: 85, status: 'Sắp hết', statusType: 'low' },
    { id: '4', code: '#ITEM-004', name: 'Áo phao cứu sinh', category: 'Thiết bị bảo hộ', unit: 'Chiếc', qty: 320, status: 'Ổn định', statusType: 'stable' },
    { id: '5', code: '#ITEM-005', name: 'Thuốc hạ sốt & Sơ cứu', category: 'Y tế', unit: 'Bộ', qty: 500, status: 'Ổn định', statusType: 'stable' },
];

function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '').trim();
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function parseArrayResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.inventoryItems)) return payload.inventoryItems;
    if (Array.isArray(payload?.lines)) return payload.lines;
    if (Array.isArray(payload?.stocks)) return payload.stocks;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
}

export default function InventoryOverviewPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState(mockStats);

    // Load dữ liệu tồn kho từ backend
    const loadInventory = async () => {
        try {
            setLoading(true);
            setError(null);

            let inventoryData = [];
            let statsData = mockStats;
            let categoriesMap = new Map();

            // Luôn load danh mục trước để map "Phân loại" từ itemCategoryId
            try {
                const categoriesResponse = await getItemCategories();
                const categories = parseArrayResponse(categoriesResponse);
                categories.forEach((cat) => {
                    const catId = cat?.id ?? cat?.itemCategoryId ?? cat?.categoryId;
                    if (catId == null) return;
                    categoriesMap.set(String(catId), {
                        code: cat.code || cat.categoryCode || `#CAT-${catId}`,
                        name: cat.name || cat.categoryName || 'Khác',
                        unit: cat.unit || cat.uom || cat.unitOfMeasure || 'Đơn vị',
                    });
                });
                console.log('[InventoryOverviewPage] Loaded categories:', categoriesMap.size);
            } catch (catErr) {
                console.warn('[InventoryOverviewPage] Could not load categories for mapping:', catErr);
                categoriesMap = new Map();
            }

            // Strategy 1: Thử lấy từ API tồn kho trực tiếp (/api/inventory/stock)
            // API này đọc từ bảng stock_balances, chỉ có dữ liệu khi có phiếu nhập status = DONE
            let stockDataLoaded = false;
            try {
                console.log('[InventoryOverviewPage] Trying getInventoryStock (from stock_balances table)...');
                const stockData = await getInventoryStock();
                console.log('[InventoryOverviewPage] getInventoryStock response:', stockData);

                // Parse response (có thể là array hoặc { data: [], content: [] })
                inventoryData = parseArrayResponse(stockData);

                // Nếu API trả về mảng rỗng [], có nghĩa là chưa có phiếu nhập nào được approve (DONE)
                // → Fallback sang strategy khác để tính tồn kho từ receipts - issues
                if (inventoryData.length === 0) {
                    console.log('[InventoryOverviewPage] stock_balances is empty (no DONE receipts yet), falling back to calculate from receipts-issues');
                    stockDataLoaded = false; // Đánh dấu để fallback
                } else {
                    stockDataLoaded = true; // Có dữ liệu từ stock_balances
                    console.log('[InventoryOverviewPage] Loaded', inventoryData.length, 'items from stock_balances');
                }

                // Cập nhật stats nếu có
                if (stockData?.summary || stockData?.stats) {
                    const summary = stockData.summary || stockData.stats;
                    if (Array.isArray(summary)) {
                        statsData = summary.map((s, idx) => ({
                            ...(mockStats[idx] || mockStats[0]),
                            value: String(s.value ?? s.total ?? (mockStats[idx]?.value || '0')),
                            label: s.label || s.name || (mockStats[idx]?.label || ''),
                        }));
                    }
                }
            } catch (stockErr) {
                console.warn('[InventoryOverviewPage] getInventoryStock failed, trying dashboard:', stockErr);
                stockDataLoaded = false;
            }

            // Nếu Strategy 1 không có dữ liệu (mảng rỗng hoặc lỗi), thử Strategy 2 và 3
            if (!stockDataLoaded || inventoryData.length === 0) {

                // Strategy 2: Lấy từ dashboard
                try {
                    console.log('[InventoryOverviewPage] Trying getManagerDashboard...');
                    const dashboardData = await getManagerDashboard();
                    console.log('[InventoryOverviewPage] getManagerDashboard response:', dashboardData);
                    const payload = dashboardData?.data || dashboardData;

                    inventoryData = parseArrayResponse(payload);

                    // Nếu dashboard có dữ liệu, dùng luôn
                    if (inventoryData.length > 0) {
                        console.log('[InventoryOverviewPage] Loaded', inventoryData.length, 'items from dashboard');
                    } else {
                        throw new Error('Dashboard has no inventory data');
                    }

                    if (payload?.inventorySummary) {
                        const summary = payload.inventorySummary;
                        if (Array.isArray(summary)) {
                            statsData = summary.map((s, idx) => ({
                                ...(mockStats[idx] || mockStats[0]),
                                value: String(s.value ?? (mockStats[idx]?.value || '0')),
                                label: s.label || s.name || (mockStats[idx]?.label || ''),
                            }));
                        }
                    }
                } catch (dashboardErr) {
                    console.warn('[InventoryOverviewPage] getManagerDashboard failed or empty, trying receipts:', dashboardErr);

                    // Strategy 3: Tính tồn kho từ phiếu nhập (DONE) - phiếu xuất (DONE)
                    // Lưu ý: Chỉ phiếu nhập status = DONE mới được cập nhật vào stock_balances
                    try {
                        console.log('[InventoryOverviewPage] Calculating stock from receipts - issues...');

                        // Lấy tất cả phiếu nhập
                        const receiptsResponse = await listInventoryReceipts({});
                        console.log('[InventoryOverviewPage] listInventoryReceipts response:', receiptsResponse);

                        // Parse receipts
                        let receipts = [];
                        receipts = parseArrayResponse(receiptsResponse);

                        // Lọc chỉ lấy phiếu nhập đã duyệt (status = DONE)
                        // Lưu ý: Chỉ phiếu nhập status = DONE mới được cập nhật vào stock_balances
                        // APPROVED chưa đủ, phải là DONE
                        const approvedReceipts = receipts.filter(
                            (r) => r.status === 'DONE'
                        );
                        console.log('[InventoryOverviewPage] DONE receipts (will update stock_balances):', approvedReceipts.length);

                        // Lấy tất cả phiếu xuất
                        let issues = [];
                        try {
                            const issuesResponse = await listInventoryIssues({});
                            console.log('[InventoryOverviewPage] listInventoryIssues response:', issuesResponse);

                            issues = parseArrayResponse(issuesResponse);
                        } catch (issuesErr) {
                            console.warn('[InventoryOverviewPage] Could not load issues, assuming 0:', issuesErr);
                            issues = [];
                        }

                        // Lọc chỉ lấy phiếu xuất đã duyệt (status = DONE)
                        // Tương tự, chỉ phiếu xuất DONE mới được trừ khỏi stock_balances
                        const approvedIssues = issues.filter(
                            (i) => i.status === 'DONE'
                        );
                        console.log('[InventoryOverviewPage] DONE issues (will reduce stock_balances):', approvedIssues.length);

                        // Aggregate: Tính tổng nhập - tổng xuất theo itemCategoryId
                        const itemMap = new Map();

                        // Cộng từ phiếu nhập
                        approvedReceipts.forEach((receipt) => {
                            const lines = receipt.lines || receipt.lineItems || [];
                            lines.forEach((line) => {
                                const itemCategoryId = line.itemCategoryId || line.itemId;
                                if (!itemCategoryId) return;

                                const categoryInfo = categoriesMap.get(String(itemCategoryId)) || {};
                                const existing = itemMap.get(itemCategoryId) || {
                                    id: itemCategoryId,
                                    itemCategoryId: itemCategoryId,
                                    code: categoryInfo.code || line.itemCode || `#ITEM-${itemCategoryId}`,
                                    name: categoryInfo.name || line.itemName || line.itemCategoryName || 'Mặt hàng',
                                    category: categoryInfo.name || line.itemCategoryName || 'Khác',
                                    unit: categoryInfo.unit || line.unit || 'Đơn vị',
                                    qty: 0,
                                };
                                existing.qty += parseNumber(line.qty ?? line.quantity ?? line.balance ?? 0);
                                itemMap.set(itemCategoryId, existing);
                            });
                        });

                        // Trừ từ phiếu xuất
                        approvedIssues.forEach((issue) => {
                            const lines = issue.lines || issue.lineItems || [];
                            lines.forEach((line) => {
                                const itemCategoryId = line.itemCategoryId || line.itemId;
                                if (!itemCategoryId) return;

                                const existing = itemMap.get(itemCategoryId);
                                if (existing) {
                                    existing.qty -= parseNumber(line.qty ?? line.quantity ?? line.balance ?? 0);
                                    // Đảm bảo không âm
                                    if (existing.qty < 0) existing.qty = 0;
                                }
                            });
                        });

                        inventoryData = Array.from(itemMap.values());
                        console.log('[InventoryOverviewPage] Calculated stock (DONE receipts - DONE issues):', inventoryData);
                    } catch (receiptsErr) {
                        console.error('[InventoryOverviewPage] All APIs failed:', receiptsErr);
                        inventoryData = [];
                    }
                }
            }

            // Normalize inventory data
            // Hỗ trợ nhiều format từ API stock_balances hoặc từ tính toán receipts-issues
            const normalizedInventory = inventoryData.map((item, idx) => {
                // Parse số lượng từ nhiều field khác nhau
                const qty = parseNumber(
                    item.qty ??
                    item.quantity ??
                    item.stockQty ??
                    item.stockQuantity ??
                    item.balance ??
                    item.availableQty ??
                    item.onHandQty ??
                    item.totalQty ??
                    0
                );

                // Parse itemCategoryId từ nhiều field
                const itemCategoryId = item.itemCategoryId || item.itemId || item.categoryId || item.id;
                const categoryInfo = categoriesMap.get(String(itemCategoryId)) || {};
                const categoryName = item.category || item.categoryName || item.itemCategoryName || categoryInfo.name || 'Khác';
                const unitValue = item.unit || item.uom || item.unitOfMeasure || categoryInfo.unit || 'Đơn vị';

                return {
                    id: itemCategoryId || item.id || `item-${idx}`,
                    code:
                        item.code ||
                        item.itemCode ||
                        item.categoryCode ||
                        categoryInfo.code ||
                        `#ITEM-${String(idx + 1).padStart(3, '0')}`,
                    name: item.name || item.itemName || item.productName || item.itemCategoryName || item.categoryName || 'Mặt hàng',
                    category: categoryName,
                    unit: unitValue,
                    qty: qty,
                    status: item.status || (qty > 0 ? 'Ổn định' : 'Hết hàng'),
                    statusType: item.statusType || (qty > 0 && qty < 100 ? 'low' : 'stable'),
                };
            });

            console.log('[InventoryOverviewPage] Normalized inventory:', normalizedInventory);
            // Chỉ set data từ backend, không fallback về mock nếu không có data
            setInventory(normalizedInventory);
            setStats(statsData);
        } catch (err) {
            console.error('[InventoryOverviewPage] loadInventory error:', err);
            setError(err?.message || 'Không thể tải dữ liệu tồn kho');
            // Không set mock data khi có lỗi - để hiển thị empty state
            setInventory([]);
            // Giữ stats mặc định nếu có lỗi
            setStats(mockStats);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const filteredInventory = useMemo(() => {
        if (!searchQuery.trim()) return inventory;
        const q = searchQuery.toLowerCase();
        return inventory.filter(
            (item) =>
                item.code.toLowerCase().includes(q) ||
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
        );
    }, [inventory, searchQuery]);

    return (
        <div className="space-y-6">
            {/* ===== HEADER ===== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý Kho Trung tâm
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Hệ thống quản lý hàng cứu trợ bão lụt
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        to={MANAGER_ROUTES.CREATE_RECEIPT}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo phiếu nhập
                    </Link>
                    <Link
                        to={MANAGER_ROUTES.CREATE_ISSUE}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo phiếu xuất
                    </Link>
                </div>
            </div>

            {/* ===== METRIC CARDS ===== */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {stat.label}
                        </p>
                        <p className={`mt-1 text-2xl font-bold ${stat.color || 'text-slate-800'}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ===== CURRENT STOCK TABLE ===== */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Bảng tồn kho hiện có
                    </h2>
                    <div className="flex items-center gap-2">
                        <Link
                            to={MANAGER_ROUTES.ITEM_CATEGORIES}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Tag className="h-3.5 w-3.5" />
                            Quản lý danh mục hàng
                        </Link>
                        <button
                            type="button"
                            onClick={loadInventory}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mặt hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                        <p className="mt-2">Đang tải dữ liệu tồn kho...</p>
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                        Chưa có hàng tồn kho. Hãy tạo phiếu nhập để thêm hàng vào kho.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mã hàng
                                    </th>
                                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Phân loại
                                    </th>
                                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Đơn vị
                                    </th>
                                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Số lượng tồn
                                    </th>
                                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                    >
                                        <td className="py-3 text-sm font-medium text-slate-900">
                                            {item.code}
                                        </td>
                                        <td className="py-3 text-sm text-slate-600">
                                            {item.category}
                                        </td>
                                        <td className="py-3 text-sm text-slate-600">
                                            {item.unit}
                                        </td>
                                        <td
                                            className={`py-3 text-right text-sm font-medium ${item.statusType === 'low'
                                                ? 'text-red-600'
                                                : 'text-slate-900'
                                                }`}
                                        >
                                            {item.qty.toLocaleString()}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${item.statusType === 'low'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ===== COORDINATION NOTE ===== */}
            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">Lưu ý điều phối</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Hệ thống đang ở chế độ Kho Trung tâm duy nhất. Mọi phiếu nhập/xuất
                        sẽ được ghi nhận trực tiếp vào tổng tồn kho.
                    </p>
                </div>
            </div>
        </div>
    );
}
