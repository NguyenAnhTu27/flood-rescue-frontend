# API Connection Guide - Frontend to Backend

This guide explains how to connect your React frontend to your backend API.

## 📦 Step 1: Install Dependencies

**Current Setup:** The project uses native `fetch` API (no installation needed!)

**Optional:** If you prefer axios, install it:
```bash
npm install axios
```
Then update `src/shared/lib/http.js` to use axios (see axios version in comments).

## 🔧 Step 2: Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Hệ thống Cứu hộ
VITE_APP_VERSION=1.0.0
```

**Important:** In Vite, environment variables must start with `VITE_` to be accessible in the frontend.

## 📁 Step 3: Project Structure

The API setup follows this structure:

```
src/
├── shared/
│   └── lib/
│       ├── http.js          # Fetch-based HTTP client with interceptors
│       └── storage.js       # localStorage utilities
├── app/
│   └── config/
│       └── env.js          # Environment configuration
└── features/
    ├── auth/
    │   └── api.js          # Auth API calls
    ├── rescue/
    │   └── api.js          # Rescue API calls
    └── ...                 # Other feature APIs
```

## 🚀 Step 4: How to Use APIs

### Example 1: Using Auth API in LoginPage

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/api.js';
import { setToken, setRole, setUser } from '../../shared/lib/storage.js';

function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (credentials) => {
        try {
            setLoading(true);
            setError(null);
            
            // Call API
            const response = await login(credentials);
            
            // Save token and user data
            setToken(response.token);
            setRole(response.user.role);
            setUser(response.user);
            
            // Redirect to dashboard
            navigate('/cong-dan');
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Your form JSX
    );
}
```

### Example 2: Using Rescue API in Component

```jsx
import { useState, useEffect } from 'react';
import { getRescueRequests, createRescueRequest } from '../../features/rescue/api.js';

function RescueRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await getRescueRequests({ status: 'pending' });
            setRequests(response.data || response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (formData) => {
        try {
            const response = await createRescueRequest(formData);
            // Refresh list
            fetchRequests();
            return response;
        } catch (err) {
            throw err;
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            {requests.map(request => (
                <div key={request.id}>{request.description}</div>
            ))}
        </div>
    );
}
```

## 🔐 Step 5: Authentication Flow

The HTTP client automatically:
1. **Adds token** to all requests via `Authorization: Bearer <token>` header
2. **Handles 401 errors** by clearing token and redirecting to login
3. **Handles errors** globally with proper error messages

## 📝 Step 6: Creating New API Files

For each feature, create an API file:

```javascript
// src/features/your-feature/api.js
import httpClient from '../../shared/lib/http.js';

export async function getItems(params = {}) {
    const response = await httpClient.get('/your-endpoint', { params });
    return response;
}

export async function createItem(data) {
    const response = await httpClient.post('/your-endpoint', data);
    return response;
}

export async function updateItem(id, data) {
    const response = await httpClient.put(`/your-endpoint/${id}`, data);
    return response;
}

export async function deleteItem(id) {
    const response = await httpClient.delete(`/your-endpoint/${id}`);
    return response;
}
```

## 🎯 Step 7: Backend API Requirements

Your backend should:

1. **Return consistent response format:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Success message"
}
```

2. **Handle errors:**
```json
{
    "success": false,
    "message": "Error message",
    "errors": { ... }
}
```

3. **Use JWT tokens** in `Authorization: Bearer <token>` header

4. **CORS configuration** to allow frontend origin

## 🔍 Step 8: Testing API Connection

1. Start your backend server (e.g., `http://localhost:3000`)
2. Update `.env` with correct API URL
3. Test login:
```javascript
import { login } from './features/auth/api.js';

// Test
login({ email: 'test@example.com', password: 'password', role: 'CITIZEN' })
    .then(res => console.log('Success:', res))
    .catch(err => console.error('Error:', err));
```

## 📚 Common Patterns

### Loading States
```jsx
const [loading, setLoading] = useState(false);

const handleAction = async () => {
    setLoading(true);
    try {
        await apiCall();
    } finally {
        setLoading(false);
    }
};
```

### Error Handling
```jsx
const [error, setError] = useState(null);

try {
    await apiCall();
} catch (err) {
    setError(err.message);
    // Show toast notification
}
```

### Form Submission
```jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await createItem(formData);
        // Success - show message, redirect, etc.
    } catch (err) {
        // Show error message
    }
};
```

## 🛠️ Troubleshooting

1. **CORS Error**: Make sure backend allows your frontend origin
2. **401 Unauthorized**: Check if token is being sent correctly
3. **Network Error**: Verify API_BASE_URL is correct
4. **404 Not Found**: Check endpoint URLs match backend routes

## 📖 Next Steps

1. Update your backend API endpoints
2. Implement API calls in your components
3. Add error handling and loading states
4. Test all API endpoints
5. Add request/response validation
