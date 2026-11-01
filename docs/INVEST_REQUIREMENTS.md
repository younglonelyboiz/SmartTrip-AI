# User stories và kiểm tra INVEST

Mỗi story có giá trị đầu cuối, phụ thuộc tối thiểu rõ; chi tiết triển khai có thể thương lượng. Các tiêu chí AC là điều kiện nghiệm thu dự kiến, không phải kết quả kiểm thử đã chạy.

| Story | Người dùng và giá trị | Phụ thuộc | Acceptance criteria |
|---|---|---|---|
| US-01 | Traveler chọn/lưu sở thích để giảm nhập lại | Không | AC-01: hồ sơ có sở thích; không thay lịch đã lưu; demo ghi rõ không auth |
| US-02 | Guest xem địa điểm để chọn ứng viên | Không | AC-02: có nguồn, loại giá và thời lượng; empty khi không có kết quả |
| US-03 | Traveler xác nhận ràng buộc chuyến đi | US-02 | AC-03: ngày hợp lệ, nhóm >0, tiền nguyên, không giao bắt buộc/loại trừ; fixture ngoài phạm vi báo unsupported |
| US-04 | Traveler nhận lịch nhiều ngày khả thi | US-03 | AC-04: validator kiểm tra giờ, travel, return, tiền và mandatory; response có snapshot/status |
| US-05 | Traveler hiểu khi không tạo được lịch | US-03 | AC-05: conflict có lý do; timeout chưa có nghiệm không hiển thị là vô nghiệm |
| US-06 | Traveler kiểm tra dự toán và so sánh | US-04 | AC-06: cộng đúng theo basis, baseline/proposed cùng request/snapshot; mock ghi rõ |
| US-07 | Traveler thay đổi kế hoạch mà giữ phần đã chốt | US-04 | AC-07: version mới có parent, phần locked không thay đổi, version cũ giữ nguyên |
| US-08 | Traveler lưu/mở lại phiên bản | US-04 | AC-08: reload đọc lại đủ phiên bản; storage hỏng/quota báo lỗi và reset riêng demo |
| US-09 | Admin kiểm tra danh mục và nguồn | US-02 | AC-09: mock chỉ xem; target chỉ admin được cập nhật, snapshot cũ bất biến |
| US-10 | Chủ chia sẻ chỉ đọc và nhận phản hồi | US-08 | AC-10: expiry/revoke/ownership được đặc tả; chỉ target, không FE |

## Kiểm tra INVEST
| Tiêu chí | Cách áp dụng |
|---|---|
| Independent | Các story đọc danh mục/hồ sơ độc lập; phụ thuộc nghiệp vụ đã liệt kê, mock service tách UI |
| Negotiable | Bố cục và thuật toán có thể thay, hard constraints/đơn vị không thương lượng ngầm |
| Valuable | Mỗi story cho giá trị traveler/admin rõ, không chỉ là task kỹ thuật |
| Estimable | Request/output, lỗi, trạng thái và AC đã xác định; nguồn thật vẫn là rủi ro triển khai sau |
| Small | US-04 khi triển khai thật tách thành baseline khả thi rồi solver, cùng contract; không gộp agent/training |
| Testable | Mỗi AC nối scenario/API/checker trong bảng truy vết bên dưới; không dùng kết quả kỳ vọng làm kết quả đo |

Ưu tiên hiện tại US-02–08; US-01/09 minh họa tối thiểu; US-10 chỉ thiết kế. Mở rộng chưa đưa vào backlog sẵn sàng: cộng tác nhóm, hybrid recommendation và liên tỉnh cần discovery riêng.

## Truy vết yêu cầu trong backlog

| Feature | Story / AC | Use case / Business rule | API operationId target | FE / scenario / kiểm tra |
|---|---|---|---|---|
| F-01 | US-01 / AC-01 | UC-01, BR-08 | getProfile, updateProfile, login | /demo-login; hồ sơ demo, target auth chưa làm |
| F-02 | US-02 / AC-02 | UC-02, BR-05/06 | listPlaces | /planner, /admin; schema snapshot và provenance |
| F-03 | US-02 / AC-02 | UC-02 | listPlaces | Điểm phù hợp fixture; recommendation thật chỉ thiết kế |
| F-04 | US-03 / AC-03 | UC-03, BR-01/09 | createOptimizationRun | /planner; check:services matching/unsupported; browser form |
| F-05 | US-04 / AC-04 | UC-04, BR-02/03 | createOptimizationRun, getOptimizationRun | standard; check:fixtures; solver thật chỉ thiết kế |
| F-06 | US-06 / AC-06 | UC-05, BR-01/05/10 | getVersion | /trips/:tripId/versions/:versionId; cost checker theo người/nhóm |
| F-07 | US-05 / AC-05 | UC-04, BR-06/07 | getOptimizationRun | budget-conflict, timeout; schema plan=null, browser message |
| F-08 | US-07 / AC-07 | UC-06, BR-04 | createOptimizationRun, listVersions | replan; parent/locked checker, browser v1/v2 |
| F-08 | US-08 / AC-08 | UC-07, BR-04/08 | listVersions, getVersion | /trips; check:services storage, reload browser |
| F-09 | US-06 / AC-06 | UC-05, BR-10 | getVersion | /compare/standard; sameRequest/snapshot guard, fixture checker |
| F-10 | US-09 / AC-09 | UC-08, BR-05/08 | listSources, createSource, updatePlace, publishSnapshot | /admin chỉ xem; quyền target chỉ đặc tả |
| F-11 | US-10 / AC-10 | UC-09, BR-08 | createShare, revokeShare, getSharedVersion, createFeedback | Chỉ thiết kế, không FE demo |
| F-12 | Sau MVP | Không áp MVP | Chưa đặc tả | Ngoài phạm vi hiện tại |
