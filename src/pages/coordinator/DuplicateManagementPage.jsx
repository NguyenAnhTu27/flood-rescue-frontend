import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, GitMerge, Search } from 'lucide-react';
import {
  getCoordinatorRescueQueue,
  markDuplicateRescueRequest,
} from '../../features/coordinator/api.js';

function normalizeList(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.content)) return resp.content;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

export default function DuplicateManagementPage() {
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [sourceId, setSourceId] = useState('');
  const [masterId, setMasterId] = useState('');
  const [note, setNote] = useState('Yêu cầu trùng lặp vị trí và mô tả.');

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.code, r.addressText, r.description, r.citizenName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, keyword]);

  const suspiciousPairs = useMemo(() => {
    const byAddress = new Map();
    for (const r of filtered) {
      const key = String(r.addressText || '').trim().toLowerCase();
      if (!key) continue;
      if (!byAddress.has(key)) byAddress.set(key, []);
      byAddress.get(key).push(r);
    }
    return Array.from(byAddress.entries())
      .map(([address, list]) => ({ address, list }))
      .filter((x) => x.list.length > 1)
      .slice(0, 8);
  }, [filtered]);

  const load = async () => {
    try {
      setLoading(true);
      setMessage('');
      const resp = await getCoordinatorRescueQueue({ page: 0, size: 100 });
      setRows(normalizeList(resp));
    } catch (e) {
      setMessage(e?.message || 'Không tải được danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDuplicate = async () => {
    if (!sourceId || !masterId || sourceId === masterId) {
      setMessage('Chọn đúng yêu cầu nguồn và yêu cầu chính trước khi đánh dấu trùng lặp.');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      await markDuplicateRescueRequest(Number(sourceId), {
        masterRequestId: Number(masterId),
        note,
      });
      setMessage('Đã đánh dấu trùng lặp thành công.');
      await load();
    } catch (e) {
      setMessage(e?.message || 'Không thể đánh dấu trùng lặp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản lý yêu cầu trùng lặp</h1>
            <p className="text-sm text-slate-500">Phát hiện yêu cầu giống nhau để tránh phân công trùng nguồn lực.</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
        </div>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã, địa chỉ, người gửi..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cụm nghi ngờ trùng</h2>
          <div className="mt-3 space-y-3">
            {suspiciousPairs.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa phát hiện cụm địa chỉ trùng.</p>
            ) : (
              suspiciousPairs.map((group) => (
                <div key={group.address} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-semibold">{group.list.length} yêu cầu cùng địa chỉ</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">{group.list[0]?.addressText}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.list.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSourceId(String(r.id));
                          if (!masterId) setMasterId(String(group.list[0].id));
                        }}
                        className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
                      >
                        #{r.code || r.id}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Đánh dấu trùng lặp</h2>
          <div className="mt-3 space-y-3">
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Chọn yêu cầu cần đánh dấu trùng</option>
              {filtered.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code || r.id} - {r.addressText || 'Không rõ địa chỉ'}
                </option>
              ))}
            </select>

            <select
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Chọn yêu cầu chính (master)</option>
              {filtered.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code || r.id} - {r.addressText || 'Không rõ địa chỉ'}
                </option>
              ))}
            </select>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ghi chú lý do đánh dấu trùng"
            />

            <button
              type="button"
              onClick={handleMarkDuplicate}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <GitMerge className="h-4 w-4" />
              Xác nhận đánh dấu trùng lặp
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}
    </div>
  );
}
