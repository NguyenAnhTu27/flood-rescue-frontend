<Route
    path={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
    element={
        <RequireRole role="CITIZEN">
            <RescueRequestCreatePage />
        </RequireRole>
    }
/>