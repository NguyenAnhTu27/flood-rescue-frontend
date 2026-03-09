import React, { useMemo, useState } from 'react';
import { AlertTriangle, Flame, Send } from 'lucide-react';
import {
  getCoordinatorRescueQueue,
  prioritizeRescueRequest,
  addCoordinatorNoteToRescueRequest,
} from '../../features/coordinator/api.js';

function normalizeList(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.content)) return resp.content;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

export default function EscalationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [reason, setReason] = useState('Nguy cơ tăng nhanh, cần leo thang ưu tiên điều phối.');
  const [msg, setMsg] = useState('');

  const highPriorityCount = useMemo(
    () => rows.filter((r) => String(r.priority || '').toUpperCase() === 'HIGH').length,
    [rows],
  );

  const load = async () => {
    try {
      setLoading(true);
      setMsg('');
      const resp = await getCoordinatorRescueQueue({ page: 0, size: 100 });
      setRows(normalizeList(resp));
    } catch (e) {
      setMsg(e?.message || 'Không tải được dữ liệu yêu cầu cứu hộ.');
    } finally {
      setLoading(false);
    }
  };

  const escalate = async () => {
    if (!requestId) {
      setMsg('Vui lòng chọn yêu cầu cần leo thang.');
      return;
    }
    try {
      setLoading(true);
      setMsg('');
      await prioritizeRescueRequest(Number(requestId), 'HIGH');
      await addCoordinatorNoteToRescueRequest(Number(requestId), reason);
      setMsg('Đã leo thang thành công: yêu cầu được chuyển về mức ưu tiên HIGH.');
      await load();
    } catch (e) {
      setMsg(e?.message || 'Không thể leo thang yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Leo thang điều phối khẩn cấp</h1>
            <p className="text-sm text-slate-500">Ưu tiên xử lý tình huống nguy cơ cao và ghi nhận lý do nghiệp vụ.</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Danh sách yêu cầu</h2>
            <span className="text-xs text-slate-500">HIGH hiện tại: {highPriorityCount}</span>
          </div>
          <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Mã</th>
                  <th className="px-3 py-2 text-left">Địa chỉ</th>
                  <th className="px-3 py-2 text-left">Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-t border-slate-100 cursor-pointer ${String(requestId) === String(r.id) ? 'bg-rose-50' : 'hover:bg-slate-50'}`}
                    onClick={() => setRequestId(String(r.id))}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800">{r.code || r.id}</td>
                    <td className="px-3 py-2 text-slate-600">{r.addressText || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${String(r.priority || '').toUpperCase() === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.priority || 'MEDIUM'}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-500">Chưa có dữ liệu.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Thao tác leo thang</h2>
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2 text-rose-700">
              <Flame className="h-4 w-4" />
              <span className="font-semibold text-sm">Mức xử lý KHẨN CẤP</span>
            </div>
            <p className="mt-1 text-xs text-rose-700">Yêu cầu sẽ được ưu tiên điều phối trước các trường hợp thông thường.</p>
          </div>

          <label className="mt-4 block text-xs font-medium text-slate-600">ID yêu cầu đã chọn</label>
          <input
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Nhập hoặc chọn từ bảng bên trái"
          />

          <label className="mt-4 block text-xs font-medium text-slate-600">Lý do leo thang</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={escalate}
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Leo thang ưu tiên ngay
          </button>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            Chỉ dùng khi có nguy cơ đe dọa tính mạng cao hoặc điều kiện hiện trường xấu đi nhanh.
          </div>
        </div>
      </div>

      {msg && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{msg}</div>}
    </div>
  );
}
