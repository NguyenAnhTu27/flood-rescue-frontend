import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, FilePlus2, Info, Package, TriangleAlert } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { getInventoryStock, getReliefRequest, listInventoryIssues, listReliefRequests } from '../../../features/relief/api.js';
import { createDistributionVoucher } from '../../../features/relief/apiDistribution.js';
import { getTeams } from '../../../features/teams/api.js';
import { getAssets } from '../../../features/assets/api.js';

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

function parseDateValue(value) {
    if (!value) return 0;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function normalizeIssue(issue, idx = 0) {
    const id = issue?.id ?? issue?.issueId ?? null;
    const code = issue?.code || issue?.issueCode || (id ? `PXK-${id}` : `PXK-${idx + 1}`);
    const createdAt =
        issue?.createdAt ||
        issue?.createdDate ||
        issue?.createdTime ||
        issue?.dateCreated ||
        issue?.issueDate ||
        null;
    const warehouseName =
        issue?.warehouseName ||
        issue?.warehouse ||
        issue?.warehouseCode ||
        issue?.fromWarehouseName ||
        'Kho Trung tam';

    return {
        id,
        code,
        createdAt,
        createdAtTs: parseDateValue(createdAt),
        warehouseName,
    };
}

function normalizeReliefRequest(req, idx = 0) {
    const id = req?.id ?? req?.requestId ?? null;
    const code = req?.code || req?.requestCode || (id ? `REQ-${id}` : `REQ-${idx + 1}`);
    const area = req?.targetAreaName || req?.targetArea || req?.area || req?.location || '';
    const createdAt = req?.createdAt || req?.dateSent || req?.createdDate || req?.createdTime || null;

    return {
        id,
        code,
        area,
        createdAt,
        createdAtTs: parseDateValue(createdAt),
    };
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
    const [warehouse, setWarehouse] = useState('Kho Trung tam');
    const [requestLabel, setRequestLabel] = useState('Khong co yeu cau cuu tro tham chieu');
    const [rows, setRows] = useState([]);
    const [stockSnapshot, setStockSnapshot] = useState([]);
    const [teams, setTeams] = useState([]);
    const [assets, setAssets] = useState([]);
    const [issueOptions, setIssueOptions] = useState([]);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [selectedApprovedRequestId, setSelectedApprovedRequestId] = useState('');
    const [dispatchForm, setDispatchForm] = useState({
        issueRefCode: '',
        teamId: '',
        assetId: '',
        contactName: '',
        contactPhone: '',
        deliveryAddress: '',
        eta: '',
        priority: 'TRUNG_BINH',
        dispatchNote: '',
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [stockRes, teamsRes, assetsRes, issuesRes, approvedReqRes] = await Promise.allSettled([
                    loadCentralWarehouseStock(),
                    getTeams(),
                    getAssets(),
                    listInventoryIssues({ size: 100 }),
                    listReliefRequests({ status: 'APPROVED', size: 100 }),
                ]);

                const stockList = stockRes.status === 'fulfilled' ? parseList(stockRes.value) : [];
                const loadedTeams = teamsRes.status === 'fulfilled' ? parseList(teamsRes.value) : [];
                const loadedAssets = assetsRes.status === 'fulfilled' ? parseList(assetsRes.value) : [];
                const issueListRaw = issuesRes.status === 'fulfilled' ? parseList(issuesRes.value) : [];
                const approvedRaw = approvedReqRes.status === 'fulfilled' ? parseList(approvedReqRes.value) : [];
                const sortedIssues = issueListRaw
                    .map((issue, idx) => normalizeIssue(issue, idx))
                    .sort((a, b) => {
                        if (a.createdAtTs !== b.createdAtTs) return b.createdAtTs - a.createdAtTs;
                        return String(b.code).localeCompare(String(a.code));
                    });
                const sortedApprovedRequests = approvedRaw
                    .map((req, idx) => normalizeReliefRequest(req, idx))
                    .filter((req) => req.id !== null && req.id !== undefined)
                    .sort((a, b) => {
                        if (a.createdAtTs !== b.createdAtTs) return b.createdAtTs - a.createdAtTs;
                        return String(b.code).localeCompare(String(a.code));
                    });

                setStockSnapshot(stockList);
                setTeams(loadedTeams);
                setAssets(loadedAssets);
                setIssueOptions(sortedIssues);
                setApprovedRequests(sortedApprovedRequests);
                if (sortedApprovedRequests.length > 0) {
                    const queryMatched = requestId
                        ? sortedApprovedRequests.find((req) => String(req.id) === String(requestId))
                        : null;
                    const selectedRequest = queryMatched || sortedApprovedRequests[0];
                    setSelectedApprovedRequestId(String(selectedRequest.id));
                    setRequestLabel(`${selectedRequest.code}${selectedRequest.area ? ` - ${selectedRequest.area}` : ''} (Da duyet)`);
                } else {
                    setSelectedApprovedRequestId('');
                    setRequestLabel('Khong co yeu cau cuu tro da duyet');
                    setRows([]);
                }
                if (sortedIssues.length > 0) {
                    const latestIssue = sortedIssues[0];
                    setDispatchForm((prev) => ({
                        ...prev,
                        issueRefCode: prev.issueRefCode || latestIssue.code,
                    }));
                    setWarehouse(latestIssue.warehouseName || 'Kho Trung tam');
                }
                setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            } catch (e) {
                setError(e?.message || 'Khong the tai du lieu tao phieu dieu phoi.');
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

    const handleDispatchField = (field, value) => {
        setDispatchForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    useEffect(() => {
        if (!dispatchForm.issueRefCode) return;
        const selectedIssue = issueOptions.find((issue) => issue.code === dispatchForm.issueRefCode);
        if (selectedIssue?.warehouseName) {
            setWarehouse(selectedIssue.warehouseName);
        }
    }, [dispatchForm.issueRefCode, issueOptions]);

    useEffect(() => {
        const loadSelectedRequest = async () => {
            if (!selectedApprovedRequestId) return;

            try {
                const detail = await getReliefRequest(selectedApprovedRequestId);
                const code = detail?.code || detail?.requestCode || detail?.id || selectedApprovedRequestId;
                const area = detail?.targetAreaName || detail?.targetArea || detail?.area || detail?.location || '';
                setRequestLabel(`${code}${area ? ` - ${area}` : ''} (Da duyet)`);

                const requestItems = mapReliefItems(detail);
                const stockLookup = buildStockLookups(stockSnapshot);
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
            } catch {
                const selectedReq = approvedRequests.find((req) => String(req.id) === String(selectedApprovedRequestId));
                if (selectedReq) {
                    setRequestLabel(`${selectedReq.code}${selectedReq.area ? ` - ${selectedReq.area}` : ''} (Da duyet)`);
                }
                setRows([]);
            }
        };

        loadSelectedRequest();
    }, [selectedApprovedRequestId, stockSnapshot, approvedRequests]);

    const shortageRows = useMemo(() => {
        return rows.filter((row) => row.distributeQty > row.stockQty);
    }, [rows]);

    const canSubmit = useMemo(() => {
        if (!dispatchForm.issueRefCode) return false;
        if (!selectedApprovedRequestId) return false;
        if (rows.length === 0) return false;
        if (rows.every((row) => row.distributeQty <= 0)) return false;
        if (shortageRows.length > 0) return false;
        return true;
    }, [dispatchForm.issueRefCode, selectedApprovedRequestId, rows, shortageRows]);

    const selectedIssue = useMemo(() => {
        return issueOptions.find((issue) => issue.code === dispatchForm.issueRefCode) || null;
    }, [dispatchForm.issueRefCode, issueOptions]);

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
        if (!dispatchForm.issueRefCode) {
            setError('Vui long chon phieu xuat kho tham chieu.');
            return;
        }
        if (!selectedApprovedRequestId) {
            setError('Vui long chon yeu cau cuu tro da duyet.');
            return;
        }
        if (!canSubmit) {
            setError('Khong the tao phieu: vui long dieu chinh so luong dieu phoi hop le.');
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
                issueId: selectedIssue?.id || undefined,
                issueRefCode: dispatchForm.issueRefCode || undefined,
                receiverName: dispatchForm.contactName || undefined,
                receiverPhone: dispatchForm.contactPhone || undefined,
                deliveryAddress: dispatchForm.deliveryAddress || undefined,
                eta: dispatchForm.eta || undefined,
                priority: dispatchForm.priority || undefined,
                note: dispatchForm.dispatchNote || undefined,
            };

            if (selectedApprovedRequestId && Number.isFinite(Number(selectedApprovedRequestId))) {
                payload.reliefRequestId = Number(selectedApprovedRequestId);
            }
            if (dispatchForm.teamId && Number.isFinite(Number(dispatchForm.teamId))) {
                payload.teamId = Number(dispatchForm.teamId);
            }
            if (dispatchForm.assetId && Number.isFinite(Number(dispatchForm.assetId))) {
                payload.assetId = Number(dispatchForm.assetId);
            }

            await createDistributionVoucher(payload);
            window.alert('Da tao phieu dieu phoi thanh cong.');
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
        } catch (e) {
            setError(e?.message || 'Tao phieu dieu phoi that bai. Vui long thu lai.');
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
                / <span className="font-medium text-blue-600">Tao phieu dieu phoi</span>
            </div>

            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tao Phieu Dieu phoi Giao hang</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Chung tu dieu phoi cho khau giao hang, tach biet voi nghiep vu xuat kho.
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
                        <select
                            value={selectedApprovedRequestId}
                            onChange={(e) => setSelectedApprovedRequestId(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chon yeu cau da duyet</option>
                            {approvedRequests.map((req) => (
                                <option key={req.id} value={String(req.id)}>
                                    {req.code}{req.area ? ` - ${req.area}` : ''}{req.createdAt ? ` - ${new Date(req.createdAt).toLocaleDateString('vi-VN')}` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">{requestLabel}</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Kho xuat hang</p>
                        <p className="text-sm font-semibold text-blue-600">{warehouse}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">Ma phieu</p>
                        <p className="text-sm font-semibold text-slate-700">{voucherCode}</p>
                    </div>
                </div>

                <div className="mb-4 rounded-lg border border-slate-200 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Thong tin dieu phoi giao hang</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-medium text-slate-600">Tham chieu phieu xuat kho</label>
                            <select
                                value={dispatchForm.issueRefCode}
                                onChange={(e) => handleDispatchField('issueRefCode', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Chon phieu xuat kho</option>
                                {issueOptions.map((issue) => (
                                    <option key={`${issue.code}-${issue.id ?? 'none'}`} value={issue.code}>
                                        {issue.code}
                                        {issue.createdAt ? ` - ${new Date(issue.createdAt).toLocaleString('vi-VN')}` : ''}
                                    </option>
                                ))}
                            </select>
                            {issueOptions.length > 0 && (
                                <p className="mt-1 text-[11px] text-slate-500">Mac dinh da chon phieu xuat kho moi nhat.</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Muc uu tien</label>
                            <select
                                value={dispatchForm.priority}
                                onChange={(e) => handleDispatchField('priority', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="KHAN_CAP">Khan cap</option>
                                <option value="TRUNG_BINH">Trung binh</option>
                                <option value="THAP">Thap</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Doi giao hang</label>
                            <select
                                value={dispatchForm.teamId}
                                onChange={(e) => handleDispatchField('teamId', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Chon doi giao hang</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name || team.teamName || `Doi ${team.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Phuong tien giao</label>
                            <select
                                value={dispatchForm.assetId}
                                onChange={(e) => handleDispatchField('assetId', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Chon phuong tien</option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.code || asset.assetCode || `PT-${asset.id}`} - {asset.type || asset.name || 'Phuong tien'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Nguoi nhan tai diem giao</label>
                            <input
                                type="text"
                                value={dispatchForm.contactName}
                                onChange={(e) => handleDispatchField('contactName', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Ho ten nguoi nhan"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">So dien thoai nguoi nhan</label>
                            <input
                                type="text"
                                value={dispatchForm.contactPhone}
                                onChange={(e) => handleDispatchField('contactPhone', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="09xxxxxxxx"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-600">Dia chi giao chi tiet</label>
                            <input
                                type="text"
                                value={dispatchForm.deliveryAddress}
                                onChange={(e) => handleDispatchField('deliveryAddress', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Thon/Xa/Huyen/Tinh"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Thoi gian du kien giao</label>
                            <input
                                type="datetime-local"
                                value={dispatchForm.eta}
                                onChange={(e) => handleDispatchField('eta', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Ghi chu dieu phoi</label>
                            <input
                                type="text"
                                value={dispatchForm.dispatchNote}
                                onChange={(e) => handleDispatchField('dispatchNote', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Luu y cho doi giao hang"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Dang tai danh sach hang dieu phoi...
                    </div>
                ) : (
                    <>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Package className="h-4 w-4 text-blue-600" />
                                Danh sach hang dieu phoi
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
                                        <th className="py-2 text-right">So luong dieu phoi</th>
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
                                                        className={`w-24 rounded-md border px-2 py-1 text-right outline-none focus:ring-2 ${isOverStock
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
                                    Luu y: Phieu dieu phoi phuc vu khau giao nhan. So luong dieu phoi phai khop voi kha nang xuat kho thuc te.
                                </span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => navigate(MANAGER_ROUTES.DISTRIBUTION_PLAN)}
                                    disabled={submitting}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Gan nhiem vu
                                </button>
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
                                    {submitting ? 'Dang tao...' : 'Tao phieu dieu phoi'}
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
