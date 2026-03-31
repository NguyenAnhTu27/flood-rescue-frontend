import React, { useMemo, useState, useEffect } from "react";
import { ADMIN_API_BASE_URL } from "../../app/config/env.js";

export default function AuditLogsPage() {
  const API = ADMIN_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  const actionOptions = useMemo(
    () => [
      "ALL",
      "LOGIN",
      "CREATE_USER",
      "RESET_PASSWORD",
      "UPDATE_STATUS",
      "DELETE_USER",
      "UPDATE_ROLE_PERMISSIONS",
      "UPDATE_SYSTEM_SETTINGS",
      "UPDATE_NOTIFICATION_TEMPLATE",
      "CREATE_CATALOG",
      "UPDATE_CATALOG",
      "DELETE_CATALOG",
    ],
    []
  );

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
      throw new Error(typeof data === "string" ? data : data?.message || "Request failed");
    }
    return data;
  };

  const loadLogs = async (nextAction = action, nextKeyword = keyword) => {
    setMessage("");
    try {
      const params = new URLSearchParams({ page: "0", size: "50" });
      if (nextAction !== "ALL") params.set("action", nextAction);
      if (nextKeyword.trim()) params.set("keyword", nextKeyword.trim());

      const res = await fetch(`${API}/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponse(res);
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setMessage(e.message);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadLogs();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  const levelClass = (level) => {
    if (level === "SUCCESS") return "bg-emerald-100 text-emerald-700";
    if (level === "WARN") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">Nhật ký hệ thống</h1>
        <p className="mt-1 text-slate-600">Theo dõi lịch sử thao tác quản trị và thay đổi dữ liệu.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo actor/target/action"
            className="min-w-[260px] rounded-lg border p-2"
          />
          <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border p-2">
            {actionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button onClick={() => loadLogs(action, keyword)} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">
            Tìm
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Hành động</th>
                <th className="p-3">Nhận vật</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3">Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="p-3 text-slate-600">{log.createdAt?.replace("T", " ") || "-"}</td>
                  <td className="p-3 font-medium">{log.action}</td>
                  <td className="p-3">{log.actor}</td>
                  <td className="p-3">{log.target || "-"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${levelClass(log.level)}`}>{log.level}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {message && <p className="text-sm text-blue-700">{message}</p>}
    </div>
  );
}
