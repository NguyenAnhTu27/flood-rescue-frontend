import React, { useEffect, useMemo, useState } from "react";
import { ADMIN_API_BASE_URL } from "../../app/config/env.js";

export default function UserManagementPage() {
  const API = ADMIN_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showCreate, setShowCreate] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [showDetailPassword, setShowDetailPassword] = useState(false);
  const [detailResetPassword, setDetailResetPassword] = useState("");
  const [detailForm, setDetailForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleId: 1,
    status: "ACTIVE",
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
  });

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleId: 1,
    teamId: null,
  });

  const [resetPasswords, setResetPasswords] = useState({});

  const roleOptions = useMemo(
    () => [
      { id: "", label: "Tất cả" },
      { id: 1, label: "Citizen" },
      { id: 2, label: "Coordinator" },
      { id: 3, label: "Rescue Team" },
      { id: 4, label: "Manager" },
    ],
    []
  );

  const roleCodeById = useMemo(
    () => ({
      1: "CITIZEN",
      2: "COORDINATOR",
      3: "RESCUER",
      4: "MANAGER",
      5: "ADMIN",
    }),
    []
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      if (typeof data === "string") {
        throw new Error(data);
      }
      if (data?.errors && typeof data.errors === "object") {
        const details = Object.values(data.errors).join("; ");
        throw new Error(details || data?.message || "Request failed");
      }
      throw new Error(data?.message || "Request failed");
    }
    return data;
  };

  const validateCreateForm = (input) => {
    const errors = {};
    const fullName = (input.fullName || "").trim();
    const email = (input.email || "").trim();
    const phone = (input.phone || "").trim();
    const password = input.password || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[3-9]\d{8}|\+84[3-9]\d{8})$/;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z\d]/.test(password);

    if (!fullName) {
      errors.fullName = "Họ tên không được để trống";
    } else if (fullName.length < 2 || fullName.length > 120) {
      errors.fullName = "Họ tên phải từ 2 đến 120 ký tự";
    }

    if (!email) {
      errors.email = "Email không được để trống";
    } else if (!emailRegex.test(email)) {
      errors.email = "Email không đúng định dạng";
    }

    if (!phone) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(phone)) {
      errors.phone = "Số điện thoại phải là 10 số (03-09) hoặc định dạng +84";
    }

    if (!password) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 8 || password.length > 72) {
      errors.password = "Mật khẩu phải từ 8 đến 72 ký tự";
    } else if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      errors.password = "Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt";
    }

    if (!input.roleId) {
      errors.roleId = "Vai trò không được để trống";
    }

    return errors;
  };

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const getUsers = async (nextPage = page) => {
    try {
      let url = `${API}/users?page=${nextPage}`;
      if (keyword.trim()) url += `&keyword=${encodeURIComponent(keyword.trim())}`;
      if (roleId !== "") url += `&roleId=${roleId}`;

      const res = await fetch(url, { headers: authHeaders });
      const data = await parseResponse(res);
      const incomingUsers = Array.isArray(data.users) ? data.users : [];
      const incomingTotalUsers = data.totalUsers || 0;
      const incomingTotalPages = data.totalPages || 1;

      if (incomingUsers.length === 0 && incomingTotalUsers > 0 && nextPage > 0) {
        setPage(0);
        await getUsers(0);
        return;
      }

      setUsers(incomingUsers);
      setTotalPages(incomingTotalPages);
      setTotalUsers(incomingTotalUsers);
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const getStats = async () => {
    try {
      const res = await fetch(`${API}/stats`, { headers: authHeaders });
      const data = await parseResponse(res);
      setStats({
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        lockedUsers: data.lockedUsers || 0,
      });
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  useEffect(() => {
    getUsers(page);
    getStats();
  }, [page]);

  const createUser = async () => {
    const errors = validateCreateForm(form);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) {
      showMessage("Dữ liệu tạo tài khoản chưa hợp lệ. Vui lòng kiểm tra các trường bắt buộc.", "error");
      return;
    }

    try {
      const payload = { ...form };
      const res = await fetch(`${API}/create-user`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Tạo tài khoản thành công", "success");
      setShowCreate(false);
      setShowCreatePassword(false);
      setCreateErrors({});
      setForm({ fullName: "", email: "", phone: "", password: "", roleId: 1, teamId: null });

      const createdUser = {
        id: Date.now(), // temporary client id for instant UI update
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        role: roleCodeById[payload.roleId] || "UNKNOWN",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      const matchesRole = roleId === "" || String(payload.roleId) === String(roleId);
      const q = keyword.trim().toLowerCase();
      const matchesKeyword =
        !q ||
        [createdUser.fullName, createdUser.email, createdUser.phone, createdUser.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      if (matchesRole && matchesKeyword) {
        setUsers((prev) => [createdUser, ...prev.slice(0, 19)]);
      }

      setTotalUsers((prev) => prev + 1);
      setStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        activeUsers: prev.activeUsers + 1,
      }));

      // Force full page refresh so UI always reflects latest backend state.
      window.location.reload();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const deleteUser = async (user) => {
    try {
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Đã xoá user", "success");

      // Remove immediately from current UI list without full-page refresh.
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotalUsers((prev) => Math.max(0, prev - 1));
      setStats((prev) => ({
        totalUsers: Math.max(0, prev.totalUsers - 1),
        activeUsers: user.status === "ACTIVE" ? Math.max(0, prev.activeUsers - 1) : prev.activeUsers,
        lockedUsers: user.status === "LOCKED" ? Math.max(0, prev.lockedUsers - 1) : prev.lockedUsers,
      }));
      setResetPasswords((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });

      // Force full page refresh so UI always reflects latest backend state.
      window.location.reload();
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetPassword = async (id) => {
    try {
      const password = resetPasswords[id];
      if (!password?.trim()) {
        showMessage("Nhập password mới", "error");
        return;
      }

      const res = await fetch(`${API}/users/${id}/reset-password`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Reset password thành công", "success");
      setResetPasswords((prev) => ({ ...prev, [id]: "" }));
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const openDetail = (user) => {
    setDetailUser(user);
    setDetailForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      roleId: user.roleId || 1,
      status: user.status || "ACTIVE",
    });
    setDetailResetPassword("");
    setShowDetailPassword(false);
  };

  const saveDetail = async () => {
    if (!detailUser) return;
    try {
      const payload = {
        ...detailForm,
        roleId: Number(detailForm.roleId),
        teamId: null,
      };
      const res = await fetch(`${API}/users/${detailUser.id}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Cập nhật người dùng thành công", "success");
      setDetailUser(null);
      setPage(0);
      await getUsers(0);
      await getStats();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const resetPasswordFromDetail = async () => {
    if (!detailUser) return;
    if (!detailResetPassword.trim()) {
      showMessage("Nhập mật khẩu mới", "error");
      return;
    }
    try {
      const res = await fetch(`${API}/users/${detailUser.id}/reset-password`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: detailResetPassword }),
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Reset password thành công", "success");
      setDetailResetPassword("");
      setShowDetailPassword(false);
      setResetPasswords((prev) => ({ ...prev, [detailUser.id]: "" }));
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/users/${id}/status`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Cập nhật trạng thái thành công", "success");
      await getUsers();
      await getStats();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const handleSearch = async () => {
    setPage(0);
    await getUsers(0);
  };

  const statusClass = (status) =>
    status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : "bg-rose-100 text-rose-700";

  const formatCreatedAt = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5C6 5 2 12 2 12s4 7 10 7s10-7 10-7s-4-7-10-7Zm0 11a4 4 0 1 1 0-8a4 4 0 0 1 0 8Z"
      />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 5l2-2l18 18l-2 2l-4.2-4.2A10.6 10.6 0 0 1 12 19c-6 0-10-7-10-7a21.8 21.8 0 0 1 5.2-5.8L2 5Zm20 7s-4-7-10-7c-1.4 0-2.7.3-4 .8l1.6 1.6A4 4 0 0 1 16.6 14L22 12Z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {message && (
        <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
          <div
            className={`w-full max-w-3xl rounded-xl border px-4 py-3 shadow-lg ${
              messageType === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{message}</p>
              <button
                type="button"
                onClick={() => setMessage("")}
                className="rounded px-2 py-1 text-xs font-semibold hover:bg-black/5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
            <p className="text-slate-500">Quản lý danh sách thành viên, phân quyền và trạng thái truy cập.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Tạo người dùng mới
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-5">
        <section className="rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="min-w-[280px] flex-1 rounded-xl border bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500"
              placeholder="Tìm theo họ tên, email, số điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {roleOptions.map((r) => (
              <button
                key={String(r.id)}
                onClick={() => setRoleId(r.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  String(roleId) === String(r.id)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
            <button onClick={handleSearch} className="rounded-xl bg-slate-800 px-4 py-2.5 text-white">
              Tìm
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="grid grid-cols-12 border-b bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-500">
            <div className="col-span-4">HỌ TÊN & THÔNG TIN</div>
            <div className="col-span-2">VAI TRÒ</div>
            <div className="col-span-2">TRẠNG THÁI</div>
            <div className="col-span-2">NGÀY TẠO</div>
            <div className="col-span-2">THAO TÁC</div>
          </div>

          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-12 items-center border-b px-6 py-4">
              <div className="col-span-4">
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-sm text-slate-500">{user.email || "-"}</p>
                <p className="text-sm text-slate-500">{user.phone || "-"}</p>
              </div>
              <div className="col-span-2">
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm">{user.role}</span>
              </div>
              <div className="col-span-2">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(user.status)}`}>
                  {user.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                </span>
              </div>
              <div className="col-span-2 text-sm text-slate-500">{formatCreatedAt(user.createdAt)}</div>
              <div className="col-span-2">
                <button
                  onClick={() => openDetail(user)}
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between px-6 py-4 text-sm text-slate-600">
            <div>
              Hiển thị trang {page + 1} / {totalPages} - Tổng {totalUsers} người dùng
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">Tổng người dùng</p>
            <p className="text-4xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">Đang hoạt động</p>
            <p className="text-4xl font-bold text-green-600">{stats.activeUsers}</p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">Bị tạm khóa</p>
            <p className="text-4xl font-bold text-rose-600">{stats.lockedUsers}</p>
          </div>
        </section>

      </main>

      {showCreate && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5">
            <h3 className="mb-4 text-xl font-semibold">Tạo người dùng mới</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <input
                  className={`w-full rounded border p-2 ${createErrors.fullName ? "border-rose-400" : ""}`}
                  placeholder="Họ tên"
                  value={form.fullName}
                  onChange={(e) => {
                    setForm({ ...form, fullName: e.target.value });
                    setCreateErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                />
                {createErrors.fullName && <p className="mt-1 text-xs text-rose-600">{createErrors.fullName}</p>}
              </div>
              <div>
                <input
                  className={`w-full rounded border p-2 ${createErrors.email ? "border-rose-400" : ""}`}
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setCreateErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                />
                {createErrors.email && <p className="mt-1 text-xs text-rose-600">{createErrors.email}</p>}
              </div>
              <div>
                <input
                  className={`w-full rounded border p-2 ${createErrors.phone ? "border-rose-400" : ""}`}
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    setCreateErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                />
                {createErrors.phone && <p className="mt-1 text-xs text-rose-600">{createErrors.phone}</p>}
              </div>
              <div className="flex items-center rounded border">
                <input
                  className={`w-full rounded-l p-2 outline-none ${createErrors.password ? "border-rose-400" : ""}`}
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setCreateErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((v) => !v)}
                  className="px-2 text-slate-500 hover:text-slate-700"
                  aria-label={showCreatePassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCreatePassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {createErrors.password && <p className="-mt-2 text-xs text-rose-600 md:col-start-2">{createErrors.password}</p>}
              <div>
                <select
                  className={`w-full rounded border p-2 ${createErrors.roleId ? "border-rose-400" : ""}`}
                  value={form.roleId}
                  onChange={(e) => {
                    setForm({ ...form, roleId: Number(e.target.value) });
                    setCreateErrors((prev) => ({ ...prev, roleId: undefined }));
                  }}
                >
                  <option value={1}>Citizen</option>
                  <option value={2}>Coordinator</option>
                  <option value={3}>Rescue Team</option>
                  <option value={4}>Manager</option>
                </select>
                {createErrors.roleId && <p className="mt-1 text-xs text-rose-600">{createErrors.roleId}</p>}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setShowCreatePassword(false);
                  setCreateErrors({});
                }}
                className="rounded border px-4 py-2"
              >
                Hủy
              </button>
              <button onClick={createUser} className="rounded bg-blue-600 px-4 py-2 text-white">Tạo</button>
            </div>
          </div>
        </div>
      )}

      {detailUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-3xl font-bold text-slate-900">Thiết lập Thông tin Người dùng</h3>
              <p className="mt-1 text-slate-500">Tạo mới hoặc cập nhật thông tin thành viên trong hệ thống quản lý cứu hộ</p>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-2xl border">
                <div className="border-b px-5 py-4">
                  <h4 className="text-2xl font-bold">Thông tin chi tiết</h4>
                  <p className="text-slate-500">Vui lòng điền đầy đủ các thông tin bắt buộc dưới đây.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Họ tên *</label>
                    <input
                      className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                      value={detailForm.fullName}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Email *</label>
                    <input
                      className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                      value={detailForm.email}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Số điện thoại *</label>
                    <input
                      className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                      value={detailForm.phone}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Mật khẩu mới</label>
                    <div className="flex items-center rounded-xl border bg-slate-50">
                      <input
                        className="w-full rounded-l-xl bg-transparent px-4 py-3 outline-none"
                        type={showDetailPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu mới"
                        value={detailResetPassword}
                        onChange={(e) => {
                          setDetailResetPassword(e.target.value);
                          setResetPasswords((prev) => ({ ...prev, [detailUser.id]: e.target.value }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDetailPassword((v) => !v)}
                        className="px-3 text-slate-500 hover:text-slate-700"
                      >
                        {showDetailPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Vai trò *</label>
                    <select
                      className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                      value={detailForm.roleId}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, roleId: Number(e.target.value) }))}
                    >
                      <option value={1}>Citizen</option>
                      <option value={2}>Coordinator</option>
                      <option value={3}>Rescue Team</option>
                      <option value={4}>Manager</option>
                      <option value={5}>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Trạng thái</label>
                    <select
                      className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                      value={detailForm.status}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="LOCKED">LOCKED</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between border-t px-5 py-4">
                  <button
                    onClick={() => setDeleteTarget(detailUser)}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Xóa người dùng
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailUser(null)}
                      className="rounded-lg border px-4 py-2 text-sm font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={resetPasswordFromDetail}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={saveDetail}
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa người dùng</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa người dùng{" "}
              <span className="font-semibold text-slate-800">{deleteTarget.fullName}</span> không?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded border px-4 py-2 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (detailUser && deleteTarget?.id === detailUser.id) {
                    setDetailUser(null);
                  }
                  deleteUser(deleteTarget);
                }}
                className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
