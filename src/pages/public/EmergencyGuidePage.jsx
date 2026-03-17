import React, { useState } from "react";
import {
    ShieldAlert,
    PackageCheck,
    TriangleAlert,
    Phone,
    Droplets,
    Flame,
    BriefcaseMedical,
    HousePlug,
    Footprints,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    BadgeAlert,
    Waves,
    TimerReset,
    LifeBuoy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../app/routes/route.constants.js";
import Card from "../../shared/ui/Card.jsx";
import Button from "../../shared/ui/Button.jsx";

function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

const PHASES = [
    {
        id: "before",
        color: "blue",
        icon: <PackageCheck size={22} />,
        label: "Giai đoạn 1",
        title: "Trước khi lũ xảy ra",
        subtitle: "Chuẩn bị chủ động để bảo vệ gia đình",
        items: [
            {
                icon: <Droplets size={18} />,
                title: "Theo dõi dự báo thời tiết",
                body: "Thường xuyên cập nhật thông tin từ Đài khí tượng thủy văn, bản tin lũ lụt của chính quyền địa phương và ứng dụng cứu hộ. Chia sẻ thông tin kịp thời với hàng xóm, đặc biệt người già và trẻ em.",
            },
            {
                icon: <PackageCheck size={18} />,
                title: "Chuẩn bị túi khẩn cấp (72 giờ)",
                body: "Đóng gói sẵn: giấy tờ tùy thân (bọc nilon kín), tiền mặt, thuốc cá nhân (ít nhất 7 ngày), nước uống (3 lít/người/ngày), lương khô, đèn pin + pin dự phòng, còi hiệu, bản đồ giấy khu vực, quần áo ấm đủ dùng 3 ngày.",
            },
            {
                icon: <HousePlug size={18} />,
                title: "Gia cố và bảo vệ nhà cửa",
                body: "Nâng cao các thiết bị điện, đồ đạc có giá trị lên vị trí cao. Tắt cầu dao điện, khóa van gas khi nhận cảnh báo lũ. Đặt bao cát trước cửa nếu sống ở vùng trũng thấp. Di chuyển xe cộ lên khu vực cao trước.",
            },
            {
                icon: <Footprints size={18} />,
                title: "Lập kế hoạch di tản",
                body: "Xác định 2 đường thoát hiểm từ nhà và khu phố. Thống nhất điểm hẹn với các thành viên gia đình nếu bị lạc. Đăng ký với tổ dân phố danh sách người cần hỗ trợ đặc biệt (người già, trẻ nhỏ, người khuyết tật).",
            },
        ],
    },
    {
        id: "during",
        color: "orange",
        icon: <TriangleAlert size={22} />,
        label: "Giai đoạn 2",
        title: "Trong khi lũ đang xảy ra",
        subtitle: "Hành động bình tĩnh, ưu tiên tính mạng",
        items: [
            {
                icon: <ShieldAlert size={18} />,
                title: "Di chuyển lên vị trí cao ngay lập tức",
                body: "Khi nhận lệnh sơ tán, di chuyển ngay — đừng chần chừ thu dọn đồ đạc. Nếu chưa kịp thoát, lên tầng cao nhất của nhà và chờ cứu hộ. Không cố bơi qua dòng nước chảy xiết — chỉ 15cm nước chảy nhanh đủ để quật ngã người lớn.",
            },
            {
                icon: <Flame size={18} />,
                title: "Tắt toàn bộ nguồn điện và gas",
                body: "Ngắt cầu dao tổng trước khi nước vào nhà. Không sử dụng thiết bị điện khi người hoặc tay còn ướt. Tuyệt đối không bật điện nếu có nghi ngờ đường dây bị ngập hoặc hư hỏng.",
            },
            {
                icon: <Phone size={18} />,
                title: "Liên lạc và gửi tín hiệu cứu hộ",
                body: "Gọi đường dây khẩn cấp 1800 599 920 (miễn phí). Dùng ứng dụng để gửi vị trí GPS chính xác. Nếu hết pin, dùng còi, đèn pin hoặc vải màu sáng để ra hiệu từ vị trí cao. Nhắn tin thay vì gọi điện khi mạng yếu.",
            },
            {
                icon: <Droplets size={18} />,
                title: "An toàn nguồn nước và thực phẩm",
                body: "Không uống nước lũ dù đã đun sôi. Chỉ dùng nước đóng chai hoặc nước đã lọc qua bộ lọc sạch. Không ăn thực phẩm đã tiếp xúc với nước lũ. Dùng lương khô dự trữ trong túi khẩn cấp.",
            },
        ],
    },
    {
        id: "after",
        color: "green",
        icon: <CheckCircle2 size={22} />,
        label: "Giai đoạn 3",
        title: "Sau khi lũ rút",
        subtitle: "Kiểm tra an toàn trước khi trở về",
        items: [
            {
                icon: <HousePlug size={18} />,
                title: "Kiểm tra an toàn trước khi vào nhà",
                body: "Chỉ trở về khi chính quyền thông báo an toàn. Kiểm tra nền móng, tường và mái nhà có bị nứt, lún không. Mở cửa sổ thông gió trước khi vào để xua khí độc tích tụ. Không bật điện cho đến khi kỹ thuật viên kiểm tra.",
            },
            {
                icon: <Droplets size={18} />,
                title: "Vệ sinh và phòng dịch bệnh",
                body: "Dọn sạch bùn đất, xác động vật và chất thải bằng đồ bảo hộ (găng tay, ủng). Khử trùng nhà với nước Javel (1 phần Javel + 9 phần nước). Không để trẻ em chơi gần vùng vừa ngập. Uống nước đã qua xử lý, không dùng giếng tới khi kiểm tra xong.",
            },
            {
                icon: <BriefcaseMedical size={18} />,
                title: "Chăm sóc sức khỏe sau lũ",
                body: "Theo dõi các triệu chứng bệnh đường tiêu hóa (tiêu chảy, nôn), bệnh da liễu và sốt. Đến trạm y tế ngay nếu có dấu hiệu nhiễm bệnh. Tiêm phòng uốn ván nếu có vết thương hở. Hỗ trợ tâm lý cho trẻ em và người cao tuổi bị sang chấn.",
            },
            {
                icon: <PackageCheck size={18} />,
                title: "Báo cáo thiệt hại và nhận hỗ trợ",
                body: "Chụp ảnh toàn bộ thiệt hại trước khi dọn dẹp để làm căn cứ hỗ trợ. Liên hệ tổ dân phố, UBND xã/phường để đăng ký nhận hỗ trợ. Dùng ứng dụng cứu hộ để cập nhật trạng thái và nhận thông tin cứu trợ.",
            },
        ],
    },
];

const HOTLINES = [
    { label: "Ủy ban Quốc gia ứng phó sự cố thiên tai", number: "1800 599 920", note: "Miễn phí 24/7" },
    { label: "Cảnh sát Phòng cháy chữa cháy & Cứu nạn", number: "114", note: "Miễn phí" },
    { label: "Cấp cứu y tế", number: "115", note: "Miễn phí" },
    { label: "Cảnh sát – Công an", number: "113", note: "Miễn phí" },
];

const COLORMAP = {
    blue: {
        badge: "bg-blue-50 text-blue-700 border-blue-100",
        headerBg: "bg-blue-600",
        iconBg: "bg-blue-50 border-blue-100 text-blue-600",
        dot: "bg-blue-500",
    },
    orange: {
        badge: "bg-orange-50 text-orange-700 border-orange-100",
        headerBg: "bg-orange-500",
        iconBg: "bg-orange-50 border-orange-100 text-orange-600",
        dot: "bg-orange-500",
    },
    green: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        headerBg: "bg-emerald-600",
        iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
        dot: "bg-emerald-500",
    },
};

