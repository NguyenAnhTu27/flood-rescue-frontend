import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, FilePlus2, Info, Package, TriangleAlert } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { createInventoryIssue, getInventoryStock, getReliefRequest } from '../../../features/relief/api.js';

const SAMPLE_ITEMS = [
    { id: 'gao', name: 'Gao', unit: 'Kg', requestedQty: 1000, itemCategoryId: null },
    { id: 'mi-goi', name: 'Mi tom Hao Hao', unit: 'Thung', requestedQty: 500, itemCategoryId: null },
    { id: 'nuoc-uong', name: 'Nuoc tinh khiet (500ml)', unit: 'Chai', requestedQty: 2000, itemCategoryId: null },
];

function parseList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.inventoryItems)) return data.inventoryItems;
    if (Array.isArray(data?.stocks)) return data.stocks;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.lines)) return data.lines;
    return [];
}

function normalizeKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function toNumber(value) {
    if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '').trim();
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
    return toNumber(value).toLocaleString('en-US');
}

function createVoucherCode() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
    return `PPH-${y}${m}${d}-${random}`;
}

function mapReliefItems(requestDetail) {
    const list =
        parseList(requestDetail?.items).length > 0
            ? parseList(requestDetail?.items)
            : parseList(requestDetail?.essentialItems).length > 0
                ? parseList(requestDetail?.essentialItems)
                : parseList(requestDetail?.lines);

    if (list.length === 0) return SAMPLE_ITEMS;

    return list.map((item, index) => {
        if (typeof item === 'string') {
            return {
                id: `line-${index}`,
                name: item,
                unit: '',
                requestedQty: 0,
                itemCategoryId: null,
            };
        }

        return {
            id: item?.id || item?.itemId || item?.itemCategoryId || `line-${index}`,
            name: item?.itemName || item?.name || item?.item || `Mat hang ${index + 1}`,
            unit: item?.unit || '',
            requestedQty: toNumber(item?.quantity || item?.qty || 0),
            itemCategoryId: item?.itemCategoryId ?? item?.itemId ?? item?.id ?? null,
        };
    });
}

function buildStockLookups(stockList) {
    const byName = new Map();
    const byCategoryId = new Map();

    for (const stockItem of stockList) {
        const name =
            stockItem?.itemCategory?.name ||
            stockItem?.itemCategoryName ||
            stockItem?.categoryName ||
            stockItem?.itemName ||
            stockItem?.name ||
            '';
        const nameKey = normalizeKey(name);
        const qty = toNumber(
            stockItem?.totalQty ??
                stockItem?.qty ??
                stockItem?.quantity ??
                stockItem?.balance ??
                stockItem?.stockQty ??
                stockItem?.stockQuantity ??
                ((toNumber(stockItem?.donationQty) || 0) + (toNumber(stockItem?.purchaseQty) || 0))
        );
        const itemCategoryId =
            stockItem?.itemCategory?.id ??
            stockItem?.itemCategoryId ??
            stockItem?.itemId ??
            stockItem?.categoryId ??
            null;
        const unit = stockItem?.itemCategory?.unit || stockItem?.unit || '';

        if (nameKey) {
            const existingByName = byName.get(nameKey) || { qty: 0, itemCategoryId, unit };
            existingByName.qty += qty;
            if (!existingByName.itemCategoryId && itemCategoryId) existingByName.itemCategoryId = itemCategoryId;
            if (!existingByName.unit && unit) existingByName.unit = unit;
            byName.set(nameKey, existingByName);
        }
        if (itemCategoryId !== null && itemCategoryId !== undefined) {
            const key = String(itemCategoryId);
            const existingByCategory = byCategoryId.get(key) || { qty: 0, itemCategoryId, unit };
            existingByCategory.qty += qty;
            if (!existingByCategory.unit && unit) existingByCategory.unit = unit;
            byCategoryId.set(key, existingByCategory);
        }
    }

    return { byName, byCategoryId };
}

function isCentralWarehouseStock(stockItem) {
    const warehouseText = String(
        stockItem?.warehouseName ||
            stockItem?.warehouse ||
            stockItem?.warehouseCode ||
            stockItem?.warehouseType ||
            ''
    ).toLowerCase();

    if (!warehouseText) return true;
    return (
        warehouseText.includes('trung tam') ||
        warehouseText.includes('trungtam') ||
        warehouseText.includes('central') ||
        warehouseText.includes('main')
    );
}

