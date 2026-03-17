import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, House, LifeBuoy } from 'lucide-react';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '../../app/routes/route.constants.js';

export default function NotFoundPage() {
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
            <section className="glass-card px-8 py-10 text-center sm:px-12 sm:py-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/80 bg-white/[0.55] text-blue-600 backdrop-blur-xl">
                    <Compass size={28} />
                </div>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-blue-600">404</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-slate-900">Trang bạn cần không còn ở đây</h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-slate-600 sm:text-base">
                    Liên kết có thể đã thay đổi hoặc nội dung chưa được xuất bản công khai. Bạn có thể quay lại trang chủ, xem hướng dẫn khẩn cấp hoặc đăng nhập để tiếp tục với luồng chính của hệ thống.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link to={PUBLIC_ROUTES.HOME} className="inline-flex items-center gap-2 rounded-[18px] bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                        <House size={16} />
                        Về trang chủ
                    </Link>
                    <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="glass-chip rounded-[18px] px-6 py-3.5 font-semibold text-slate-700">
                        <LifeBuoy size={16} />
                        Mở hướng dẫn khẩn cấp
                    </Link>
                    <Link to={AUTH_ROUTES.LOGIN} className="glass-chip rounded-[18px] px-6 py-3.5 font-semibold text-slate-700">
                        Đăng nhập
                    </Link>
                </div>
            </section>
        </div>
    );
}
