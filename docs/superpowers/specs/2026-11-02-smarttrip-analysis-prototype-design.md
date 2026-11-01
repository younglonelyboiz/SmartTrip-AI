# SmartTrip AI — Thiết kế phạm vi tài liệu và FE prototype

Ngày: 2026-11-02
Trạng thái: Người dùng duyệt phạm vi ngày 2026-11-02. Việc duyệt phạm vi không phải nghiệm thu các đầu ra chưa triển khai.

## 1. Ý định và kết quả cần đạt

Chuyển ý tưởng trong `agent.md` thành bộ tài liệu phân tích–thiết kế toàn hệ thống SmartTrip AI. Kế thừa cách tổ chức của đề tài IT Incident Triage System, viết lại nội dung theo nghiệp vụ du lịch. Optimization Engine là trọng tâm chuyên môn. Frontend prototype dùng dữ liệu mock để minh họa tài liệu, không triển khai backend, AI hoặc thuật toán tối ưu thực tế trong đợt này.

Người dùng mục tiêu là khách du lịch tự túc tại Việt Nam và nhóm đã có sẵn thành viên. Bộ tài liệu phục vụ xây dựng và trình bày đề tài; phải phân biệt thiết kế dự kiến, hành vi prototype và kết quả đã kiểm chứng.

## 2. Những điểm người dùng đã chốt

- Đầu ra gồm bộ tài liệu phân tích–thiết kế và FE prototype.
- Tài liệu quan trọng hơn FE; FE chỉ mock.
- Thiết kế toàn hệ thống, đào sâu Optimization Engine.
- Dùng đề tài cũ làm khung tham khảo và xóa thư mục đó sau khi chuyển phần cần thiết.

## 3. Phương án đã cân nhắc

| Phương án | Đánh đổi | Quyết định |
|---|---|---|
| Thiết kế toàn hệ thống, đào sâu tối ưu | Nhiều tài liệu hơn, nhưng thể hiện được quan hệ giữa dữ liệu, recommendation, agent và optimizer | Người dùng chọn phương án 1 |
| Chỉ thiết kế chuyên sâu Optimization Engine | Gọn hơn, thiếu độ đầy đủ của thiết kế sản phẩm và luồng liên phân hệ | Không chọn |

## 4. Mục tiêu, ngoài phạm vi và điều cần tránh

### Mục tiêu

- Có chuỗi truy vết từ nhu cầu → tính năng → use case/user story → mô hình dữ liệu/API → hành vi FE → nghiệm thu.
- Đặc tả đầu vào, đầu ra, hàm mục tiêu, ràng buộc, tình huống vô nghiệm, giới hạn thời gian giải và phương pháp đánh giá optimizer.
- Phân định trách nhiệm: recommendation xếp hạng ứng viên; optimizer tạo lịch trình khả thi; agent thu thập yêu cầu, gọi công cụ và diễn giải; business logic kiểm tra quyền và vòng đời dữ liệu.
- FE có luồng demo liên tục và kịch bản ngoại lệ dùng fixture nhất quán.

### Ngoài phạm vi đợt này

- Backend, database chạy thật, solver, LLM, huấn luyện recommendation, truy vấn nguồn dữ liệu trực tiếp, triển khai hạ tầng.
- Đặt dịch vụ, thanh toán, ghép bạn đồng hành, cam kết giá thời gian thực.
- Benchmark thực nghiệm hoặc tuyên bố thuật toán đã hiệu quả khi chưa chạy thử.

### Điều cần tránh

- Thay tên đề tài cũ nhưng giữ nguyên nghiệp vụ ticket, ITIL, SLA hoặc role IT Support.
- Gọi kết quả mock là tối ưu đã tính toán, gọi trạng thái demo là xác thực an toàn.
- Dùng phép tính của LLM làm nguồn thời gian, khoảng cách hoặc chi phí.
- Đánh dấu tài liệu mới là approved/validated khi chưa được duyệt.

## 5. Phạm vi sản phẩm được mô tả

