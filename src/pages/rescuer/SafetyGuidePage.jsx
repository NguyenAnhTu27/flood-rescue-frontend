import React from 'react';
import { AlertTriangle, LifeBuoy, Shield, Waves } from 'lucide-react';

const blocks = [
  {
    icon: AlertTriangle,
    title: 'An toàn bản thân trước',
    desc: 'Luôn đánh giá rủi ro khu vực ngập, tránh lao vào dòng chảy mạnh khi chưa có dây an toàn và đội hình hỗ trợ.',
  },
  {
    icon: LifeBuoy,
    title: 'Ưu tiên cứu người dễ tổn thương',
    desc: 'Trẻ em, người cao tuổi, người khuyết tật và phụ nữ mang thai cần được ưu tiên sơ tán trước.',
  },
  {
    icon: Shield,
    title: 'Báo cáo theo chu kỳ ngắn',
    desc: 'Cập nhật tình trạng đội, vị trí và nhu cầu vật tư theo mốc 10-15 phút để điều phối kịp thời.',
  },
  {
    icon: Waves,
    title: 'Kiểm soát điểm tập kết',
    desc: 'Thiết lập điểm tập kết cao ráo, có đường thoát, có phân luồng người dân và kho vật tư tạm thời.',
  },
];

export default function SafetyGuidePage() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Hướng dẫn an toàn cho đội cứu hộ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tài liệu tóm tắt các nguyên tắc bắt buộc khi thực hiện nhiệm vụ ngoài hiện trường lũ lụt.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Icon className="h-5 w-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">{b.title}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Mọi quyết định tại hiện trường cần đặt tiêu chí bảo toàn sinh mạng đội cứu hộ lên hàng đầu.
      </div>
    </div>
  );
}
