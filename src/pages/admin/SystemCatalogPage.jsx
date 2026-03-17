import React, { useEffect, useMemo, useState } from "react";

const META_CODE = "__GROUP__";

const DEFAULT_STATUS_FORM = {
  id: null,
  groupCode: "",
  code: "",
  nameVn: "",
  active: true,
};

function slugifyCategory(name) {
  const noAccent = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  return noAccent
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export default function SystemCatalogPage() {
  const API = "http://localhost:8080/api/admin";
  const token = localStorage.getItem("token");

  const [allItems, setAllItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState(DEFAULT_STATUS_FORM);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showCategoryManageModal, setShowCategoryManageModal] = useState(false);
  const [groupEdits, setGroupEdits] = useState({});

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) throw new Error(typeof data === "string" ? data : data?.message || "Request failed");
    return data;
  };

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const loadAllItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/catalogs`, { headers: authHeaders });
      const data = await parseResponse(res);
      setAllItems(Array.isArray(data) ? data : []);
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await fetch(`${API}/catalog-groups`, { headers: authHeaders });
      const data = await parseResponse(res);
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadAllItems();
    loadGroups();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const tabItems = useMemo(() => {
    const map = new Map();

    groups.forEach((g) => {
      map.set(g.groupCode, {
        groupCode: g.groupCode,
        label: g.name || g.groupCode,
        icon: "•",
        totalStatuses: g.totalStatuses || 0,
      });
    });

    allItems.forEach((item) => {
      if (!map.has(item.groupCode)) {
        map.set(item.groupCode, {
          groupCode: item.groupCode,
          label: item.groupCode,
          icon: "•",
          totalStatuses: 0,
        });
      }
    });

    allItems
      .filter((i) => i.code === META_CODE)
      .forEach((meta) => {
        const existing = map.get(meta.groupCode);
        if (existing) {
          map.set(meta.groupCode, {
            ...existing,
            label: meta.nameVn || meta.name || existing.label,
          });
        }
      });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allItems, groups]);

  useEffect(() => {
    if (!tabItems.some((t) => t.groupCode === activeTab)) {
      setActiveTab(tabItems[0]?.groupCode || "");
    }
  }, [tabItems, activeTab]);

  const items = useMemo(
    () =>
      allItems
        .filter((i) => i.groupCode === activeTab && i.code !== META_CODE)
        .sort((a, b) => String(a.code).localeCompare(String(b.code))),
    [allItems, activeTab]
  );

  const openCreateStatus = () => {
    if (!activeTab) {
      showMessage("Chưa có danh mục nào. Hãy thêm danh mục trước.", "error");
      return;
    }
    setStatusForm({ ...DEFAULT_STATUS_FORM, groupCode: activeTab });
    setShowStatusModal(true);
  };

  const openEditStatus = (item) => {
    setStatusForm({
      id: item.id,
      groupCode: item.groupCode,
      code: item.code || "",
      nameVn: item.nameVn || item.name || "",
      active: !!item.active,
    });
    setShowStatusModal(true);
  };

  const saveStatus = async () => {
    if (!statusForm.code.trim() || !statusForm.nameVn.trim()) {
      showMessage("Vui lòng nhập đầy đủ Mã code và Tên hiển thị (VN)", "error");
      return;
    }
    try {
      const payload = {
        groupCode: statusForm.groupCode,
        code: statusForm.code.trim().toUpperCase(),
        nameVn: statusForm.nameVn.trim(),
        active: !!statusForm.active,
      };

      const isUpdate = !!statusForm.id;
      const res = await fetch(isUpdate ? `${API}/catalogs/${statusForm.id}` : `${API}/catalogs`, {
        method: isUpdate ? "PUT" : "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await parseResponse(res);
      showMessage(isUpdate ? "Cập nhật trạng thái thành công" : "Thêm trạng thái thành công", "success");
      setShowStatusModal(false);
      setStatusForm(DEFAULT_STATUS_FORM);
      await loadAllItems();
      await loadGroups();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const removeStatus = async () => {
    if (!statusForm.id) return;
    try {
      const res = await fetch(`${API}/catalogs/${statusForm.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await parseResponse(res);
      showMessage("Xóa trạng thái thành công", "success");
      setShowStatusModal(false);
      setStatusForm(DEFAULT_STATUS_FORM);
      await loadAllItems();
      await loadGroups();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const saveCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      showMessage("Vui lòng nhập tên danh mục", "error");
      return;
    }

    const groupCode = slugifyCategory(name);
    if (!groupCode) {
      showMessage("Tên danh mục không hợp lệ", "error");
      return;
    }

    if (tabItems.some((t) => t.groupCode === groupCode)) {
      showMessage("Danh mục này đã tồn tại", "error");
      return;
    }

    try {
      const res = await fetch(`${API}/catalogs`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode,
          code: META_CODE,
          nameVn: name,
          active: true,
        }),
      });
      await parseResponse(res);
      showMessage("Thêm danh mục mới thành công", "success");
      setShowCategoryModal(false);
      setNewCategoryName("");
      setActiveTab(groupCode);
      await loadAllItems();
      await loadGroups();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const openManageCategories = () => {
    const init = {};
    groups.forEach((g) => {
      init[g.groupCode] = g.name || g.groupCode;
    });
    setGroupEdits(init);
    setShowCategoryManageModal(true);
  };

  const saveGroupName = async (groupCode) => {
    const name = (groupEdits[groupCode] || "").trim();
    if (!name) {
      showMessage("Tên danh mục không được để trống", "error");
      return;
    }
    try {
      const res = await fetch(`${API}/catalog-groups/${groupCode}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await parseResponse(res);
      showMessage("Đổi tên danh mục thành công", "success");
      await loadGroups();
      await loadAllItems();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const deleteGroup = async (groupCode) => {
    try {
      const res = await fetch(`${API}/catalog-groups/${groupCode}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await parseResponse(res);
      showMessage("Xóa danh mục thành công", "success");
      await loadGroups();
      await loadAllItems();
      if (activeTab === groupCode) {
        const fallback = groups.find((g) => g.groupCode !== groupCode)?.groupCode || "";
        setActiveTab(fallback);
      }
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const toggleActive = async (item) => {
    try {
      const res = await fetch(`${API}/catalogs/${item.id}/active`, {
        method: "PATCH",
        headers: authHeaders,
      });
      await parseResponse(res);
      await loadAllItems();
      await loadGroups();
    } catch (e) {
      showMessage(e.message, "error");
    }
  };

  const exportCsv = () => {
    const header = ["CODE", "TEN_HIEN_THI_VN", "SU_DUNG"];
    const rows = items.map((i) => [i.code || "", i.nameVn || i.name || "", i.active ? "1" : "0"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-slate-900">Quản lý Danh mục Hệ thống</h1>
            <p className="mt-2 text-2xl text-slate-500">Thiết lập và quản lý các tham số danh mục dùng chung cho toàn bộ ứng dụng cứu trợ.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportCsv} className="rounded-2xl border bg-white px-5 py-3 font-semibold text-slate-700">⤓ Xuất file</button>
            <button onClick={() => setShowCategoryModal(true)} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700">⊕ Thêm danh mục</button>
            <button onClick={openManageCategories} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700">✎ Chỉnh sửa danh mục</button>
            <button onClick={openCreateStatus} className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">⊕ Thêm trạng thái</button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b px-4 py-3">
          {tabItems.map((tab) => (
            <button
              key={tab.groupCode}
              onClick={() => setActiveTab(tab.groupCode)}
              className={`rounded-xl px-4 py-3 text-lg font-semibold ${activeTab === tab.groupCode ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-b-2xl">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
              <tr>
                <th className="px-6 py-4">MÃ CODE</th>
                <th className="px-6 py-4">TÊN HIỂN THỊ (VN)</th>
                <th className="px-6 py-4 text-center">SỬ DỤNG</th>
                <th className="px-6 py-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Chưa có trạng thái trong danh mục này.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t text-slate-800">
                    <td className="px-6 py-6 text-2xl text-slate-600">{item.code}</td>
                    <td className="px-6 py-6 text-2xl font-bold">{item.nameVn || item.name}</td>
                    <td className="px-6 py-6 text-center">
                      <button onClick={() => toggleActive(item)} className={`h-8 w-14 rounded-full transition ${item.active ? "bg-blue-600" : "bg-slate-300"}`}>
                        <span className={`block h-6 w-6 rounded-full bg-white transition ${item.active ? "translate-x-7" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button onClick={() => openEditStatus(item)} className="text-xl text-slate-500 hover:text-blue-600">✎</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${messageType === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white">
            <div className="border-b px-6 py-4"><h3 className="text-3xl font-extrabold text-slate-900">Thêm danh mục mới</h3></div>
            <div className="px-6 py-5">
              <label className="mb-2 block text-sm font-semibold">Tên danh mục *</label>
              <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full rounded-xl border px-4 py-3" />
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }} className="rounded-lg border px-4 py-2 text-sm font-semibold">Hủy</button>
              <button onClick={saveCategory} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">Thêm danh mục</button>
            </div>
          </div>
        </div>
      )}

      {showCategoryManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white">
            <div className="border-b px-6 py-4"><h3 className="text-3xl font-extrabold text-slate-900">Chỉnh sửa danh mục</h3></div>
            <div className="max-h-[60vh] overflow-auto px-6 py-5">
              <table className="w-full">
                <thead className="text-left text-sm font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">MÃ DANH MỤC</th>
                    <th className="px-3 py-2">TÊN DANH MỤC</th>
                    <th className="px-3 py-2 text-center">SỐ TRẠNG THÁI</th>
                    <th className="px-3 py-2 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.groupCode} className="border-t">
                      <td className="px-3 py-3 text-sm font-semibold text-slate-700">{g.groupCode}</td>
                      <td className="px-3 py-3"><input value={groupEdits[g.groupCode] || ""} onChange={(e) => setGroupEdits((prev) => ({ ...prev, [g.groupCode]: e.target.value }))} className="w-full rounded-lg border px-3 py-2" /></td>
                      <td className="px-3 py-3 text-center text-sm text-slate-600">{g.totalStatuses || 0}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => saveGroupName(g.groupCode)} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Lưu tên</button>
                          <button onClick={() => deleteGroup(g.groupCode)} className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Xóa danh mục</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t px-6 py-4"><button onClick={() => setShowCategoryManageModal(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Đóng</button></div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white">
            <div className="border-b px-6 py-4"><h3 className="text-3xl font-extrabold text-slate-900">{statusForm.id ? "Chỉnh sửa trạng thái" : "Thêm trạng thái mới"}</h3></div>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Danh mục *</label>
                <select value={statusForm.groupCode} onChange={(e) => setStatusForm((prev) => ({ ...prev, groupCode: e.target.value }))} className="w-full rounded-xl border px-4 py-3">
                  {tabItems.map((tab) => (<option key={tab.groupCode} value={tab.groupCode}>{tab.label}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Mã code *</label>
                <input value={statusForm.code} onChange={(e) => setStatusForm((prev) => ({ ...prev, code: e.target.value }))} className="w-full rounded-xl border px-4 py-3" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Tên hiển thị (VN) *</label>
                <input value={statusForm.nameVn} onChange={(e) => setStatusForm((prev) => ({ ...prev, nameVn: e.target.value }))} className="w-full rounded-xl border px-4 py-3" />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={!!statusForm.active} onChange={(e) => setStatusForm((prev) => ({ ...prev, active: e.target.checked }))} />
                Bật sử dụng trạng thái này
              </label>
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div>{statusForm.id && <button onClick={removeStatus} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Xóa trạng thái</button>}</div>
              <div className="flex gap-2">
                <button onClick={() => { setShowStatusModal(false); setStatusForm(DEFAULT_STATUS_FORM); }} className="rounded-lg border px-4 py-2 text-sm font-semibold">Hủy</button>
                <button onClick={saveStatus} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">{statusForm.id ? "Lưu thay đổi" : "Thêm trạng thái"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
