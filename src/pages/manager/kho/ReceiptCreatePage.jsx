import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { approveInventoryReceipt, createInventoryReceipt, getItemCategories } from '../../../features/relief/api.js';

const INITIAL_ITEMS = [
    {
        id: 1,
        name: '',
        quantity: 0,
        unit: '',
        itemCategoryId: null,
        itemCode: '',
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
        const approxWeightKg = (totalQty * 12).toLocaleString('vi-VN'); // v├¡ dß╗Ñ
        return {
            itemCount,
            approxWeightKg,
            createdDate: new Date().toLocaleDateString('vi-VN'),
        };
    }, [items]);

    // Fetch danh s├ích loß║íi h├áng h├│a tß╗½ BE
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true);
                const data = await getItemCategories();
                // Parse response format (c├│ thß╗â l├á array hoß║╖c { data: [], content: [] })
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
                // Nß║┐u kh├┤ng load ─æ╞░ß╗úc, vß║½n cho ph├⌐p user nhß║¡p itemCategoryId thß╗º c├┤ng
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
                itemCategoryId: null,
                itemCode: '',
            },
        ]);
    };

    const handleChangeItem = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;

                // Xß╗¡ l├╜ sß╗æ l╞░ß╗úng tß╗ôn
                if (field === 'quantity') {
                    const numValue = value === '' ? 0 : Number(value);
                    return {
                        ...item,
                        quantity: isNaN(numValue) ? 0 : Math.max(0, numValue)
                    };
                }

                // Xß╗¡ l├╜ m├ú h├áng (itemCode)
                if (field === 'itemCode') {
                    const selectedCode = String(value || '').trim();
                    if (!selectedCode) {
                        return {
                            ...item,
                            itemCode: '',
                            itemCategoryId: null,
                            name: '',
                            unit: '',
                        };
                    }
                    const matched = categories.find((c) => {
                        const code = String(c.code || '').trim();
                        if (code) return code === selectedCode;
                        return `ID:${c.id}` === selectedCode;
                    });
                    if (!matched) {
                        return { ...item, itemCode: selectedCode };
                    }
                    return {
                        ...item,
                        itemCode: selectedCode,
                        itemCategoryId: matched.id ?? null,
                        name: matched.name || matched.categoryName || '',
                        unit: matched.unit || '',
                    };
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
        // Nß║┐u DB ch╞░a c├│ danh mß╗Ñc (categories rß╗ùng) th├¼ kh├┤ng thß╗â tß║ío phiß║┐u
        // v├¼ BE bß║»t buß╗Öc itemCategoryId phß║úi tß╗ôn tß║íi trong DB.
        if (!loadingCategories && categories.length === 0) {
            window.alert(
                'Hiß╗çn DB ch╞░a c├│ Danh mß╗Ñc h├áng (item_categories ─æang trß╗æng) n├¬n kh├┤ng thß╗â tß║ío phiß║┐u nhß║¡p.\n\nBß║ín h├úy tß║ío danh mß╗Ñc tr╞░ß╗¢c (v├¡ dß╗Ñ: L╞░╞íng thß╗▒c, Nhu yß║┐u phß║⌐m, Y tß║┐, Thiß║┐t bß╗ï bß║úo hß╗Ö), rß╗ôi quay lß║íi tß║ío phiß║┐u.'
            );
            return;
        }

        // Validate: phß║úi c├│ itemCategoryId cho mß╗ùi d├▓ng hß╗úp lß╗ç
        const itemsWithoutCategory = items.filter((it) => Number(it.quantity) > 0 && !it.itemCategoryId);
        if (itemsWithoutCategory.length > 0) {
            window.alert('Vui l├▓ng chß╗ìn Danh mß╗Ñc h├áng cho tß║Ñt cß║ú c├íc d├▓ng tr╞░ß╗¢c khi l╞░u phiß║┐u.');
            return;
        }

        // Validate: kiß╗âm tra tß║Ñt cß║ú items c├│ ─æß║ºy ─æß╗º th├┤ng tin
        // L╞░u ├╜: itemName (t├¬n mß║╖t h├áng) l├á optional, nh╞░ng itemCategoryId l├á bß║»t buß╗Öc
        const validItems = items.filter(
            (it) => Number(it.quantity) > 0 && it.itemCategoryId != null
        );
        if (validItems.length === 0) {
            window.alert('Vui l├▓ng nhß║¡p ├¡t nhß║Ñt mß╗Öt mß║╖t h├áng vß╗¢i sß╗æ l╞░ß╗úng > 0 v├á ─æ├ú chß╗ìn Danh mß╗Ñc h├áng.');
            return;
        }

        // Debug: log tß║Ñt cß║ú items ─æß╗â kiß╗âm tra
        console.log('[ReceiptCreatePage] All items before validation:', items);
        console.log('[ReceiptCreatePage] Valid items:', validItems);

        // Map ─æ├║ng vß╗¢i InventoryReceiptCreateRequest:
        // { sourceType, note, lines: InventoryReceiptLineRequest[] }
        // L╞░u ├╜: Dß╗» liß╗çu sß║╜ ─æ╞░ß╗úc l╞░u v├áo bß║úng inventory_receipt_lines (kh├┤ng phß║úi item_categories)
        // item_categories chß╗ë l╞░u danh mß╗Ñc (L╞░╞íng thß╗▒c, Nhu yß║┐u phß║⌐m...)
        // inventory_receipt_lines mß╗¢i l╞░u t├¬n mß║╖t h├áng cß╗Ñ thß╗â (Gß║ío tß║╗, N╞░ß╗¢c suß╗æi...)
        const payload = {
            sourceType: sourceType === 'donation' ? 'DONATION' : 'PURCHASE',
            note: null,
            lines: validItems.map((it) => {
                // Lß║Ñy t├¬n mß║╖t h├áng tß╗½ input, ─æß║úm bß║úo kh├┤ng null/undefined
                // itemName sß║╜ ─æ╞░ß╗úc l╞░u v├áo bß║úng inventory_receipt_lines
                const itemName = (it.name && String(it.name).trim()) || '';

                console.log('[ReceiptCreatePage] Line item data:', {
                    itemCategoryId: it.itemCategoryId,
                    itemName: itemName,
                    name: it.name,
                    qty: it.quantity,
                    unit: it.unit,
                });

                // ─Éß║úm bß║úo itemCategoryId v├á qty l├á sß╗æ hß╗úp lß╗ç
                const itemCategoryId = it.itemCategoryId ? Number(it.itemCategoryId) : null;
                const qty = it.quantity ? Number(it.quantity) : 0;

                // Validate: itemCategoryId l├á bß║»t buß╗Öc
                if (!itemCategoryId || isNaN(itemCategoryId)) {
                    console.error('[ReceiptCreatePage] Invalid itemCategoryId:', it.itemCategoryId);
                    throw new Error(`D├▓ng "${itemName || 'mß║╖t h├áng'}" ch╞░a chß╗ìn ph├ón loß║íi. Vui l├▓ng chß╗ìn ph├ón loß║íi tr╞░ß╗¢c khi l╞░u.`);
                }

                // Validate: qty phß║úi > 0
                if (!qty || qty <= 0 || isNaN(qty)) {
                    console.error('[ReceiptCreatePage] Invalid qty:', it.quantity);
                    throw new Error(`D├▓ng "${itemName || 'mß║╖t h├áng'}" c├│ sß╗æ l╞░ß╗úng kh├┤ng hß╗úp lß╗ç. Vui l├▓ng nhß║¡p sß╗æ l╞░ß╗úng > 0.`);
                }

                const linePayload = {
                    itemCategoryId: itemCategoryId,
                    qty: qty,
                    unit: (it.unit || '').trim(),
                    // Gß╗¡i itemName ─æß╗â backend l╞░u v├áo bß║úng inventory_receipt_lines
                    // Nß║┐u user kh├┤ng nhß║¡p t├¬n mß║╖t h├áng, gß╗¡i empty string
                    itemName: itemName,
                };

                console.log('[ReceiptCreatePage] Line payload:', linePayload);
                return linePayload;
            }),
        };

        // Log to├án bß╗Ö payload ─æß╗â debug
        console.log('[ReceiptCreatePage] Full payload gß╗¡i l├¬n createInventoryReceipt:', JSON.stringify(payload, null, 2));

        console.log('[ReceiptCreatePage] Payload gß╗¡i l├¬n createInventoryReceipt:', payload);

        try {
            setSubmitting(true);
            setError(null);

            const createdReceipt = await createInventoryReceipt(payload);
            console.log('[ReceiptCreatePage] createInventoryReceipt response:', createdReceipt);

            let response = createdReceipt;
            if (createdReceipt?.id) {
                response = await approveInventoryReceipt(createdReceipt.id);
                console.log('[ReceiptCreatePage] approveInventoryReceipt response:', response);
            }

            const receiptCode =
                response?.code ||
                response?.documentCode ||
                response?.receiptCode ||
                response?.id;

            window.alert(
                receiptCode
                    ? `Tß║ío v├á cß║¡p nhß║¡t kho th├ánh c├┤ng: ${receiptCode}`
                    : 'Tß║ío phiß║┐u nhß║¡p kho v├á cß║¡p nhß║¡t tß╗ôn kho th├ánh c├┤ng!'
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
                'Kh├┤ng thß╗â tß║ío phiß║┐u nhß║¡p kho. Vui l├▓ng kiß╗âm tra console ─æß╗â xem chi tiß║┐t.';

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
                    Trß╗ƒ vß╗ü Kho Trung t├óm
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Tß║ío Phiß║┐u Nhß║¡p kho</h1>
                <p className="text-sm text-slate-500">
                    Vui l├▓ng ─æiß╗ün th├┤ng tin chi tiß║┐t c├íc mß║╖t h├áng cß╗⌐u trß╗ú nhß║¡p kho.
                </p>

                {/* Section 1: Th├┤ng tin chung */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">
                            1. Th├┤ng tin chung
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            KHO: Kho Trung t├óm
                        </span>
                    </header>

                    <div className="space-y-4 p-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Nguß╗ôn h├áng
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
                                        Quy├¬n g├│p
                                    </span>
                                    <span className="mt-0.5 text-xs text-slate-500">
                                        H├áng tß╗½ c├íc mß║ính th╞░ß╗¥ng qu├ón, tß╗ò chß╗⌐c
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
                                        Tß╗▒ mua
                                    </span>
                                    <span className="mt-0.5 text-xs text-slate-500">
                                        H├áng do hß╗ç thß╗æng mua trß╗▒c tiß║┐p
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Danh s├ích h├áng h├│a */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">
                            2. Danh s├ích h├áng h├│a
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Th├¬m mß║╖t h├áng
                        </button>
                    </header>

                    <div className="p-6 overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        M├ú h├áng
                                    </th>
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        T├¬n h├áng
                                    </th>
                                    <th className="pb-4 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        ─É╞ín vß╗ï
                                    </th>
                                    <th className="pb-4 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Sß╗æ l╞░ß╗úng
                                    </th>
                                    <th className="pb-4 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Thao t├íc
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                        >
                                            <td className="py-4 px-4">
                                                <select
                                                    value={item.itemCode || ''}
                                                    onChange={(e) => handleChangeItem(item.id, 'itemCode', e.target.value)}
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                >
                                                    <option value="">-- Chß╗ìn m├ú h├áng --</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.code || `ID:${cat.id}`}>
                                                            {cat.code || `M├ú ${cat.id}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-4 px-4">
                                                <input
                                                    type="text"
                                                    value={item.name || ''}
                                                    readOnly
                                                    placeholder="Tß╗▒ ─æß╗Öng hiß╗ân thß╗ï khi chß╗ìn m├ú h├áng"
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    readOnly
                                                    placeholder="Theo m├ú h├áng"
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
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
                                                    placeholder="Sß╗æ l╞░ß╗úng (tß╗▒ ─æß╗Öng ─æiß╗ün khi chß╗ìn m├ú)"
                                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={items.length === 1}
                                                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                        title="X├│a d├▓ng"
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
                            Th├¬m mß║╖t h├áng mß╗¢i
                        </button>
                    </div>
                </section>
            </div>

            {/* SUMMARY CARD */}
            <aside className="mt-10 w-full max-w-xs space-y-4 lg:mt-0 lg:flex-shrink-0">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Tß╗òng kß║┐t phiß║┐u nhß║¡p
                    </h2>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Kho nhß║¡n:</span>
                            <span className="font-medium text-slate-900">Kho Trung t├óm</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Sß╗æ l╞░ß╗úng loß║íi h├áng:</span>
                            <span className="font-medium text-slate-900">
                                {summary.itemCount.toString().padStart(2, '0')} mß║╖t h├áng
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tß╗òng khß╗æi l╞░ß╗úng dß╗▒ kiß║┐n:</span>
                            <span className="font-medium text-slate-900">
                                ~{summary.approxWeightKg} kg
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Ng├áy lß║¡p phiß║┐u:</span>
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
                            ─ÉANG SOß║áN THß║óO
                        </span>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? '─Éang l╞░u phiß║┐u...' : 'X├íc nhß║¡n nhß║¡p kho'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Hß╗ºy bß╗Å &amp; Quay lß║íi
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(MANAGER_ROUTES.RECEIPT_APPROVAL)}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                            Duyß╗çt phiß║┐u nhß║¡p
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700">
                        i
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">L╞░u ├╜ nhß║¡p kho</p>
                        <p className="mt-0.5">
                            H├úy kiß╗âm tra hß║ín sß╗¡ dß╗Ñng ─æß╗æi vß╗¢i c├íc mß║╖t h├áng thß╗▒c phß║⌐m tr╞░ß╗¢c khi x├íc nhß║¡n
                            nhß║¡p kho.
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
}
