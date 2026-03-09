import React from 'react';
import CitizenReliefRequestCreatePage from '../citizen/ReliefRequestCreatePage.jsx';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';

export default function ReliefRequestCreatePage() {
    return (
        <CitizenReliefRequestCreatePage
            afterCreateNavigateTo={MANAGER_ROUTES.DASHBOARD}
            autoLocateOnMount={false}
            allowAddressSearch
            showUseGpsButton={false}
        />
    );
}
