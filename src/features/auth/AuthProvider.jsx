import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getCurrentUser } from './api.js';
import { AUTH_ROUTES } from '../../app/routes/route.constants.js';
import { clearAuth, getRole, getToken, getUser, setRole, setToken, setUser } from '../../shared/lib/storage.js';

const AuthContext = createContext(null);

function normalizeRole(roleRaw) {
    const role = String(roleRaw || '').toUpperCase().trim();
    return role || null;
}

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setTokenState] = useState(() => getToken());
    const [role, setRoleState] = useState(() => normalizeRole(getRole()));
    const [user, setUserState] = useState(() => getUser());
    const [isHydrating, setIsHydrating] = useState(true);

    const isAuthed = Boolean(token);

    const setSession = useCallback(({ token: nextToken, role: nextRole, user: nextUser } = {}) => {
        if (nextToken) {
            setToken(nextToken);
            setTokenState(nextToken);
        }
        const normalizedRole = normalizeRole(nextRole ?? nextUser?.role);
        if (normalizedRole) {
            setRole(normalizedRole);
            setRoleState(normalizedRole);
        }
        if (nextUser && typeof nextUser === 'object') {
            setUser(nextUser);
            setUserState(nextUser);
        }
    }, []);

    const logout = useCallback(
        ({ redirectToLogin = true } = {}) => {
            clearAuth();
            setTokenState(null);
            setRoleState(null);
            setUserState(null);
            if (redirectToLogin) {
                navigate(AUTH_ROUTES.LOGIN, {
                    replace: true,
                    state: { from: { pathname: location.pathname, search: location.search } },
                });
            }
        },
        [location.pathname, location.search, navigate]
    );

    const hydrate = useCallback(async () => {
        const t = getToken();
        const storedRole = normalizeRole(getRole());
        const storedUser = getUser();

        setTokenState(t);
        setRoleState(storedRole);
        setUserState(storedUser);

        if (!t) return;

        try {
            const me = await getCurrentUser();
            if (me && typeof me === 'object') {
                const nextRole = normalizeRole(me.role ?? storedRole);
                setUser(me);
                setUserState(me);
                if (nextRole) {
                    setRole(nextRole);
                    setRoleState(nextRole);
                }
            }
        } catch (e) {
            // Token invalid/expired → clear session
            logout({ redirectToLogin: false });
        }
    }, [logout]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setIsHydrating(true);
            try {
                await hydrate();
            } finally {
                if (mounted) setIsHydrating(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [hydrate]);

    // Listen to 401 signal from http client
    useEffect(() => {
        const onUnauthorized = () => logout({ redirectToLogin: true });
        window.addEventListener('auth:unauthorized', onUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
    }, [logout]);

    // Sync when other tabs modify localStorage
    useEffect(() => {
        const onStorage = (evt) => {
            if (!evt.key) return;
            if (evt.key === 'token' || evt.key === 'role' || evt.key === 'user') {
                setTokenState(getToken());
                setRoleState(normalizeRole(getRole()));
                setUserState(getUser());
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const value = useMemo(
        () => ({
            token,
            role,
            user,
            isAuthed,
            isHydrating,
            setSession,
            logout,
            hydrate,
        }),
        [token, role, user, isAuthed, isHydrating, setSession, logout, hydrate]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    return React.useContext(AuthContext);
}

