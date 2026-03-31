# Hướng dẫn Code Backend cho Tính năng Cứu hộ

## 📋 Tổng quan

Dựa trên cấu trúc Frontend hiện tại, đây là hướng dẫn chi tiết để bắt đầu code backend cho tính năng cứu hộ.

## 🗄️ 1. Database Schema

### Bảng: `rescue_requests`

```sql
CREATE TABLE rescue_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    citizen_id BIGINT NOT NULL,
    
    -- Thông tin vị trí
    address VARCHAR(500) NOT NULL,
    ward VARCHAR(200),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Thông tin yêu cầu
    description TEXT NOT NULL,
    people_count INT DEFAULT 1,
    urgency ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    
    -- Thông tin liên hệ
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (citizen_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_urgency (urgency),
    INDEX idx_created_at (created_at),
    INDEX idx_location (latitude, longitude)
);
```

### Bảng: `rescue_request_attachments`

```sql
CREATE TABLE rescue_request_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rescue_request_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rescue_request_id) REFERENCES rescue_requests(id) ON DELETE CASCADE,
    INDEX idx_rescue_request (rescue_request_id)
);
```

### Bảng: `rescue_assignments` (cho Coordinator/Manager)

```sql
CREATE TABLE rescue_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rescue_request_id BIGINT NOT NULL,
    team_id BIGINT,
    assigned_by BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
    
    FOREIGN KEY (rescue_request_id) REFERENCES rescue_requests(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE KEY unique_request_assignment (rescue_request_id)
);
```

## 🔌 2. API Endpoints cần implement

### 2.1. Tạo yêu cầu cứu hộ (Citizen)

**Endpoint:** `POST /api/rescue/requests`

**Request:**
```javascript
// FormData với multipart/form-data
{
    address: "Xã Nam Danh, Thị xã Ba Đồn, Tỉnh Quảng Bình",
    ward: "Xã Nam Danh",
    latitude: 17.123456,
    longitude: 106.789012,
    description: "Mô tả chi tiết tình huống...",
    peopleCount: 4,
    urgency: "HIGH", // HIGH | MEDIUM | LOW
    // contact phone is appended into description if provided
    attachments: [File, File, ...] // Array of image files
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "address": "Xã Nam Danh, Thị xã Ba Đồn, Tỉnh Quảng Bình",
        "ward": "Xã Nam Danh",
        "latitude": 17.123456,
        "longitude": 106.789012,
        "description": "Mô tả chi tiết tình huống...",
        "peopleCount": 4,
        "urgency": "HIGH",
        "status": "PENDING",
        // contact phone is appended into description if provided
        "attachments": [
            {
                "id": 1,
                "fileName": "image1.jpg",
                "fileUrl": "/uploads/rescue/1/image1.jpg"
            }
        ],
        "createdAt": "2024-01-15T10:30:00Z"
    }
}
```

**Validation:**
- `address`: Required, max 500 chars
- `latitude`, `longitude`: Required, valid coordinates
- `description`: Required, min 10 chars
- `peopleCount`: Required, min 1, max 1000
- `urgency`: Required, must be HIGH/MEDIUM/LOW
- `contactPhone`: Not used (append to description instead)
- `attachments`: Optional, max 10 files, max 10MB each, only images

### 2.2. Lấy danh sách yêu cầu (Citizen)

**Endpoint:** `GET /api/citizen/rescue-requests`

**Query Parameters:**
```
?status=PENDING&page=1&limit=10
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "id": 1,
                "address": "...",
                "status": "PENDING",
                "urgency": "HIGH",
                "createdAt": "2024-01-15T10:30:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 25,
            "totalPages": 3
        }
    }
}
```

### 2.3. Lấy chi tiết yêu cầu

**Endpoint:** `GET /api/rescue/requests/:id`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "address": "...",
        "ward": "...",
        "latitude": 17.123456,
        "longitude": 106.789012,
        "description": "...",
        "peopleCount": 4,
        "urgency": "HIGH",
        "status": "PENDING",
        // contact phone is appended into description if provided
        "attachments": [...],
        "assignments": [...],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
    }
}
```

### 2.4. Cập nhật yêu cầu

**Endpoint:** `PUT /api/rescue/requests/:id`

**Request:**
```json
{
    "description": "Mô tả đã cập nhật",
    "peopleCount": 5,
    "urgency": "MEDIUM"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        ...
    }
}
```

**Authorization:** Chỉ citizen tạo request mới được update (trừ khi status = COMPLETED/CANCELLED)

### 2.5. Hủy yêu cầu

**Endpoint:** `POST /api/rescue/requests/:id/cancel`

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Yêu cầu cứu hộ đã được hủy"
}
```

**Authorization:** Chỉ citizen tạo request mới được cancel

### 2.6. Lấy trạng thái yêu cầu

