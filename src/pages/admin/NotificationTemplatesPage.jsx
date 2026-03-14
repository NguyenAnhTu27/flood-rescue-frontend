import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, FileText, Pencil, PlusCircle, Search } from "lucide-react";

const PAGE_SIZE = 4;
const CHANNEL_OPTIONS = ["WEB", "EMAIL", "SMS", "PUSH"];

const DEFAULT_FORM = {
  id: null,
  code: "",
  templateKey: "",
  title: "",
  channel: "WEB",
  content: "",
  active: true,
};

export default function NotificationTemplatesPage() {
  const API = "http://localhost:8080/api/admin";
  const token = localStorage.getItem("token");

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ totalTemplates: 0, activeTemplates: 0, topChannel: "N/A" });

  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
      throw new Error(typeof data === "string" ? data : data?.message || "Request failed");
    }
    return data;
  };

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const loadTemplates = async (nextPage = page, nextKeyword = keyword) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        size: String(PAGE_SIZE),
      });
      if (nextKeyword?.trim()) {
        params.set("keyword", nextKeyword.trim());
      }

      const res = await fetch(`${API}/notification-templates?${params.toString()}`, {
        headers: authHeaders,
      });
      const data = await parseResponse(res);
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(Number.isFinite(data.page) ? data.page : 0);
      setTotalPages(Math.max(data.totalPages || 1, 1));
      setTotalItems(data.totalItems || 0);
      setStats(data.stats || { totalTemplates: 0, activeTemplates: 0, topChannel: "N/A" });
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates(0, "");
  }, []);

  const runSearch = async () => {
    const q = searchInput.trim();
    setKeyword(q);
    await loadTemplates(0, q);
  };

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({
      id: item.id,
      code: item.code || "",
      templateKey: item.templateKey || "",
      title: item.title || "",
      channel: item.channel || "WEB",
      content: item.content || "",
      active: !!item.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || deleting) return;
    setShowModal(false);
    setForm(DEFAULT_FORM);
  };

  const saveTemplate = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.channel.trim() || !form.content.trim()) {
      showMessage("Vui lòng nhập đầy đủ mã sự kiện, tiêu đề, kênh gửi và nội dung", "error");
      return;
    }

    setSaving(true);
    try {
      if (!form.id) {
        const res = await fetch(`${API}/notification-templates`, {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: form.code,
            templateKey: form.templateKey || form.code,
            title: form.title,
            channel: form.channel,
            content: form.content,
            active: !!form.active,
          }),
        });
        await parseResponse(res);
        showMessage("Tạo mẫu thông báo thành công", "success");
        await loadTemplates(0, keyword);
      } else {
        const res = await fetch(`${API}/notification-templates/${form.id}`, {
          method: "PUT",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title,
            channel: form.channel,
            content: form.content,
            active: !!form.active,
          }),
        });
        await parseResponse(res);
        showMessage("Cập nhật mẫu thông báo thành công", "success");
        await loadTemplates(page, keyword);
      }

      setShowModal(false);
      setForm(DEFAULT_FORM);
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item) => {
    try {
      const res = await fetch(`${API}/notification-templates/${item.id}/active`, {
        method: "PATCH",
        headers: authHeaders,
      });
      await parseResponse(res);
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, active: !x.active } : x)));
      await loadTemplates(page, keyword);
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const deleteTemplate = async () => {
    if (!form.id) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa mẫu thông báo này?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${API}/notification-templates/${form.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await parseResponse(res);
      showMessage("Xóa mẫu thông báo thành công", "success");
      setShowModal(false);
      setForm(DEFAULT_FORM);
      await loadTemplates(0, keyword);
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("vi-VN");
  };

  const renderChannelBadge = (channel) => {
    const value = String(channel || "UNKNOWN").toUpperCase();
    const style =
      value === "WEB"
        ? "bg-blue-100 text-blue-700"
        : value === "EMAIL"
        ? "bg-emerald-100 text-emerald-700"
        : value === "SMS"
        ? "bg-orange-100 text-orange-700"
        : value === "PUSH"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-slate-200 text-slate-700";
    return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
  };

  const startIndex = items.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, totalItems);

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            messageType === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="text-5xl font-extrabold text-slate-900">Quản lý Mẫu thông báo</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-2xl border bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder="Tìm kiếm theo tên hoặc mã sự kiện..."
              className="w-full bg-transparent text-slate-700 outline-none"
            />
          </div>
          <button onClick={runSearch} className="rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-700">
            Tìm
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">
            <PlusCircle size={18} />
            Tạo mẫu mới
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 text-left text-sm font-semibold uppercase text-slate-600">
            <tr>
              <th className="w-[22%] px-6 py-4">Mã sự kiện</th>
              <th className="w-[30%] px-6 py-4">Tiêu đề thông báo</th>
              <th className="w-[12%] px-6 py-4">Kênh gửi</th>
              <th className="w-[12%] px-6 py-4 text-center">Trạng thái</th>
              <th className="w-[14%] px-6 py-4">Ngày cập nhật</th>
              <th className="w-[10%] px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Không có mẫu thông báo nào.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t align-top">
                  <td className="px-6 py-5">
                    <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700">{item.code || item.templateKey}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xl font-bold text-slate-800">{item.title || "-"}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.content || "-"}</p>
                  </td>
                  <td className="px-6 py-5">{renderChannelBadge(item.channel)}</td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`h-8 w-14 rounded-full transition ${item.active ? "bg-blue-600" : "bg-slate-300"}`}
                      aria-label="toggle-active"
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white transition ${
                          item.active ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-5 text-slate-600">{formatDate(item.updatedAt)}</td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={17} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-slate-500">
          <span>
            Hiển thị {startIndex}-{endIndex} trên {totalItems} mẫu
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => loadTemplates(page - 1, keyword)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                onClick={() => loadTemplates(idx, keyword)}
                className={`h-8 min-w-8 rounded px-2 ${idx === page ? "bg-blue-600 text-white" : "border bg-white text-slate-700"}`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              disabled={page + 1 >= totalPages}
              onClick={() => loadTemplates(page + 1, keyword)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng số mẫu</p>
              <p className="text-5xl font-extrabold text-slate-900">{stats.totalTemplates || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đang kích hoạt</p>
              <p className="text-5xl font-extrabold text-emerald-600">{stats.activeTemplates || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kênh gửi nhiều nhất</p>
              <p className="text-4xl font-extrabold text-slate-900">{stats.topChannel || "N/A"}</p>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-3xl font-extrabold text-slate-900">
                {form.id ? "Chỉnh sửa mẫu thông báo" : "Tạo mẫu thông báo mới"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Mã sự kiện *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3"
                  disabled={!!form.id}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Template key</label>
                <input
                  value={form.templateKey}
                  onChange={(e) => setForm((prev) => ({ ...prev, templateKey: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3"
                  disabled={!!form.id}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Tiêu đề *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Kênh gửi *</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3"
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Nội dung *</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Kích hoạt mẫu thông báo
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              {form.id && (
                <button
                  onClick={deleteTemplate}
                  className="mr-auto rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                  disabled={saving || deleting}
                >
                  {deleting ? "Đang xóa..." : "Xóa mẫu"}
                </button>
              )}

              <button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm font-semibold" disabled={saving || deleting}>
                Hủy
              </button>
              <button
                onClick={saveTemplate}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={saving || deleting}
              >
                {saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Tạo mẫu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
