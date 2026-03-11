import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Users, ScrollText, ArrowRight } from "lucide-react";
import { ADMIN_ROUTES } from "../../app/routes/route.constants.js";

export default function AdminDashboard() {
  const API = "http://localhost:8080/api/admin";
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await res.json() : await res.text();
        if (!res.ok) {
          throw new Error(typeof data === "string" ? data : data?.message || "Không thể tải thống kê");
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
        title: "Quản lý Người dùng",
        description: "Quản lý tài khoản, thông tin cá nhân và trạng thái hoạt động.",
        to: ADMIN_ROUTES.USERS_MANAGEMENT,
        icon: Users,
      },
      {
        title: "Cấu hình hệ thống",
        description: "Cài đặt tham số vận hành và tham số kỹ thuật.",
        to: ADMIN_ROUTES.SYSTEM_SETTINGS,
        icon: Settings,
      },
      {
        title: "Nhật ký hệ thống",
        description: "Theo dõi lịch sử truy cập và các thay đổi dữ liệu.",
        to: ADMIN_ROUTES.AUDIT_LOGS,
        icon: ScrollText,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">Quản trị hệ thống</h1>
            <p className="mt-3 text-2xl text-slate-600">Quản lý người dùng, đội cứu hộ, cấu hình và vận hành hệ thống</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-right shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">System Administrator</p>
            <p className="text-lg font-semibold text-slate-900">ADMIN</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Tổng người dùng</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Đang hoạt động</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.activeUsers}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Bị khóa</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">{stats.lockedUsers}</p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Icon size={28} />
              </div>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-slate-900">{module.title}</h2>
              <p className="mt-3 min-h-[56px] text-xl text-slate-600">{module.description}</p>

              <Link
                to={module.to}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
              >
                Truy cập
                <ArrowRight size={18} />
              </Link>
            </article>
          );
        })}
      </section>

    </div>
  );
}
