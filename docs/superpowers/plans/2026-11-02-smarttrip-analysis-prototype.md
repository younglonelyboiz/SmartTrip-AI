# SmartTrip AI Analysis and Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bàn giao bộ phân tích–thiết kế SmartTrip AI, chuyên sâu Optimization Engine, kèm FE prototype dùng mock.

**Architecture:** Viết tài liệu nghiệp vụ và hợp đồng dữ liệu trước, dùng chung identifier và fixture cho tài liệu và FE. Target architecture là modular backend với adapter dữ liệu/recommendation/optimizer/agent; đợt này chỉ hiện thực frontend và mock service. Không dựng backend hoặc solver.

**Tech Stack:** Markdown, Mermaid, OpenAPI 3.1; React, TypeScript, Vite, React Router; Python cho kiểm tra tài liệu và Node cho kiểm tra fixture. Chọn phiên bản package khi triển khai dựa trên môi trường thực tế, không sao chép mù quáng lockfile cũ.

**Spec:** [Thiết kế đã duyệt](../specs/2026-11-02-smarttrip-analysis-prototype-design.md)

## Global Constraints

- Tài liệu viết bằng tiếng Việt, identifier/schema dùng tiếng Anh.
- Thời gian theo Asia/Ho_Chi_Minh, tiền VND; ngân sách đầu vào là tổng cho nhóm, có số người và phân biệt khoản theo người/theo nhóm.
- Không triển khai backend, solver, LLM hoặc API dữ liệu thật trong đợt này.
- Mọi kịch bản hiển thị nhãn dữ liệu mô phỏng.
- Không tự bỏ ràng buộc cứng để tạo kết quả trông hợp lệ.
- Không điền kết quả đo giả.
- Không xóa `agent.md` hoặc `mindmap.png` gốc.
- Chỉ xóa thư mục đề tài cũ sau khi kiểm tra đầu ra mới và tạo bản sao lưu ở `/tmp`.
- Native và subagent là hai lựa chọn thực thi; chờ người dùng chọn theo writing-plans. Không tự coi duyệt thiết kế là lựa chọn delegation.

## Review Focus

1. Người dùng sửa đầu vào ngoài fixture: trả unsupported, không trả kế hoạch không khớp; kiểm tra ở Task 5.
2. Dữ liệu localStorage hỏng/cũ: báo và phục hồi an toàn, không crash; kiểm tra ở Task 6.
3. Timeout chưa có nghiệm: không hiển thị là đã chứng minh vô nghiệm; kiểm tra hợp đồng ở Task 3 và trạng thái FE ở Task 6.
4. Khoản chi theo người/nhóm và quay về khách sạn: tổng tiền và thời gian phải bao gồm đầy đủ; kiểm tra ở Task 5.
5. Kế hoạch lưu bị thay đổi sau replanning: giữ phiên bản trước, không ghi đè ngầm; kiểm tra ở Task 6.

## Bản đồ file và trách nhiệm