Thiết kế gồm tài khoản và sở thích, danh mục địa điểm, gợi ý cá nhân hóa, tiếp nhận yêu cầu tự nhiên, lập và điều chỉnh lịch trình, dự toán chi phí có nguồn, bản đồ, lưu/chia sẻ chuyến đi và quản trị dữ liệu. Quyền truy cập dự kiến: khách xem nội dung công khai, traveler quản lý chuyến đi của mình, admin quản lý danh mục/nguồn dữ liệu và theo dõi hệ thống. Các tính năng mở rộng như cộng tác nhóm và collaborative filtering được phân kỳ, không mặc định nằm trong MVP.

Các lựa chọn dưới đây do người viết đề xuất để bộ tài liệu có phạm vi cụ thể, chưa phải yêu cầu đã được người dùng xác nhận:

- MVP thiết kế cho một điểm đến là Đà Nẵng; bộ fixture chuyến đi 3 ngày 2 đêm. Mở rộng qua dữ liệu, không hard-code thành giới hạn nghiệp vụ toàn hệ thống.
- Một chuyến đi trong một thành phố, một điểm lưu trú làm điểm đầu/cuối mỗi ngày; chưa tối ưu liên tỉnh hoặc phối hợp nhiều phương tiện phức tạp.
- Thời gian theo Asia/Ho_Chi_Minh, tiền VND; ngân sách đầu vào là tổng cho nhóm, có số người và phân biệt khoản theo người/theo nhóm.
- Giá lưu trú và chi phí cố định được trừ khỏi ngân sách trước khi chọn hoạt động; không tối ưu chọn khách sạn trong MVP.

## 6. Chiều sâu Optimization Engine

Tài liệu chuyên sâu cần mô tả bài toán chọn tập địa điểm và thứ tự ghé qua nhiều ngày, với khung giờ hoạt động và giới hạn ngân sách. Không đồng nhất bài toán này với TSP chỉ tìm thứ tự đi qua tất cả điểm.

### Hợp đồng dữ liệu

Đầu vào có phiên bản: ngày đi, số người, khung giờ mỗi ngày, điểm lưu trú, địa điểm ứng viên, điểm phù hợp, thời lượng tham quan, cửa sổ mở cửa theo ngày, ma trận thời gian/khoảng cách, chi phí, điểm bắt buộc/loại trừ và sở thích. Mỗi dữ kiện có loại nguồn và thời điểm ghi nhận; giá ghi rõ observed/estimated/simulated, đơn vị và cơ sở tính.

Đầu ra có phiên bản: lịch từng ngày, thời gian đến/rời/chờ/di chuyển, khoản chi, tổng hợp theo nhóm và mỗi người, địa điểm bị bỏ và lý do, kiểm tra ràng buộc, trạng thái giải, phiên bản dữ liệu và cấu hình. Mọi kết quả phải dùng cùng snapshot dữ liệu để có thể so sánh.

### Mô hình dự kiến

- Biến chọn điểm, phân ngày, cung di chuyển và thời gian đến; đảm bảo liên thông và loại chu trình con.
- Ràng buộc cứng: không trùng điểm, không xung đột bắt buộc/loại trừ, đúng giờ hoạt động, đủ thời lượng ghé, bao gồm thời gian đi/chờ/quay về, không vượt ngân sách và khung giờ ngày.
- Sở thích mềm: tăng độ phù hợp, đa dạng hoạt động và giảm di chuyển. Hàm mục tiêu phải mô tả chuẩn hóa, trọng số và cách xử lý hòa điểm để tái lập.
- Không tự bỏ ràng buộc cứng để tạo kết quả trông hợp lệ. Khi không thể đáp ứng, trả nguyên nhân được kiểm chứng hoặc cảnh báo chưa xác định; người dùng chủ động chấp thuận thay đổi.
- Phân biệt feasible, optimal nếu có chứng cứ từ solver, infeasible đã chứng minh, timeout có nghiệm, timeout chưa có nghiệm và lỗi dữ liệu. Chưa tìm được nghiệm không đồng nghĩa vô nghiệm.

### Thuật toán và đánh giá

Đề xuất so sánh một baseline greedy có kiểm tra tính khả thi với một hướng giải có ràng buộc như CP-SAT. Đây là phương án nghiên cứu cho triển khai sau, không phải cam kết công nghệ hoặc hiệu năng đã kiểm chứng. Khi viết đặc tả kỹ thuật cần kiểm tra tài liệu chính thức và nêu lý do chọn mô hình phù hợp.

