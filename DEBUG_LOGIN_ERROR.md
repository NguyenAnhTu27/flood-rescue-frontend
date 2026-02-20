# Hướng dẫn Debug Lỗi Login 400

## Bước 1: Xem chi tiết Validation Errors trong Console

1. Mở **Developer Tools** (F12)
2. Vào tab **Console**
3. Tìm dòng `[Validation Errors]` - đây sẽ hiển thị object `errors` từ backend
4. Click vào object để xem chi tiết

Ví dụ:
```javascript
[Validation Errors] {
  email: ["Email không đúng format"],
  password: ["Mật khẩu phải có ít nhất 8 ký tự"]
}
```

## Bước 2: Xem Response trong Network Tab

1. Mở **Developer Tools** → tab **Network**
2. Tìm request `auth/login` (có status 400)
3. Click vào request
4. Vào tab **Response** hoặc **Preview**
5. Xem object `errors` để biết field nào bị lỗi

## Bước 3: Kiểm tra Backend API Requirements

Backend có thể yêu cầu:

### Option 1: Field name khác
- `username` thay vì `email`
- `identifier` thay vì `email`
- `phone` thay vì `email`

### Option 2: Format khác
- Email phải có domain cụ thể
- Password phải có độ dài tối thiểu/tối đa
- Các validation rules khác

### Option 3: Thiếu field bắt buộc
- `deviceId`
- `captcha`
- `rememberMe`
- Các field khác

## Bước 4: Test với Postman/curl

Test trực tiếp backend để xem format chính xác:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Hoặc thử với `username`:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "password123"
  }'
```

## Các lỗi thường gặp

### 1. "email field is required"
→ Backend yêu cầu field `email` nhưng có thể tên field khác (`username`, `identifier`)

### 2. "email must be a valid email"
→ Email không đúng format

### 3. "password must be at least X characters"
→ Mật khẩu quá ngắn

### 4. "Field 'role' is not allowed"
→ Đã fix: đã bỏ `role` khỏi request

## Cách fix

Sau khi xem object `errors` trong Console, bạn sẽ biết:
- Field nào bị lỗi
- Lỗi cụ thể là gì
- Cần sửa như thế nào

Sau đó có thể:
1. Đổi tên field trong `src/pages/auth/LoginPage.jsx` (dòng 45)
2. Thêm validation ở frontend
3. Hoặc sửa format dữ liệu gửi lên

## Ví dụ fix

Nếu backend yêu cầu `username` thay vì `email`:

```javascript
// Trong LoginPage.jsx, dòng 44-46
const response = await login({
    username: email,  // Đổi từ email sang username
    password: password,
});
```

Nếu backend yêu cầu cả `email` và `phone`:

```javascript
// Xác định email hay phone
const isEmail = email.includes('@');
const response = await login({
    [isEmail ? 'email' : 'phone']: email,
    password: password,
});
```
