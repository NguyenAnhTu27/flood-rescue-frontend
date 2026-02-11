import React from 'react';
import { Navigate } from 'react-router-dom';

import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { useAuth } from '../../features/auth/hooks.js';

// Guard kiểm tra đăng nhập
export default function RequireAuth({ children }) {
    const { isAuthed } = useAuth();
    if (!isAuthed) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
    return children;
}