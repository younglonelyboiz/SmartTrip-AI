# Đặc tả API target

Nguồn máy đọc: [openapi.yaml](../api/openapi.yaml), OpenAPI 3.1.0, base `/api/v1`. Chưa có backend; FE dùng service mock. Các endpoint dưới đây là thiết kế triển khai sau, không phải tính năng đã chạy.

| Operation | Route | Quyền/ý nghĩa |
|---|---|---|
| login | POST /auth/login | Public; target xác thực thật, FE chọn hồ sơ demo |
| getProfile/updateProfile | GET/PATCH /profile | Chính mình; role/id immutable khi PATCH |
| listPlaces | GET /places | Public snapshot catalog |
| listTrips/createTrip/getTrip | GET/POST /trips, GET /trips/{tripId} | Chủ chuyến, list chỉ của mình |
| createOptimizationRun | POST /trips/{tripId}/runs | Chủ chuyến; 202 runId/pollUrl |
| getOptimizationRun | GET /trips/{tripId}/runs/{runId} | Chủ chuyến; state và result khi kết thúc |
| listVersions/getVersion | GET /trips/{tripId}/versions[/{versionId}] | Chủ chuyến; immutable versions |
| createFeedback | POST /trips/{tripId}/feedback | Chủ chuyến; unique per user/version |
| createShare/revokeShare | POST /trips/{tripId}/shares, DELETE /trips/{tripId}/shares/{shareId} | Chủ chuyến; token chỉ đọc, expiry/revoke |
| getSharedVersion | GET /shares/{shareToken} | Public có token, trả 404 khi hết hạn/thu hồi |
| listSources/createSource/updatePlace/publishSnapshot | /admin/sources, /admin/places/{placeId}, /admin/snapshots | Admin; không cấp quyền đọc trips riêng |


## Ví dụ yêu cầu lập kế hoạch
```json
{
  "snapshotId": "danang-demo-v1",
  "parentVersionId": null,
  "request": {
    "destination": "Đà Nẵng", "startDate": "2026-12-10", "endDate": "2026-12-12",
    "partySize": 2, "budgetVnd": 6000000,
    "dayStartMinute": 480, "dayEndMinute": 1080, "depotId": "hotel",
    "interests": ["biển", "ẩm thực"], "mandatoryPlaceIds": ["my-khe"],
    "excludedPlaceIds": [], "lockedVisits": []
  }
}
```

## Những phần cố ý chưa production hóa
Auth provider, rate limit, pagination lớn, vận hành durable worker và retention cần quyết định ở giai đoạn backend. Mô tả C4 đề xuất job worker dùng chung module, không giả định FastAPI BackgroundTasks đảm bảo job bền vững. Prototype không gửi password/token thật hay chia sẻ chuyến đi qua server.
