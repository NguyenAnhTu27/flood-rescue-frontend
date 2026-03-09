import React, { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Route, Truck } from 'lucide-react';
import { listDistributionVouchers } from '../../../features/relief/apiDistribution.js';

function normalizeList(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.content)) return resp.content;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

export default function DistributionTrackingPage() {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await listDistributionVouchers({ page: 0, size: 100 });
        if (!mounted) return;
        setRows(normalizeList(resp));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return rows;
    return rows.filter((r) => String(r.status || '').toUpperCase() === statusFilter);
  }, [rows, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const delivering = rows.filter((r) => String(r.status || '').toUpperCase().includes('DELIVER')).length;
    const done = rows.filter((r) => ['DONE', 'COMPLETED'].includes(String(r.status || '').toUpperCase())).length;
    return { total, delivering, done };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Theo dõi phân phối cứu trợ</h1>
        <p className="text-sm text-slate-500">Giám sát tiến độ giao hàng và trạng thái điều phối theo thời gian thực.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><PackageCheck className="h-4 w-4" /> Tổng phiếu</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Truck className="h-4 w-4" /> Đang giao</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{stats.delivering}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Route className="h-4 w-4" /> Hoàn thành</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{stats.done}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {['ALL', 'DRAFT', 'APPROVED', 'IN_DELIVERY', 'DONE', 'CANCELLED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-auto rounded-lg border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Mã phiếu</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
                <th className="px-3 py-2 text-left">Đội/xe</th>
                <th className="px-3 py-2 text-left">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{r.code || r.id}</td>
                  <td className="px-3 py-2">{r.status || 'UNKNOWN'}</td>
                  <td className="px-3 py-2">{r.assignedTeamName || r.teamName || r.assetName || '-'}</td>
                  <td className="px-3 py-2 text-slate-500">{r.updatedAt || r.createdAt || '-'}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-500">Không có dữ liệu phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
