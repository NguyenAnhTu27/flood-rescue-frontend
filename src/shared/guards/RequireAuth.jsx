import React from 'react';
import { Navigate } from 'react-router-dom';

import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { useAuth } from '../../features/auth/hooks.js';
import PageLoader from '../ui/PageLoader.jsx';

// Guard kiểm tra đăng nhập
export default function RequireAuth({ children }) {
    const { isAuthed, isHydrating } = useAuth();
    if (isHydrating) return <PageLoader label="Đang xác thực phiên đăng nhập..." />;
    if (!isAuthed) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
    return children;
}