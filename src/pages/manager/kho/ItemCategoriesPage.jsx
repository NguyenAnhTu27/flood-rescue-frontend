import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { createItemCategory, getItemCategories } from '../../../features/relief/api.js';

function normalizeCategoriesResponse(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function generateCategoryCode(name) {
    const normalized = String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .toUpperCase();

    const base = normalized || 'ITEM';
    const suffix = Date.now().toString().slice(-6);
    return `CAT-${base.slice(0, 16)}-${suffix}`;
}

export default function ItemCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [quantity, setQuantity] = useState(0); // Chỉ dùng cho giao diện nhập nhanh
    const [creating, setCreating] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getItemCategories();
            setCategories(normalizeCategoriesResponse(data));
        } catch (e) {
            console.error('[ItemCategoriesPage] load error:', e);
            setError(e?.message || 'Không thể tải danh mục hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c) =>
            String(c?.name || c?.categoryName || '').toLowerCase().includes(q) ||
            String(c?.code || '').toLowerCase().includes(q)
        );
    }, [categories, search]);

    const handleCreate = async () => {
        const trimmedName = name.trim();
        const trimmedUnit = unit.trim();
        const generatedCode = generateCategoryCode(trimmedName);

        if (!trimmedName) {
            window.alert('Vui long nhap ten mat hang.');
            return;
        }
        if (!trimmedUnit) {
            window.alert('Vui long nhap don vi tinh.');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            // DB item_categories bat buoc: code, name, unit, is_active(default=1)
            // code duoc sinh tu dong de user khong can nhap tay
            const payload = {
                code: generatedCode,
                name: trimmedName,
                unit: trimmedUnit,
            };

            console.log('[ItemCategoriesPage] Creating category with payload:', payload);
            await createItemCategory(payload);

            // Reset form
            setName('');
            setUnit('');
            setQuantity(0);
            await load();
            window.alert('Tao danh muc thanh cong!');
        } catch (e) {
            console.error('[ItemCategoriesPage] create error:', e);
            const msg = e?.data?.message || e?.message || 'Khong the tao danh muc';
            setError(msg);
            window.alert(msg);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh mục hàng</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tạo danh mục (Lương thực, Nhu yếu phẩm, Y tế...) để dùng khi lập phiếu nhập kho.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        to={MANAGER_ROUTES.CREATE_RECEIPT}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Về Phiếu nhập
                    </Link>
                    <button
                        type="button"
                        onClick={load}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Tạo danh mục mới</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        He thong tu dong sinh ma danh muc tu ten mat hang.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tên mặt hàng
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Đơn vị
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Số lượng
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="py-3">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="VD: Mi tom, Nuoc sach, Ao phao..."
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <input
                                        type="text"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        placeholder="VD: Kg, Thung, Chai..."
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <input
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setQuantity(val === '' ? 0 : Math.max(0, Math.round(Number(val))));
                                        }}
                                        placeholder="0"
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        Đang hoạt động
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Plus className="h-4 w-4" />
                        {creating ? 'Đang tạo...' : 'Tạo danh mục'}
                    </button>
                </div>
                {error && (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {error}
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Danh sách danh mục</h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tong cong <span className="font-semibold text-slate-700">{filtered.length}</span> danh muc
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tim theo ten hoac ma..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
                            Dang tai danh sach danh muc...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
                            Chua co danh muc nao. Hay tao "Luong thuc", "Nhu yeu pham", "Y te", "Thiet bi bao ho".
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((c) => {
                                const isInactive = c.isActive === false || c.is_active === false || c.is_active === 0;
                                return (
                                    <div
                                        key={c.id || c.name}
                                        className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {c.name || c.categoryName || 'Danh muc'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Ma: <span className="font-medium text-slate-700">{c.code || '-'}</span>
                                                </p>
                                            </div>
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                                ID {c.id ?? '-'}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                            <div className="text-xs text-slate-600">
                                                Don vi: <span className="font-semibold text-slate-700">{c.unit || '-'}</span>
                                            </div>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                    isInactive
                                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                }`}
                                            >
                                                {isInactive ? 'Ngung' : 'Dang hoat dong'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