**Endpoint:** `GET /api/rescue/requests/:id/status`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "status": "IN_PROGRESS",
        "statusHistory": [
            {
                "status": "PENDING",
                "timestamp": "2024-01-15T10:30:00Z"
            },
            {
                "status": "ASSIGNED",
                "timestamp": "2024-01-15T11:00:00Z",
                "assignedTo": "Team ABC"
            }
        ],
        "estimatedCompletion": "2024-01-15T14:00:00Z"
    }
}
```

## 🔐 3. Authentication & Authorization

### 3.1. Authentication
- Sử dụng JWT token từ header: `Authorization: Bearer <token>`
- Token được lấy từ `/api/auth/login`

### 3.2. Authorization Rules

| Endpoint | Citizen | Coordinator | Rescuer | Manager | Admin |
|----------|---------|-------------|---------|---------|-------|
| POST /rescue/requests | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /citizen/rescue-requests | ✅ (own) | ❌ | ❌ | ❌ | ❌ |
| GET /rescue/requests | ✅ (own) | ✅ (all) | ✅ (assigned) | ✅ (all) | ✅ (all) |
| PUT /rescue/requests/:id | ✅ (own) | ✅ (assigned) | ❌ | ✅ (all) | ✅ (all) |
| POST /rescue/requests/:id/cancel | ✅ (own) | ✅ (assigned) | ❌ | ✅ (all) | ✅ (all) |

## 📁 4. File Upload Handling

### 4.1. Lưu trữ files
- Thư mục: `/uploads/rescue/{request_id}/`
- Tên file: `{timestamp}_{original_name}`
- Validate: Chỉ chấp nhận image (jpg, jpeg, png, webp)
- Max size: 10MB per file
- Max files: 10 per request

### 4.2. Example (Node.js với Multer)

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = `uploads/rescue/${req.params.id || 'temp'}`;
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)'));
    }
});
```

## 🏗️ 5. Cấu trúc Backend Project (Gợi ý)

```
backend/
├── src/
│   ├── controllers/
│   │   └── rescue.controller.js
│   ├── services/
│   │   └── rescue.service.js
│   ├── models/
│   │   └── RescueRequest.js
│   ├── routes/
│   │   └── rescue.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   └── validation.middleware.js
│   ├── validators/
│   │   └── rescue.validator.js
│   └── utils/
│       └── file.util.js
├── uploads/
│   └── rescue/
└── package.json
```

## 📝 6. Business Logic cần implement

### 6.1. Tạo yêu cầu cứu hộ
1. Validate input data
2. Lưu thông tin vào database
3. Upload files (nếu có)
4. Tạo notification cho Coordinator
5. Trả về response với ID mới

### 6.2. Phân công đội cứu hộ (Coordinator)
1. Kiểm tra request status = PENDING
2. Tìm team phù hợp (gần vị trí, available)
3. Tạo assignment
4. Update request status = ASSIGNED
5. Gửi notification cho team

### 6.3. Cập nhật trạng thái
- PENDING → ASSIGNED: Khi được phân công
- ASSIGNED → IN_PROGRESS: Khi team bắt đầu
- IN_PROGRESS → COMPLETED: Khi hoàn thành
- Any → CANCELLED: Khi hủy

## 🧪 7. Testing Checklist

- [ ] Tạo yêu cầu cứu hộ thành công
- [ ] Validation các trường bắt buộc
- [ ] Upload ảnh thành công
- [ ] Lấy danh sách yêu cầu với pagination
- [ ] Lấy chi tiết yêu cầu
- [ ] Cập nhật yêu cầu (chỉ owner)
- [ ] Hủy yêu cầu (chỉ owner)
- [ ] Authorization: Citizen chỉ thấy request của mình
- [ ] Authorization: Coordinator thấy tất cả
- [ ] File upload: Validate type và size
- [ ] Error handling: Invalid ID, Unauthorized, etc.

## 🚀 8. Bắt đầu code

### Bước 1: Setup Database
```sql
-- Tạo database
CREATE DATABASE rescue_system;

-- Tạo các bảng (xem phần 1)
```

### Bước 2: Tạo Model
```javascript
// models/RescueRequest.js
class RescueRequest {
    static create(data) { ... }
    static findById(id) { ... }
    static findByCitizenId(citizenId) { ... }
    static update(id, data) { ... }
    static cancel(id) { ... }
}
```

### Bước 3: Tạo Validator
```javascript
// validators/rescue.validator.js
const validateCreateRequest = (req, res, next) => {
    // Validate: address, latitude, longitude, description, etc.
};
```

### Bước 4: Tạo Service
```javascript
// services/rescue.service.js
class RescueService {
    async createRequest(citizenId, data, files) { ... }
    async getRequests(citizenId, filters) { ... }
    async getRequestById(id) { ... }
    async updateRequest(id, data) { ... }
    async cancelRequest(id) { ... }
}
```

### Bước 5: Tạo Controller
```javascript
// controllers/rescue.controller.js
class RescueController {
    async create(req, res) { ... }
    async list(req, res) { ... }
    async getById(req, res) { ... }
    async update(req, res) { ... }
    async cancel(req, res) { ... }
}
```

### Bước 6: Tạo Routes
```javascript
// routes/rescue.routes.js
router.post('/rescue/requests', authMiddleware, uploadMiddleware, rescueController.create);
router.get('/rescue/requests', authMiddleware, rescueController.list);
router.get('/rescue/requests/:id', authMiddleware, rescueController.getById);
router.put('/rescue/requests/:id', authMiddleware, rescueController.update);
router.post('/rescue/requests/:id/cancel', authMiddleware, rescueController.cancel);
```

## 📚 9. Tài liệu tham khảo

- API Base URL: `http://localhost:8080/api` (development)
- Authentication: JWT Bearer token
- File Upload: multipart/form-data
- Response Format: `{ success: true, data: {...} }` hoặc `{ success: false, message: "...", errors: {...} }`

## ⚠️ 10. Lưu ý quan trọng

1. **Security:**
   - Validate tất cả input
   - Sanitize file names
   - Check file types (không chỉ dựa vào extension)
   - Rate limiting cho API endpoints

2. **Performance:**
   - Index database cho các trường thường query
   - Pagination cho danh sách
   - Optimize file upload (có thể dùng cloud storage)

3. **Error Handling:**
   - Trả về error message rõ ràng
   - Log errors để debug
   - Không expose thông tin nhạy cảm

4. **Testing:**
   - Unit tests cho business logic
   - Integration tests cho API endpoints
   - Test với các edge cases
