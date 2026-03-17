import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';
import { createTeam, getTeam, getTeamMemberCandidates, updateTeam } from '../../features/teams/api.js';

export default function TeamCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('id');
  const isEdit = !!teamId;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    leaderId: null,
    memberIds: [],
    forceReassignMembers: false,
  });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoadingCandidates(true);
        const data = await getTeamMemberCandidates();
        setCandidates(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('[TeamCreatePage] load member candidates error:', e);
        setError(e?.message || 'Không thể tải danh sách thành viên có sẵn');
      } finally {
        setLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, []);

  useEffect(() => {
    if (!isEdit || !teamId) return;

    const loadTeam = async () => {
      try {
        setLoading(true);
        const data = await getTeam(teamId);
        const members = Array.isArray(data?.members) ? data.members : [];

        setFormData((prev) => ({
          ...prev,
          name: data?.name || '',
          code: data?.code || '',
          description: data?.description || '',
          leaderId: data?.leaderId || null,
          memberIds: members.map((m) => m.id),
        }));
      } catch (e) {
        console.error('[TeamCreatePage] Load team error:', e);
        setError(e?.message || 'Không thể tải thông tin đội');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [isEdit, teamId]);

  const candidateMap = useMemo(() => {
    const map = new Map();
    for (const c of candidates) map.set(c.id, c);
    return map;
  }, [candidates]);

  const selectedMembers = useMemo(() => {
    return formData.memberIds
      .map((id) => candidateMap.get(id))
      .filter(Boolean);
  }, [formData.memberIds, candidateMap]);

  const handleToggleMember = (candidate) => {
    const alreadySelected = formData.memberIds.includes(candidate.id);

    if (alreadySelected) {
      setFormData((prev) => {
        const nextMemberIds = prev.memberIds.filter((id) => id !== candidate.id);
        const nextLeaderId = prev.leaderId === candidate.id ? null : prev.leaderId;
        return { ...prev, memberIds: nextMemberIds, leaderId: nextLeaderId };
      });
      return;
    }

    const inOtherTeam = candidate.teamId && String(candidate.teamId) !== String(teamId || '');
    if (inOtherTeam) {
      const ok = window.confirm(
        `${candidate.fullName} đang thuộc đội "${candidate.teamName || `#${candidate.teamId}`}". Xác nhận điều chuyển thành viên này?`
      );
      if (!ok) return;

      setFormData((prev) => ({
        ...prev,
        forceReassignMembers: true,
        memberIds: [...prev.memberIds, candidate.id],
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, memberIds: [...prev.memberIds, candidate.id] }));
  };

  const handleSelectLeader = (leaderIdRaw) => {
    const leaderId = leaderIdRaw ? Number(leaderIdRaw) : null;
    if (!leaderId) {
      setFormData((prev) => ({ ...prev, leaderId: null }));
      return;
    }

    const candidate = candidateMap.get(leaderId);
    if (!candidate) return;

    const inOtherTeam = candidate.teamId && String(candidate.teamId) !== String(teamId || '');
    if (inOtherTeam) {
      const ok = window.confirm(
        `${candidate.fullName} đang thuộc đội "${candidate.teamName || `#${candidate.teamId}`}". Xác nhận điều chuyển và đặt làm đội trưởng?`
      );
      if (!ok) return;
    }

    setFormData((prev) => ({
      ...prev,
      forceReassignMembers: prev.forceReassignMembers || inOtherTeam,
      leaderId,
      memberIds: prev.memberIds.includes(leaderId) ? prev.memberIds : [...prev.memberIds, leaderId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Vui lòng nhập tên đội');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        code: formData.code?.trim() || null,
        description: formData.description?.trim() || null,
        leaderId: formData.leaderId || null,
        memberIds: formData.memberIds,
        forceReassignMembers: formData.forceReassignMembers,
      };

        if (isEdit) {
        await updateTeam(teamId, payload);
        window.alert('Cập nhật đội cứu hộ thành công!');
      } else {
        await createTeam(payload);
        window.alert('Cập nhật đội cứu hộ thành công!');
      }

      navigate(ADMIN_ROUTES.TEAMS_MANAGEMENT);
    } catch (e) {
      console.error('[TeamCreatePage] Submit error:', e);
      const errorMessage = e?.data?.message || e?.message || 'Không thể lưu đội cứu hộ';
      setError(errorMessage);
      window.alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center text-sm text-slate-500">
          <p>Đang tải thông tin đội...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.TEAMS_MANAGEMENT)}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="h-3 w-3" />
          Trở về Quản lý đội cứu hộ
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          Cập nhật đội cứu hộ
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên đội <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mã đội (tùy chọn)</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Đội trưởng</label>
            <select
              value={formData.leaderId || ''}
              onChange={(e) => handleSelectLeader(e.target.value)}
              disabled={loadingCandidates}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Chọn đội trưởng</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.teamName ? `(đang ở ${c.teamName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Đội viên</label>
            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-200 p-3">
              {loadingCandidates ? (
                <p className="text-sm text-slate-500">Đang tải danh sách thành viên...</p>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-slate-500">Không có thành viên RESCUER trong hệ thống.</p>
              ) : (
                candidates.map((c) => {
                  const checked = formData.memberIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center justify-between gap-3 rounded border border-slate-100 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{c.fullName}</div>
                        <div className="text-xs text-slate-500">
                          {c.email || c.phone || `ID ${c.id}`}
                          {c.teamName ? ` - đang ở ${c.teamName}` : ''}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleMember(c)}
                        className="h-4 w-4"
                      />
                    </label>
                  );
                })
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">Đã chọn: {selectedMembers.length} thành viên</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => navigate(ADMIN_ROUTES.TEAMS_MANAGEMENT)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
