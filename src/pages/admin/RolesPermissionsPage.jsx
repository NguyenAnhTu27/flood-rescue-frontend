import React, { useEffect, useMemo, useState } from "react";

export default function RolesPermissionsPage() {
  const API = "http://localhost:8080/api/admin";
  const token = localStorage.getItem("token");

  const [activeRole, setActiveRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [permissionMap, setPermissionMap] = useState({});
  const [permissionDefs, setPermissionDefs] = useState([]);
  const [draftPermissions, setDraftPermissions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("permissions");
  const [roleUsers, setRoleUsers] = useState([]);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const selected = useMemo(() => new Set(draftPermissions || []), [draftPermissions]);
  const activeRoleItem = useMemo(
    () => roles.find((r) => r.code === activeRole) || null,
    [roles, activeRole]
  );

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
      throw new Error(typeof data === "string" ? data : data?.message || "Request failed");
    }
    return data;
  };

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponse(res);
      setPermissionDefs(Array.isArray(data.permissions) ? data.permissions : []);
      setPermissionMap(data.rolePermissions || {});
      const roleItems = Array.isArray(data.roles) ? data.roles : [];
      setRoles(roleItems);

      const firstRole = roleItems[0]?.code || Object.keys(data.rolePermissions || {})[0];
      const nextRole = activeRole && (data.rolePermissions || {})[activeRole] ? activeRole : firstRole;
      if (nextRole) {
        setActiveRole(nextRole);
        setDraftPermissions([...(data.rolePermissions?.[nextRole] || [])]);
      }
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeRole) return;
    setDraftPermissions([...(permissionMap[activeRole] || [])]);
  }, [activeRole, permissionMap]);

  useEffect(() => {
    const loadRoleUsers = async () => {
      if (activeTab !== "users" || !activeRoleItem?.id) return;
      try {
        const res = await fetch(`${API}/users?roleId=${activeRoleItem.id}&page=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseResponse(res);
        setRoleUsers(Array.isArray(data.users) ? data.users : []);
      } catch (e) {
        showMessage(e.message, "error");
      }
    };
    loadRoleUsers();
  }, [activeTab, activeRoleItem?.id]);

  const roleNameMap = useMemo(
    () => ({
      CITIZEN: "Citizen",
      COORDINATOR: "Coordinator",
      RESCUER: "Rescue Team",
      MANAGER: "Manager",
      ADMIN: "Admin",
    }),
    []
  );

  const roleDescMap = useMemo(
    () => ({
      CITIZEN: "Người dân gửi yêu cầu cứu trợ",
      COORDINATOR: "Điều phối viên hiện trường",
      RESCUER: "Đội cứu hộ trực tiếp",
      MANAGER: "Quản lý kho và nguồn lực",
      ADMIN: "Toàn quyền hệ thống",
    }),
    []
  );

  const moduleLabel = (key) => {
    const map = {
      RESCUE: "Quản lý yêu cầu cứu hộ",
      USER: "Quản lý người dùng",
      INVENTORY: "Quản lý kho hàng",
      SYSTEM: "Cấu hình hệ thống",
      AUDIT: "Xem báo cáo",
      DEFAULT: "Phân quyền khác",
    };
    return map[key] || key;
  };

  const actionLabel = (action) => {
    const map = {
      read: "Xem",
      create: "Thêm",
      update: "Sửa",
      delete: "Xóa",
      assign: "Phân công",
      manage: "Quản lý",
      config: "Cấu hình",
      export: "Xuất file",
    };
    return map[action] || action.toUpperCase();
  };

  const groupedModules = useMemo(() => {
    const groups = {};
    permissionDefs.forEach((perm) => {
      const rawModule = (perm.module || perm.code?.split(".")[0] || "DEFAULT").toUpperCase();
      const action = perm.code?.includes(".") ? perm.code.split(".").slice(1).join(".") : perm.code;
      if (!groups[rawModule]) groups[rawModule] = [];
      groups[rawModule].push({
        ...perm,
        actionKey: action,
      });
    });
    return Object.entries(groups).map(([moduleKey, items]) => ({
      moduleKey,
      title: moduleLabel(moduleKey),
      items: items.sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }, [permissionDefs]);

  const togglePermission = (permCode) => {
    setDraftPermissions((prev) => {
      const existing = new Set(prev || []);
      if (existing.has(permCode)) existing.delete(permCode);
      else existing.add(permCode);
      return Array.from(existing);
    });
  };

  const toggleModuleAll = (moduleItems, checked) => {
    setDraftPermissions((prev) => {
      const next = new Set(prev || []);
      moduleItems.forEach((item) => {
        if (checked) next.add(item.code);
        else next.delete(item.code);
      });
      return Array.from(next);
    });
  };

  const resetChanges = () => {
    setDraftPermissions([...(permissionMap[activeRole] || [])]);
    showMessage("Đã hoàn tác thay đổi chưa lưu", "success");
  };

  const saveChanges = async () => {
    setMessage("");
    try {
      const res = await fetch(`${API}/roles/${activeRole}/permissions`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: Array.from(selected).sort() }),
      });
      const data = await parseResponse(res);
      showMessage(typeof data === "string" ? data : "Cập nhật phân quyền thành công", "success");
      await loadData();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const isDirty = useMemo(() => {
    const base = new Set(permissionMap[activeRole] || []);
    if (base.size !== selected.size) return true;
    for (const p of selected) {
      if (!base.has(p)) return true;
    }
    return false;
  }, [permissionMap, activeRole, selected]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-4xl font-extrabold text-slate-900">Quản lý Vai trò & Quyền hạn</h1>
        <p className="mt-2 text-2xl text-slate-500">
          Thiết lập các cấp độ truy cập và quyền thực thi tác vụ cho từng nhóm người dùng trong hệ thống.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-2xl font-bold text-slate-900">Danh sách vai trò</h2>
              <span className="text-sm font-semibold text-blue-600">Đang dùng DB thật</span>
            </div>
            <div>
              {roles.map((role) => (
                <button
                  key={role.code}
                  onClick={() => setActiveRole(role.code)}
                  className={`flex w-full items-center justify-between border-b px-5 py-4 text-left ${
                    activeRole === role.code ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div>
                    <div className={`text-2xl font-bold ${activeRole === role.code ? "text-blue-700" : "text-slate-800"}`}>
                      {roleNameMap[role.code] || role.name || role.code}
                    </div>
                    <p className="text-sm text-slate-500">{roleDescMap[role.code] || role.name}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {role.userCount || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-700">Lưu ý</p>
            <p className="mt-1 text-sm text-slate-600">
              Việc thay đổi quyền hạn sẽ có hiệu lực ngay lập tức sau khi bạn bấm Lưu phân quyền.
            </p>
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
            <div>
              <h3 className="text-4xl font-extrabold text-slate-900">
                Chi tiết quyền hạn: {roleNameMap[activeRole] || activeRole}
              </h3>
              <p className="mt-1 text-slate-500">Cấu hình các hành động được phép thực hiện cho vai trò này.</p>
            </div>
            <div className="flex items-center rounded-xl border bg-slate-50 p-1">
              <button
                onClick={() => setActiveTab("permissions")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  activeTab === "permissions" ? "bg-white text-slate-900 shadow" : "text-slate-500"
                }`}
              >
                Phân quyền
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  activeTab === "users" ? "bg-white text-slate-900 shadow" : "text-slate-500"
                }`}
              >
                Người dùng ({activeRoleItem?.userCount || 0})
              </button>
            </div>
          </div>

          {activeTab === "permissions" ? (
            <div className="space-y-6 px-6 py-5">
              {groupedModules.map((group) => {
                const allChecked = group.items.every((item) => selected.has(item.code));
                return (
                  <div key={group.moduleKey}>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-3xl font-bold text-slate-900">{group.title}</h4>
                      <label className="flex items-center gap-2 text-sm text-slate-500">
                        Chọn tất cả
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => toggleModuleAll(group.items, e.target.checked)}
                          className="h-4 w-4"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-slate-50 p-4 md:grid-cols-4">
                      {group.items.map((perm) => (
                        <label key={perm.code} className="flex items-center gap-2 text-lg text-slate-800">
                          <input
                            type="checkbox"
                            checked={selected.has(perm.code)}
                            onChange={() => togglePermission(perm.code)}
                            className="h-5 w-5"
                          />
                          <span>{actionLabel(perm.actionKey)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-5">
              <div className="rounded-2xl border">
                <div className="grid grid-cols-12 border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  <div className="col-span-4">Họ tên</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-3">Điện thoại</div>
                  <div className="col-span-2">Trạng thái</div>
                </div>
                {roleUsers.map((u) => (
                  <div key={u.id} className="grid grid-cols-12 border-b px-4 py-3 text-sm">
                    <div className="col-span-4 font-medium text-slate-800">{u.fullName}</div>
                    <div className="col-span-3 text-slate-600">{u.email || "-"}</div>
                    <div className="col-span-3 text-slate-600">{u.phone || "-"}</div>
                    <div className="col-span-2 text-slate-600">{u.status}</div>
                  </div>
                ))}
                {roleUsers.length === 0 && (
                  <div className="px-4 py-6 text-sm text-slate-500">Không có người dùng nào thuộc vai trò này.</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t px-6 py-4">
            <div>
              {message && (
                <span className={`text-sm ${messageType === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                  {message}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={resetChanges} className="rounded-lg px-4 py-2 font-semibold text-slate-600">
                Hủy bỏ
              </button>
              <button
                disabled={loading || !activeRole || !isDirty || activeTab !== "permissions"}
                onClick={saveChanges}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-40"
              >
                Lưu phân quyền
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
