# SmartTripAI — Frontend prototype

React + TypeScript + Vite; chưa có backend, solver, LLM hoặc API dữ liệu thật. Mọi giá, giờ và tuyến đều giả lập.

## Chạy ứng dụng

Cần Node 22.12+ hoặc phiên bản đáp ứng Vite trong lockfile (môi trường kiểm tra Node 26.8.1).

```bash
cd frontend
npm ci
npm run dev
```

Mở URL Vite in ra (mặc định http://127.0.0.1:5173). Trang đầu là Khám phá (`/`). Mở `/demo-login` nếu muốn đổi hồ sơ demo; không nhập tài khoản thật. Admin chỉ là chế độ UI. Hosting static cần SPA fallback cho deep link, chưa publish trong đợt này.

## Build và kiểm tra

```bash
npm run build
npm run check:fixtures
npm run check:services
node scripts/check-browser.mjs
```

Browser check cần Chromium tương thích Playwright; cài bằng `npx playwright install chromium` hoặc đặt biến `SMARTTRIP_CHROME` tới executable đã có. Ảnh kiểm tra nằm trong test-results (không track); ảnh minh họa README được chụp riêng trong docs/uxui_screenshots.

Từ gốc repo: tạo venv rồi cài `scripts/requirements-checks.txt`, chạy `python scripts/check_docs.py` và `python scripts/check_contract.py`. Các check xác minh tài liệu/fixture, không đo chất lượng solver.

## Kịch bản demo và dữ liệu mẫu

Nguồn duy nhất: `src/mocks/scenarios.json`. Thời điểm ghi dữ liệu mock 02/11/2026; ngày đi 10–12/12/2026. Các giờ/giá không phải thông tin du lịch thực tế.

## Request chuẩn
Đà Nẵng, 2 người, tổng ngân sách 6.000.000 VND, 08:00–18:00 mỗi ngày, depot `hotel`, thích biển/ẩm thực, bắt buộc `my-khe`, không loại trừ, không lockedVisits. Fixed cost: lưu trú 2 đêm tổng 1.000.000 theo nhóm và ăn uống 3 ngày tổng 300.000 mỗi người. Snapshot `danang-demo-v1`.

| Scenario ID | Input khác request chuẩn | Kỳ vọng |
|---|---|---|
| standard | Không | FEASIBLE, 3 ngày, có baseline và proposed cùng request/snapshot |
| budget-conflict | budgetVnd=1.000.000 | INFEASIBLE: fixed cost 1.600.000 đã vượt B, plan=null |
| replan | excludedPlaceIds=[son-tra]; lockedVisits=[my-khe,2026-12-10,500] | FEASIBLE, version v2 có parent v1, giữ Mỹ Khê 08:20 ngày đầu |
| timeout | budgetVnd=5.000.000 | TIMEOUT_NO_SOLUTION, plan=null; chỉ mô phỏng trạng thái |

Ngày 1 proposed mẫu: 08:00 xuất phát; Mỹ Khê 08:20–09:20; Chợ Hàn 09:35–10:20; 10:40 về hotel. Các ngày khác đọc trực tiếp fixture để tránh nhân bản nguồn dữ liệu. Tổng hiển thị được checker cộng lại từ cost items, không nhập một số KPI rời.

## Demo chính
1. Mở Khám phá → chọn tỉnh/thành để xem lộ trình, hoặc mở Lập kế hoạch → standard.
2. Nhập điểm đi và chặng đi–về, xem yêu cầu và điểm ứng viên; bấm xem kết quả mock.
3. Xem toàn hành trình nếu đã nhập thông tin đi–về; chuyển ngày, đọc lịch và dự toán tại điểm đến, xem constraint report và nguồn simulated.
4. So sánh baseline/proposed; giải thích đây chỉ là hai lịch mẫu cùng dữ liệu.
5. Lưu v1, reload và mở lại từ danh sách.

## Ngoại lệ và replanning
- Chọn budget-conflict: đọc chứng cứ fixed cost>B, không xuất lịch vi phạm.
- Chọn replan: loại Sơn Trà, khóa Mỹ Khê; lưu v2 rồi mở lại cả v1/v2. v1 không bị ghi đè.
- Chọn timeout: đọc “chưa tìm được nghiệm”, không kết luận không thể lập lịch.
- Sửa ngân sách thành 5.123.456 hoặc đổi ngày ngoài mẫu: unsupported, hướng chọn lại scenario; không trả lịch standard.
- Lưu trữ hỏng: báo lỗi và nút reset demo; không xóa localStorage ngoài namespace.
- Chọn admin: xem danh mục/nguồn mock, không cập nhật dữ liệu thật.


## Ghi nhận kiểm chứng

Kiểm tra ngày 02/11/2026, Node 26.8.1:

| Kiểm tra | Kết quả |
|---|---|
| TypeScript + Vite build | Pass; có cảnh báo React Router bỏ qua directive use client trong SPA |
| Fixture checker | Pass 4 scenario, baseline, tiền/giờ/cửa sổ/lượt về/locked prefix; bắt được 2 negative controls |
| Mock service/storage | Pass matching, unsupported, v1/v2, dữ liệu hỏng/schema cũ, quota và reset riêng namespace |
| OpenAPI 3.1 + JSON schema | Pass 16 paths và cả 4 fixture |
| Link tài liệu | Pass các đường dẫn local, gồm 6 ảnh README |
| Mermaid | Parse thành công 13 sơ đồ Mermaid trong Chromium; mind map dùng ảnh người dùng cung cấp |
| Trình duyệt | Pass demo chính, so sánh, conflict, timeout, unsupported, reload v1/v2, admin, not-found |
| Responsive/keyboard | Không tràn ngang tại 390px ở các route được kiểm tra; skip link và reduced motion được kiểm tra, không phải audit WCAG đầy đủ |
| Ảnh UI/UX | 3 ảnh chụp UI hiện tại (03/11/2026): khám phá, lập kế hoạch, lịch trình/bản đồ tại docs/uxui_screenshots |

Kiểm tra browser dùng Chromium có sẵn và server localhost. Snapshot/fixture check không phải solver benchmark. Reviewer đã rà và các lỗi quan trọng về khóa prefix, provenance từng dữ kiện và metadata result đã được sửa.

Trạng thái commit/nhánh được theo dõi trong lịch sử Git. Prototype chưa được deploy.

## Dọn khung đề tài cũ

Thư mục đề tài cũ đã được sao lưu, đối chiếu nội dung từng file và symlink trước khi xóa. Bản sao tạm: `/tmp/IT-Incident-Triage-System-backup-20261102-bdc2d628.tar`. `/tmp` không phải nơi lưu trữ lâu dài. `agent.md` và `mindmap.png` gốc vẫn được giữ.

## Cập nhật thiết kế giao diện

Theo yêu cầu người dùng: tông xanh dương nhẹ + trắng, ảnh địa điểm cục bộ, bố cục form/ứng viên và timeline/dự toán được nhóm rõ. Nguồn và giấy phép ảnh trong docs/05-UX_UI_DESIGN.md và footer FE; `mindmap.png` là sơ đồ tư duy chính ở README/Features.


### Điểm đi và chặng đi–về

Planner cho nhập điểm xuất phát, phương tiện, giờ đến điểm đến ngày đầu, giờ rời điểm đến ngày cuối, thời gian mỗi chặng nối và dự trù đi–về/chặng nối cả nhóm. Giờ đến cộng thời gian nối phải kịp lịch ngày đầu; giờ kết thúc lịch ngày cuối phải kịp chặng về. Prototype kiểm tra fixture, chưa tự xếp lại lịch khi xung đột và chưa tra cứu vận tải/giá thực tế.

Thông tin đi–về được truyền trong URL và lưu riêng theo chuyến/phiên bản khi bấm lưu. Dự toán tại điểm đến đã gồm lưu trú, ăn uống, tham quan và di chuyển giả lập. Chi phí đi–về do người dùng nhập được cộng riêng; để trống nghĩa là chưa biết, không phải miễn phí. Xóa dữ liệu demo cũng xóa thông tin đi–về đã lưu.

Kiểm tra logic hành trình: `node --import tsx scripts/check-journey.ts`.