Kế hoạch đánh giá phải dùng cùng dữ liệu, ràng buộc, ngân sách thời gian tính và cấu hình cho các phương pháp; có bộ kiểm tra tính khả thi độc lập. Đo tỷ lệ khả thi, giá trị mục tiêu, tổng thời gian di chuyển, chi phí, độ phù hợp và thời gian giải. Bộ ca gồm dữ liệu hợp lệ, thiếu ma trận, địa điểm đóng cửa, điểm bắt buộc xung đột, ngân sách thấp, timeout và replanning có điểm đã khóa. Không điền kết quả đo giả.

## 7. Danh mục tài liệu bàn giao

| Đường dẫn dự kiến | Nội dung |
|---|---|
| `README.md` | Tổng quan, mục lục tài liệu, cách chạy FE và giới hạn mock |
| `docs/01-SCOPE.md` | Pain point, mục tiêu, MVP, phân kỳ, ngoài phạm vi và giả định |
| `docs/02-FEATURES.md` | Functional mind map bằng Mermaid, feature matrix, độ ưu tiên |
| `docs/03-USE_CASES.md` | Actors, quyền, luồng chính/ngoại lệ và business rules |
| `docs/INVEST_REQUIREMENTS.md` | Stories có acceptance criteria và kiểm tra INVEST |
| `docs/04-INFORMATION_ARCHITECTURE.md` | Sitemap, quyền truy cập, vòng đời chuyến đi và phiên bản kế hoạch |
| `docs/05-UX_UI_DESIGN.md` | Đặc tả FE, trạng thái, tương tác và ranh giới mock |
| `docs/architecture/c4/` | Context, Container, Component và ánh xạ code/module dự kiến; phân biệt target và prototype |
| `docs/architecture/DATABASE_DESIGN.md` | ERD, bảng, khóa, versioning, nguồn giá và snapshot |
| `docs/architecture/OPENAPI_SPECIFICATION.md` | Hợp đồng API dự kiến, schema, quyền và lỗi |
| `docs/api/openapi.yaml` | Hợp đồng máy đọc được, nhất quán với tài liệu API |
| `docs/optimization/OPTIMIZATION_ENGINE.md` | Mô hình toán, đơn vị, giả định, thuật toán, trạng thái giải và replanning |
| `docs/data/DATA_STRATEGY.md` | Nhu cầu dữ liệu, nguồn ứng viên, quyền sử dụng, chất lượng và fallback |
| `docs/evaluation/EVALUATION_PLAN.md` | Baseline, tập ca, metric, cách đo và giới hạn |
| `docs/TRACEABILITY.md` | Ánh xạ yêu cầu–story–use case–API–FE–nghiệm thu |
| `docs/DEMO_SCENARIOS.md` | Kịch bản demo và fixture tương ứng |

Tài liệu viết bằng tiếng Việt, identifier/schema dùng tiếng Anh. Dùng `architecture` thay cho lỗi chính tả `architechture` ở khung cũ. Nguồn ứng viên chưa khảo sát phải được đánh dấu chưa xác minh; không mặc định có API key, giấy phép hoặc dữ liệu đầy đủ.

## 8. Ranh giới FE prototype

Đề xuất React + TypeScript + Vite, tiếp nối stack khung cũ; mã ở `frontend/` tại gốc. Tách typed fixture và mock service khỏi component để sau này thay bằng API. Không sao chép luồng nghiệp vụ IT.

Các năng lực cần minh họa: chọn hồ sơ demo, nhập yêu cầu chuyến đi, xem điểm ứng viên, xem lịch theo ngày và dự toán, xem so sánh baseline/phương án, xem cảnh báo ràng buộc, chọn tình huống thay đổi để xem bản kế hoạch mock tiếp theo, lưu và mở lại chuyến đi trong localStorage; quản trị chỉ minh họa danh mục và nguồn dữ liệu.

