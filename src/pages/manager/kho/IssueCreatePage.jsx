import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, Check, FileText, List, BarChart3, Info } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import {
    createInventoryIssue,
    approveInventoryIssue,
    getInventoryStock,
    getItemCategories,
} from '../../../features/relief/api.js';
import { listReliefRequests } from '../../../features/relief/api.js';

const INITIAL_ITEMS = [
    {
        id: 1,
        itemCategoryId: '',
        itemName: '',
        quantity: '',
        unit: '',
        stockQty: 0,
    },
];

export default function IssueCreatePage() {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        reliefRequestId: null,
        reliefRequestCode: '',
        reliefRequestArea: '',
        basisRef: '',
        receiverDept: '',
        note: '',
    });

    // Items state
    const [items, setItems] = useState(INITIAL_ITEMS);

    // Reference data
    const [itemCategories, setItemCategories] = useState([]);
    const [stockData, setStockData] = useState([]); // Tồn kho hiện tại
    const [reliefRequests, setReliefRequests] = useState([]);
    const [searchReliefQuery, setSearchReliefQuery] = useState('');
    const [showReliefSearch, setShowReliefSearch] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [autoSaveTime, setAutoSaveTime] = useState(null);

    // Load reference data
    useEffect(() => {
        const loadReferenceData = async () => {
            try {
                setLoadingData(true);
                const [categoriesData, stockDataRes] = await Promise.allSettled([
                    getItemCategories(),
                    getInventoryStock(),
                ]);

                // Parse item categories
                if (categoriesData.status === 'fulfilled') {
                    const data = categoriesData.value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    setItemCategories(list);
                }

                // Parse stock data
                if (stockDataRes.status === 'fulfilled') {
                    const data = stockDataRes.value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    else if (Array.isArray(data?.lines)) list = data.lines;
                    setStockData(list);
                }

                // Generate initial code
                generateCode();
            } catch (e) {
                console.error('Error loading reference data:', e);
                setError('Không thể tải dữ liệu. Vui lòng thử lại.');
            } finally {
                setLoadingData(false);
            }
        };

        loadReferenceData();
    }, []);

    // Auto-save timer
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setAutoSaveTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const generateCode = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const code = `PXK-${year}${month}${day}-${random}`;
        setFormData((prev) => ({ ...prev, code }));
    };

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSearchReliefRequest = async (query) => {
        setSearchReliefQuery(query);
        if (query.length < 2) {
            setShowReliefSearch(false);
            return;
        }

        try {
            const data = await listReliefRequests({ page: 0, size: 10 });
            let requestsList = [];
            if (Array.isArray(data)) requestsList = data;
            else if (Array.isArray(data?.content)) requestsList = data.content;
            else if (Array.isArray(data?.data)) requestsList = data.data;

            // Filter by query
            const filtered = requestsList.filter(
                (req) =>
                    req.code?.toLowerCase().includes(query.toLowerCase()) ||
                    req.area?.toLowerCase().includes(query.toLowerCase()) ||
                    req.location?.toLowerCase().includes(query.toLowerCase())
            );
            setReliefRequests(filtered);
            setShowReliefSearch(filtered.length > 0);
        } catch (e) {
            console.warn('Could not search relief requests:', e);
            setShowReliefSearch(false);
        }
    };

    const handleSelectReliefRequest = (request) => {
        setFormData((prev) => ({
            ...prev,
            reliefRequestId: request.id,
            reliefRequestCode: request.code || request.id,
            reliefRequestArea: request.area || request.location || '',
        }));
        setSearchReliefQuery('');
        setShowReliefSearch(false);
    };

    const handleRemoveReliefRequest = () => {
        setFormData((prev) => ({
            ...prev,
            reliefRequestId: null,
            reliefRequestCode: '',
            reliefRequestArea: '',
        }));
    };

    const handleAddItem = () => {
        const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        setItems([
            ...items,
            {
                id: nextId,
                itemCategoryId: '',
                itemName: '',
                quantity: '',
                unit: '',
                stockQty: 0,
            },
        ]);
    };

    const handleChangeItem = (id, field, value) => {
        setItems((prev) => {
            const next = prev.map((item) => {
                if (item.id !== id) return item;

                const updated = { ...item, [field]: value };

                // Auto-fill unit and stockQty when itemCategoryId is selected
                if (field === 'itemCategoryId' && value) {
                    const category = itemCategories.find(
                        (cat) => cat.id === parseInt(value) || cat.id === value
                    );
                    if (category) {
                        updated.unit = category.unit || '';
                        updated.itemName = category.name || category.categoryName || '';

                        // Find stock quantity
                        const stockItem = stockData.find(
                            (s) =>
                                s.itemCategoryId === category.id ||
                                s.itemId === category.id ||
                                s.id === category.id
                        );
                        updated.stockQty = stockItem?.qty || stockItem?.quantity || stockItem?.balance || 0;
                    }
                }

                return updated;
            });
            return next;
        });
    };

    const handleRemoveItem = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const summary = useMemo(() => {
        const validItems = items.filter((item) => item.itemCategoryId && item.quantity);
        return {
            totalLines: items.length,
            totalTypes: new Set(items.filter((i) => i.itemCategoryId).map((i) => i.itemCategoryId)).size,
            status: 'DRAFT',
            warehouse: 'Kho trung tâm Miền Trung',
            creator: 'Trần Văn Quản lý', // TODO: Get from current user
        };
    }, [items]);

    const validateForm = () => {
        if (!formData.code) {
            setError('Vui lòng tạo mã phiếu xuất');
            return false;
        }
        if (items.length === 0) {
            setError('Vui lòng thêm ít nhất một mặt hàng xuất');
            return false;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.itemCategoryId) {
                setError(`Vui lòng chọn loại hàng cho dòng ${i + 1}`);
                return false;
            }
            if (!item.quantity || parseFloat(item.quantity) <= 0) {
                setError(`Vui lòng nhập số lượng hợp lệ cho dòng ${i + 1}`);
                return false;
            }
            if (item.stockQty && parseFloat(item.quantity) > item.stockQty) {
                setError(`Số lượng xuất (${item.quantity}) vượt quá tồn kho (${item.stockQty}) cho dòng ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const buildPayload = () => {
        const lines = items
            .filter((item) => item.itemCategoryId && item.quantity)
            .map((item) => ({
                itemCategoryId: parseInt(item.itemCategoryId),
                qty: parseFloat(item.quantity),
                unit: item.unit || '',
            }));

        // Build payload theo format của InventoryIssueCreateRequest
        const payload = {
            code: formData.code.trim(),
            lines: lines,
        };

        // Optional fields - chỉ thêm nếu có giá trị
        if (formData.reliefRequestId) {
            payload.reliefRequestId = parseInt(formData.reliefRequestId);
        }
        const noteParts = [];
        if (formData.basisRef?.trim()) noteParts.push(`Can cu: ${formData.basisRef.trim()}`);
        if (formData.receiverDept?.trim()) noteParts.push(`Don vi nhan kho: ${formData.receiverDept.trim()}`);
        if (formData.note?.trim()) noteParts.push(`Ghi chu kho: ${formData.note.trim()}`);
        if (noteParts.length > 0) {
            payload.note = noteParts.join(' | ');
        }

        return payload;
    };

    const handleCancel = () => {
        if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        }
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = buildPayload();
            console.log('[IssueCreatePage] Saving draft with payload:', payload);

            const result = await createInventoryIssue(payload);
            console.log('[IssueCreatePage] Draft saved successfully:', result);

            window.alert('Đã lưu nháp thành công!');
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        } catch (e) {
            console.error('[IssueCreatePage] Error saving draft:', e);
            const errorMessage = e?.response?.data?.message || e?.message || 'Không thể lưu nháp. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!validateForm()) {
            return;
        }

        if (!window.confirm('Bạn có chắc muốn duyệt phiếu xuất này? Sau khi duyệt, số lượng tồn kho sẽ được trừ đi.')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Bước 1: Tạo phiếu xuất (status = DRAFT)
            const payload = buildPayload();
            console.log('[IssueCreatePage] Creating issue with payload:', payload);

            const result = await createInventoryIssue(payload);
            console.log('[IssueCreatePage] Issue created:', result);

            // Bước 2: Duyệt phiếu xuất ngay sau khi tạo
            const issueId = result?.id || result?.data?.id;
            if (issueId) {
                console.log('[IssueCreatePage] Approving issue:', issueId);
                await approveInventoryIssue(issueId);
                console.log('[IssueCreatePage] Issue approved successfully');
            } else {
                console.warn('[IssueCreatePage] Cannot find issue ID from response:', result);
                throw new Error('Không thể lấy ID phiếu xuất để duyệt');
            }

            window.alert('Đã duyệt phiếu xuất thành công!');
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        } catch (e) {
            console.error('[IssueCreatePage] Error approving issue:', e);
            const errorMessage = e?.response?.data?.message || e?.message || 'Không thể duyệt phiếu xuất. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-slate-500">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="mb-2 text-xs text-slate-500">
                    Quản lý / Kho cứu trợ / Phiếu xuất kho
                </nav>
                <h1 className="text-2xl font-bold text-slate-900">Phiếu xuất kho cứu trợ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Chứng từ kho dùng để ghi nhận xuất hàng khỏi kho trung tâm theo kế hoạch đã duyệt.
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm text-rose-600">{error}</p>
                </div>
            )}

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Left Panel */}
                <div className="flex-1 space-y-6">
                    {/* Thông tin phiếu xuất */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Thông tin phiếu xuất</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Mã phiếu xuất *</label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => handleFormChange('code', e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="PXK-20231024-001"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        disabled={generatingCode}
                                        className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {generatingCode ? 'Đang tạo...' : 'Tạo mã tự động'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Phiếu cứu trợ liên quan</label>
                                <div className="mt-1 relative">
                                    {formData.reliefRequestCode ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                            <span className="flex-1 text-sm font-medium text-blue-900">
                                                #{formData.reliefRequestCode} - {formData.reliefRequestArea}
                                            </span>
                                            <span className="text-xs text-blue-700">
                                                TRẠNG THÁI: ĐANG CHỜ XỬ LÝ
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveReliefRequest}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={searchReliefQuery}
                                                onChange={(e) => handleSearchReliefRequest(e.target.value)}
                                                onFocus={() => {
                                                    if (searchReliefQuery.length >= 2) {
                                                        setShowReliefSearch(true);
                                                    }
                                                }}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="Tìm mã phiếu hoặc khu vực..."
                                            />
                                            {showReliefSearch && reliefRequests.length > 0 && (
                                                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                                                    {reliefRequests.map((req) => (
                                                        <button
                                                            key={req.id}
                                                            type="button"
                                                            onClick={() => handleSelectReliefRequest(req)}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                                                        >
                                                            <div className="font-medium text-slate-900">
                                                                {req.code || req.id}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {req.area || req.location || 'N/A'}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Căn cứ xuất kho</label>
                                    <input
                                        type="text"
                                        value={formData.basisRef}
                                        onChange={(e) => handleFormChange('basisRef', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Ví dụ: Lệnh điều phối DP-20260308-001"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Đơn vị nhận kho</label>
                                    <input
                                        type="text"
                                        value={formData.receiverDept}
                                        onChange={(e) => handleFormChange('receiverDept', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Đội giao nhận / điểm tập kết nhận hàng"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Ghi chú kho</label>
                                <textarea
                                    rows={3}
                                    value={formData.note}
                                    onChange={(e) => handleFormChange('note', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Nhập ghi chú chi tiết về lô hàng xuất..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Danh sách hàng xuất */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <List className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900">Danh sách hàng xuất</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm hàng xuất
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">LOẠI HÀNG</th>
                                        <th className="px-4 py-3 text-right">SỐ LƯỢNG</th>
                                        <th className="px-4 py-3 text-left">ĐƠN VỊ</th>
                                        <th className="px-4 py-3 text-right">TỒN KHO</th>
                                        <th className="px-4 py-3 text-right">HÀNH ĐỘNG</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.itemCategoryId}
                                                    onChange={(e) => handleChangeItem(item.id, 'itemCategoryId', e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="">Chọn loại hàng</option>
                                                    {itemCategories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name || cat.categoryName || cat.code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => handleChangeItem(item.id, 'quantity', e.target.value)}
                                                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleChangeItem(item.id, 'unit', e.target.value)}
                                                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Thùng..."
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {item.stockQty.toLocaleString('vi-VN')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-rose-600 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Summary */}
                <div className="w-full lg:w-80 lg:flex-shrink-0">
                    <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Tóm tắt phiếu</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Trạng thái</label>
                                <div className="mt-1">
                                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                        BẢN NHÁP
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Kho xuất</label>
                                <p className="mt-1 text-sm text-slate-900">{summary.warehouse}</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Tổng số dòng hàng</label>
                                <p className="mt-1 text-sm text-slate-900">{String(summary.totalLines).padStart(2, '0')} dòng</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Tổng loại vật phẩm</label>
                                <p className="mt-1 text-sm text-slate-900">{String(summary.totalTypes).padStart(2, '0')} loại</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Người tạo</label>
                                <p className="mt-1 text-sm text-slate-900">{summary.creator}</p>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <p className="text-xs text-blue-800">
                                        Phiếu xuất kho chỉ ghi nhận nghiệp vụ kho. Thông tin giao nhận chi tiết thực hiện ở Phiếu điều phối hàng.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
                    <span>DRAFT MODE</span>
                    {autoSaveTime && (
                        <>
                            <span>•</span>
                            <span>Tự động lưu lúc {autoSaveTime}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                        Hủy phiếu
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                    >
                        Lưu nháp
                    </button>
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Check className="h-4 w-4" />
                        Duyệt phiếu xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
