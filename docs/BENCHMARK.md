# Benchmark offline cho thuật toán lập lịch

## Cơ sở nghiên cứu

Bài toán gần nhất trong nghiên cứu là **Team Orienteering Problem with Time Windows (TOPTW)**: chọn các điểm có điểm thưởng, thời lượng tham quan và khung giờ, rồi xếp nhiều tuyến trong giới hạn thời gian. [Vansteenwegen và cộng sự (2009)](https://www.sciencedirect.com/science/article/pii/S030505480900080X) nghiên cứu cách tìm lịch đủ nhanh để điều chỉnh chuyến tham quan; [Gedik và cộng sự (2017)](https://www.sciencedirect.com/science/article/pii/S0360835217301134) báo cáo cả chất lượng nghiệm lẫn số nghiệm tối ưu đã chứng minh trên tập benchmark chuẩn. Biến thể có **điểm bắt buộc** được nghiên cứu riêng trong [Kirac và cộng sự (2023)](https://www.inderscience.com/info/inarticle.php?artid=128542).

Từ các công trình đó, benchmark này đo riêng **tỷ lệ tìm được lịch, tính hợp lệ, điểm mục tiêu và thời gian chạy**; so sánh điểm chỉ trên các ca mà cả hai thuật toán có lịch. Đây là cách áp dụng phương pháp đánh giá, **không phải** tái hiện kết quả hay tập dữ liệu của các bài báo. TOPTW chuẩn thường có điểm xuất phát/kết thúc và ma trận đi lại đã biết; prototype hiện chưa mô hình hóa chặng từ/về khách sạn. Vì vậy kết quả không được gọi là kết quả TOPTW chuẩn và không so trực tiếp với các bảng điểm trong bài báo.

Chạy từ thư mục gốc:

```bash
python -m backend.benchmark --output benchmark-results.json
python -m unittest backend.test_benchmark -v
```

Lệnh đầu ghi kết quả từng ca và bảng tổng hợp vào JSON. Có thể đổi đường dẫn bằng `--output`. Không cần GraphHopper hoặc kết nối mạng.

## Thiết kế

- 36 ca cố định cho Đà Nẵng: 1/2/3 ngày × ngân sách 0/50.000/150.000/không giới hạn VND × 0/1/2 điểm bắt buộc. Cùng một catalog, yêu cầu và ma trận cho cả hai thuật toán.
- **Greedy:** xét điểm bắt buộc trước, sau đó theo mức ưu tiên; xếp vào ngày đầu tiên còn chỗ mà vẫn thỏa giờ, nghỉ trưa, ngân sách và nhóm trải nghiệm.
- **Beam:** `plan_itinerary` hiện có, width 300 và giới hạn 100.000 lần mở rộng.
- Ma trận offline tính khoảng cách haversine × 1,35 và giả định tốc độ 25 km/h. Đây là **dữ liệu tổng hợp để so sánh thuật toán**, không phải tuyến đường thật hoặc kết quả GraphHopper.
- Giá vé, thời lượng ghé và cửa sổ tham quan lấy từ `backend/planning_metadata.json`, đều là giả định biên tập chưa xác minh.
- Lịch có trạng thái `PLANNED_ESTIMATE` được `verify_plan` kiểm tra lại. Điểm chất lượng = tổng `priority` của điểm được chọn + 3 × số nhóm hoạt động khác nhau. Điểm này là mục tiêu nội bộ, không đo mức hài lòng của người du lịch.

## Kết quả tham chiếu (15/11/2026)

| Chỉ số | Greedy | Beam search |
|---|---:|---:|
| Tìm được lịch / tổng ca | 33/36 | 33/36 |
| Lịch đạt validator / lịch tìm được | 33/33 | 33/33 |
| Điểm trung bình trên các ca tìm được lịch | 45,73 | 52,21 |
| Trung vị thời gian chạy mỗi ca trên máy đo (ms) | 0,64 | 86,17 |

Trên 33 ca mà **cả hai** thuật toán tìm được lịch, beam cao hơn greedy trung bình **6,48 điểm**. Ba ca còn lại trả `SEARCH_LIMIT`; trạng thái này không chứng minh bài toán vô nghiệm. Thời gian chạy là một lần đo trên mỗi ca, phụ thuộc máy và tải hệ thống; hãy chạy lại khi cần số liệu hiệu năng của máy khác.

Benchmark hiện kiểm tra khả năng xử lý ràng buộc trên giả định và so sánh một hàm điểm nội bộ. Nó chưa đo tính đúng của dữ liệu thực, sở thích người dùng, chất lượng tuyến thực tế, khả năng mở rộng với catalog lớn hoặc mức tối ưu toàn cục. Mốc tiếp theo có ích nhất là bộ dữ liệu giờ/giá được xác minh và tập yêu cầu do người dùng thật đưa ra.

Để có một đánh giá phù hợp hơn với nghiên cứu, bước tiếp theo là thêm **tập instance TOPTW công khai với nghiệm tốt nhất/đã chứng minh** và một adapter cho mô hình có depot. Khi đó có thể báo cáo khoảng cách tới nghiệm tham chiếu, tỷ lệ tìm được nghiệm theo giới hạn thời gian và độ ổn định qua nhiều lần chạy. Cần giữ kết quả đó tách khỏi benchmark sản phẩm có ngân sách và các quy tắc riêng của SmartTripAI.
