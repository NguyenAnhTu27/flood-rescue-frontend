import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Boxes, ClipboardList, HandHeart } from 'lucide-react';
import {
  getInventoryStock,
  listInventoryReceipts,
  listInventoryIssues,
  listReliefRequests,
} from '../../features/relief/api.js';

function normalizeList(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.content)) return resp.content;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

export default function ReportsPage() {
  const [stock, setStock] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [reliefs, setReliefs] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [s, r, i, l] = await Promise.allSettled([
        getInventoryStock({ page: 0, size: 100 }),
        listInventoryReceipts({ page: 0, size: 100 }),
        listInventoryIssues({ page: 0, size: 100 }),
        listReliefRequests({ page: 0, size: 100 }),
      ]);

      if (!mounted) return;
      setStock(s.status === 'fulfilled' ? normalizeList(s.value) : []);
      setReceipts(r.status === 'fulfilled' ? normalizeList(r.value) : []);
      setIssues(i.status === 'fulfilled' ? normalizeList(i.value) : []);
      setReliefs(l.status === 'fulfilled' ? normalizeList(l.value) : []);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalStockItems = stock.length;
    const receiptApproved = receipts.filter((x) => String(x.status || '').toUpperCase() === 'APPROVED').length;
    const issueApproved = issues.filter((x) => String(x.status || '').toUpperCase() === 'APPROVED').length;
    const reliefPending = reliefs.filter((x) => ['PENDING', 'DRAFT'].includes(String(x.status || '').toUpperCase())).length;
    return { totalStockItems, receiptApproved, issueApproved, reliefPending };
  }, [stock, receipts, issues, reliefs]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Báo cáo tổng hợp vận hành</h1>
        <p className="text-sm text-slate-500">Theo dõi nhanh sức khỏe nghiệp vụ kho hàng, phiếu xuất/nhập và yêu cầu cứu trợ.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Boxes className="h-4 w-4" /> Danh mục tồn kho</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{metrics.totalStockItems}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><ClipboardList className="h-4 w-4" /> Phiếu nhập đã duyệt</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{metrics.receiptApproved}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><BarChart3 className="h-4 w-4" /> Phiếu xuất đã duyệt</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{metrics.issueApproved}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><HandHeart className="h-4 w-4" /> Yêu cầu cứu trợ chờ xử lý</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{metrics.reliefPending}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Top tồn kho</h2>
          <div className="mt-3 space-y-2">
            {stock.slice(0, 8).map((s, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-sm text-slate-700">{s.itemName || s.name || s.categoryName || `Mục ${idx + 1}`}</span>
                <span className="text-sm font-semibold text-slate-900">{s.availableQty || s.quantity || s.stock || 0}</span>
              </div>
            ))}
            {stock.length === 0 && <p className="text-sm text-slate-500">Không có dữ liệu tồn kho.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Yêu cầu cứu trợ mới nhất</h2>
          <div className="mt-3 space-y-2">
            {reliefs.slice(0, 8).map((r, idx) => (
              <div key={idx} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{r.code || `REQ-${r.id || idx + 1}`}</span>
                  <span className="text-xs text-slate-500">{r.status || 'UNKNOWN'}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{r.note || r.description || 'Không có mô tả'}</p>
              </div>
            ))}
            {reliefs.length === 0 && <p className="text-sm text-slate-500">Không có dữ liệu yêu cầu cứu trợ.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
