# 01 — Phạm vi SmartTrip AI

Trạng thái: thiết kế đề xuất theo phạm vi đã duyệt, chưa phải hệ thống production.

## Bối cảnh và vấn đề
Người du lịch tự túc phải ghép thông tin điểm đến, giờ mở cửa, chi phí và quãng đường từ nhiều nơi. Danh sách địa điểm hấp dẫn chưa đủ tạo lịch trình: thứ tự ghé, thời lượng, giờ đóng cửa và ngân sách có thể xung đột. SmartTrip hướng đến lịch trình có cấu trúc, có thể kiểm tra tính khả thi và điều chỉnh theo yêu cầu.

## Người dùng và giá trị
- Traveler: lập, kiểm tra, lưu và điều chỉnh chuyến đi cá nhân hoặc nhóm có sẵn.
- Guest: xem danh mục công khai, chưa có quyền lưu chuyến đi riêng.
- Admin: quản trị địa điểm, chất lượng nguồn và theo dõi các lần lập kế hoạch.

Không ghép người lạ. Nhóm dùng một chủ chuyến đi trong MVP; cùng chỉnh sửa và bỏ phiếu dành cho phiên bản sau.

## Ba thành phần và ranh giới trách nhiệm
Recommendation cung cấp điểm phù hợp và danh sách ứng viên. Optimization Engine chọn điểm/phân ngày/xếp tuyến và kiểm tra ngân sách, thời gian. AI Agent trích xuất yêu cầu, hỏi lại dữ kiện thiếu, gọi công cụ và diễn giải. Backend thông thường quản lý quyền, lưu trữ, kiểm tra dữ liệu; LLM không tự tính tuyến, tiền hoặc xác nhận tính khả thi.

## MVP thiết kế
Một thành phố Đà Nẵng; nhiều ngày với một điểm lưu trú cố định làm điểm đầu/cuối ngày. Có sở thích, ngân sách tổng nhóm, ứng viên, điểm bắt buộc/loại trừ, cửa sổ hoạt động, ma trận di chuyển, kế hoạch và phiên bản điều chỉnh. Lưu trú/chi phí cố định được nhập trước, không tối ưu chọn khách sạn. Kết quả có nguồn dữ liệu, trạng thái giải và báo cáo ràng buộc.

Fixture minh họa: 2 người, 3 ngày 2 đêm, 10–12/12/2026, ngân sách tổng 6.000.000 VND; 08:00–18:00 mỗi ngày. Toàn bộ thông số giá/giờ/di chuyển là simulated. Không cam kết giá hoặc hoạt động thực tế của các địa danh.

## Đầu ra đợt này
Bộ tài liệu nghiệp vụ/kiến trúc/API/mô hình tối ưu/đánh giá và FE mock chạy độc lập. Backend, database, solver và agent chỉ được thiết kế, không được mô tả là đã triển khai. FE không phải bằng chứng chất lượng thuật toán.

## Không làm và phân kỳ
| Giai đoạn | Phạm vi |
|---|---|
| Hiện tại | Tài liệu toàn hệ thống + FE fixture |
| MVP triển khai sau | Auth thật, dữ liệu đã xác minh, recommendation content-based, baseline, solver, agent orchestration |
| Sau MVP | Nhiều thành phố, nhóm cộng tác, hybrid recommendation khi đủ tương tác, mô phỏng lịch sử nếu đủ snapshot |
| Ngoài đề tài hiện tại | Booking, thanh toán, ghép người lạ, cam kết giá realtime |

## Thành công và rủi ro
Thành công là truy vết được yêu cầu đến hợp đồng và demo, mô hình toán đủ để lập trình, dữ liệu ví dụ tự nhất quán. Chất lượng solver chưa được chứng minh: phải đo theo các ca kiểm tra tính khả thi trong đặc tả module Optimization Engine. Rủi ro chính là thiếu giờ hoạt động/giá và ma trận tin cậy; dữ liệu thiếu phải trả lỗi hoặc đánh dấu ước tính theo chính sách, không ngầm thay bằng số do LLM sinh.

