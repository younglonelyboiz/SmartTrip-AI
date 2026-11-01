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

## Contract và lỗi
TravelRequest và PlanVersion trong YAML dùng cùng từ điển với optimizer; tiền integer VND theo nhóm, cost basis rõ. Start/endDate inclusive, phút 0..1440, start<end, endDate>=startDate. partySize>=1, mandatory/excluded phải tồn tại và không giao nhau. Schema không diễn đạt hết cross-field constraints: backend kiểm tra các quy tắc BR-01..10 trước solver.

Bearer token target có expiry; 401 khi thiếu/hết hạn; 403 khi không có vai trò admin, 404 khi tài nguyên riêng không có quyền xem để giảm lộ thông tin; 409 khi version/feedback xung đột; 422 khi input sai. Problem dùng application/problem+json có type/title/status/detail/code/instance; không đưa stack trace hoặc khóa API ra response.

Request RunCreate có snapshotId, request và parentVersionId. Retry POST create run cần Idempotency-Key (target ghi key theo user+trip, request hash, cùng key khác payload trả 409); lần tạo run và tham chiếu snapshot phải atomic. Execution state tách solver status. Run QUEUED/RUNNING có result=null; khi COMPLETED có result, FAILED trả reason qua result DATA_ERROR hoặc Problem tùy thời điểm lỗi. Poll có backoff và dừng khi complete, không vòng lặp vô hạn. Thời gian phản hồi/queue durability cần đo khi triển khai, không cam kết ở prototype.

OptimizationResult ràng buộc plan=null cho INFEASIBLE/TIMEOUT_NO_SOLUTION/INVALID_INPUT/DATA_ERROR; các trạng thái có nghiệm bắt buộc PlanVersion. Run lỗi model nội bộ không gán INVALID_INPUT của người dùng. `isMock` là provenance môi trường demo, không phải solver status. Result/plan có configVersion/objectiveVersion; result có skippedPlaces với placeId/reason và mỗi check có evidence có cấu trúc. FactProvenance trên Place, OpeningWindow và TravelEdge ghi nguồn/thời điểm/hiệu lực cho dữ kiện, tách khỏi provenance của giá. Unknown constraint check không được tô thành pass. Mỗi plan có request/snapshotId, parentVersionId và total từ cost items.

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
