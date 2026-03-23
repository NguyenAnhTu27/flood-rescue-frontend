import React from 'react';
import ReliefRequestCreateForm from './ReliefRequestCreateForm.jsx';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';

export default function ReliefRequestCreatePage() {
    return (
        <ReliefRequestCreateForm
            afterCreateNavigateTo={MANAGER_ROUTES.RELIEF_REQUESTS}
            autoLocateOnMount={false}
            allowAddressSearch
            showUseGpsButton={false}
        />
    );
}