function PhaseSection({ phase }) {
    const [openIndex, setOpenIndex] = useState(null);
    const c = COLORMAP[phase.color];

    return (
        <Card className="overflow-hidden p-0">
            <div className={`${c.headerBg} px-6 py-5 text-white`}>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                        {phase.icon}
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{phase.label}</p>
                        <h2 className="text-lg font-extrabold leading-tight">{phase.title}</h2>
                    </div>
                </div>
                <p className="mt-2 text-sm text-white/80">{phase.subtitle}</p>
            </div>

            {/* Accordion items */}
            <div className="divide-y divide-slate-100 bg-white">
                {phase.items.map((item, i) => {
                    const isOpen = openIndex === i;
                    return (
                        <div key={i}>
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : i)}
                                className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
                            >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${c.iconBg}`}>
                                    {item.icon}
                                </div>
                                <span className="flex-1 text-sm font-semibold text-slate-800">{item.title}</span>
                                {isOpen ? (
                                    <ChevronUp size={16} className="shrink-0 text-slate-400" />
                                ) : (
                                    <ChevronDown size={16} className="shrink-0 text-slate-400" />
                                )}
                            </button>
                            {isOpen && (
                                <div className="px-6 pb-5">
                                    <div className="ml-[52px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-sm leading-relaxed text-slate-600">{item.body}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

export default function EmergencyGuidePage() {
    return (
        <div className="space-y-10 sm:space-y-14">
            <Container>
                <Card className="px-6 py-6 sm:px-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Truy cập nhanh</span>
                        <Link to={PUBLIC_ROUTES.HOME}>
                            <Button variant="ghost" size="sm">Trang chủ</Button>
                        </Link>
                        <Link to={PUBLIC_ROUTES.SUPPORT_CONTACT}>
                            <Button variant="ghost" size="sm">Liên hệ hỗ trợ</Button>
                        </Link>
                        <Link to={AUTH_ROUTES.LOGIN}>
                            <Button size="sm">Đăng nhập gửi yêu cầu</Button>
                        </Link>
                    </div>
                </Card>
            </Container>

            <Container>
                <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:px-12">
                        <div className="pointer-events-none absolute -left-10 top-10 h-44 w-44 rounded-full bg-red-200/35 blur-3xl" />
                        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-cyan-200/35 blur-3xl" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                <BadgeAlert size={13} />
                                Hướng dẫn khẩn cấp mùa lũ
                            </div>
                            <h1 className="ui-heading mt-6 max-w-3xl text-4xl sm:text-5xl">
                                An toàn khi lũ đến cần
                                <span className="block bg-gradient-to-r from-red-600 via-orange-500 to-blue-600 bg-clip-text text-transparent">
                                    rõ bước, đúng thứ tự, dễ nhớ
                                </span>
                            </h1>
                            <p className="ui-text-secondary mt-5 max-w-2xl text-base sm:text-lg">
                                Nội dung được chia theo giai đoạn hành động để người dân không bị quá tải thông tin trong tình huống khẩn cấp. Mỗi phần chỉ giữ lại những gì thật sự cần để bảo toàn người trước, tài sản sau.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to={AUTH_ROUTES.LOGIN}>
                                    <Button size="lg" className="shadow-lg shadow-blue-500/20">
                                        Gửi yêu cầu cứu hộ
                                    </Button>
                                </Link>
                                <Link to={PUBLIC_ROUTES.SUPPORT_CONTACT}>
                                    <Button variant="outline" size="lg">
                                        Xem thông tin hỗ trợ
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
                        {[
                            { icon: Waves, label: "3 giai đoạn", body: "Chuẩn bị, ứng phó, phục hồi" },
                            { icon: TimerReset, label: "12 hành động", body: "Tập trung vào việc sống sót và liên lạc" },
                            { icon: LifeBuoy, label: "4 đầu mối", body: "Hotline khẩn cấp luôn trong tầm nhìn" },
                        ].map(({ icon: Icon, label, body }) => (
                            <Card key={label} className="px-6 py-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-blue-100 bg-blue-50 text-blue-600">
                                    <Icon size={22} />
                                </div>
                                <p className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">{label}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
                            </Card>
                        ))}
                    </div>
                </section>
            </Container>

            <Container>
                <Card className="overflow-hidden px-6 py-6 sm:px-8 sm:py-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Đường dây khẩn cấp</p>
                            <h2 className="ui-heading mt-2 text-2xl">Gọi ngay khi cần hỗ trợ trực tiếp</h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {HOTLINES.map((h) => (
                                <a
                                    key={h.number}
                                    href={`tel:${h.number.replace(/\s/g, "")}`}
                                    className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                                >
                                    <Phone size={15} className="text-blue-600" />
                                    <span>
                                        <span className="block text-sm font-bold text-slate-900">{h.number}</span>
                                        <span className="block text-xs text-slate-500">{h.label}</span>
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </Card>
            </Container>

            <Container>
                <section className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Hành động theo thứ tự</p>
                            <h2 className="ui-heading mt-2 text-3xl">Checklist an toàn theo từng giai đoạn</h2>
                        </div>
                        <p className="ui-text-secondary max-w-xl text-sm leading-7">
                            Các khối nội dung được giữ gọn, có thể mở ra khi cần, để giảm nhiễu và giúp người dân hành động nhanh hơn trong tình huống áp lực cao.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {PHASES.map((phase) => (
                            <PhaseSection key={phase.id} phase={phase} />
                        ))}
                    </div>
                </section>
            </Container>

            <Container>
                <Card className="px-7 py-8 sm:px-8 sm:py-9">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                            <BadgeAlert size={13} />
                            Túi khẩn cấp 72 giờ
                        </div>
                        <h2 className="ui-heading mt-4 text-3xl">Những vật dụng phải có trước khi di tản</h2>
                        <p className="ui-text-secondary mx-auto mt-4 max-w-2xl text-sm sm:text-base">
                            Thay vì danh sách dài khó nhớ, checklist được chia theo nhóm để người dân có thể chuẩn bị nhanh, kiểm tra nhanh và mang đi nhanh.
                        </p>
                    </div>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                cat: "Giấy tờ & Tài chính",
                                color: "blue",
                                items: ["CMND/CCCD (bọc nilon kín)", "Sổ hộ khẩu, sổ bảo hiểm", "Tiền mặt đủ dùng 3–7 ngày", "Ảnh gia đình (nhận dạng)"],
                            },
                            {
                                cat: "Nước & Thực phẩm",
                                color: "sky",
                                items: ["Nước uống đóng chai (3L/người/ngày)", "Lương khô, đồ hộp dùng được 72h", "Muối, đường, oresol", "Dụng cụ mở đồ hộp"],
                            },
                            {
                                cat: "Y tế & Thuốc",
                                color: "green",
                                items: ["Thuốc dùng hàng ngày (≥7 ngày)", "Băng gạc, cồn, betadine", "Thuốc hạ sốt, tiêu chảy, dị ứng", "Khẩu trang, găng tay y tế"],
                            },
                            {
                                cat: "Ánh sáng & Liên lạc",
                                color: "yellow",
                                items: ["Đèn pin + pin dự phòng", "Sạc dự phòng đã sạc đầy", "Còi hiệu", "Radio chạy pin"],
                            },
                            {
                                cat: "Quần áo & Bảo hộ",
                                color: "orange",
                                items: ["Quần áo ấm đủ dùng 3 ngày", "Áo mưa, ủng cao su", "Mũ bảo hiểm hoặc mũ cứng", "Túi zip chống nước"],
                            },
                            {
                                cat: "Dụng cụ khác",
                                items: ["Dao đa năng", "Dây thừng (5–10m)", "Bản đồ giấy khu vực", "Bật lửa, nến"],
                            },
                        ].map(({ cat, items }) => (
                            <div key={cat} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="mb-3 text-sm font-bold text-slate-800">{cat}</h3>
                                <ul className="space-y-2">
                                    {items.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                                            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 rounded-[28px] bg-gradient-to-br from-blue-600 via-cyan-600 to-emerald-500 px-6 py-8 text-center text-white shadow-lg shadow-cyan-500/20 sm:px-10">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">Hành động ngay</p>
                        <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">Nếu đang ở trong vùng nguy hiểm, đừng chờ thêm</h3>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-cyan-50 sm:text-base">
                            Dùng hệ thống để gửi yêu cầu cứu hộ, cung cấp vị trí và mô tả ngắn tình trạng hiện tại. Thông tin rõ giúp đội cứu hộ phản ứng nhanh hơn.
                        </p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <Link to={AUTH_ROUTES.LOGIN}>
                                <Button variant="solid" className="bg-white text-blue-700 hover:bg-blue-50 border-transparent">
                                    Gửi yêu cầu cứu hộ
                                </Button>
                            </Link>
                            <Link to={PUBLIC_ROUTES.HOME}>
                                <Button variant="outline" className="border-white/35 bg-white/12 text-white hover:bg-white/18">
                                    Về trang chủ
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </Container>
        </div>
    );
}