Tham chiếu: [Features](02-FEATURES.md), [Use cases](03-USE_CASES.md), [mô tả nguồn dữ liệu bên dưới](#nguồn-dữ-liệu-dự-kiến).

## Nguồn dữ liệu dự kiến

### Trạng thái nguồn (kiểm tra 02/11/2026)
| Nguồn | Điều biết được | Điều chưa xác minh/không dùng hiện tại |
|---|---|---|
| OpenStreetMap | Dữ liệu mở ODbL, cần attribution; tài liệu chính thức có chính sách riêng cho tile | Chưa khảo sát độ phủ giờ mở cửa/tuyến tại Đà Nẵng; không có cam kết đủ giá |
| Cổng/đơn vị du lịch Việt Nam | Ứng viên để khảo sát điểm đến | Chưa chọn dataset, giấy phép và API; không scrape mặc định |
| ViHoRec | Tên nguồn nghiên cứu được gợi ý trong agent.md | Chưa xác minh quyền tải, schema, phạm vi và quyền tái sử dụng; không phụ thuộc MVP |
| Routing/giá thương mại | Có thể dùng adapter khi được cấp quyền | Chưa có nhà cung cấp, key hoặc hợp đồng |
| Fixture repo | Dữ liệu tự dựng phục vụ demo | Không phải dữ liệu quan sát được, không phải giá hiện hành |

Tham khảo chính thức: [OSM copyright](https://www.openstreetmap.org/copyright), [tile policy](https://operations.osmfoundation.org/policies/tiles/). Giấy phép dữ liệu không đồng nghĩa được dùng tile server không giới hạn. FE hiện tại dùng SVG sơ đồ tự vẽ, không gọi tile server.

## Các loại dữ liệu
Place có ID, tọa độ nếu đã xác minh, category, thời lượng dự kiến, nguồn và recordedAt. Opening window theo ngày gồm openMinute/closeMinute, đóng cả ngày có biểu diễn riêng. Travel matrix có directed pair, travelMinutes, distanceKm, phương tiện, ngày áp dụng và nguồn. Tất cả cạnh dùng trong plan phải có dữ liệu; không coi null là 0.

Price record: id, sourceId, kind observed/estimated/simulated, recordedAt, validFrom/validTo, serviceDate, currency=VND, amountVnd, basis per_person/per_group, điều kiện áp dụng và phương pháp ước tính nếu kind=estimated. Observed không có nghĩa còn đặt được; simulated dùng demo/test. Mọi lần hiển thị có badge loại giá.

Snapshot có ID bất biến, inputHash, createdAt, tập dữ kiện và configVersion; cập nhật nguồn tạo snapshot mới, không sửa snapshot đã dùng. Plan lưu snapshotId và request. Người dùng được báo khi dữ liệu thiếu/cũ; độ cũ tối đa phải là policy theo loại nguồn trước triển khai thật, không hard-code một ngưỡng chung vô căn cứ.

## Pipeline dự kiến
Khảo sát quyền truy cập → ingest dữ liệu được phép → normalize ID/đơn vị/timezone → validate → kiểm tra thiếu/ngoại lệ → tạo snapshot → phục vụ recommendation/optimizer. Bản ghi bị lỗi đi quarantine kèm diagnostic. Admin xem báo cáo coverage trước publish; nguồn không đủ tin cậy không âm thầm đưa vào solver.

## Fallback và an toàn dữ liệu
- Không có giá: yêu cầu người dùng nhập estimate có nhãn hoặc từ chối lập lịch theo ngân sách, không tự bịa giá.
- Không có ma trận/giờ hoạt động: DATA_ERROR cho target MVP; có thể loại điểm tùy chọn nếu policy và giải thích rõ, không loại mandatory ngầm.
- Không có lịch sử tương tác: content-based; không khẳng định collaborative filtering hiệu quả khi dữ liệu chưa đủ.
- Lưu tối thiểu thông tin sở thích/chuyến đi, kiểm tra ownership; không đưa nội dung chuyến riêng vào dashboard admin mặc định.
- Lịch sử mô phỏng chỉ dùng dữ liệu có recordedAt <= asOf, snapshot không chứa bản ghi đến sau; chưa triển khai vì chưa có nguồn lịch sử đầy đủ.

## Fixture hiện tại
`frontend/src/mocks/scenarios.json` là nguồn duy nhất của dữ liệu FE. Cả giá, thời gian đi và giờ hoạt động đều simulated, không tải nguồn ngoài. Tên địa danh có mục đích minh họa; thông số không được dùng như thông tin dịch vụ thực tế. So sánh baseline/proposed dùng cùng request/snapshot; fixture replan tạo request/version con riêng.
