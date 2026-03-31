import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ScrollText,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import Card from '../../shared/ui/Card.jsx';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';

export default function AdminDashboard() {
  const API = 'http://localhost:8080/api/admin';
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) {
          throw new Error(typeof data === 'string' ? data : data?.message || 'Không thể tải thống kê');
        }
        setStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          lockedUsers: data.lockedUsers || 0,
        });
      } catch (e) {
        setError(e.message);
      }
    };

    fetchStats();
  }, [token]);

  const modules = useMemo(
    () => [
      {
        title: 'Quản lý người dùng',
        description: 'Cập nhật tài khoản, trạng thái hoạt động và rà soát phân quyền truy cập.',
        to: ADMIN_ROUTES.USERS_MANAGEMENT,
        icon: Users,
        accent: 'from-blue-500/15 via-cyan-500/10 to-white',
        iconClassName: 'bg-blue-100 text-blue-700',
      },
      {
        title: 'Cấu hình hệ thống',
        description: 'Điều chỉnh tham số vận hành và giữ toàn bộ quy trình chạy ổn định.',
        to: ADMIN_ROUTES.SYSTEM_SETTINGS,
        icon: Settings,
        accent: 'from-amber-500/15 via-orange-500/10 to-white',
        iconClassName: 'bg-amber-100 text-amber-700',
      },
      {
        title: 'Nhật ký hệ thống',
        description: 'Theo dõi truy cập, kiểm tra thay đổi dữ liệu và phát hiện bất thường.',
        to: ADMIN_ROUTES.AUDIT_LOGS,
        icon: ScrollText,
        accent: 'from-emerald-500/15 via-cyan-500/10 to-white',
        iconClassName: 'bg-emerald-100 text-emerald-700',
      },
    ],
    [],
  );

  const activeRate = useMemo(() => {
    if (!stats.totalUsers) return 0;
    return Math.round((stats.activeUsers / stats.totalUsers) * 100);
  }, [stats.activeUsers, stats.totalUsers]);

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-blue-400/25 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white shadow-xl">
        <div className="relative p-5 sm:p-6 lg:p-8">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-300/20 blur-3xl animate-pulse" />

          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50 backdrop-blur">
                  <Shield className="h-3.5 w-3.5" />
                  Quản trị hệ thống
                </div>

                <div className="space-y-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2.1rem]">
                    Trung tâm điều hành cho quản trị viên
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-blue-50/90 sm:text-base">
                    Quản trị tài khoản người dùng, rà soát trạng thái hoạt động, cấu hình tham số hệ thống
                    và theo dõi nhật ký vận hành để nền tảng cứu hộ, cứu trợ luôn ổn định và an toàn.
                  </p>
                </div>
              </div>

              <div className="self-start rounded-[24px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-blue-100/75">Trạng thái hệ thống</div>
                    <div className="mt-1 text-sm font-semibold text-white">Sẵn sàng quản trị</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-blue-100/75">Tổng người dùng</div>
                    <div className="mt-4 text-3xl font-bold text-white">{stats.totalUsers}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-blue-100">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-blue-100/75">Đang hoạt động</div>
                    <div className="mt-4 text-3xl font-bold text-emerald-300">{stats.activeUsers}</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-blue-100/75">Bị khóa</div>
                    <div className="mt-4 text-3xl font-bold text-rose-300">{stats.lockedUsers}</div>
                  </div>
                  <div className="rounded-2xl bg-rose-400/15 p-3 text-rose-200">
                    <Lock className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-blue-100/75">Tỷ lệ hoạt động</div>
                    <div className="mt-4 text-3xl font-bold text-cyan-200">{activeRate}%</div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-700"
                        style={{ width: `${Math.max(activeRate, 8)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-blue-100">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Phân hệ quản trị</h2>
            <p className="text-sm text-slate-500">
              Các tác vụ quản trị chính được gom lại để thao tác nhanh và dễ theo dõi hơn.
            </p>
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {modules.length} modules
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <article
                key={module.title}
                className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className={`flex-1 rounded-[22px] bg-gradient-to-br p-4 ${module.accent}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${module.iconClassName}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold leading-tight text-slate-950">
                    {module.title}
                  </h2>
                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">
                    {module.description}
                  </p>
                </div>

                <Link
                  to={module.to}
                  className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Truy cập phân hệ
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
