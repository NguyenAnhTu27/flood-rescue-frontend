import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Info, Tag, RefreshCw } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { getInventoryStock, listInventoryReceipts, listInventoryIssues, getItemCategories, getTemporaryInventoryIssues } from '../../../features/relief/api.js';

const DEFAULT_STATS = [
    { id: 'total-items', label: 'TỔNG MẶT HÀNG', value: '0', color: 'text-slate-800' },
    { id: 'current-stock', label: 'TỒN KHO HIỆN TẠI', value: '0', color: 'text-blue-600' },
    { id: 'import-today', label: 'NHẬP TRONG NGÀY', value: '0', color: 'text-green-600' },
    { id: 'export-today', label: 'XUẤT TRONG NGÀY', value: '0', color: 'text-red-600' },
];

export default function InventoryOverviewPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [temporaryIssues, setTemporaryIssues] = useState([]);
    const [stats, setStats] = useState(DEFAULT_STATS);

    // Load dữ liệu tồn kho từ backend
    const loadInventory = async () => {
        try {
            setLoading(true);
            setError(null);

            let inventoryData = [];

            // Strategy 1: Thử lấy từ API tồn kho trực tiếp (/api/inventory/stock)
            // API này đọc từ bảng stock_balances, chỉ có dữ liệu khi có phiếu nhập status = DONE
            let stockDataLoaded = false;
            try {
                console.log('[InventoryOverviewPage] Trying getInventoryStock (from stock_balances table)...');
                const stockData = await getInventoryStock();
                console.log('[InventoryOverviewPage] getInventoryStock response:', stockData);

                // Parse response (có thể là array hoặc { data: [], content: [] })
                if (Array.isArray(stockData)) {
                    inventoryData = stockData;
                } else if (Array.isArray(stockData?.data)) {
                    inventoryData = stockData.data;
                } else if (Array.isArray(stockData?.content)) {
                    inventoryData = stockData.content;
                } else if (Array.isArray(stockData?.items)) {
                    inventoryData = stockData.items;
                } else if (Array.isArray(stockData?.inventoryItems)) {
                    inventoryData = stockData.inventoryItems;
                } else if (Array.isArray(stockData?.lines)) {
                    inventoryData = stockData.lines;
                }

                // Nếu API trả về mảng rỗng [], có nghĩa là chưa có phiếu nhập nào được approve (DONE)
                // → Fallback sang strategy khác để tính tồn kho từ receipts - issues
                if (inventoryData.length === 0) {
                    console.log('[InventoryOverviewPage] stock_balances is empty (no DONE receipts yet), falling back to calculate from receipts-issues');
                    stockDataLoaded = false; // Đánh dấu để fallback
                } else {
                    stockDataLoaded = true; // Có dữ liệu từ stock_balances
                    console.log('[InventoryOverviewPage] Loaded', inventoryData.length, 'items from stock_balances');
                }
            } catch (stockErr) {
                console.warn('[InventoryOverviewPage] getInventoryStock failed, fallback to calculate from receipts-issues:', stockErr);
                stockDataLoaded = false;
            }

            // Nếu Strategy 1 không có dữ liệu (mảng rỗng hoặc lỗi), tính từ receipts/issues DONE
            if (!stockDataLoaded || inventoryData.length === 0) {
                try {
                    console.log('[InventoryOverviewPage] Calculating stock from receipts - issues...');

                    // Lấy danh sách item categories để map thông tin
                    let categoriesMap = new Map();
                    try {
                        const categoriesResponse = await getItemCategories();
                        let categories = [];
                        if (Array.isArray(categoriesResponse)) {
                            categories = categoriesResponse;
                        } else if (Array.isArray(categoriesResponse?.data)) {
                            categories = categoriesResponse.data;
                        } else if (Array.isArray(categoriesResponse?.content)) {
                            categories = categoriesResponse.content;
                        }

                        categories.forEach((cat) => {
                            if (cat.id) {
                                categoriesMap.set(cat.id, {
                                    code: cat.code || `#CAT-${cat.id}`,
                                    name: cat.name || 'Danh mục',
                                    unit: cat.unit || 'Đơn vị',
                                });
                            }
                        });
                    } catch (catErr) {
                        console.warn('[InventoryOverviewPage] Could not load categories:', catErr);
                    }

                    const receiptsResponse = await listInventoryReceipts({});
                    const issuesResponse = await listInventoryIssues({});
                    const receipts = Array.isArray(receiptsResponse)
                        ? receiptsResponse
                        : Array.isArray(receiptsResponse?.content)
                            ? receiptsResponse.content
                            : Array.isArray(receiptsResponse?.data)
                                ? receiptsResponse.data
                                : [];
                    const issues = Array.isArray(issuesResponse)
                        ? issuesResponse
                        : Array.isArray(issuesResponse?.content)
                            ? issuesResponse.content
                            : Array.isArray(issuesResponse?.data)
                                ? issuesResponse.data
                                : [];

                    const approvedReceipts = receipts.filter((r) => String(r?.status || '').toUpperCase() === 'DONE');
                    const approvedIssues = issues.filter((i) => String(i?.status || '').toUpperCase() === 'DONE');

                    const itemMap = new Map();

                    approvedReceipts.forEach((receipt) => {
                        const lines = receipt.lines || receipt.lineItems || [];
                        lines.forEach((line) => {
                            const itemCategoryId = line.itemCategoryId || line.itemId;
                            if (!itemCategoryId) return;

                            const categoryInfo = categoriesMap.get(itemCategoryId) || {};
                            const existing = itemMap.get(itemCategoryId) || {
                                id: itemCategoryId,
                                itemCategoryId,
                                code: categoryInfo.code || line.itemCode || `#ITEM-${itemCategoryId}`,
                                name: categoryInfo.name || line.itemName || line.itemCategoryName || 'Mặt hàng',
                                category: categoryInfo.name || line.itemCategoryName || 'Khác',
                                unit: categoryInfo.unit || line.unit || 'Đơn vị',
                                qty: 0,
                            };
                            existing.qty += Number(line.qty || line.quantity || 0);
                            itemMap.set(itemCategoryId, existing);
                        });
                    });

                    approvedIssues.forEach((issue) => {
                        const lines = issue.lines || issue.lineItems || [];
                        lines.forEach((line) => {
                            const itemCategoryId = line.itemCategoryId || line.itemId;
                            if (!itemCategoryId) return;

                            const existing = itemMap.get(itemCategoryId);
                            if (existing) {
                                existing.qty -= Number(line.qty || line.quantity || 0);
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

            // Normalize inventory data
            // Hỗ trợ nhiều format từ API stock_balances hoặc từ tính toán receipts-issues
            const normalizedInventory = inventoryData.map((item, idx) => {
                // Parse số lượng từ nhiều field khác nhau
                const donationQty = Number(item.donationQty ?? item.donation_qty ?? 0);
                const purchaseQty = Number(item.purchaseQty ?? item.purchase_qty ?? 0);
                const totalQtyFromSource = item.totalQty ?? item.total_qty;
                const qty = typeof item.qty === 'number'
                    ? item.qty
                    : typeof item.quantity === 'number'
                        ? item.quantity
                        : typeof totalQtyFromSource === 'number'
                            ? totalQtyFromSource
                        : typeof item.stockQty === 'number'
                            ? item.stockQty
                            : typeof item.stockQuantity === 'number'
                                ? item.stockQuantity
                                : typeof item.balance === 'number'
                                    ? item.balance
                                    : Number(
                                        item.qty
                                        || item.quantity
                                        || totalQtyFromSource
                                        || item.stockQty
                                        || item.stockQuantity
                                        || item.balance
                                        || (donationQty + purchaseQty)
                                        || 0
                                    );

                // Parse itemCategoryId từ nhiều field
                const itemCategoryId = item.itemCategoryId || item.itemId || item.categoryId || item.id;

                return {
                    id: itemCategoryId || item.id || `item-${idx}`,
                    code: item.code || item.itemCode || item.categoryCode || `#ITEM-${String(idx + 1).padStart(3, '0')}`,
                    name: item.name || item.itemName || item.itemCategoryName || item.categoryName || 'Mặt hàng',
                    category: item.category || item.categoryName || item.itemCategoryName || 'Khác',
                    unit: item.unit || item.uom || item.unitOfMeasure || 'Đơn vị',
                    qty: qty,
                    status: item.status || (qty > 0 ? 'Ổn định' : 'Hết hàng'),
                    statusType: item.statusType || (qty > 0 && qty < 100 ? 'low' : 'stable'),
                };
            });

            console.log('[InventoryOverviewPage] Normalized inventory:', normalizedInventory);
            // Chỉ set data từ backend, không fallback về mock nếu không có data
            setInventory(normalizedInventory);

            // Tính stats theo dữ liệu thực tế:
            // - total-items / current-stock lấy từ tồn kho hiện có
            // - import/export trong ngày chỉ tính phiếu DONE
            const [receiptsForStatsResp, issuesForStatsResp] = await Promise.allSettled([
                listInventoryReceipts({}),
                listInventoryIssues({}),
            ]);
            const receiptsForStats = receiptsForStatsResp.status === 'fulfilled'
                ? (Array.isArray(receiptsForStatsResp.value)
                    ? receiptsForStatsResp.value
                    : Array.isArray(receiptsForStatsResp.value?.content)
                        ? receiptsForStatsResp.value.content
                        : Array.isArray(receiptsForStatsResp.value?.data)
                            ? receiptsForStatsResp.value.data
                            : [])
                : [];
            const issuesForStats = issuesForStatsResp.status === 'fulfilled'
                ? (Array.isArray(issuesForStatsResp.value)
                    ? issuesForStatsResp.value
                    : Array.isArray(issuesForStatsResp.value?.content)
                        ? issuesForStatsResp.value.content
                        : Array.isArray(issuesForStatsResp.value?.data)
                            ? issuesForStatsResp.value.data
                            : [])
                : [];

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const importTodayQty = receiptsForStats
                .filter((r) => String(r?.status || '').toUpperCase() === 'DONE')
                .filter((r) => new Date(r?.updatedAt || r?.createdAt || 0) >= startOfToday)
                .reduce((sum, r) => {
                    const lines = r?.lines || r?.lineItems || [];
                    return sum + lines.reduce((s, line) => s + Number(line?.qty || line?.quantity || 0), 0);
                }, 0);

            const exportTodayQty = issuesForStats
                .filter((i) => String(i?.status || '').toUpperCase() === 'DONE')
                .filter((i) => new Date(i?.updatedAt || i?.createdAt || 0) >= startOfToday)
                .reduce((sum, i) => {
                    const lines = i?.lines || i?.lineItems || [];
                    return sum + lines.reduce((s, line) => s + Number(line?.qty || line?.quantity || 0), 0);
                }, 0);

            const totalCurrentStock = normalizedInventory.reduce((sum, item) => sum + Number(item?.qty || 0), 0);

            setStats([
                { id: 'total-items', label: 'TỔNG MẶT HÀNG', value: String(normalizedInventory.length), color: 'text-slate-800' },
                { id: 'current-stock', label: 'TỒN KHO HIỆN TẠI', value: totalCurrentStock.toLocaleString('vi-VN'), color: 'text-blue-600' },
                { id: 'import-today', label: 'NHẬP TRONG NGÀY', value: importTodayQty.toLocaleString('vi-VN'), color: 'text-green-600' },
                { id: 'export-today', label: 'XUẤT TRONG NGÀY', value: exportTodayQty.toLocaleString('vi-VN'), color: 'text-red-600' },
            ]);

            try {
                const tempIssuesResp = await getTemporaryInventoryIssues();
                const list = Array.isArray(tempIssuesResp)
                    ? tempIssuesResp
                    : Array.isArray(tempIssuesResp?.data)
                        ? tempIssuesResp.data
                        : Array.isArray(tempIssuesResp?.content)
                            ? tempIssuesResp.content
                            : [];
                setTemporaryIssues(list);
            } catch {
                setTemporaryIssues([]);
            }
        } catch (err) {
            console.error('[InventoryOverviewPage] loadInventory error:', err);
            setError(err?.message || 'Không thể tải dữ liệu tồn kho');
            // Không set mock data khi có lỗi - để hiển thị empty state
            setInventory([]);
            // Giữ stats mặc định nếu có lỗi
            setStats(DEFAULT_STATS);
            setTemporaryIssues([]);
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
                        to={MANAGER_ROUTES.DASHBOARD}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                        Xử lý yêu cầu cứu trợ
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
                            Danh mục hàng
                        </Link>
                        <Link
                            to={MANAGER_ROUTES.ITEM_CLASSIFICATIONS}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Tag className="h-3.5 w-3.5" />
                            Phân loại hàng
                        </Link>
                        <Link
                            to={MANAGER_ROUTES.ITEM_UNITS}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Tag className="h-3.5 w-3.5" />
                            Đơn vị quản lý
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">Tạm trừ theo đội đang nhận hàng</h3>
                {temporaryIssues.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-800">Hiện không có phiếu xuất nào ở trạng thái tạm trừ.</p>
                ) : (
                    <div className="mt-2 space-y-2">
                        {temporaryIssues.map((issue) => (
                            <div key={issue.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700">
                                <div className="font-semibold text-slate-900">
                                    {issue.code} - Đội: {issue.assignedTeamName || issue.assignedTeamCode || issue.assignedTeamId || '—'}
                                </div>
                                <div className="mt-1">
                                    Lý do tạm trừ: {issue.note || 'Đội đang lấy hàng đi cứu trợ (trạng thái đã tới điểm cứu trợ).'}
                                </div>
                                <div className="mt-1">
                                    Tạm trừ:
                                    {' '}
                                    {(issue.lines || []).map((l) => `${l.itemCode || l.itemName}: ${l.qty} ${l.unit}`).join(' | ') || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
