import React from 'react';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
             
            console.error('[AppErrorBoundary] Caught error:', error, errorInfo);
        }
    }

    handleReload = () => {
        this.setState({ hasError: false });
        window.location.href = this.props.fallbackHref || '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
                    <div className="max-w-lg w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-3">
                            <span className="text-lg font-bold">!</span>
                        </div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Đã xảy ra lỗi không mong muốn
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Giao diện đã gặp sự cố trong quá trình tải dữ liệu hoặc hiển thị. Vui lòng thử
                            tải lại trang. Nếu lỗi tiếp tục xảy ra, hãy liên hệ quản trị hệ thống.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="inline-flex items-center rounded-xl bg-rescue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rescue-700"
                            >
                                Tải lại trang
                            </button>
                            <button
                                type="button"
                                onClick={() => window.location.assign('/')}
                                className="inline-flex items-center rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                            >
                                Về trang chính
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;

