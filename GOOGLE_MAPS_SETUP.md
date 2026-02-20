# Hướng dẫn Setup Google Maps API

## Bước 1: Lấy Google Maps API Key

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy API key

## Bước 2: Enable APIs cần thiết

Trong Google Cloud Console, vào **APIs & Services** → **Library** và enable:
- ✅ **Maps JavaScript API**
- ✅ **Geocoding API** (để chuyển đổi tọa độ thành địa chỉ)
- ✅ **Places API** (tùy chọn, nếu cần tìm kiếm địa chỉ)

## Bước 3: Cấu hình API Key

1. Tạo file `.env` trong thư mục root (nếu chưa có):
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

2. Thay `YOUR_API_KEY_HERE` bằng API key bạn đã copy

3. **Quan trọng**: Restart dev server sau khi thêm `.env`:
```bash
npm run dev
```

## Bước 4: Giới hạn API Key (Khuyến nghị cho Production)

Để bảo mật, nên giới hạn API key:

1. Vào **APIs & Services** → **Credentials**
2. Click vào API key của bạn
3. Trong **Application restrictions**:
   - Chọn **HTTP referrers (web sites)**
   - Thêm domain của bạn: `localhost:5173/*` (cho dev)
   - Thêm domain production: `yourdomain.com/*`

4. Trong **API restrictions**:
   - Chọn **Restrict key**
   - Chỉ chọn các API bạn đã enable (Maps JavaScript API, Geocoding API)

## Bước 5: Test

1. Mở trang tạo yêu cầu cứu hộ
2. Bản đồ Google Maps sẽ hiển thị
3. Click vào bản đồ hoặc kéo marker để chọn vị trí
4. Địa chỉ sẽ tự động được cập nhật

## Troubleshooting

### Lỗi: "Google Maps API key not found"
- Kiểm tra file `.env` có đúng tên không
- Kiểm tra API key có đúng format không
- Restart dev server

### Lỗi: "This API key is not authorized"
- Kiểm tra đã enable Maps JavaScript API chưa
- Kiểm tra API restrictions có đúng không

### Bản đồ không hiển thị
- Mở Console (F12) để xem lỗi chi tiết
- Kiểm tra API key có hợp lệ không
- Kiểm tra billing account (Google Maps cần billing account, nhưng có free tier)

## Free Tier

Google Maps có free tier:
- **$200 credit mỗi tháng** (đủ cho hầu hết ứng dụng nhỏ)
- Maps JavaScript API: $7 per 1,000 requests
- Geocoding API: $5 per 1,000 requests

## Lưu ý

- **Không commit file `.env`** vào Git (đã có trong `.gitignore`)
- Sử dụng API key riêng cho development và production
- Monitor usage trong Google Cloud Console