Mọi kịch bản hiển thị nhãn dữ liệu mô phỏng. Thao tác thay đổi chỉ trả fixture được định nghĩa; tổ hợp không hỗ trợ phải thông báo giới hạn thay vì đưa kết quả không liên quan. So sánh phải kiểm tra được tổng từ các khoản thành phần nhưng không được diễn giải là benchmark thực. Bản đồ có thể dùng sơ đồ tuyến mô phỏng, không cần dịch vụ bản đồ hoặc routing bên ngoài.

Thiết kế hình thức và bố cục chi tiết còn để bước UI giải quyết sau khi chốt phạm vi; ưu tiên thông tin lịch trình, chi phí và giải thích ràng buộc. Không cần tạo ảnh AI hoặc phát triển landing page marketing trong đợt này.

## 9. Tiêu chí nghiệm thu và kiểm chứng

- Mỗi tài liệu trong danh mục có nội dung đặc thù SmartTrip, liên kết nội bộ hợp lệ; không giữ tên/role/trạng thái nghiệp vụ IT cũ.
- ERD, schema API và khái niệm trong optimizer thống nhất ID, đơn vị, phiên bản và ownership.
- OpenAPI parse được và được kiểm tra bằng validator phù hợp; Mermaid được kiểm tra cú pháp khi có công cụ hỗ trợ.
- Ví dụ lịch trình và chi phí được tính lại từ fixture, kiểm tra giờ hoạt động, thời gian chuyển tiếp và giới hạn ngày; kết quả mock không phải bằng chứng hiệu quả thuật toán.
- FE build thành công; kiểm tra luồng demo chính, một luồng không khả thi và một luồng điều chỉnh, lưu/mở lại; các nút có hành vi rõ, không có lỗi console nghiêm trọng.
- Kiểm tra FE bằng bàn phím, label/focus, hiển thị ở desktop và viewport hẹp; không tuyên bố mức tuân thủ accessibility khi chưa đo.
- README chỉ rõ phần đã chạy, phần mock và thiết kế dành cho giai đoạn sau.

## 10. Chuyển đổi và dọn đề tài cũ

Đọc và chuyển các cấu trúc cần thiết trước, xây tài liệu và FE mới ở gốc. Không xóa `agent.md` hoặc `mindmap.png` gốc; ảnh mindmap hiện có chưa được coi là đã phù hợp nội dung SmartTrip.

Thư mục `IT-Incident-Triage-System/` hiện chưa được Git theo dõi. Trước khi xóa theo yêu cầu, tạo bản sao lưu ở `/tmp` và ghi vị trí trong báo cáo bàn giao; bản sao này chỉ tạm thời. Chỉ xóa sau khi đầu ra mới đã được kiểm tra đầy đủ và các tham chiếu sang thư mục cũ đã được thay thế. Không đưa bước xóa lên trước việc kế thừa tài liệu.

## 11. Những lựa chọn giao cho người thực hiện

Người thực hiện có thể quyết định bố cục và token giao diện, fixture cụ thể, tên module, công cụ kiểm tra, cách chia task và chi tiết thuật toán đề xuất dựa trên nghiên cứu. Không được tự mở rộng sang backend thật hoặc công bố hiệu năng chưa đo. Các giả định ở mục 5 và stack ở mục 8 là đề xuất của người viết để người dùng kiểm tra khi duyệt thiết kế.

Sau khi bản thiết kế được duyệt, lập kế hoạch triển khai trước khi viết tài liệu chi tiết và FE.

## Điều chỉnh theo yêu cầu mới nhất ngày 2026-11-02

Người dùng yêu cầu README theo đúng đề tài cũ và chỉ làm các phần đề tài cũ đã làm. Vì vậy đầu ra sản phẩm giới hạn ở Scope, Features, Use Cases, INVEST, Information Architecture, UI/UX, C4, Database, API và FE prototype. Không bàn giao bộ tài liệu Data Strategy, Evaluation, Traceability, Demo Scenarios hoặc Delivery Checks riêng: nguồn dữ liệu đưa vào Scope, mô hình optimizer vào Component, truy vết vào INVEST, demo/checks vào frontend/README.md. Các đường dẫn trong kế hoạch phía trên là lịch sử trước điều chỉnh, không phải danh mục phải tạo thêm.
