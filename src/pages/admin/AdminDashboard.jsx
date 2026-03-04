import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../shared/ui/Button.jsx';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';

export default function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-4 rounded-xl border bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Admin - Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Quản trị hệ thống cứu hộ. Bạn có thể quản lý đội cứu hộ, phương tiện và người dùng.
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    className="mt-2 sm:mt-0"
                    onClick={() => navigate(ADMIN_ROUTES.TEAMS_ASSETS)}
                >
                    Tạo đội &amp; phương tiện
                </Button>
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
                Đây là trang tổng quan dành cho admin. Nhấn nút
                <span className="mx-1 font-semibold text-slate-900">"Tạo đội &amp; phương tiện"</span>
                để mở màn hình cấu hình đội cứu hộ và phương tiện phục vụ điều phối.
            </div>
        </div>
    );
}