- `docs/01-SCOPE.md`, `02-FEATURES.md`, `03-USE_CASES.md`, `INVEST_REQUIREMENTS.md`: phạm vi, yêu cầu và nghiệm thu.
- `docs/optimization/OPTIMIZATION_ENGINE.md`: mô hình toán, solver strategy, validation và replanning.
- `docs/data/DATA_STRATEGY.md`, `docs/evaluation/EVALUATION_PLAN.md`: nguồn, snapshot, baseline và cách đánh giá.
- `docs/architecture/c4/{README,01-CONTEXT,02-CONTAINER,03-COMPONENT,04-CODE}.md`: kiến trúc target và prototype.
- `docs/architecture/{DATABASE_DESIGN,OPENAPI_SPECIFICATION}.md`, `docs/api/openapi.yaml`: persistence và hợp đồng API dự kiến.
- `docs/{04-INFORMATION_ARCHITECTURE,05-UX_UI_DESIGN,DEMO_SCENARIOS,TRACEABILITY}.md`: màn hình, demo và truy vết.
- `frontend/src/domain/types.ts`: kiểu dữ liệu dùng chung trong FE; `frontend/src/mocks/scenarios.json`: fixture duy nhất.
- `frontend/src/services/{mockTravelService,tripStorage}.ts`: chọn fixture và lưu phiên bản, không có tính năng solver.
- `frontend/src/pages/{DemoLogin,Trips,Planner,Itinerary,Comparison,Admin}.tsx`: các màn hình demo.
- `frontend/src/components/{AppLayout,DayTimeline,BudgetSummary,ConstraintReport,RouteDiagram,SourceBadge}.tsx`: thành phần hiển thị.
- `frontend/src/{App,main}.tsx`, `frontend/src/styles.css`, `frontend/index.html`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`: ứng dụng và cấu hình.
- `scripts/check_docs.py`, `scripts/check_contract.py`, `frontend/scripts/check-fixtures.mjs`: kiểm chứng liên kết, API và tính nhất quán fixture.
- `README.md`, `docs/DELIVERY_CHECKS.md`: hướng dẫn và bằng chứng nghiệm thu thực tế.

## Task 1: Phân tích nghiệp vụ và truy vết yêu cầu

**Files:** Create `docs/01-SCOPE.md`, `docs/02-FEATURES.md`, `docs/03-USE_CASES.md`, `docs/INVEST_REQUIREMENTS.md`, `docs/TRACEABILITY.md`.

**Interfaces:** Consumes `agent.md` và spec. Produces identifier `F-*`, `UC-*`, `US-*`, `BR-*`, `AC-*` được dùng xuyên suốt các task sau.

- [ ] Đọc lại tài liệu cũ liên quan và lập yêu cầu SmartTrip với vai trò guest/traveler/admin; tách MVP và mở rộng.
- [ ] Viết scope và feature matrix, mind map Mermaid; giữ recommendation/agent ở mức đủ thiết kế, optimizer là trọng tâm.
- [ ] Viết use case có tiền điều kiện, hậu điều kiện, luồng chính/ngoại lệ, ownership và business rules; có lập lịch, vô nghiệm, điều chỉnh, lưu phiên bản và quản trị nguồn.
- [ ] Viết stories có INVEST, phụ thuộc và acceptance criteria quan sát được; nối ID vào TRACEABILITY.
- [ ] Kiểm tra mỗi tính năng MVP có story/use case/AC; không đưa nhóm cộng tác hoặc booking vào MVP. Rà nội dung với `rg -n 'IT_SUPPORT|PENDING_TRIAGE|ITIL|INC-' docs --glob '*.md'`; chỉ chấp nhận nhắc đến lịch sử trong spec/plan, không trong đặc tả sản phẩm mới.

## Task 2: Đặc tả mô hình tối ưu, dữ liệu và đánh giá

**Files:** Create `docs/optimization/OPTIMIZATION_ENGINE.md`, `docs/data/DATA_STRATEGY.md`, `docs/evaluation/EVALUATION_PLAN.md`.

**Interfaces:** Consumes BR/UC từ Task 1. Produces từ điển `TravelRequest`, `DatasetSnapshot`, `PlanVersion`, `ConstraintCheck`, `CostItem`, `SolverStatus` cho Task 3 và 5.

- [ ] Tra tài liệu chính thức OR-Tools về CP-SAT/routing, nguồn bản đồ và dữ liệu đề xuất; ghi link, ngày truy cập, điều đã xác minh và điều chưa kiểm chứng. Không tuyên bố API khả dụng khi chưa có quyền truy cập.
- [ ] Định nghĩa tập ngày/điểm/depot, phút nguyên, VND nguyên, biến chọn điểm/phân ngày/cung/thời điểm; depot đầu/cuối riêng, liên thông và loại chu trình con. Viết công thức bao gồm travel/wait/service/return và chi phí cố định/biến đổi theo nhóm.
- [ ] Định nghĩa hàm mục tiêu chuẩn hóa, trọng số ví dụ ghi rõ giả định và tie-break; baseline greedy kiểm tra khả thi; hướng CP-SAT, giới hạn giải và trạng thái kết quả. Không khẳng định optimal nếu thiếu chứng cứ.
- [ ] Đặc tả validator độc lập, trường hợp thiếu ma trận/giờ mở cửa, xung đột bắt buộc và replanning khóa phần đã thực hiện; không tự nới hard constraint.
- [ ] Viết data provenance, ba loại giá, snapshot và giới hạn mô phỏng lịch sử; có fallback khi nguồn không đủ tin cậy.
- [ ] Viết protocol benchmark cùng snapshot/cấu hình/time budget; metric có công thức và mẫu số, bộ ca biên và bảng kết quả để trống. Rà tay một ví dụ nhỏ để đối chiếu toàn bộ công thức và đơn vị trước Task 3.

## Task 3: Kiến trúc, database và API thống nhất

**Files:** Create các file `docs/architecture/c4/` đã liệt kê, `docs/architecture/DATABASE_DESIGN.md`, `docs/architecture/OPENAPI_SPECIFICATION.md`, `docs/api/openapi.yaml`, `scripts/check_contract.py`.

**Interfaces:** Consumes từ điển Task 2. Produces OpenAPI schemas cùng tên; `SolverStatus` dùng `FEASIBLE`, `OPTIMAL`, `INFEASIBLE`, `TIMEOUT_WITH_SOLUTION`, `TIMEOUT_NO_SOLUTION`, `INVALID_INPUT`, `DATA_ERROR`. Mock metadata tách riêng trạng thái solver.

- [ ] Viết C4 target: FE → API modular → PostgreSQL; adapter recommendation/optimizer/agent/nguồn ngoài; C4 prototype chỉ browser + mock + localStorage. Không áp nguyên queue/SLA của đề tài cũ.
- [ ] Viết ERD và dictionary cho users/preferences/places/opening_windows/data_sources/price_records/snapshots/trips/trip_versions/optimization_runs/itinerary_items/feedback; khóa, ownership, bất biến snapshot và phiên bản.
- [ ] Viết OpenAPI 3.1 cho auth/profile, catalog, trips, versions, optimization runs, feedback, admin sources; versioned request/response, đơn vị rõ, async status/polling ở target nếu chọn xử lý nền, lỗi quyền và lỗi dữ liệu có cấu trúc.
- [ ] Tạo `scripts/check_contract.py` dùng YAML parser và OpenAPI validator; fail nếu thiếu schema cốt lõi, enum trạng thái sai hoặc `$ref` hỏng. Kiểm tra `TIMEOUT_NO_SOLUTION` không mang kế hoạch hay chứng cứ vô nghiệm.
- [ ] Chạy `python scripts/check_contract.py`; expected exit 0 và thông báo hợp đồng hợp lệ. Cài công cụ kiểm tra vào môi trường riêng nếu cần, không thêm runtime backend.
- [ ] Đối chiếu DB/API/optimizer: cùng ID, snapshot, ownership, nhóm/người, thời gian và tiền; cập nhật TRACEABILITY với operationId.

## Task 4: IA, UX và hợp đồng demo

**Files:** Create `docs/04-INFORMATION_ARCHITECTURE.md`, `docs/05-UX_UI_DESIGN.md`, `docs/DEMO_SCENARIOS.md`; update TRACEABILITY.

**Interfaces:** Produces route `/demo-login`, `/trips`, `/planner`, `/trips/:tripId/versions/:versionId`, `/compare/:scenarioId`, `/admin`; scenarioId `standard`, `budget-conflict`, `replan`, `timeout`.

- [ ] Đọc skill frontend-design và ui-ux-pro-max trước thiết kế UI; nếu cần mockup thảo luận, áp dụng visual companion từ brainstorming. Không yêu cầu chọn lại phạm vi đã duyệt.
- [ ] Viết sitemap, role-to-screen, vòng đời trip/version/run; role demo chỉ là chuyển chế độ hiển thị, không giả làm RBAC backend.
- [ ] Viết đặc tả từng route với input, hành động, trạng thái loading/empty/error/unsupported và điều hướng. Chọn giao diện tiếng Việt, ưu tiên timeline, chi phí và constraint report.
- [ ] Ghi token màu/chữ/khoảng cách, responsive, keyboard/focus/labels; không dùng màu làm tín hiệu duy nhất.
- [ ] Viết demo script cho bốn scenario, nêu chính xác request được hỗ trợ, nhãn mô phỏng, kết quả kỳ vọng và giới hạn; nối AC sang route/scenario.

## Task 5: FE shell, fixture và mock service

**Files:** Create cấu hình FE, `src/domain/types.ts`, `src/mocks/scenarios.json`, `src/services/mockTravelService.ts`, `scripts/check-fixtures.mjs` trong `frontend/`.

**Interfaces:** `getScenario(request: TravelRequest, scenarioId: string): Promise<MockResponse>`; `MockResponse` là discriminated union `kind: 'supported' | 'unsupported'`, supported chứa fixture, unsupported chứa message. `TravelRequest` khớp schema Task 3; metadata `isMock: true`. Fixture baseline/proposed cùng snapshot và request.

- [ ] Dựng React/TS/Vite và router tối thiểu; scripts `dev`, `build`, `check:fixtures`. Dùng dependency thực sự cần, đọc skill React trước viết component.
- [ ] Định nghĩa kiểu khớp API và fixture bốn scenario; standard Đà Nẵng 3 ngày 2 đêm; baseline/proposed có lịch và khoản chi tự cộng được. Không tạo metric thời gian chạy solver giả.
- [ ] Viết kiểm tra fixture: tổng cost theo người/nhóm, thứ tự thời gian, mở cửa, đủ travel/service/return, cùng snapshot, không trùng điểm và trạng thái có/không nghiệm đúng. Tạo một bản sao fixture bị đổi total/return time để xác nhận checker phát hiện sai rồi bỏ bản sao.
- [ ] Viết mock service khớp đầy đủ các trường ảnh hưởng kết quả với request fixture, không chỉ scenarioId; request khác trả unsupported. Kiểm tra giảm ngân sách ngoài fixture không nhận lịch chuẩn.
- [ ] Chạy `npm run check:fixtures` và `npm run build` trong `frontend/`; expected exit 0. Checker chỉ xác minh dữ liệu mẫu, không phải triển khai optimizer.

## Task 6: Hoàn thiện các luồng FE mock

**Files:** Create các pages/components đã liệt kê, `frontend/src/services/tripStorage.ts`, `frontend/src/styles.css`; update App/router.

**Interfaces:** `saveVersion(version: PlanVersion): StorageResult`, `loadVersions(): StorageResult`, `resetDemoStorage(): void`; StorageResult có `ok`, `versions`, `message?`, lưu namespace `smarttrip.demo.v1`. PlanVersion có tripId/versionId để không ghi đè phiên bản khác.

- [ ] Dựng AppLayout và chọn hồ sơ demo; Trips hiển thị danh sách fixture và phiên bản đã lưu; Planner có validation input và chọn scenario rõ ràng.
- [ ] Dựng timeline theo ngày, cost breakdown, provenance badge, route diagram SVG ghi rõ mô phỏng và constraint report; dữ liệu lấy từ service, không nhét fixture riêng trong component.
- [ ] Dựng Comparison chỉ cho kết quả cùng snapshot/request; minh họa thay đổi lịch bằng replan fixture. Trạng thái timeout không có nghiệm hiển thị chưa tìm được nghiệm, không hiển thị vô nghiệm.
- [ ] Thêm storage có schema version, validation và thông báo dữ liệu hỏng; thử JSON không hợp lệ, schema cũ và quota error. Save replan giữ bản trước, tải lại trang còn cả hai phiên bản; có reset dữ liệu demo.
- [ ] Dựng Admin catalog/source mock và cảnh báo giới hạn với tổ hợp request không hỗ trợ. Mọi nút có hành vi hoặc bị disable kèm lý do.
- [ ] Chạy build và fixture check; kiểm tra bằng trình duyệt luồng standard → lưu → reload, budget-conflict, replan, timeout, unsupported; kiểm tra console, bàn phím và viewport 1440px/390px. Ghi kết quả quan sát thực tế, không tự ghi pass nếu công cụ browser không khả dụng.

## Task 7: Kiểm chứng tài liệu và bàn giao

**Files:** Create `scripts/check_docs.py`, `docs/DELIVERY_CHECKS.md`; update README và TRACEABILITY.

**Interfaces:** `python scripts/check_docs.py` kiểm tra link tương đối trong README/docs, bỏ link web, xử lý anchor và đường dẫn; exit khác 0 nếu thiếu file. `DELIVERY_CHECKS.md` ghi command, kết quả, giới hạn và backup path.

- [ ] Hoàn tất TRACEABILITY: mỗi MVP story có UC/AC/schema operation/route/scenario hoặc lý do chỉ thiết kế; không có link chết hoặc ID không định nghĩa.
- [ ] Viết checker link; chạy `python scripts/check_docs.py`, `python scripts/check_contract.py`, FE build và fixture check. Kiểm tra Mermaid bằng công cụ sẵn có; nếu không chạy được renderer ghi rõ giới hạn.
- [ ] Viết README với mục lục đầy đủ, cách chạy, scenario, target so với prototype và giới hạn dữ liệu. Không để hướng dẫn dựa vào thư mục cũ.
- [ ] Đọc skill requesting-code-review và verification-before-completion; thực hiện review theo phương thức người dùng chọn, xử lý phát hiện có ảnh hưởng nghiệm thu.
- [ ] Trước xóa, xác nhận bản mới không còn tham chiếu phụ thuộc vào thư mục cũ; tạo tar backup có tên duy nhất ở `/tmp`, kiểm tra đọc được danh sách file và đối chiếu số file với nguồn.
- [ ] Xóa riêng `IT-Incident-Triage-System/` theo phạm vi đã duyệt; không xóa file gốc khác. Chạy lại checker tài liệu và FE build; ghi backup path và nhắc backup chỉ tạm thời trong DELIVERY_CHECKS.
- [ ] Kiểm tra `git diff --check` cho file tracked và whitespace file mới; lưu các thay đổi theo task nếu Git cho phép. Nếu `.git` không ghi được, giữ file trong workspace và báo chưa commit, không chặn đầu ra.

## Tự rà kế hoạch

- Các mục 1–5 spec được bao phủ Task 1 và Global Constraints; trọng tâm optimizer ở Task 2.
- Danh mục tài liệu và kiến trúc có Task 1–4; FE mock có Task 5–6; nghiệm thu/chuyển đổi có Task 7.
- Tên schema, status, route và scenario có một nơi định nghĩa và các task sau sử dụng lại.
- Năm rủi ro Review Focus có kiểm tra ở task sở hữu; không viết unit test chỉ để phản chiếu component trình bày.
- Kế hoạch chưa thực thi; checkbox chưa đánh dấu là kết quả đã hoàn thành.

## Điều chỉnh theo yêu cầu mới nhất ngày 2026-11-02

Người dùng yêu cầu README theo đúng đề tài cũ và chỉ làm các phần đề tài cũ đã làm. Vì vậy đầu ra sản phẩm giới hạn ở Scope, Features, Use Cases, INVEST, Information Architecture, UI/UX, C4, Database, API và FE prototype. Không bàn giao bộ tài liệu Data Strategy, Evaluation, Traceability, Demo Scenarios hoặc Delivery Checks riêng: nguồn dữ liệu đưa vào Scope, mô hình optimizer vào Component, truy vết vào INVEST, demo/checks vào frontend/README.md. Các đường dẫn trong kế hoạch phía trên là lịch sử trước điều chỉnh, không phải danh mục phải tạo thêm.

## Kết quả thực hiện theo phạm vi đã điều chỉnh

- [x] Phạm vi, features, use cases, stories INVEST và truy vết trong INVEST.
- [x] Đặc tả Optimization Engine trong C3 Component; nguồn dữ liệu trong Scope.
- [x] C4, database, API/OpenAPI và hợp đồng fixture nhất quán.
- [x] IA và UI/UX cùng 6 ảnh FE thật; README đúng 7 phần đề tài cũ.
- [x] FE mock: lập lịch mẫu, so sánh, conflict, timeout, replan, lưu/mở lại và admin chỉ xem.
- [x] Build, fixture/service/schema/link checks; parse Mermaid và browser kiểm tra cuối.
- [x] Review và sửa các phát hiện quan trọng; backup/kiểm tra/xóa thư mục cũ.
- Quản lý Git: theo yêu cầu tiếp theo của người dùng, chia nhánh tài liệu, giao diện và kiểm tra; commit tiếng Việt ngắn gọn, push rồi merge vào main.

Các checkbox trong task lịch sử phía trên không ghi đè yêu cầu thu hẹp phạm vi mới nhất. Ghi nhận kiểm chứng hiện tại nằm tại frontend/README.md.
