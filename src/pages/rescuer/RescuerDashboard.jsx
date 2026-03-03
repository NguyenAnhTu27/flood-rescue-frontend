import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Users,
    Clock,
    AlertCircle,
    CheckCircle2,
    MoreVertical,
    FileText,
    Plus,
    Wifi,
    Edit,
    Ship,
    Ambulance,
} from 'lucide-react';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';

const mockTasks = [
    {
        id: 'MS-552',
        status: 'AT_SCENE',
        statusLabel: 'TẠI HIỆN TRƯỜNG',
        statusColor: 'orange',
        requestCount: 3,
        timeAgo: '24 phút trước',
        location: 'Đường Tôn Thất Thuyết, Phường 15, Quận 4, TP.HCM',
        vehicle: 'Cano 02',
        vehicleIcon: Ship,
    },
    {
        id: 'MS-560',
        status: 'MOVING',
        statusLabel: 'ĐANG DI CHUYỂN',
        statusColor: 'blue',
        requestCount: 1,
        timeAgo: '5 phút trước',
        location: 'Đường Nguyễn Văn Linh, Phường Tân Phong, Quận 7',
        vehicle: 'Xe cứu thương 01',
        vehicleIcon: Ambulance,
    },
    {
        id: 'MS-565',
        status: 'NEW',
        statusLabel: 'MỚI PHÂN CÔNG',
        statusColor: 'green',
        requestCount: 5,
        timeAgo: 'Vừa xong',
        location: 'Bến Bạch Đằng, Quận 1, TP.HCM',
        vehicle: 'Cano 03',
        vehicleIcon: Ship,
    },
];

export default function RescuerDashboard() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('grid');

    const getStatusBadgeClass = (color) => {
        const colors = {
            orange: 'bg-orange-500 text-white',
            blue: 'bg-blue-500 text-white',
            green: 'bg-green-500 text-white',
        };
        return colors[color] || 'bg-slate-500 text-white';
    };

    return (
        <div className="space-y-6">
            {/* Team Info Section */}
            <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                        <Wifi className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900">Đội Cứu Hộ Số 1</h2>
                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Khu vực hoạt động: Quận 4, TP.HCM
                            </p>
                            <p className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Quân số: 12 thành viên
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600">
                        Đang làm nhiệm vụ
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                        <Edit className="h-4 w-4" />
                        Cập nhật trạng thái
                    </button>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Nhiệm vụ đang thực hiện
                        </h3>
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-700">
                            {mockTasks.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded px-2 py-1 text-xs transition ${
                                viewMode === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Danh sách
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded px-2 py-1 text-xs transition ${
                                viewMode === 'grid'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Lưới
                        </button>
                    </div>
                </div>

                {/* Task Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mockTasks.map((task) => {
                        const VehicleIcon = task.vehicleIcon;
                        return (
                            <div
                                key={task.id}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                            >
                                {/* Status Badge */}
                                <div
                                    className={`absolute left-0 top-0 z-10 rounded-br-lg px-3 py-1 text-[10px] font-bold uppercase ${getStatusBadgeClass(
                                        task.statusColor,
                                    )}`}
                                >
                                    {task.statusLabel}
                                </div>

                                {/* Task ID */}
                                <div className="absolute right-3 top-3 z-10 text-xs font-bold text-white drop-shadow-md">
                                    #{task.id}
                                </div>

                                {/* Map Preview */}
                                <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-20 w-20 rounded-full bg-blue-200/50" />
                                        <div className="absolute inset-6 rounded-full bg-blue-300/60" />
                                        <div className="absolute inset-10 flex items-center justify-center rounded-full bg-blue-600">
                                            <MapPin className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Task Info */}
                                <div className="p-4">
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-semibold text-slate-900">
                                                {task.requestCount} yêu cầu cứu hộ
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500">{task.timeAgo}</span>
                                    </div>

                                    <div className="space-y-2 text-xs text-slate-600">
                                        <p className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span className="line-clamp-2">{task.location}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <VehicleIcon className="h-3.5 w-3.5 shrink-0" />
                                            {task.vehicle}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    RESCUER_ROUTES.ASSIGNMENT_DETAIL.replace(
                                                        ':id',
                                                        task.id,
                                                    ),
                                                )
                                            }
                                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            Xem chi tiết
                                        </button>
                                        <button className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-600">
                    Cập nhật lúc 14:30:15 - Kết nối máy chủ ổn định
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        <FileText className="h-4 w-4" />
                        Báo cáo nhanh
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        Tạo yêu cầu mới
                    </button>
                </div>
            </div>
        </div>
    );
}
