import React from 'react';
import { Navigate } from 'react-router-dom';

import { PUBLIC_ROUTES } from '../../app/routes/route.constants.js';
import { useAuth } from '../../features/auth/hooks.js';

// Guard kiểm tra role
export default function RequireRole({ allow, children }) {
    const { role } = useAuth();
    if (!role || !allow.includes(role)) {
        return <Navigate to={PUBLIC_ROUTES.HOME} replace />;
    }
    return children;
}
