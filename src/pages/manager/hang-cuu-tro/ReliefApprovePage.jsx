import { Navigate, useSearchParams } from 'react-router-dom';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';

export default function ReliefApprovePage() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const target = id
        ? `${MANAGER_ROUTES.RELIEF_VERIFY}?id=${id}`
        : MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD;

    return <Navigate to={target} replace />;
}
