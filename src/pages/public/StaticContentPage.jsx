import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeHelp, FileText, ShieldCheck, PhoneCall } from 'lucide-react';
import { getPublicContentPage } from '../../features/content-pages/api.js';
import { PUBLIC_ROUTES } from '../../app/routes/route.constants.js';

const PAGE_KEY_BY_PATH = {
    '/tuyen-bo-mien-tru-trach-nhiem': 'terms',
    '/chinh-sach-bao-mat': 'privacy',
    '/lien-he-ho-tro': 'support',
};

const DEFAULT_TITLE_BY_KEY = {
    terms: 'Tuyên bố miễn trừ trách nhiệm',
    privacy: 'Chính sách bảo mật',
    support: 'Liên hệ hỗ trợ',
};

const DEFAULT_CONTENT_BY_KEY = {
    terms: `1. Mục đích sử dụng
Nền tảng này được xây dựng nhằm hỗ trợ tiếp nhận thông tin cứu hộ, cứu trợ và cung cấp nội dung công khai cho người dân trong tình huống thiên tai.

2. Trách nhiệm của người dùng
Người dùng cần cung cấp thông tin chính xác, không gửi yêu cầu giả mạo và không sử dụng hệ thống cho mục đích gây nhiễu hoặc trục lợi.

3. Giới hạn dịch vụ
Trong tình huống thiên tai diện rộng, tốc độ phản hồi và xử lý có thể phụ thuộc vào hạ tầng liên lạc, điều kiện thời tiết và khả năng tiếp cận thực tế của lực lượng cứu hộ.

4. Cập nhật nội dung
Các hướng dẫn, thông tin liên hệ và nội dung công khai có thể được cập nhật theo chỉ đạo của cơ quan điều phối và điều kiện thực địa.`,
    privacy: `1. Phạm vi thu thập dữ liệu
Hệ thống có thể thu thập họ tên, số điện thoại, địa chỉ, vị trí hiện tại, nội dung mô tả tình huống khẩn cấp và các tệp đính kèm do người dùng chủ động cung cấp.

2. Mục đích sử dụng dữ liệu
Dữ liệu được sử dụng để xác minh yêu cầu, điều phối lực lượng cứu hộ, liên hệ lại với người dân, cung cấp hỗ trợ phù hợp và cải thiện chất lượng vận hành hệ thống.

3. Dữ liệu vị trí và thông tin nhạy cảm
Thông tin vị trí, tình trạng sức khỏe hoặc mô tả hiện trường được xem là dữ liệu nhạy cảm trong bối cảnh thiên tai. Hệ thống chỉ sử dụng các dữ liệu này cho mục đích hỗ trợ khẩn cấp, bảo đảm an toàn và điều phối phản ứng phù hợp.

4. Chia sẻ dữ liệu
Dữ liệu có thể được chia sẻ với cơ quan điều phối, đội cứu hộ, đơn vị y tế hoặc cơ quan chức năng có thẩm quyền trong phạm vi cần thiết để thực hiện nhiệm vụ cứu hộ, cứu trợ và bảo vệ tính mạng con người.

5. Lưu trữ và bảo vệ
Hệ thống áp dụng các biện pháp kỹ thuật và quản trị phù hợp để hạn chế truy cập trái phép, mất mát hoặc thay đổi dữ liệu. Thời gian lưu trữ phụ thuộc vào yêu cầu nghiệp vụ, quy định pháp luật và nhu cầu đối soát sau sự cố.

6. Quyền của người dùng
Người dùng có thể đề nghị cập nhật, chỉnh sửa hoặc phản ánh về dữ liệu cá nhân đã cung cấp thông qua kênh hỗ trợ chính thức. Trong một số trường hợp, dữ liệu có thể cần được lưu giữ để phục vụ điều tra, thống kê hoặc nghĩa vụ pháp lý.

7. Liên hệ về bảo mật
Nếu phát hiện rò rỉ dữ liệu, truy cập trái phép hoặc thông tin hiển thị không chính xác, người dùng cần liên hệ ngay với bộ phận hỗ trợ để được tiếp nhận và xử lý.

8. Cập nhật chính sách
Chính sách bảo mật có thể được điều chỉnh khi hệ thống thay đổi phạm vi dịch vụ, quy trình điều phối hoặc yêu cầu pháp lý liên quan.`,
    support: '',
};

