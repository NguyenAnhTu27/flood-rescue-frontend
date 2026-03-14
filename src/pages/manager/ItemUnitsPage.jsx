import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import {
    createItemUnit,
    deleteItemUnit,
    getItemUnits,
} from '../../features/relief/api.js';

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

export default function ItemUnitsPage() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getItemUnits();
            setList(normalizeList(data));
        } catch (e) {
            setError(e?.message || 'Không thể tải danh sách đơn vị.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter((x) =>
            String(x?.code || '').toLowerCase().includes(q)
            || String(x?.name || '').toLowerCase().includes(q)
        );
    }, [list, search]);

    const handleCreate = async () => {
        if (!code.trim()) {
            window.alert('Vui lòng nhập mã đơn vị.');
            return;
        }
        if (!name.trim()) {
            window.alert('Vui lòng nhập tên đơn vị.');
            return;
        }

        try {
            setSaving(true);
            await createItemUnit({ code: code.trim(), name: name.trim() });
            setCode('');
            setName('');
            await load();
        } catch (e) {
            window.alert(e?.message || 'Không thể tạo đơn vị.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xóa đơn vị "${item.name}"?`)) return;
        try {
            await deleteItemUnit(item.id);
            await load();
        } catch (e) {
            window.alert(e?.message || 'Không thể xóa đơn vị.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đơn vị</h1>
                    <p className="mt-1 text-sm text-slate-500">Quản lý danh sách đơn vị để chọn khi tạo danh mục hàng.</p>
                </div>
                <Link
                    to={MANAGER_ROUTES.ITEM_CATEGORIES}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Về danh mục hàng
                </Link>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-semibold text-slate-900">Tạo đơn vị mới</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Mã đơn vị"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    />
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên đơn vị"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    />
                </div>
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" />
                        {saving ? 'Đang tạo...' : 'Tạo đơn vị'}
                    </button>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Danh sách đơn vị</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm đơn vị..."
                            className="h-9 w-64 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm"
                        />
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="py-8 text-center text-sm text-slate-500">Đang tải...</div>
                    ) : error ? (
                        <div className="py-8 text-center text-sm text-rose-600">{error}</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">Chưa có đơn vị hàng nào.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500">
                                        <th className="px-3 py-2">Mã</th>
                                        <th className="px-3 py-2">Tên</th>
                                        <th className="px-3 py-2">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            <td className="px-3 py-2 font-medium text-slate-800">{item.code}</td>
                                            <td className="px-3 py-2 text-slate-700">{item.name}</td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
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
            </section>
        </div>
    );
}
