# Troubleshooting Guide

## Network Error: "Cannot connect to backend server"

If you're seeing a network error when trying to login, here are the solutions:

### Solution 1: Enable Mock API Mode (Quick Fix for Development)

If your backend isn't ready yet, you can use mock API responses:

1. Create a `.env` file in the root directory:
```env
VITE_USE_MOCK_API=true
```

2. Restart your development server:
```bash
npm run dev
```

3. Now login will work with mock data (no backend required)

### Solution 2: Connect to Real Backend

If you have a backend server running:

1. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=false
```

**Important:** Replace `http://localhost:3000/api` with your actual backend URL.

2. Make sure your backend is running and accessible at that URL.

3. Check CORS settings on your backend - it should allow requests from your frontend origin (usually `http://localhost:5173` for Vite).

4. Restart your development server:
```bash
npm run dev
```

### Solution 3: Check Backend Connection

1. **Verify backend is running:**
   - Open your browser and go to: `http://localhost:3000/api/health` (or your backend health endpoint)
   - You should see a response

2. **Check the browser console:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for `[API Request]` logs to see what URL is being called
   - Check Network tab to see if the request is being made

3. **Common issues:**
   - Backend not running → Start your backend server
   - Wrong port → Update `VITE_API_BASE_URL` in `.env`
   - CORS error → Configure CORS on backend to allow your frontend origin
   - Firewall blocking → Check firewall settings

### Solution 4: Check Environment Variables

Make sure your `.env` file is in the root directory (same level as `package.json`):

```
FE-HeThongLuLut/
├── .env          ← Should be here
├── package.json
├── src/
└── ...
```

**Note:** After changing `.env`, you MUST restart the dev server for changes to take effect.

### Debugging Tips

1. **Check console logs:**
   - The app logs all API requests in development mode
   - Look for `[API Request]` or `[MOCK API]` messages

2. **Check Network tab:**
   - Open Developer Tools → Network tab
   - Try logging in again
   - See if the request appears and what the error is

3. **Verify API URL:**
   - The app uses: `VITE_API_BASE_URL` from `.env` or defaults to `http://localhost:3000/api`
   - Check console logs to see the actual URL being called

### Still Having Issues?

1. Make sure you've restarted the dev server after creating/updating `.env`
2. Check that `.env` file has no syntax errors
3. Verify the backend URL is correct (no trailing slash)
4. Check browser console for detailed error messages
