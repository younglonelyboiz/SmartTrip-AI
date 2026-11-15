# SmartTripAI — Frontend prototype

React + TypeScript + Vite, FastAPI và GraphHopper cục bộ; có bộ lập lịch heuristic từ yêu cầu, chưa có solver chứng minh tối ưu hay LLM. Giá/giờ tham quan là giả định; planner mới tính lịch từ input, còn ba happy case giữ lịch mẫu. Tuyến ô tô dự kiến tính từ dữ liệu OSM.

Kịch bản mẫu tại `/planner?scenario=standard` gọi backend để xếp hạng gợi ý đơn giản: ưu tiên category khớp chính xác sở thích trong danh mục Đà Nẵng giả lập. Đây không phải mô hình học máy và không tính ngân sách/khoảng cách. Lịch trình được backend trả từ fixture khi request khớp, không tự tối ưu theo gợi ý.

Trang `/planner` nhận **thành phố (Hà Nội, Huế, Đà Nẵng), số ngày 1–14**, ngân sách cho một người và điểm bắt buộc tùy chọn. Không chọn điểm vẫn tạo được gợi ý. Hệ thống đề xuất thêm điểm, tìm thứ tự và chia ngày dựa trên giờ tham quan/chi phí giả định cùng thời gian và khoảng cách GraphHopper thực. Lịch mới không lấy từ fixture.

Mặc định 08:00–22:00, nghỉ 12:00–13:00; phần chỉnh giờ là tùy chọn dùng chung cho toàn chuyến, có thể tắt nghỉ. Ngân sách trống không giới hạn, 0 giới hạn đúng bằng 0; chỉ gồm vé và di chuyển giữa điểm trong ngày, không gồm ăn uống/khách sạn/chặng đến-rời thành phố/từ-về nơi ở. Giá và giờ là **ước tính biên tập chưa xác minh** trong `backend/planning_metadata.json`; di chuyển minh họa 12.000 VND/km, không phải báo giá taxi.

Kết quả có timeline, điểm bắt buộc/được gợi ý, lý do, thời gian chặng, phí và tổng; bản đồ dùng geometry từ cùng kết quả đã kiểm tra. Khi không đủ điều kiện/dữ liệu để phủ số ngày yêu cầu, hiển thị rõ ngày trống. Tìm kiếm heuristic hữu hạn không cam kết tối ưu toàn cục; chưa tìm thấy lịch khác với chứng minh vô nghiệm. Lịch mới chưa có lưu/chia sẻ. Đổi đầu vào sẽ bỏ kết quả cũ.

## Chạy ứng dụng

Cần Python 3.10+ với FastAPI/Uvicorn/httpx theo `backend/requirements.txt`, Java 17 và Node 22.12+ hoặc phiên bản đáp ứng Vite trong lockfile. Không cần Docker. Trên máy hiện tại các phụ thuộc đã có; nếu máy khác thiếu, kiểm tra dung lượng trước khi tải hoặc cài.

Terminal 1, từ thư mục gốc dự án, khởi động GraphHopper với Java cục bộ đã chuẩn bị:

```bash
data/tools/java/usr/lib/jvm/java-17-openjdk-amd64/bin/java -Xmx3g -jar data/tools/downloads/graphhopper-web-10.2.jar server backend/graphhopper-danang.yml
```

Để có tuyến cho Hà Nội và Huế, chạy thêm hai terminal từ thư mục gốc:

```bash
data/tools/java/usr/lib/jvm/java-17-openjdk-amd64/bin/java -Xmx2g -jar data/tools/downloads/graphhopper-web-10.2.jar server backend/graphhopper-hanoi.yml
```

```bash
data/tools/java/usr/lib/jvm/java-17-openjdk-amd64/bin/java -Xmx2g -jar data/tools/downloads/graphhopper-web-10.2.jar server backend/graphhopper-hue.yml
```

Chờ log `Started Server` của từng tiến trình. Máy khác có Java 17 có thể thay đường dẫn Java bằng `java`; các file trong `data/` phải được chuẩn bị riêng, không tự động đi kèm source. Các cấu hình dùng bản trích vùng và chỉ profile `car`. Bản đồ nền vẫn cần mạng.

Terminal 2, từ thư mục gốc dự án:

```bash
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Terminal 3:

```bash
cd frontend
npm run dev
```

Mở URL Vite in ra (mặc định http://127.0.0.1:5173). Vite chuyển `/api/prototype` tới backend cục bộ; nếu backend tắt, planner báo lỗi thay vì âm thầm dùng gợi ý cũ. Nếu `node_modules` chưa có, cần cài theo lockfile sau khi kiểm tra dung lượng. Trang đầu là Khám phá (`/`). Mở `/demo-login` nếu muốn đổi hồ sơ demo; không nhập tài khoản thật. Admin chỉ là chế độ UI. Hosting static cần SPA fallback và proxy API, chưa publish trong đợt này.

Trên trang lịch trình ba thành phố, GraphHopper vẽ tuyến giữa các điểm ghé của ngày và trả quãng đường/thời gian ước tính riêng cho từng chặng khi dịch vụ thành phố tương ứng chạy. Vị trí là tọa độ tham khảo, không bao gồm chặng nơi lưu trú; đồ thị cắt theo vùng có thể không tìm thấy tuyến hoặc bỏ sót đường ngoài vùng. Cấu hình ô tô thử nghiệm chưa bật xử lý hạn chế rẽ (`turn_costs`), không có giao thông trực tiếp; không dùng làm chỉ dẫn lái xe. Thời gian/giá trong timeline và ngân sách vẫn lấy từ fixture, không phải kết quả GraphHopper. Nếu routing lỗi thì bản đồ báo lỗi, không giả đường thẳng thành tuyến thật. Planner mới vẽ các chặng GraphHopper đã dùng để tính timeline và dự toán; geometry không được tính lại ở frontend.

## Build và kiểm tra

```bash
npm run build
npm run check:fixtures
npm run check:services
node --import tsx scripts/check-recommendation.ts
node --import tsx scripts/check-city-happy-cases.ts
node scripts/check-city-happy-cases.mjs
node scripts/check-backend-e2e.mjs
node scripts/check-browser.mjs
```

Từ thư mục gốc, kiểm tra API bằng `python3 -m unittest backend.test_api -v` (cần `httpx` cho kiểm thử). Backend dùng fixture của frontend và không ghi dữ liệu; `/docs` của FastAPI mô tả API prototype. Không phơi backend này ra Internet: chưa có xác thực, database hoặc bảo mật production.

Browser check cần Chromium tương thích Playwright; cài bằng `npx playwright install chromium` hoặc đặt biến `SMARTTRIP_CHROME` tới executable đã có. Ảnh kiểm tra nằm trong test-results (không track); ảnh minh họa README được chụp riêng trong docs/uxui_screenshots.

Từ gốc repo: tạo venv rồi cài `scripts/requirements-checks.txt`, chạy `python scripts/check_docs.py` và `python scripts/check_contract.py`. Các check xác minh tài liệu/fixture, không đo chất lượng solver.

## Kịch bản demo và dữ liệu mẫu

Đà Nẵng dùng `src/mocks/scenarios.json`; Hà Nội và Huế dùng `src/mocks/cityHappyCases.ts`. Chọn thành phố từ trang chủ để mở trực tiếp happy case, xem từng ngày và lưu phiên bản. Dữ liệu giả lập 02/11/2026; ngày đi 10–12/12/2026. Giờ, giá và thời gian di chuyển trong các lịch không phải thông tin thực tế. Luồng demo nhận request fixture Đà Nẵng; planner chính lập lịch mới từ catalog cho cả ba thành phố.

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

Kịch bản mẫu Đà Nẵng cho nhập điểm xuất phát, phương tiện, giờ đến điểm đến ngày đầu, giờ rời điểm đến ngày cuối, thời gian mỗi chặng nối và dự trù đi–về/chặng nối cả nhóm. Giờ đến cộng thời gian nối phải kịp lịch ngày đầu; giờ kết thúc lịch ngày cuối phải kịp chặng về. Prototype kiểm tra fixture, chưa tự xếp lại lịch khi xung đột và chưa tra cứu vận tải/giá thực tế.

Thông tin đi–về được truyền trong URL và lưu riêng theo chuyến/phiên bản khi bấm lưu. Dự toán tại điểm đến đã gồm lưu trú, ăn uống, tham quan và di chuyển giả lập. Chi phí đi–về do người dùng nhập được cộng riêng; để trống nghĩa là chưa biết, không phải miễn phí. Xóa dữ liệu demo cũng xóa thông tin đi–về đã lưu.

Kiểm tra logic hành trình: `node --import tsx scripts/check-journey.ts`.

## Kiểm chứng luồng lập lịch mới — 06/11/2026

- Backend: 31 test đạt (API cũ/mới, ngân sách 0/trống, điểm bắt buộc, giờ/nghỉ, lỗi dữ liệu/tuyến, giới hạn đồng thời và hủy tác vụ khi hết thời gian).
- Browser end-to-end đã chạy qua Vite → FastAPI → GraphHopper thực cho cả Hà Nội, Huế và Đà Nẵng, gồm tự chọn điểm và điểm bắt buộc; đối chiếu timeline, geometry và tổng tiền.
- Kiểm tra UI: giờ tùy chọn, budget 0, xung đột, retry, bỏ response cũ, ngày một điểm/ngày trống, lỗi nền bản đồ và không tràn ngang ở 375/390/1440px.
- Hồi quy demo: standard/comparison/conflict/timeout/unsupported, lưu/reload v1-v2, storage hỏng/reset, admin, keyboard/reduced motion đạt; không có page error. Đã sửa timer zoom Leaflet chạy sau khi gỡ bản đồ lúc chuyển trang.

Build TypeScript/Vite đạt; còn cảnh báo sẵn từ React Router (`use client`) và bundle trên 500 kB. Đây là kiểm chứng chạy phần mềm theo giả định, không xác minh giá/giờ thực tế hoặc chứng minh lịch tối ưu.
