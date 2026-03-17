import { useAuthContext } from './AuthProvider.jsx';

/**
 * useAuth
 * Single source of truth for auth state.
 *
 * Shape is backward-compatible with existing guards:
 * - isAuthed
 * - role
 */
export function useAuth() {
    const ctx = useAuthContext();
    if (!ctx) {
        return {
            isAuthed: false,
            role: null,
            token: null,
            user: null,
            isHydrating: false,
            setSession: () => {},
            logout: () => {},
            hydrate: async () => {},
        };
    }
    return {
        isAuthed: ctx.isAuthed,
        role: ctx.role,
        token: ctx.token,
        user: ctx.user,
        isHydrating: ctx.isHydrating,
        setSession: ctx.setSession,
        logout: ctx.logout,
        hydrate: ctx.hydrate,
    };
}
