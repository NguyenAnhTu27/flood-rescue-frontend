import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import {
    createItemCategory,
    deleteItemCategory,
    getItemCategories,
    getItemClassifications,
    getItemUnits,
} from '../../features/relief/api.js';

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

export default function ItemCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [classifications, setClassifications] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [selectedClassificationFilter, setSelectedClassificationFilter] = useState('');
    const [selectedUnitFilter, setSelectedUnitFilter] = useState('');

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [classificationId, setClassificationId] = useState('');
    const [creating, setCreating] = useState(false);

    const loadClassifications = async () => {
        const data = await getItemClassifications();
        const list = normalizeList(data);
        setClassifications(list);
        if (!classificationId && list.length > 0) {
            setClassificationId(String(list[0].id));
        }
    };

    const loadUnits = async () => {
        const data = await getItemUnits();
        const list = normalizeList(data);
        setUnits(list);
        if (!unit && list.length > 0) {
            setUnit(String(list[0].code || ''));
        }
    };

    const loadCategories = async (filterClassificationId = selectedClassificationFilter) => {
        const params = {};
        if (filterClassificationId) {
            params.classificationId = Number(filterClassificationId);
        }
        const data = await getItemCategories(params);
        setCategories(normalizeList(data));
    };

    const loadAll = async () => {
        try {
            setLoading(true);
            setError(null);
            await Promise.all([loadClassifications(), loadUnits(), loadCategories()]);
        } catch (e) {
            setError(e?.message || 'Không thể tải dữ liệu danh mục hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadCategories(selectedClassificationFilter).catch((e) => {
            setError(e?.message || 'Không thể lọc danh mục theo phân loại');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassificationFilter]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return categories.filter((c) => {
            if (selectedUnitFilter && String(c?.unit || '').toLowerCase() !== String(selectedUnitFilter).toLowerCase()) {
                return false;
            }
            if (!q) return true;
            return [c?.code, c?.name, c?.classificationName, c?.unit]
                .filter(Boolean)
                .some((x) => String(x).toLowerCase().includes(q));
        });
    }, [categories, search, selectedUnitFilter]);

    const handleCreate = async () => {
        const trimmedCode = code.trim();
        const trimmedName = name.trim();
        const trimmedUnit = unit.trim();
        const parsedClassificationId = Number(classificationId);

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
        if (!parsedClassificationId) {
            window.alert('Vui lòng chọn phân loại hàng.');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            await createItemCategory({
                code: trimmedCode,
                name: trimmedName,
                unit: trimmedUnit,
                classificationId: parsedClassificationId,
            });

            setCode('');
            setName('');
            setUnit('');
            await loadCategories();
            window.alert('Tạo danh mục thành công!');
        } catch (e) {
            const msg = e?.data?.message || e?.message || 'Không thể tạo danh mục';
            setError(msg);
            window.alert(msg);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteCategory = async (item) => {
        if (!window.confirm(`Xóa danh mục "${item.name}"?`)) return;
        try {
            await deleteItemCategory(item.id);
            await loadCategories();
        } catch (e) {
            window.alert(e?.message || 'Không thể xóa danh mục hàng.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh mục hàng</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Danh mục hàng được gắn theo phân loại để dùng khi lập phiếu nhập/xuất kho.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        to={MANAGER_ROUTES.ITEM_CLASSIFICATIONS}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Quản lý phân loại
                    </Link>
                    <Link
                        to={MANAGER_ROUTES.ITEM_UNITS}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Quản lý đơn vị
                    </Link>
                    <button
                        type="button"
                        onClick={loadAll}
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

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Mã hàng"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên loại hàng"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    />
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    >
                        <option value="">Chọn đơn vị</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.code}>
                                {u.code} - {u.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={classificationId}
                        onChange={(e) => setClassificationId(e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    >
                        <option value="">Chọn phân loại hàng</option>
                        {classifications.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                {units.length === 0 && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Chưa có đơn vị. Vui lòng tạo ở mục <Link to={MANAGER_ROUTES.ITEM_UNITS} className="font-semibold underline">Quản lý đơn vị</Link>.
                    </div>
                )}

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-70"
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
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Danh sách danh mục</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedClassificationFilter}
                            onChange={(e) => setSelectedClassificationFilter(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
                        >
                            <option value="">Tất cả phân loại</option>
                            {classifications.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={selectedUnitFilter}
                            onChange={(e) => setSelectedUnitFilter(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
                        >
                            <option value="">Tất cả đơn vị</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.code}>
                                    {u.code} - {u.name}
                                </option>
                            ))}
                        </select>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm danh mục..."
                                className="h-9 w-64 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-slate-500">Đang tải...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-500">Chưa có danh mục nào.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500">
                                        <th className="px-3 py-2">Mã</th>
                                        <th className="px-3 py-2">Tên</th>
                                        <th className="px-3 py-2">Phân loại</th>
                                        <th className="px-3 py-2">Đơn vị</th>
                                        <th className="px-3 py-2">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c) => (
                                        <tr key={c.id} className="border-b border-slate-100">
                                            <td className="px-3 py-2 font-medium text-slate-800">{c.code}</td>
                                            <td className="px-3 py-2 text-slate-700">{c.name}</td>
                                            <td className="px-3 py-2 text-slate-700">{c.classificationName || '—'}</td>
                                            <td className="px-3 py-2 text-slate-700">{c.unit}</td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(c)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
