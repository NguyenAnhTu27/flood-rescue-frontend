import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import {
    createReliefRequest,
    saveReliefRequestDraft,
    generateReliefRequestCode,
    getAreas,
} from '../../../features/relief/api.js';
import { getItemCategories } from '../../../features/relief/api.js';

export default function ReliefRequestCreatePage() {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        targetArea: '',
        rescueRequestLink: '',
        note: '',
    });

    // Items state
    const [items, setItems] = useState([
        {
            id: Date.now(),
            itemCategoryId: '',
            category: '',
            quantity: '',
            unit: '',
            note: '',
        },
    ]);

    // Dropdowns data
    const [areas, setAreas] = useState([]);
    const [itemCategories, setItemCategories] = useState([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [generatingCode, setGeneratingCode] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoadingData(true);
                setError(null);

                // Load areas and item categories in parallel
                const [areasData, categoriesData] = await Promise.all([
                    getAreas(),
                    getItemCategories(),
                ]);

                // Parse areas
                let areasList = [];
                if (Array.isArray(areasData)) {
                    areasList = areasData;
                } else if (Array.isArray(areasData?.data)) {
                    areasList = areasData.data;
                } else if (Array.isArray(areasData?.content)) {
                    areasList = areasData.content;
                }
                setAreas(areasList);

                // Parse item categories
                let categoriesList = [];
                if (Array.isArray(categoriesData)) {
                    categoriesList = categoriesData;
                } else if (Array.isArray(categoriesData?.data)) {
                    categoriesList = categoriesData.data;
                } else if (Array.isArray(categoriesData?.content)) {
                    categoriesList = categoriesData.content;
                }
                setItemCategories(categoriesList);

                // Generate initial code
                try {
                    const codeData = await generateReliefRequestCode();
                    setFormData((prev) => ({
                        ...prev,
                        code: codeData.code || codeData.data?.code || 'REQ-2024-XXXX',
                    }));
                } catch (e) {
                    console.warn('Could not generate code:', e);
                    setFormData((prev) => ({
                        ...prev,
                        code: 'REQ-2024-XXXX',
                    }));
                }
            } catch (e) {
                console.error('Error loading initial data:', e);
                setError('Không thể tải dữ liệu. Vui lòng thử lại.');
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, []);

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: Date.now(),
                itemCategoryId: '',
                category: '',
                quantity: '',
                unit: '',
                note: '',
            },
        ]);
    };

    const handleChangeItem = (index, field, value) => {
        setItems((prev) => {
            const next = [...prev];
            const updatedItem = { ...next[index], [field]: value };

            // Auto-fill unit when category is selected
            if (field === 'itemCategoryId' && value) {
                const category = itemCategories.find((cat) => cat.id === parseInt(value) || cat.id === value);
                if (category) {
                    updatedItem.category = category.name || category.categoryName || '';
                    updatedItem.unit = category.unit || '';
                }
            }

            next[index] = updatedItem;
            return next;
        });
    };

    const handleRemoveItem = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleGenerateCode = async () => {
        try {
            setGeneratingCode(true);
            const codeData = await generateReliefRequestCode();
            setFormData((prev) => ({
                ...prev,
                code: codeData.code || codeData.data?.code || 'REQ-2024-XXXX',
            }));
        } catch (e) {
            console.error('Error generating code:', e);
            window.alert('Không thể tạo mã tự động. Vui lòng thử lại.');
        } finally {
            setGeneratingCode(false);
        }
    };

    const validateForm = () => {
        if (!formData.code || formData.code === 'REQ-2024-XXXX') {
            setError('Vui lòng tạo mã phiếu');
            return false;
        }
        if (!formData.targetArea) {
            setError('Vui lòng chọn khu vực mục tiêu');
            return false;
        }
        if (items.length === 0) {
            setError('Vui lòng thêm ít nhất một vật phẩm');
            return false;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.itemCategoryId && !item.category) {
                setError(`Vui lòng chọn loại hàng cho dòng ${i + 1}`);
                return false;
            }
            if (!item.quantity || parseFloat(item.quantity) <= 0) {
                setError(`Vui lòng nhập số lượng hợp lệ cho dòng ${i + 1}`);
                return false;
            }
            if (!item.unit) {
                setError(`Vui lòng nhập đơn vị cho dòng ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const buildPayload = () => {
        const lines = items
            .filter((item) => item.itemCategoryId || item.category)
            .map((item) => ({
                itemCategoryId: item.itemCategoryId ? parseInt(item.itemCategoryId) : null,
                itemName: item.category || '',
                qty: parseFloat(item.quantity) || 0,
                unit: item.unit || '',
                note: item.note || '',
            }));

        return {
            code: formData.code,
            targetArea: formData.targetArea,
            rescueRequestLink: formData.rescueRequestLink || null,
            note: formData.note || null,
            lines: lines,
        };
    };

    const handleCancel = () => {
        if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
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
            await saveReliefRequestDraft(payload);

            window.alert('Đã lưu nháp thành công!');
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
        } catch (e) {
            console.error('Error saving draft:', e);
            setError(e?.message || 'Không thể lưu nháp. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        if (!window.confirm('Bạn có chắc muốn gửi yêu cầu này để duyệt?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = buildPayload();
            await createReliefRequest(payload);

            window.alert('Đã gửi yêu cầu thành công!');
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
        } catch (e) {
            console.error('Error submitting request:', e);
            setError(e?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
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
            <div>
                <nav className="mb-2 text-xs text-slate-500">
                    Quản lý / Cứu trợ / Tạo yêu cầu cứu trợ
                </nav>
                <h1 className="text-2xl font-bold text-slate-900">Tạo yêu cầu cứu trợ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Điền thông tin chi tiết để tạo phiếu yêu cầu cứu trợ mới cho khu vực bị ảnh hưởng.
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm text-rose-600">{error}</p>
                </div>
            )}

            {/* Thông tin chung */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-base font-semibold text-slate-900">Thông tin chung</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-xs font-medium text-slate-600">Mã phiếu *</label>
                        <div className="mt-1 flex gap-2">
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => handleFormChange('code', e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="REQ-2024-XXXX"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateCode}
                                disabled={generatingCode}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                {generatingCode ? 'Đang tạo...' : 'Tạo mã'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600">Khu vực mục tiêu *</label>
                        <select
                            value={formData.targetArea}
                            onChange={(e) => handleFormChange('targetArea', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn khu vực bị ảnh hưởng</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id || area.name}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Liên kết yêu cầu cứu hộ</label>
                    <input
                        type="text"
                        value={formData.rescueRequestLink}
                        onChange={(e) => handleFormChange('rescueRequestLink', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="#SOS-9928 - Khẩn cấp tại ..."
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                    <textarea
                        rows={3}
                        value={formData.note}
                        onChange={(e) => handleFormChange('note', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Thông tin bổ sung về chuyến cứu trợ..."
                    />
                </div>
            </div>

            {/* Danh sách hàng cứu trợ */}
            <div className="space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-1 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">Danh sách hàng cứu trợ</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        + Thêm vật phẩm
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">TÊN MẶT HÀNG</th>
                                <th className="px-4 py-3 text-right">SỐ LƯỢNG</th>
                                <th className="px-4 py-3 text-left">ĐƠN VỊ</th>
                                <th className="px-4 py-3 text-left">GHI CHÚ</th>
                                <th className="px-4 py-3 text-right">HÀNH ĐỘNG</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                                <tr key={item.id} className="transition hover:bg-blue-50/40">
                                    <td className="px-4 py-3">
                                        {itemCategories.length > 0 ? (
                                            <select
                                                value={item.itemCategoryId}
                                                onChange={(e) => handleChangeItem(index, 'itemCategoryId', e.target.value)}
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            >
                                                <option value="">Chọn tên mặt hàng</option>
                                                {itemCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name || cat.categoryName || cat.code}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item.category}
                                                onChange={(e) => handleChangeItem(index, 'category', e.target.value)}
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                placeholder="Gạo trắng..."
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => handleChangeItem(index, 'quantity', e.target.value)}
                                            className="h-10 w-28 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={item.unit}
                                            onChange={(e) => handleChangeItem(index, 'unit', e.target.value)}
                                            className="h-10 w-24 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            placeholder="kg, thùng..."
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={item.note}
                                            onChange={(e) => handleChangeItem(index, 'note', e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            placeholder="Ghi chú chi tiết..."
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 text-right text-xs font-medium text-slate-500">
                    Tổng số mặt hàng: {items.length}
                </p>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
                    <span>Draft</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu nháp'}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi duyệt'}
                    </button>
                </div>
            </div>
        </div>
    );
}
