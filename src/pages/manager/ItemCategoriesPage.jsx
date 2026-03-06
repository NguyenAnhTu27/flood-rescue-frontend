import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import { createItemCategory, getItemCategories } from '../../features/relief/api.js';

function normalizeCategoriesResponse(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

export default function ItemCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [category, setCategory] = useState(''); // Phân loại
    const [stockQuantity, setStockQuantity] = useState(0); // Số lượng tồn
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
            String(c?.name || c?.categoryName || '').toLowerCase().includes(q)
        );
    }, [categories, search]);

    const handleCreate = async () => {
        const trimmedCode = code.trim();
        const trimmedName = name.trim();
        const trimmedUnit = unit.trim();
        const trimmedCategory = category.trim();

        if (!trimmedCode) {
            window.alert('Vui lòng nhập mã loại hàng.');
            return;
        }
        if (!trimmedName) {
            window.alert('Vui lòng nhập tên loại hàng.');
            return;
        }
        if (!trimmedUnit) {
            window.alert('Vui lòng nhập đơn vị tính.');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            // Gửi đúng format ItemCategoryCreateRequest: { code, name, unit }
            // Nếu backend hỗ trợ thêm field category và stockQuantity, có thể thêm vào
            const payload = {
                code: trimmedCode,
                name: trimmedName,
                unit: trimmedUnit,
                // Thêm các field tùy chọn nếu backend hỗ trợ
                ...(trimmedCategory && { category: trimmedCategory }),
                ...(stockQuantity > 0 && { stockQuantity: Number(stockQuantity) }),
            };

            console.log('[ItemCategoriesPage] Creating category with payload:', payload);
            await createItemCategory(payload);

            // Reset form
            setCode('');
            setName('');
            setUnit('');
            setCategory('');
            setStockQuantity(0);
            await load();
            window.alert('Tạo danh mục thành công!');
        } catch (e) {
            console.error('[ItemCategoriesPage] create error:', e);
            const msg = e?.data?.message || e?.message || 'Không thể tạo danh mục';
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
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
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
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Số lượng tồn
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
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Nhập mã hàng"
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Nhập phân loại (tùy chọn)"
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <input
                                        type="text"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        placeholder="Nhập đơn vị"
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={stockQuantity}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setStockQuantity(val === '' ? 0 : Number(val));
                                        }}
                                        placeholder="0"
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                                    />
                                </td>
                                <td className="py-3">
                                    <span className="inline-flex rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
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

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Danh sách danh mục</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm danh mục..."
                            className="h-9 w-64 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-slate-500">Đang tải...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-500">
                            Chưa có danh mục nào. Hãy tạo “Lương thực”, “Nhu yếu phẩm”, “Y tế”, “Thiết bị bảo hộ”.
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((c) => (
                                <div
                                    key={c.id || c.name}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                                >
                                    <div className="text-xs text-slate-500">
                                        Mã: {c.code || '-'} | ID: {c.id ?? '-'}
                                    </div>
                                    <div className="mt-1 font-semibold text-slate-900">
                                        {c.name || c.categoryName || 'Danh mục'}
                                    </div>
                                    {c.unit && (
                                        <div className="mt-1 text-xs text-slate-600">
                                            Đơn vị: {c.unit}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
