import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import { createInventoryReceipt, getItemCategories } from '../../features/relief/api.js';

// Không hardcode itemCategoryId nữa, để user chọn từ dropdown
const FALLBACK_CATEGORY_OPTIONS = [
    { id: null, name: 'Lương thực' },
    { id: null, name: 'Nhu yếu phẩm' },
    { id: null, name: 'Y tế' },
    { id: null, name: 'Thiết bị bảo hộ' },
    { id: null, name: 'Khác' },
];

const INITIAL_ITEMS = [
    {
        id: 1,
        name: 'Mì tôm (Thùng 30 gói)',
        quantity: 100,
        unit: 'Thùng',
        itemCategoryId: null,
        categoryName: '',
        itemCode: '', // Mã hàng
        status: 'active', // active | inactive
    },
    {
        id: 2,
        name: 'Nước suối (Lốc 6 chai 1.5L)',
        quantity: 50,
        unit: 'Lốc',
        itemCategoryId: null,
        categoryName: '',
        itemCode: '', // Mã hàng
        status: 'active',
    },
];

export default function ReceiptCreatePage() {
    const navigate = useNavigate();
    const [sourceType, setSourceType] = useState('donation'); // donation | purchase
    const [items, setItems] = useState(INITIAL_ITEMS);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const summary = useMemo(() => {
        const itemCount = items.length;
        const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        const approxWeightKg = (totalQty * 12).toLocaleString('vi-VN'); // ví dụ
        return {
            itemCount,
            approxWeightKg,
            createdDate: new Date().toLocaleDateString('vi-VN'),
        };
    }, [items]);

    // Fetch danh sách loại hàng hóa từ BE
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true);
                const data = await getItemCategories();
                // Parse response format (có thể là array hoặc { data: [], content: [] })
                let categoriesList = [];
                if (Array.isArray(data)) {
                    categoriesList = data;
                } else if (data?.content && Array.isArray(data.content)) {
                    categoriesList = data.content;
                } else if (data?.data && Array.isArray(data.data)) {
                    categoriesList = data.data;
                } else if (data?.items && Array.isArray(data.items)) {
                    categoriesList = data.items;
                }
                setCategories(categoriesList);
                console.log('[ReceiptCreatePage] Loaded categories:', categoriesList);
            } catch (e) {
                console.warn('[ReceiptCreatePage] Could not load categories:', e);
                // Nếu không load được, vẫn cho phép user nhập itemCategoryId thủ công
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);

    const handleAddItem = () => {
        const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        setItems([
            ...items,
            {
                id: nextId,
                name: '',
                quantity: 0,
                unit: '',
                itemCategoryId: null, // User phải chọn từ dropdown
                categoryName: '',
                itemCode: '', // Mã hàng
                status: 'active', // Mặc định là active
            },
        ]);
    };

    const handleChangeItem = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;

                // Xử lý số lượng tồn
                if (field === 'quantity') {
                    const numValue = value === '' ? 0 : Number(value);
                    return {
                        ...item,
                        quantity: isNaN(numValue) ? 0 : Math.max(0, numValue)
                    };
                }

                // Xử lý phân loại (itemCategoryId)
                if (field === 'itemCategoryId') {
                    const numericId = value === '' || value === null ? null : Number(value);
                    console.log('[ReceiptCreatePage] Changing itemCategoryId:', { id, value, numericId });

                    // Tự động fill đơn vị và mã hàng theo loại hàng nếu chưa nhập
                    let nextUnit = item.unit;
                    let nextItemCode = item.itemCode || '';

                    if (numericId && Array.isArray(categories) && categories.length > 0) {
                        const matched = categories.find((c) => Number(c.id) === numericId);
                        if (matched) {
                            // Tự động fill đơn vị nếu chưa nhập
                            if (!nextUnit && matched?.unit) {
                                nextUnit = matched.unit;
                                console.log('[ReceiptCreatePage] Auto-filled unit:', nextUnit);
                            }
                            // Tự động fill mã hàng từ category code nếu chưa nhập
                            if (!nextItemCode && matched?.code) {
                                nextItemCode = matched.code;
                                console.log('[ReceiptCreatePage] Auto-filled itemCode:', nextItemCode);
                            }
                        }
                    }

                    return {
                        ...item,
                        itemCategoryId: numericId,
                        unit: nextUnit,
                        itemCode: nextItemCode,
                    };
                }

                // Xử lý mã hàng (itemCode)
                if (field === 'itemCode') {
                    return { ...item, itemCode: value };
                }

                if (field === 'categoryName') {
                    return { ...item, categoryName: value };
                }

                if (field === 'status') {
                    return { ...item, status: value };
                }

                return { ...item, [field]: value };
            })
        );
    };

    const handleRemoveItem = (id) => {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleConfirm = async () => {
        // Nếu DB chưa có danh mục (categories rỗng) thì không thể tạo phiếu
        // vì BE bắt buộc itemCategoryId phải tồn tại trong DB.
        if (!loadingCategories && categories.length === 0) {
            window.alert(
                'Hiện DB chưa có Danh mục hàng (item_categories đang trống) nên không thể tạo phiếu nhập.\n\nBạn hãy tạo danh mục trước (ví dụ: Lương thực, Nhu yếu phẩm, Y tế, Thiết bị bảo hộ), rồi quay lại tạo phiếu.'
            );
            return;
        }

        // Validate: phải có itemCategoryId cho mỗi dòng hợp lệ
        const itemsWithoutCategory = items.filter(
            (it) => it.name && Number(it.quantity) > 0 && !it.itemCategoryId
        );
        if (itemsWithoutCategory.length > 0) {
            window.alert('Vui lòng chọn Danh mục hàng cho tất cả các dòng trước khi lưu phiếu.');
            return;
        }

        // Validate: kiểm tra tất cả items có đầy đủ thông tin
        // Lưu ý: itemName (tên mặt hàng) là optional, nhưng itemCategoryId là bắt buộc
        const validItems = items.filter(
            (it) => Number(it.quantity) > 0 && it.itemCategoryId != null
        );
        if (validItems.length === 0) {
            window.alert('Vui lòng nhập ít nhất một mặt hàng với số lượng > 0 và đã chọn Danh mục hàng.');
            return;
        }

        // Debug: log tất cả items để kiểm tra
        console.log('[ReceiptCreatePage] All items before validation:', items);
        console.log('[ReceiptCreatePage] Valid items:', validItems);

        // Map đúng với InventoryReceiptCreateRequest:
        // { sourceType, note, lines: InventoryReceiptLineRequest[] }
        // Lưu ý: Dữ liệu sẽ được lưu vào bảng inventory_receipt_lines (không phải item_categories)
        // item_categories chỉ lưu danh mục (Lương thực, Nhu yếu phẩm...)
        // inventory_receipt_lines mới lưu tên mặt hàng cụ thể (Gạo tẻ, Nước suối...)
        const payload = {
            sourceType: sourceType === 'donation' ? 'DONATION' : 'PURCHASE',
            note: null,
            lines: validItems.map((it) => {
                // Lấy tên category từ danh sách categories đã load
                const selectedCategory = categories.find((cat) => Number(cat.id) === Number(it.itemCategoryId));
                const categoryName = selectedCategory?.name || selectedCategory?.categoryName || '';

                // Lấy tên mặt hàng từ input, đảm bảo không null/undefined
                // itemName sẽ được lưu vào bảng inventory_receipt_lines
                const itemName = (it.name && String(it.name).trim()) || '';

                console.log('[ReceiptCreatePage] Line item data:', {
                    itemCategoryId: it.itemCategoryId,
                    itemName: itemName,
                    name: it.name,
                    qty: it.quantity,
                    unit: it.unit,
                    categoryName: categoryName,
                });

                // Đảm bảo itemCategoryId và qty là số hợp lệ
                const itemCategoryId = it.itemCategoryId ? Number(it.itemCategoryId) : null;
                const qty = it.quantity ? Number(it.quantity) : 0;

                // Validate: itemCategoryId là bắt buộc
                if (!itemCategoryId || isNaN(itemCategoryId)) {
                    console.error('[ReceiptCreatePage] Invalid itemCategoryId:', it.itemCategoryId);
                    throw new Error(`Dòng "${itemName || 'mặt hàng'}" chưa chọn phân loại. Vui lòng chọn phân loại trước khi lưu.`);
                }

                // Validate: qty phải > 0
                if (!qty || qty <= 0 || isNaN(qty)) {
                    console.error('[ReceiptCreatePage] Invalid qty:', it.quantity);
                    throw new Error(`Dòng "${itemName || 'mặt hàng'}" có số lượng không hợp lệ. Vui lòng nhập số lượng > 0.`);
                }

                const linePayload = {
                    itemCategoryId: itemCategoryId,
                    qty: qty,
                    unit: (it.unit || '').trim() || 'Thùng',
                    // Gửi itemName để backend lưu vào bảng inventory_receipt_lines
                    // Nếu user không nhập tên mặt hàng, gửi empty string
                    itemName: itemName,
                };

                console.log('[ReceiptCreatePage] Line payload:', linePayload);
                return linePayload;
            }),
        };

        // Log toàn bộ payload để debug
        console.log('[ReceiptCreatePage] Full payload gửi lên createInventoryReceipt:', JSON.stringify(payload, null, 2));

        console.log('[ReceiptCreatePage] Payload gửi lên createInventoryReceipt:', payload);

        try {
            setSubmitting(true);
            setError(null);

            const response = await createInventoryReceipt(payload);
            console.log('[ReceiptCreatePage] createInventoryReceipt response:', response);

            const receiptCode =
                response?.code ||
                response?.documentCode ||
                response?.receiptCode ||
                response?.id;

            window.alert(
                receiptCode
                    ? `Tạo phiếu nhập kho thành công: ${receiptCode}`
                    : 'Tạo phiếu nhập kho thành công!'
            );
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        } catch (e) {
            console.error('[ReceiptCreatePage] createInventoryReceipt error:', e);
            console.error('[ReceiptCreatePage] Error details:', {
                status: e?.status,
                message: e?.message,
                data: e?.data,
            });

            const errorData = e?.data || {};
            const errorMessage =
                errorData?.message ||
                errorData?.error ||
                e?.message ||
                'Không thể tạo phiếu nhập kho. Vui lòng kiểm tra console để xem chi tiết.';

            setError(errorMessage);
            window.alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* MAIN FORM */}
            <div className="flex-1 lg:flex-[2] space-y-4">
                {/* Breadcrumb + Title */}
                <button
                    type="button"
                    onClick={handleCancel}
                    className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Trở về Kho Trung tâm
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Tạo Phiếu Nhập kho</h1>
                <p className="text-sm text-slate-500">
                    Vui lòng điền thông tin chi tiết các mặt hàng cứu trợ nhập kho.
                </p>

                {/* Section 1: Thông tin chung */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">
                            1. Thông tin chung
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            KHO: Kho Trung tâm
                        </span>
                    </header>

                    <div className="space-y-4 p-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Nguồn hàng
                            </p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setSourceType('donation')}
                                    className={`flex flex-col rounded-lg border px-4 py-3 text-left text-sm transition ${sourceType === 'donation'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <span className="font-semibold text-slate-900">
                                        Quyên góp
                                    </span>
                                    <span className="mt-0.5 text-xs text-slate-500">
                                        Hàng từ các mạnh thường quân, tổ chức
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceType('purchase')}
                                    className={`flex flex-col rounded-lg border px-4 py-3 text-left text-sm transition ${sourceType === 'purchase'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <span className="font-semibold text-slate-900">
                                        Tự mua
                                    </span>
                                    <span className="mt-0.5 text-xs text-slate-500">
                                        Hàng do hệ thống mua trực tiếp
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Danh sách hàng hóa */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">
                            2. Danh sách hàng hóa
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Thêm mặt hàng
                        </button>
                    </header>

                    <div className="p-6 overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mã hàng
                                    </th>
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Tên mặt hàng
                                    </th>
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Phân loại
                                    </th>
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Đơn vị
                                    </th>
                                    <th className="pb-4 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Số lượng tồn
                                    </th>
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Trạng thái
                                    </th>
                                    <th className="pb-4 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const selectedCategory = categories.find((cat) => Number(cat.id) === Number(item.itemCategoryId));
                                    const categoryCode = selectedCategory?.code || '';
                                    const categoryName = selectedCategory?.name || selectedCategory?.categoryName || item.categoryName || '';

                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                        >
                                            <td className="py-4 px-4">
                                                <select
                                                    value={item.itemCode || ''}
                                                    onChange={(e) => {
                                                        const selectedCode = e.target.value;
                                                        if (selectedCode) {
                                                            const selectedCat = categories.find((c) => c.code === selectedCode);
                                                            if (selectedCat) {
                                                                // Tự động fill tất cả các field từ category đã chọn
                                                                setItems((prev) =>
                                                                    prev.map((it) => {
                                                                        if (it.id !== item.id) return it;
                                                                        return {
                                                                            ...it,
                                                                            itemCode: selectedCat.code || '',
                                                                            name: selectedCat.name || it.name || '',
                                                                            itemCategoryId: selectedCat.id || null,
                                                                            unit: selectedCat.unit || it.unit || '',
                                                                            quantity: selectedCat.stockQuantity || selectedCat.stockQty || it.quantity || 0,
                                                                            status: selectedCat.isActive !== false ? 'active' : 'inactive',
                                                                        };
                                                                    })
                                                                );
                                                                console.log('[ReceiptCreatePage] Auto-filled all fields from category:', selectedCat);
                                                            }
                                                        } else {
                                                            // Reset về rỗng nếu chọn "-- Chọn mã hàng --"
                                                            handleChangeItem(item.id, 'itemCode', '');
                                                        }
                                                    }}
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                >
                                                    <option value="">-- Chọn mã hàng --</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.code || cat.id}>
                                                            {cat.code || `Mã ${cat.id}`} - {cat.name || cat.categoryName || 'Danh mục'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-4 px-4">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        handleChangeItem(item.id, 'name', e.target.value)
                                                    }
                                                    placeholder="Tên mặt hàng (tự động điền khi chọn mã)"
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                {loadingCategories ? (
                                                    <div className="h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 flex items-center text-xs text-slate-500">
                                                        Đang tải...
                                                    </div>
                                                ) : categories.length > 0 ? (
                                                    <select
                                                        value={item.itemCategoryId || ''}
                                                        onChange={(e) => {
                                                            const selectedId = e.target.value;
                                                            if (selectedId) {
                                                                const selectedCat = categories.find((c) => Number(c.id) === Number(selectedId));
                                                                if (selectedCat) {
                                                                    // Tự động fill tất cả các field từ category đã chọn
                                                                    setItems((prev) =>
                                                                        prev.map((it) => {
                                                                            if (it.id !== item.id) return it;
                                                                            return {
                                                                                ...it,
                                                                                itemCategoryId: Number(selectedId),
                                                                                itemCode: it.itemCode || selectedCat.code || '',
                                                                                name: it.name || selectedCat.name || '',
                                                                                unit: it.unit || selectedCat.unit || '',
                                                                                quantity: it.quantity || selectedCat.stockQuantity || selectedCat.stockQty || 0,
                                                                                status: selectedCat.isActive !== false ? 'active' : 'inactive',
                                                                            };
                                                                        })
                                                                    );
                                                                    console.log('[ReceiptCreatePage] Auto-filled all fields from category:', selectedCat);
                                                                }
                                                            } else {
                                                                handleChangeItem(item.id, 'itemCategoryId', '');
                                                            }
                                                        }}
                                                        className={`h-9 w-full rounded-md border px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 ${!item.itemCategoryId
                                                            ? 'border-rose-300 bg-rose-50'
                                                            : 'border-slate-200 bg-white'
                                                            }`}
                                                    >
                                                        <option value="">-- Chọn phân loại --</option>
                                                        {categories.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.name || cat.categoryName || `Loại ${cat.id}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <select
                                                        value={item.categoryName || ''}
                                                        onChange={(e) =>
                                                            handleChangeItem(item.id, 'categoryName', e.target.value)
                                                        }
                                                        className="h-9 w-full rounded-md border border-amber-300 bg-amber-50 px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                    >
                                                        <option value="">-- Chọn danh mục (DB chưa có) --</option>
                                                        {FALLBACK_CATEGORY_OPTIONS.map((c) => (
                                                            <option key={c.name} value={c.name}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) =>
                                                        handleChangeItem(item.id, 'unit', e.target.value)
                                                    }
                                                    placeholder="Đơn vị (tự động điền khi chọn mã)"
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={item.quantity || ''}
                                                    onChange={(e) =>
                                                        handleChangeItem(item.id, 'quantity', e.target.value)
                                                    }
                                                    placeholder="Số lượng (tự động điền khi chọn mã)"
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <select
                                                    value={item.status || 'active'}
                                                    onChange={(e) =>
                                                        handleChangeItem(item.id, 'status', e.target.value)
                                                    }
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                >
                                                    <option value="active">Đang hoạt động</option>
                                                    <option value="inactive">Ngừng hoạt động</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={items.length === 1}
                                                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                        title="Xóa dòng"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-2 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Thêm mặt hàng mới
                        </button>
                    </div>
                </section>
            </div>

            {/* SUMMARY CARD */}
            <aside className="mt-10 w-full max-w-xs space-y-4 lg:mt-0 lg:flex-shrink-0">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Tổng kết phiếu nhập
                    </h2>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Kho nhận:</span>
                            <span className="font-medium text-slate-900">Kho Trung tâm</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Số lượng loại hàng:</span>
                            <span className="font-medium text-slate-900">
                                {summary.itemCount.toString().padStart(2, '0')} mặt hàng
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tổng khối lượng dự kiến:</span>
                            <span className="font-medium text-slate-900">
                                ~{summary.approxWeightKg} kg
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Ngày lập phiếu:</span>
                            <span className="font-medium text-slate-900">
                                {summary.createdDate}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-4 space-y-2">
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            ĐANG SOẠN THẢO
                        </span>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? 'Đang lưu phiếu...' : 'Xác nhận nhập kho'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Hủy bỏ &amp; Quay lại
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700">
                        i
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Lưu ý nhập kho</p>
                        <p className="mt-0.5">
                            Hãy kiểm tra hạn sử dụng đối với các mặt hàng thực phẩm trước khi xác nhận
                            nhập kho.
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
}