async function loadCentralWarehouseStock() {
    const preferredParams = {
        warehouseName: 'Kho Trung tam',
        warehouseType: 'CENTRAL',
    };

    try {
        const preferredData = await getInventoryStock(preferredParams);
        const preferredList = parseList(preferredData);
        if (preferredList.length > 0) return preferredList;
    } catch (e) {
        console.warn('[DistributionVoucherPage] getInventoryStock with central params failed:', e);
    }

    const fallbackData = await getInventoryStock();
    const fallbackList = parseList(fallbackData);
    return fallbackList.filter(isCentralWarehouseStock);
}

export default function DistributionVoucherPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get('requestId');

    const [voucherCode] = useState(() => createVoucherCode());
    const [warehouse] = useState('Kho Trung tam');
    const [requestLabel, setRequestLabel] = useState('REQ-2023-001 - Cuu tro Quang Binh (Da duyet)');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [requestRes, stockRes] = await Promise.allSettled([
                    requestId ? getReliefRequest(requestId) : Promise.resolve(null),
                    loadCentralWarehouseStock(),
                ]);

                const requestDetail = requestRes.status === 'fulfilled' ? requestRes.value : null;
                const stockList = stockRes.status === 'fulfilled' ? parseList(stockRes.value) : [];

                if (requestDetail) {
                    const code = requestDetail?.code || requestDetail?.requestCode || requestDetail?.id || requestId;
                    const area = requestDetail?.targetAreaName || requestDetail?.targetArea || requestDetail?.area || requestDetail?.location || '';
                    setRequestLabel(`${code}${area ? ` - ${area}` : ''} (Da duyet)`);
                } else if (requestId) {
                    setRequestLabel(`${requestId} (Da duyet)`);
                }

                const requestItems = mapReliefItems(requestDetail);
                const stockLookup = buildStockLookups(stockList);

                const mappedRows = requestItems.map((item, index) => {
                    const byCategory = item.itemCategoryId ? stockLookup.byCategoryId.get(String(item.itemCategoryId)) : null;
                    const byName = stockLookup.byName.get(normalizeKey(item.name));
                    const stockMatch = byCategory || byName || { qty: 0, itemCategoryId: item.itemCategoryId };
                    const requestedQty = toNumber(item.requestedQty);
                    const stockQty = toNumber(stockMatch.qty);

                    return {
                        id: `${item.id}-${index}`,
                        itemCategoryId: stockMatch.itemCategoryId ?? item.itemCategoryId ?? null,
                        name: item.name,
                        unit: item.unit || stockMatch.unit || '-',
                        requestedQty,
                        stockQty,
                        distributeQty: requestedQty,
                    };
                });

                setRows(mappedRows);
                setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            } catch (e) {
                setError(e?.message || 'Khong the tai du lieu tao phieu phan phoi.');
                setRows(
                    SAMPLE_ITEMS.map((item) => ({
                        ...item,
                        stockQty: 0,
                        distributeQty: item.requestedQty,
                    }))
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [requestId]);

    const shortageRows = useMemo(() => {
        return rows.filter((row) => row.distributeQty > row.stockQty);
    }, [rows]);

    const canSubmit = useMemo(() => {
        if (rows.length === 0) return false;
        if (rows.every((row) => row.distributeQty <= 0)) return false;
        if (shortageRows.length > 0) return false;
        return true;
    }, [rows, shortageRows]);

    const handleQtyChange = (id, nextValue) => {
        const cleanValue = Math.max(0, toNumber(nextValue));
        setRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? {
                        ...row,
                        distributeQty: cleanValue,
                    }
                    : row
            )
        );
    };

    const handleCancel = () => {
        navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
    };

    const handleCreateVoucher = async () => {
        if (!canSubmit) {
            setError('Khong the tao phieu: vui long dieu chinh so luong phan phoi hop le.');
            return;
        }

        const validLines = rows
            .filter((row) => row.distributeQty > 0 && row.itemCategoryId)
            .map((row) => ({
                itemCategoryId: Number(row.itemCategoryId),
                qty: Number(row.distributeQty),
                unit: row.unit === '-' ? '' : row.unit,
            }));

        if (validLines.length === 0) {
            setError('Khong tim thay itemCategoryId de tao phieu xuat kho tu danh sach hien tai.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const payload = {
                code: voucherCode,
                lines: validLines,
                note: `Phieu phan phoi tao tu yeu cau ${requestLabel}`,
            };

            if (requestId && Number.isFinite(Number(requestId))) {
                payload.reliefRequestId = Number(requestId);
            }

            await createInventoryIssue(payload);
            window.alert('Da tao phieu phan phoi thanh cong.');
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
        } catch (e) {
            setError(e?.message || 'Tao phieu phan phoi that bai. Vui long thu lai.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="text-xs text-slate-500">
                <button onClick={() => navigate(MANAGER_ROUTES.DASHBOARD)} className="hover:text-slate-700">
                    Trang chu
                </button>{' '}
                /{' '}
                <button onClick={() => navigate(MANAGER_ROUTES.DISTRIBUTION_PLAN)} className="hover:text-slate-700">
                    Phan phoi
                </button>{' '}
                / <span className="font-medium text-blue-600">Tao phieu phan phoi</span>
            </div>

            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tao Phieu Phan phoi Hang hoa</h1>
                <p className="mt-1 text-sm text-slate-500">
                    He thong mac dinh xuat tu <span className="font-semibold text-slate-700">{warehouse}</span> va tu dong tao phieu xuat kho.
                </p>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FilePlus2 className="h-4 w-4 text-blue-600" />
                            Thong tin chung
                        </h2>
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">Ma yeu cau da duyet</p>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                            {requestLabel}
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Kho xuat hang</p>
                        <p className="text-sm font-semibold text-blue-600">{warehouse}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">Ma phieu</p>
                        <p className="text-sm font-semibold text-slate-700">{voucherCode}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Dang tai danh sach hang phan phoi...
                    </div>
                ) : (
                    <>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Package className="h-4 w-4 text-blue-600" />
                                Danh sach hang phan phoi
                            </h3>
                            {lastUpdated && <span className="text-xs text-slate-400">Tai luc {lastUpdated}</span>}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px]">
                                <thead>
                                    <tr className="border-y border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                                        <th className="py-2">Hang hoa</th>
                                        <th className="py-2">DVT</th>
                                        <th className="py-2 text-right">So luong yeu cau</th>
                                        <th className="py-2 text-right">Ton kho thuc te</th>
                                        <th className="py-2 text-right">So luong phan phoi</th>
                                        <th className="py-2 text-center">Canh bao</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {rows.map((row) => {
                                        const isOverStock = row.distributeQty > row.stockQty;
                                        return (
                                            <tr key={row.id}>
                                                <td className="py-3 text-slate-800">{row.name}</td>
                                                <td className="py-3 text-slate-600">{row.unit}</td>
                                                <td className="py-3 text-right font-medium text-slate-700">{formatNumber(row.requestedQty)}</td>
                                                <td className="py-3 text-right font-semibold text-blue-600">{formatNumber(row.stockQty)}</td>
                                                <td className="py-3 text-right">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={row.distributeQty}
                                                        onChange={(e) => handleQtyChange(row.id, e.target.value)}
                                                        className={`w-24 rounded-md border px-2 py-1 text-right outline-none focus:ring-2 ${
                                                            isOverStock
                                                                ? 'border-rose-300 text-rose-600 ring-rose-200'
                                                                : 'border-slate-200 text-slate-700 ring-blue-200'
                                                        }`}
                                                    />
                                                </td>
                                                <td className="py-3 text-center">
                                                    {isOverStock ? (
                                                        <TriangleAlert className="mx-auto h-4 w-4 text-rose-500" />
                                                    ) : (
                                                        <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    Luu y: So luong trong "So luong phan phoi" he thong se xuat kho theo gia tri nay. Neu thieu hang, co the giam so
                                    luong de tao phieu.
                                </span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    disabled={submitting}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Huy bo
                                </button>
                                <button
                                    onClick={handleCreateVoucher}
                                    disabled={submitting || !canSubmit}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FilePlus2 className="h-4 w-4" />
                                    {submitting ? 'Dang tao...' : 'Tao phieu phan phoi'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {(error || shortageRows.length > 0) && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <p className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            {error ||
                                `Co ${shortageRows.length} mat hang dang vuot qua ton kho. Vui long kiem tra lai truoc khi tao phieu.`}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}
