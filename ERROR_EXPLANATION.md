# Giải thích lỗi "Dữ liệu không hợp lệ" (400 Bad Request)

## Lỗi là gì?

Lỗi **400 Bad Request** với thông báo **"Dữ liệu không hợp lệ"** có nghĩa là:

1. **Backend đã nhận được request** - Kết nối giữa FE và BE đã thành công ✅
2. **Backend từ chối request** - Dữ liệu gửi lên không đúng format mà backend yêu cầu ❌

## Nguyên nhân có thể

### 1. **Field `role` không được chấp nhận trong login request**
- Nhiều backend **không cần** field `role` trong request login
- Backend sẽ tự xác định role từ tài khoản user, không phải từ request
- **Đã fix**: Đã bỏ field `role` khỏi login request

### 2. **Tên field không đúng**
Backend có thể yêu cầu:
- `username` thay vì `email`
- `phone` thay vì `email`
- Hoặc các tên field khác

### 3. **Thiếu field bắt buộc**
Backend có thể yêu cầu thêm các field như:
- `deviceId`
- `captcha`
- Hoặc các field khác

### 4. **Format dữ liệu không đúng**
- Email không đúng format
- Password quá ngắn/dài
- Các validation rules khác

## Cách kiểm tra

### Bước 1: Xem chi tiết lỗi trong Console
Mở Developer Tools (F12) → Console tab, tìm:
```
[Login Error] { message: '...', status: 400, data: { errors: {...} } }
```

Object `errors` sẽ cho biết field nào bị lỗi.

### Bước 2: Xem Network tab
1. Mở Developer Tools → Network tab
2. Tìm request `auth/login`
3. Click vào request → Tab **Response**
4. Xem chi tiết object `errors` để biết field nào bị lỗi

Ví dụ response có thể là:
```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "email": ["Email không đúng format"],
    "password": ["Mật khẩu phải có ít nhất 8 ký tự"],
    "role": ["Field 'role' không được phép trong login request"]
  }
}
```

### Bước 3: Kiểm tra Backend API Documentation
Xem tài liệu API của backend để biết:
- Endpoint chính xác là gì?
- Cần gửi những field nào?
- Format của từng field ra sao?

## Đã fix gì?

1. ✅ **Bỏ field `role` khỏi login request** - Vì backend tự xác định role từ user account
2. ✅ **Cải thiện error handling** - Hiển thị chi tiết validation errors từ object `errors`
3. ✅ **Cập nhật redirect logic** - Dùng role từ user object thay vì selectedRole

## Cách test

1. **Thử login lại** - Đã bỏ `role` khỏi request
2. **Kiểm tra Console** - Xem có lỗi validation nào khác không
3. **Kiểm tra Network tab** - Xem response từ backend có object `errors` không

## Nếu vẫn lỗi

Nếu vẫn bị lỗi 400, hãy:

1. **Xem object `errors` trong Console/Network tab**
2. **Kiểm tra từng field**:
   - `email` - Có đúng format không?
   - `password` - Có đủ độ dài không?
   - Các field khác backend yêu cầu?

3. **So sánh với Backend API docs**:
   - Backend yêu cầu field nào?
   - Format của từng field ra sao?

4. **Test trực tiếp với Postman/curl**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

## Kết luận

Lỗi này **không phải lỗi kết nối**, mà là **lỗi validation dữ liệu**. Backend đã nhận được request nhưng từ chối vì dữ liệu không đúng format.

Sau khi fix (bỏ `role` khỏi request), hãy thử login lại. Nếu vẫn lỗi, kiểm tra object `errors` trong Console để biết field nào cần sửa.
