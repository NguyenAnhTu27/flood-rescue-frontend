import React from 'react';

// Layout dành riêng cho các trang Auth (login/register)
export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 ">
            {/* Top bar */}

            <div className="mx-auto w-full max-w-[90%] px-2 lg:px-3 py-8">
                {children}
            </div>

            {/* Footer */}
            <div className="mx-auto w-full max-w-[90%] px-2 lg:px-3 pb-8">
                <div className="pt-8 border-t border-slate-200">
                    <p className="text-center text-xs text-slate-500">
                        © 2024 Hệ thống Cứu hộ - Cứu trợ Quốc gia. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