export default function StaticContentPage() {
    const location = useLocation();
    const pageKey = useMemo(() => PAGE_KEY_BY_PATH[location.pathname] || 'terms', [location.pathname]);

    const [data, setData] = useState({ title: DEFAULT_TITLE_BY_KEY[pageKey], content: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const resp = await getPublicContentPage(pageKey);
                setData({
                    title: resp?.title || DEFAULT_TITLE_BY_KEY[pageKey],
                    content: resp?.content || DEFAULT_CONTENT_BY_KEY[pageKey] || '',
                });
            } catch (e) {
                setError(e?.message || 'Không thể tải nội dung trang.');
                setData((prev) => ({
                    ...prev,
                    content: DEFAULT_CONTENT_BY_KEY[pageKey] || prev.content,
                }));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [pageKey]);

    const pageMeta = {
        terms: {
            icon: FileText,
            eyebrow: 'Miễn trừ trách nhiệm',
            description: 'Phạm vi trách nhiệm của hệ thống, giới hạn vận hành thực tế và lưu ý khi sử dụng thông tin công khai.',
        },
        privacy: {
            icon: ShieldCheck,
            eyebrow: 'Bảo mật',
            description: 'Thông tin về dữ liệu cá nhân, vị trí, liên hệ khẩn cấp và cách hệ thống bảo vệ nội dung người dân cung cấp.',
        },
        support: {
            icon: PhoneCall,
            eyebrow: 'Hỗ trợ',
            description: 'Đầu mối liên hệ, hướng dẫn tiếp nhận yêu cầu và thông tin công khai dành cho người dân cần trợ giúp.',
        },
    }[pageKey];

    const MetaIcon = pageMeta.icon;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
            <article className="glass-card overflow-hidden p-7 sm:p-9">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="glass-chip text-blue-700">
                            <BadgeHelp size={14} />
                            {pageMeta.eyebrow}
                        </div>
                        <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-slate-900">{data.title}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600 sm:text-base">{pageMeta.description}</p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/80 bg-white/[0.55] text-blue-600 backdrop-blur-xl">
                        <MetaIcon size={24} />
                    </div>
                </div>

                {loading ? (
                    <div className="mt-8 rounded-[24px] border border-white/70 bg-white/[0.45] px-5 py-6 text-sm text-slate-500 backdrop-blur-xl">Đang tải nội dung...</div>
                ) : error ? (
                    <div className="mt-8 rounded-[24px] border border-rose-200/80 bg-rose-50/70 px-5 py-6 text-sm text-rose-700 backdrop-blur-xl">{error}</div>
                ) : (
                    <div className="mt-8 rounded-[24px] border border-white/70 bg-white/[0.52] px-5 py-6 text-sm leading-8 text-slate-700 backdrop-blur-xl whitespace-pre-wrap">{data.content || 'Nội dung đang được cập nhật.'}</div>
                )}

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <Link to={PUBLIC_ROUTES.TERMS_OF_USE} className="glass-hover rounded-[18px] border border-white/70 bg-white/[0.44] px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-xl">
                        Tuyên bố miễn trừ trách nhiệm
                    </Link>
                    <Link to={PUBLIC_ROUTES.PRIVACY_POLICY} className="glass-hover rounded-[18px] border border-white/70 bg-white/[0.44] px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-xl">
                        Chính sách bảo mật
                    </Link>
                    <Link to={PUBLIC_ROUTES.SUPPORT_CONTACT} className="glass-hover rounded-[18px] border border-white/70 bg-white/[0.44] px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-xl">
                        Liên hệ hỗ trợ
                    </Link>
                </div>
            </article>
        </div>
    );
}
