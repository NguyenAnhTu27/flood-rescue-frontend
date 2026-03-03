import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Info } from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';

const mockStats = [
    { id: 'total-items', label: 'TỔNG MẶT HÀNG', value: '24', color: 'text-slate-800' },
    { id: 'current-stock', label: 'TỒN KHO HIỆN TẠI', value: '12,450', color: 'text-blue-600' },
    { id: 'import-today', label: 'NHẬP TRONG NGÀY', value: '+1,200', color: 'text-green-600' },
    { id: 'export-today', label: 'XUẤT TRONG NGÀY', value: '-850', color: 'text-red-600' },
];

const mockInventory = [
    { id: '1', code: '#ITEM-001', name: 'Gạo tẻ (25kg)', category: 'Lương thực', unit: 'Bao', qty: 450, status: 'Ổn định', statusType: 'stable' },
    { id: '2', code: '#ITEM-002', name: 'Mì tôm (Thùng 30 gói)', category: 'Lương thực', unit: 'Thùng', qty: 1200, status: 'Ổn định', statusType: 'stable' },
    { id: '3', code: '#ITEM-003', name: 'Nước suối (Lốc 6 chai 1.5L)', category: 'Nhu yếu phẩm', unit: 'Lốc', qty: 85, status: 'Sắp hết', statusType: 'low' },
    { id: '4', code: '#ITEM-004', name: 'Áo phao cứu sinh', category: 'Thiết bị bảo hộ', unit: 'Chiếc', qty: 320, status: 'Ổn định', statusType: 'stable' },
    { id: '5', code: '#ITEM-005', name: 'Thuốc hạ sốt & Sơ cứu', category: 'Y tế', unit: 'Bộ', qty: 500, status: 'Ổn định', statusType: 'stable' },
];

export default function InventoryOverviewPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInventory = useMemo(() => {
        if (!searchQuery.trim()) return mockInventory;
        const q = searchQuery.toLowerCase();
        return mockInventory.filter(
            (item) =>
                item.code.toLowerCase().includes(q) ||
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    return (
        <div className="space-y-6">
            {/* ===== HEADER ===== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý Kho Trung tâm
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Hệ thống quản lý hàng cứu trợ bão lụt
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        to={MANAGER_ROUTES.CREATE_RECEIPT}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo phiếu nhập
                    </Link>
                    <Link
                        to={MANAGER_ROUTES.CREATE_ISSUE}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo phiếu xuất
                    </Link>
                </div>
            </div>

            {/* ===== METRIC CARDS ===== */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {mockStats.map((stat) => (
                    <div
                        key={stat.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {stat.label}
                        </p>
                        <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ===== CURRENT STOCK TABLE ===== */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Bảng tồn kho hiện có
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mặt hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Mã hàng
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tên mặt hàng
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Phân loại
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Đơn vị
                                </th>
                                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Số lượng tồn
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                >
                                    <td className="py-3 text-sm font-medium text-slate-900">
                                        {item.code}
                                    </td>
                                    <td className="py-3 text-sm text-slate-700">
                                        {item.name}
                                    </td>
                                    <td className="py-3 text-sm text-slate-600">
                                        {item.category}
                                    </td>
                                    <td className="py-3 text-sm text-slate-600">
                                        {item.unit}
                                    </td>
                                    <td
                                        className={`py-3 text-right text-sm font-medium ${
                                            item.statusType === 'low'
                                                ? 'text-red-600'
                                                : 'text-slate-900'
                                        }`}
                                    >
                                        {item.qty.toLocaleString()}
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${
                                                item.statusType === 'low'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'text-green-700'
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        to={MANAGER_ROUTES.ITEM_CATEGORIES}
                        className="text-sm font-medium text-blue-600 underline hover:text-blue-700"
                    >
                        Xem toàn bộ danh sách hàng hóa
                    </Link>
                </div>
            </div>

            {/* ===== COORDINATION NOTE ===== */}
            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">Lưu ý điều phối</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Hệ thống đang ở chế độ Kho Trung tâm duy nhất. Mọi phiếu nhập/xuất
                        sẽ được ghi nhận trực tiếp vào tổng tồn kho.
                    </p>
                </div>
            </div>
        </div>
    );
}
