import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Settings, Shield, FileText, History, Plus } from 'lucide-react';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const quickActions = [
        {
            title: 'Quản lý Người dùng',
            description: 'Tạo và quản lý tài khoản người dùng',
            icon: Users,
            route: ADMIN_ROUTES.USERS_MANAGEMENT,
            color: 'bg-blue-500',
        },
        {
            title: 'Quản lý Đội Cứu Hộ',
            description: 'Tạo và quản lý các đội cứu hộ',
            icon: UserPlus,
            route: ADMIN_ROUTES.TEAMS_MANAGEMENT,
            color: 'bg-green-500',
        },
        {
            title: 'Phân quyền',
            description: 'Quản lý vai trò và quyền truy cập',
            icon: Shield,
            route: ADMIN_ROUTES.ROLES_PERMISSIONS,
            color: 'bg-purple-500',
        },
        {
            title: 'Cấu hình Hệ thống',
            description: 'Thiết lập các thông số hệ thống',
            icon: Settings,
            route: ADMIN_ROUTES.SYSTEM_SETTINGS,
            color: 'bg-amber-500',
        },
        {
            title: 'Mẫu Thông báo',
            description: 'Quản lý các mẫu thông báo',
            icon: FileText,
            route: ADMIN_ROUTES.NOTIFICATION_TEMPLATES,
            color: 'bg-indigo-500',
        },
        {
            title: 'Nhật ký Hệ thống',
            description: 'Xem lịch sử hoạt động hệ thống',
            icon: History,
            route: ADMIN_ROUTES.AUDIT_LOGS,
            color: 'bg-slate-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Quản lý hệ thống và người dùng
                </p>
            </div>

            {/* Quick Actions */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Lối tắt Quản lý</h2>
                    <button
                        onClick={() => navigate(ADMIN_ROUTES.CREATE_TEAM)}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo đội cứu hộ
                    </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.route}
                                onClick={() => navigate(action.route)}
                                className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${action.color} text-white transition group-hover:scale-110`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                                            {action.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
