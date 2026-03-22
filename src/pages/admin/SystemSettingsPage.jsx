import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import httpClient from "../../shared/lib/http.js";
import { ADMIN_ROUTES } from "../../app/routes/route.constants.js";

const DEFAULT_SETTINGS = {
  rescueSlaMinutes: 30,
  maxOpenRequestPerCitizen: 1,
  autoLockAfterFailedLogin: 5,
  failedLoginLockMinutes: 15,
  maintenanceMode: false,
  mapRefreshSeconds: 20,
  hotline: "1900-xxxx",
  footerBrandName: "QUẢN LÝ CỨU HỘ",
  footerDescription:
    "Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật và điều phối theo quy định của cơ quan chức năng.",
  footerTermsLabel: "Điều khoản sử dụng",
  footerTermsUrl: "/dieu-khoan-su-dung",
  footerPrivacyLabel: "Chính sách bảo mật",
  footerPrivacyUrl: "/chinh-sach-bao-mat",
  footerSupportLabel: "Liên hệ hỗ trợ",
  footerSupportUrl: "/lien-he-ho-tro",
  footerSupportEmail: "support@cuuho.gov.vn",
  footerFacebookUrl: "#",
  footerTwitterUrl: "#",
  footerYoutubeUrl: "#",
  footerCopyright:
    "© 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.",
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [message, setMessage] = useState("");

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const loadSettings = async () => {
    setMessage("");
    try {
      const data = await httpClient.get("/admin/system-settings");
      const values = data?.values || {};
      setSettings({
        rescueSlaMinutes: Number(values.rescueSlaMinutes ?? DEFAULT_SETTINGS.rescueSlaMinutes),
        maxOpenRequestPerCitizen: Number(values.maxOpenRequestPerCitizen ?? DEFAULT_SETTINGS.maxOpenRequestPerCitizen),
        autoLockAfterFailedLogin: Number(values.autoLockAfterFailedLogin ?? DEFAULT_SETTINGS.autoLockAfterFailedLogin),
        failedLoginLockMinutes: Number(values.failedLoginLockMinutes ?? DEFAULT_SETTINGS.failedLoginLockMinutes),
        maintenanceMode: String(values.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode) === "true",
        mapRefreshSeconds: Number(values.mapRefreshSeconds ?? DEFAULT_SETTINGS.mapRefreshSeconds),
        hotline: values.hotline ?? DEFAULT_SETTINGS.hotline,
        footerBrandName: values.footerBrandName ?? DEFAULT_SETTINGS.footerBrandName,
        footerDescription: values.footerDescription ?? DEFAULT_SETTINGS.footerDescription,
        footerTermsLabel: values.footerTermsLabel ?? DEFAULT_SETTINGS.footerTermsLabel,
        footerTermsUrl: values.footerTermsUrl ?? DEFAULT_SETTINGS.footerTermsUrl,
        footerPrivacyLabel: values.footerPrivacyLabel ?? DEFAULT_SETTINGS.footerPrivacyLabel,
        footerPrivacyUrl: values.footerPrivacyUrl ?? DEFAULT_SETTINGS.footerPrivacyUrl,
        footerSupportLabel: values.footerSupportLabel ?? DEFAULT_SETTINGS.footerSupportLabel,
        footerSupportUrl: values.footerSupportUrl ?? DEFAULT_SETTINGS.footerSupportUrl,
        footerSupportEmail: values.footerSupportEmail ?? DEFAULT_SETTINGS.footerSupportEmail,
        footerFacebookUrl: values.footerFacebookUrl ?? DEFAULT_SETTINGS.footerFacebookUrl,
        footerTwitterUrl: values.footerTwitterUrl ?? DEFAULT_SETTINGS.footerTwitterUrl,
        footerYoutubeUrl: values.footerYoutubeUrl ?? DEFAULT_SETTINGS.footerYoutubeUrl,
        footerCopyright: values.footerCopyright ?? DEFAULT_SETTINGS.footerCopyright,
      });
    } catch (e) {
      setMessage(e.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const save = async () => {
    setMessage("");
    try {
      const data = await httpClient.put("/admin/system-settings", settings);
      setMessage(data?.message || "Đã lưu cấu hình");
      window.dispatchEvent(new Event("runtime-settings-updated"));
      await loadSettings();
    } catch (e) {
      setMessage(e?.message || "Lưu cấu hình thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Cấu hình hệ thống</h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Cài đặt thông số vận hành chung cho toàn hệ thống. Các thay đổi sẽ ảnh hưởng đến hành vi hoạt động và trải nghiệm người dùng.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cài đặt vận hành</h2>
                <p className="mt-1 text-sm text-slate-500">Các tham số ảnh hưởng trực tiếp đến cách hệ thống phản hồi và vận hành.</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Cập nhật nhanh
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-600">SLA phản hồi cứu hộ (phút)</span>
                <input
                  type="number"
                  value={settings.rescueSlaMinutes}
                  onChange={(e) => update("rescueSlaMinutes", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-600">Số yêu cầu mở tối đa / công dân</span>
                <input
                  type="number"
                  value={settings.maxOpenRequestPerCitizen}
                  onChange={(e) => update("maxOpenRequestPerCitizen", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-600">Số lần nhập sai trước khi khóa</span>
                <input
                  type="number"
                  value={settings.autoLockAfterFailedLogin}
                  onChange={(e) => update("autoLockAfterFailedLogin", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-600">Thời gian khóa tạm sau khi sai (phút)</span>
                <input
                  type="number"
                  value={settings.failedLoginLockMinutes}
                  onChange={(e) => update("failedLoginLockMinutes", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-600">Chu kỳ làm mới bản đồ (giây)</span>
                <input
                  type="number"
                  value={settings.mapRefreshSeconds}
                  onChange={(e) => update("mapRefreshSeconds", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-600">Hotline hỗ trợ</span>
                <input
                  value={settings.hotline}
                  onChange={(e) => update("hotline", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => update("maintenanceMode", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Bật chế độ bảo trì</p>
                    <p className="text-xs text-slate-500">Khi bật, hệ thống sẽ hiển thị trang bảo trì cho người dùng.</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cài đặt chân trang</h2>
                <p className="mt-1 text-sm text-slate-500">Thông tin hiển thị ở cuối trang và liên kết đến các trang chính sách.</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Hiển thị trong footer
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-600">Tên thương hiệu</span>
                <input
                  value={settings.footerBrandName}
                  onChange={(e) => update("footerBrandName", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-600">Mô tả chân trang</span>
                <textarea
                  value={settings.footerDescription}
                  onChange={(e) => update("footerDescription", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={3}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Nhãn link điều khoản</span>
                  <input
                    value={settings.footerTermsLabel}
                    onChange={(e) => update("footerTermsLabel", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">URL điều khoản</span>
                  <input
                    value={settings.footerTermsUrl}
                    onChange={(e) => update("footerTermsUrl", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Nhãn link chính sách</span>
                  <input
                    value={settings.footerPrivacyLabel}
                    onChange={(e) => update("footerPrivacyLabel", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">URL chính sách</span>
                  <input
                    value={settings.footerPrivacyUrl}
                    onChange={(e) => update("footerPrivacyUrl", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Nhãn link liên hệ</span>
                  <input
                    value={settings.footerSupportLabel}
                    onChange={(e) => update("footerSupportLabel", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">URL liên hệ</span>
                  <input
                    value={settings.footerSupportUrl}
                    onChange={(e) => update("footerSupportUrl", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Email hỗ trợ</span>
                  <input
                    value={settings.footerSupportEmail}
                    onChange={(e) => update("footerSupportEmail", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Facebook URL</span>
                  <input
                    value={settings.footerFacebookUrl}
                    onChange={(e) => update("footerFacebookUrl", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Twitter URL</span>
                  <input
                    value={settings.footerTwitterUrl}
                    onChange={(e) => update("footerTwitterUrl", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-600">Youtube URL</span>
                  <input
                    value={settings.footerYoutubeUrl}
                    onChange={(e) => update("footerYoutubeUrl", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-600">Dòng bản quyền</span>
                  <input
                    value={settings.footerCopyright}
                    onChange={(e) => update("footerCopyright", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}
            <p className="text-sm text-slate-500">Nhớ bấm "Lưu cấu hình" để áp dụng thay đổi.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Lưu cấu hình
            </button>
            <Link
              to={ADMIN_ROUTES.CONTENT_PAGES}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Đi tới Nội dung trang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
