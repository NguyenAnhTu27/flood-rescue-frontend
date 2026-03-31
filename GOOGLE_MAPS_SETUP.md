# Huong dan setup Mapbox

## Buoc 1: Tao Access Token tren Mapbox

1. Truy cap [Mapbox Account](https://account.mapbox.com/)
2. Dang nhap va vao **Access tokens**
3. Tao token moi hoac dung `Default public token`
4. Copy token

## Buoc 2: Cau hinh bien moi truong

Tao hoac cap nhat file `.env` o root frontend:

```env
VITE_MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN
```

Sau do restart dev server:

```bash
npm run dev
```

## Buoc 3: Kiem tra

1. Mo cac man hinh co ban do (tao yeu cau cuu ho/cuu tro, dashboard, assignment detail)
2. Click vao ban do hoac keo marker
3. Dia chi se duoc reverse geocode tu Mapbox (fallback OSM neu can)

## Troubleshooting

### Ban do khong hien
- Kiem tra `VITE_MAPBOX_ACCESS_TOKEN` da dung chua
- Mo browser console de xem loi mapbox

### Geocode khong tra ve dia chi
- He thong tu dong fallback sang OSM Nominatim
- Neu van fail, kiem tra ket noi internet

## Luu y

- Khong commit token private vao git
- Nen tao token rieng cho production va development
- Co the gioi han referrer/domain trong Mapbox settings
