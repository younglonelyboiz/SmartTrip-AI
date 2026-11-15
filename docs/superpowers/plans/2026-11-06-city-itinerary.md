# City Itinerary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. If those skills are unavailable, report that limitation and use the available native workflow only when authorized.

**Goal:** Gợi ý và tính lịch trình từ yêu cầu cho Hà Nội, Huế và Đà Nẵng qua frontend, FastAPI và GraphHopper.

**Architecture:** Bổ sung metadata giả định cho catalog OSM, adapter định tuyến và bộ lập lịch độc lập với fixture. Planner chính gọi API mới; kết quả và bản đồ dùng cùng các chặng đã tính, không tính lại tuyến ở trình duyệt.

**Tech Stack:** React, TypeScript, Vite, Leaflet, Python, FastAPI, httpx, GraphHopper hiện có; unittest và Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-city-itinerary-design.md`

## Global Constraints

- Dùng chung khung giờ cho toàn chuyến. Mặc định mỗi ngày 08:00–22:00, nghỉ trưa 12:00–13:00.
- Số ngày nguyên từ 1 đến 14; không hỗ trợ khung qua nửa đêm.
- Ngân sách cho một người, chỉ tham quan và di chuyển giữa điểm; bỏ trống không giới hạn, 0 là giới hạn thật.
- Không yêu cầu ngày đi, sở thích, đăng nhập, LLM, database, lưu hoặc chia sẻ lịch mới.
- Không bỏ điểm bắt buộc âm thầm, không dùng tuyến đường thẳng thay tuyến thật, không quảng bá giờ/giá giả định là đã xác minh.
- Giữ React/TypeScript/Vite, FastAPI và ba cấu hình GraphHopper; không reset các thay đổi chưa commit.
- Không cài dependency hoặc tải dữ liệu nếu chưa cần; chỉ chạy cục bộ.

## Review Focus

- Budget bằng 0 hoặc chuỗi rỗng: giữ đúng phân biệt với không giới hạn; kiểm tra Task 1 và 4.
- Giờ nghỉ chia đôi một lượt ghé/chặng: đợi đến sau nghỉ, không cắt thời lượng hoặc cho di chuyển xuyên giờ nghỉ; Task 3.
- Tuyến một chiều và điểm không kết nối: giữ hướng, báo lỗi dịch vụ khác với vô nghiệm; Task 2 và 3.
- Đổi thành phố/submit lại khi response cũ đang về: chỉ kết quả của request hiện hành được hiển thị; Task 4.
- Ngày trống hoặc một điểm: không lặp điểm, không vẽ chặng giả, cảnh báo mức phủ; Task 3 và 5.

## Cấu trúc file và hợp đồng dùng chung

- `backend/planning_models.py`: Pydantic input/output, validation và mặc định.
- `backend/planning_metadata.json`: metadata biên tập tách khỏi `catalog.json`, phiên bản `planning-assumptions-v1`; bảng giá di chuyển minh họa 12.000 VND/km, không phí mở cửa, làm tròn lên từng chặng đến VND.
- `backend/planning_catalog.py`: ghép và kiểm tra metadata với nguồn OSM.
- `backend/planning_routing.py`: ma trận có hướng và geometry cho ID OSM.
- `backend/planning.py`: tìm kiếm lịch hữu hạn và xác minh kết quả.
- `backend/main.py`: thêm `POST /api/prototype/catalog/plan`; giữ endpoint cũ.
- `backend/test_planning.py`: kiểm tra hợp đồng, thuật toán, adapter và API.
- `frontend/src/services/prototypeApi.ts`: TS contract và request mới.
- `frontend/src/components/CatalogPlanner.tsx`: biểu mẫu và trạng thái request.
- `frontend/src/components/CatalogItinerary.tsx`: timeline, tổng tiền, lý do và cảnh báo.
- `frontend/src/components/CatalogItineraryMap.tsx`: markers và geometry đã trả về.
- `frontend/src/pages/Planner.tsx`: thay nội dung UnifiedPlanner; giữ FixturePlanner.
- `frontend/scripts/check-backend-e2e.mjs`: thay bài kiểm tra lịch nháp bằng luồng mới, giữ kiểm tra fixture.
- `frontend/README.md`, `backend/README.md`: cách chạy, dữ liệu giả định và giới hạn.

Input `PlanRequest`: `destination: str`, `dayCount: int`, `budgetVnd: int | None = None`, `mandatoryPlaceIds: list[str] = []`, `schedule: DaySchedule` mặc định. `DaySchedule`: `start: str = "08:00"`, `end: str = "22:00"`, `lunch: TimeWindow | None` mặc định 12:00–13:00. Chuỗi giờ đúng HH:MM. `schedule` bỏ hẳn dùng mặc định; `lunch: null` tắt nghỉ.

Output `PlanResponse`: `status` thuộc `PLANNED_ESTIMATE | INFEASIBLE | SEARCH_LIMIT | ROUTING_UNAVAILABLE | DATA_ERROR`, `request` đã chuẩn hóa, `reason`, `assumptions`, `source`, `days`, `totals`, `coverage`. Không thành công thì days rỗng, totals null. Days có `dayNumber`, `visits`, `legs`, `breaks`, tổng tiền/km/phút. Visit có ID/tên/tọa độ, arrival/departure dạng phút từ 00:00, durationMinutes, mandatory, recommendationReason, admissionVnd. Leg có fromId/toId, departure/arrival, distanceMeters/durationMs, transportVnd, coordinates [lon,lat]. Tổng tiền bằng tổng phí ghé và phí chặng; coverage có số ngày có lượt ghé và số ngày yêu cầu.

### Task 1: Dữ liệu và hợp đồng lập lịch

**Files:** Create `backend/planning_models.py`, `backend/planning_catalog.py`, `backend/planning_metadata.json`, `backend/test_planning.py`.

**Interfaces:** `load_planning_catalog(destination: str) -> list[PlanningPlace]`; `PlanningPlace` gồm thông tin OSM, durationMinutes, visitWindow, admissionVnd, priority, activityGroup, exclusionGroup nullable. Định nghĩa các model input/output phía trên trong planning_models.

- [x] Viết test validation: dayCount 0/15/1.5/true bị từ chối; budget trống là None, 0 được giữ, âm/float/bool bị từ chối; ID trùng/sai thành phố bị từ chối; giờ sai định dạng, đảo, qua nửa đêm và nghỉ ngoài khung ngày bị từ chối.
- [x] Chạy `python3 -m unittest backend.test_planning -v`, xác nhận test mới fail vì thiếu model.
- [x] Tạo model strict cho số; quy định nghỉ có độ dài dương và nằm hoàn toàn trong ngày; định nghĩa request/output thống nhất.
- [x] Điền metadata đủ 30 ID hiện có: thời lượng/khung giờ/giá ghi nhãn giả định, ưu tiên và nhóm; Hoàng Thành/Tử Cấm Thành dùng cùng exclusionGroup. Không sửa nguồn OSM để chứa giá giả định.
- [x] Viết `load_planning_catalog`, test mọi ID có metadata, tọa độ/số hữu hạn, phí không âm, duration dương, phiên bản/nguồn giả định hiện diện. Test thiếu metadata trả lỗi dữ liệu thay vì default giá 0.
- [x] Chạy lại unittest, kỳ vọng toàn bộ test task này PASS; checkpoint chỉ file task này nếu commit được phép.

### Task 2: Adapter GraphHopper cho catalog

**Files:** Create `backend/planning_routing.py`; modify `backend/test_planning.py`. Endpoint route fixture hiện có chưa cần refactor để tránh phá mock tests cũ.

**Interfaces:** `async build_matrix(destination: str, places: list[PlanningPlace]) -> RouteMatrix`; matrix tra bằng `(fromId,toId)`, giá trị distanceMeters/durationMs hoặc missing. `async fetch_selected_legs(destination: str, pairs: list[tuple[PlanningPlace, PlanningPlace]]) -> list[RouteLeg]`. `RoutingUnavailable` cho lỗi dịch vụ; tuyến không tồn tại được ghi missing.

- [x] Viết test httpx mock: ba thành phố trỏ 8989/8991/8993, A→B khác B→A, timeout/connect/5xx khác route-not-found, geometry/metrics sai bị từ chối.
- [x] Chạy unittest xác nhận test mới fail.
- [x] Implement với AsyncClient trust_env=False, timeout 10 giây, semaphore 6; gọi cặp có hướng không bao gồm cùng ID, points_encoded=false chỉ khi cần geometry. Chỉ coi lỗi route-not-found có cấu trúc xác định là không kết nối; lỗi không nhận biết phải báo unavailable. Một request planning có deadline chung 45 giây cho routing.
- [x] Test giới hạn đồng thời, hết deadline hủy tác vụ con, metrics NaN/âm/bool hoặc geometry ngoài miền không lọt vào kết quả thành công.
- [x] Chạy unittest; kỳ vọng PASS. Checkpoint file task này khi được phép.

### Task 3: Tìm kiếm, xác minh lịch và API

**Files:** Create `backend/planning.py`; modify `backend/main.py`, `backend/test_planning.py`.

**Interfaces:** `plan_itinerary(request: PlanRequest, places: list[PlanningPlace], matrix: RouteMatrix) -> PlanResponse`; `async create_plan(request: PlanRequest) -> PlanResponse` điều phối load, matrix, tìm lịch, lấy geometry và xác minh. API trả 422 cho input sai, 200 cho status nghiệp vụ, 503 cho ROUTING_UNAVAILABLE; client phải đọc structured body khi 503.

- [x] Viết test với ma trận tổng hợp: cả ba thành phố, không mandatory vẫn có gợi ý; mandatory đủ và duy nhất; tổng tiền được cộng độc lập; mọi visit/leg trong khung, không đè nghỉ. Chạy test xác nhận fail.
- [x] Implement tìm kiếm beam xác định, width 300, tối đa 100.000 mở rộng; state chứa ngày, lượt đã ghé, giờ hiện tại, phí và nhóm loại trừ. Mỗi bước thêm một điểm chưa dùng hoặc đóng ngày; xét mandatory trước nhưng vẫn giữ nhánh thứ tự khác. Đến sớm thì chờ mở khung; hoạt động đụng giờ nghỉ phải dời nguyên hoạt động. Mỗi ngày đầu tiên không phát sinh chặng nối từ hôm trước. Ưu tiên trạng thái có cơ hội phủ mandatory, sau đó tổng priority/đa dạng nhóm, phủ ngày, rồi giảm di chuyển; giữ thứ tự ổn định theo ID để tái lập.
- [x] Kiểm tra trực tiếp các chứng cứ xung đột: vé mandatory vượt budget, mandatory trùng exclusionGroup, một mandatory không đủ thời gian ngay cả đi một mình. Những trường hợp còn lại chưa tìm thấy lịch trả SEARCH_LIMIT, không tuyên bố INFEASIBLE. Không có điểm nào được chọn thì không trả PLANNED_ESTIMATE.
- [x] Với phương án có đủ mandatory, bổ sung optional trong budget/thời gian, trả PLANNED_ESTIMATE kèm cảnh báo ngày trống. Xác minh lại toàn bộ lịch trước khi trả, lấy geometry các chặng đã chọn và đối chiếu metrics với ma trận; nếu thay đổi thì tính lại/kiểm tra lại hoặc trả lỗi, không ghép geometry mới vào tổng cũ.
- [x] Test budget 0/trống/thấp; mandatory không thể đạt; route thiếu riêng lẻ; outage; giới hạn tìm kiếm; không lặp điểm; 14 ngày với 10 điểm; ngày một điểm phí chặng 0; chặng/lượt ghé đụng nghỉ; lunch null; khung giờ tùy chỉnh; metadata lỗi; geometry thất bại không trả lịch thành công.
- [x] Thêm endpoint và test ASGI request/response/status; kiểm tra assumptions nêu rõ biểu phí minh họa, nguồn OSM, phạm vi chi phí và giờ giả định.
- [x] Chạy `python3 -m unittest backend.test_api backend.test_planning -v`; kỳ vọng cả API cũ và mới PASS. Checkpoint file task này khi được phép.

### Task 4: Biểu mẫu planner và trạng thái request

**Files:** Modify `frontend/src/services/prototypeApi.ts`, `frontend/src/pages/Planner.tsx`; create `frontend/src/components/CatalogPlanner.tsx`.

**Interfaces:** `createCatalogPlan(request: CatalogPlanRequest, signal: AbortSignal): Promise<CatalogPlanResponse>`; TS types khớp Task 1. `CatalogPlanner()` quản lý form và truyền response thành công vào `CatalogItinerary({ plan })` Task 5. Giữ component catalog/draft cũ nếu còn caller; không xóa endpoint.

- [x] Viết browser assertions cho đầu vào thành phố/số ngày/budget/mandatory, số ngày mặc định 3, budget trống gửi null, 0 gửi 0; defaults schedule đúng spec. Xác nhận fail trước khi thay form.
- [x] Implement form controlled, optional settings bằng details, có nút tắt nghỉ; chọn thành phố xóa mandatory. Load catalog bằng API hiện có, không đòi nhập sở thích. Nút tạo lịch không yêu cầu tick điểm.
- [x] Dùng AbortController và request generation tăng mỗi khi đổi input hoặc submit; clear kết quả ngay, bỏ cả response lỗi/thành công từ generation cũ kể cả A→B→A. Cleanup khi unmount. Hiển thị structured reason cho 503 và trạng thái nghiệp vụ; lỗi kết nối có retry.
- [x] Thay UnifiedPlanner bằng CatalogPlanner, giữ route/query demo cũ. Nối kết quả với component Task 5 trước build cuối task.
- [x] Browser test delay response cũ rồi đổi input/submit lại, xác nhận không hiển thị nhầm lịch hoặc lỗi cũ; test đổi thành phố xóa lựa chọn và lunch tắt gửi null.
- [x] Chạy `cd frontend && npm run build`; PASS khi component Task 5 đã có. Checkpoint cùng Task 5 nếu cần để giữ buildable.

### Task 5: Timeline, bản đồ và xác minh end-to-end

**Files:** Create `frontend/src/components/CatalogItinerary.tsx`, `frontend/src/components/CatalogItineraryMap.tsx`; modify `frontend/src/styles.css`, `frontend/scripts/check-backend-e2e.mjs`, `frontend/README.md`, `backend/README.md`.

**Interfaces:** `CatalogItinerary({ plan }: { plan: CatalogPlanResponse })`; `CatalogItineraryMap({ day }: { day: CatalogPlanDay })`. Dùng visit tọa độ và legs geometry response; không gọi lại /route.

- [x] Viết browser assertions cho giờ ghé/chặng/nghỉ, nhãn mandatory/gợi ý, lý do, tổng tiền độc lập từ response, chuyển ngày và attribution/assumptions; kỳ vọng fail trước component mới.
- [x] Implement timeline và chọn ngày; format phút HH:MM, VND/km/phút. Hiện khoản chi không bao gồm và cảnh báo ngày trống. Map Leaflet dùng markers/geometry có sẵn, cleanup instance và layers; chỉ một điểm có marker, ngày trống có thông báo thay map gây hiểu nhầm. Không đưa user text vào HTML không escape.
- [x] Mở rộng browser tests bằng route mocking cho lỗi mạng/503/budget conflict/search limit, ngày trống, một điểm, tile lỗi, mobile 390px và thao tác bàn phím. Test DOM/geometry từ payload đã dùng cho timeline.
- [x] Kiểm tra dịch vụ hiện có, chỉ khởi chạy dịch vụ còn thiếu theo README: ba Java GraphHopper, uvicorn cổng 8000, Vite cổng 5173; lưu log trong /tmp. Chờ health thực trước browser test; không chạy trùng cổng. Nếu local bind bị sandbox chặn, dùng escalation cho server localhost trong phạm vi task.
- [x] Chạy `python3 -m unittest backend.test_api backend.test_planning -v`, rồi tại frontend `npm run build`, `npm run check:fixtures`, `npm run check:services`, `node --import tsx scripts/check-city-happy-cases.ts`, `node scripts/check-city-happy-cases.mjs`, `node scripts/check-backend-e2e.mjs`, `node scripts/check-browser.mjs`. Cập nhật assertion cũ chỉ khi hành vi thiết kế đã thay đổi, giữ kiểm tra fixture/storage. Mỗi lệnh phải PASS, không xem mock routing là kiểm chứng GraphHopper thực.
- [x] Trong E2E thực, mỗi thành phố gửi không mandatory và có mandatory với 3 ngày; kiểm tra ID bắt buộc, thời gian, geometry, phí và tổng khớp payload. Đổi số ngày/budget để chứng minh kết quả tính từ input thay vì fixture. Ghi riêng lỗi dữ liệu/tuyến không đạt, không báo hoàn tất khi còn thiếu luồng thực.
- [x] Cập nhật README với input, defaults, heuristic/search limit, giả định giá/giờ, phạm vi budget và cách chạy/check thực tế; ghi kết quả xác minh chỉ sau khi chạy. Checkpoint file task này khi được phép.

## Tự rà soát kế hoạch

Các phần của spec đã có task: metadata và provenance (1), tuyến ba thành phố (2), gợi ý/lập lịch/budget/mandatory/trạng thái (3), input tùy chọn và chống kết quả cũ (4), timeline/map/coverage và hồi quy (5). Hợp đồng input/output thống nhất giữa Python và TS; API fixture không thay đổi. Không thêm dependency, database hoặc tính năng ngoài phạm vi. Các review focus có test tại task sở hữu.

## Ghi nhận thực hiện — 06/11/2026

Triển khai trực tiếp theo lựa chọn của người dùng; skill executing-plans không có sẵn nên dùng workflow native như thông báo trong phiên. Các checkpoint được giữ trong working tree, không tạo commit gộp với thay đổi có sẵn của người dùng.

Đã rà độc lập và sửa lỗi một chặng optional làm hủy toàn bộ ma trận; giữ riêng failed_pairs để phân biệt lỗi dịch vụ với không có đường. Thêm kiểm tra timeout/cancellation/concurrency/NaN và error body không phải object. Điều chỉnh ranking beam để giữ nhánh phân bố đủ ngày; E2E thực kiểm tra coverage 3/3 cho ba thành phố. Kiểm tra hồi quy tìm ra timer zoom Leaflet còn chạy sau unmount, đã tắt zoomAnimation để tránh page error.

Backend 31 test đạt; build frontend đạt; fixture/service/recommendation/city checks và browser regression đã chạy. Kết quả end-to-end và giới hạn dữ liệu ghi trong frontend/README.md.
