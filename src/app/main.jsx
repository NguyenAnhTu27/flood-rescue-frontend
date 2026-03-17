import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import AppErrorBoundary from '../shared/ui/AppErrorBoundary.jsx';
import { AuthProvider } from '../features/auth/AuthProvider.jsx';

// Global styles (Tailwind)
import '../shared/styles/tailwind.css';

// #region agent log
fetch('http://127.0.0.1:7760/ingest/0fef38d5-d2ff-44cd-8a64-86cef69f9613', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '6a69cc',
    },
    body: JSON.stringify({
        sessionId: '6a69cc',
        runId: 'initial',
        hypothesisId: 'ENTRY',
        location: 'app/main.jsx:bootstrap',
        message: 'App bootstrap executed',
        data: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        },
        timestamp: Date.now(),
    }),
}).catch(() => {});
// #endregion agent log

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AppErrorBoundary>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </AppErrorBoundary>
        </BrowserRouter>
    </React.StrictMode>
);