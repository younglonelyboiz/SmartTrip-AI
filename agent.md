# SmartTrip AI – Nền tảng du lịch thông minh

## 1. Tổng quan dự án

**Tên dự án:** SmartTrip AI  
**Loại sản phẩm:** Nền tảng Web Application tích hợp AI  
**Lĩnh vực:** Du lịch và lập kế hoạch cá nhân

SmartTrip AI là nền tảng hỗ trợ người dùng lập kế hoạch du lịch tự túc tại Việt Nam, kết hợp ba thành phần chính:

- **Recommendation System:** Gợi ý điểm đến và hoạt động du lịch theo sở thích cá nhân.
- **Optimization Engine:** Tối ưu lịch trình dựa trên thời gian, ngân sách, khoảng cách và các ràng buộc.
- **AI Agent:** Tự động tìm kiếm thông tin, xây dựng kế hoạch và điều chỉnh lịch trình khi có thay đổi.

Mục tiêu là tự động hóa phần lớn công việc tìm kiếm thông tin, lựa chọn địa điểm, ước tính chi phí và sắp xếp lịch trình mà người dùng thường phải thực hiện thủ công.

## 2. Bài toán cần giải quyết

Hiện nay, để chuẩn bị một chuyến du lịch tự túc, người dùng thường phải:

1. Tìm kiếm các điểm tham quan phù hợp.
2. Tìm khách sạn, phương tiện và địa điểm ăn uống.
3. So sánh chi phí từ nhiều nguồn.
4. Sắp xếp thứ tự tham quan hợp lý.
5. Tính toán thời gian di chuyển và ngân sách.
6. Điều chỉnh kế hoạch khi thời gian hoặc điều kiện thay đổi.

Thông tin thường phân tán giữa nhiều nền tảng và có thể không được cập nhật đồng nhất.

SmartTrip AI hướng đến việc tự động hóa quy trình này, đồng thời tạo ra lịch trình có khả năng kiểm chứng về thời gian, chi phí và tính khả thi.

## 3. Đối tượng sử dụng

- Người đi du lịch tự túc.
- Cá nhân muốn lập kế hoạch nhanh theo ngân sách.
- Nhóm bạn hoặc gia đình đã có sẵn thành viên, cần thống nhất lịch trình.

Không phát triển chức năng tìm kiếm hoặc ghép nối bạn đồng hành là người lạ.

## 4. Các phân hệ chức năng

### 4.1. Quản lý người dùng
- Đăng ký, đăng nhập.
- Quản lý hồ sơ và sở thích du lịch.
- Thiết lập ngân sách, thời gian và phong cách du lịch.
- Lưu lịch sử chuyến đi.

### 4.2. Hệ thống gợi ý cá nhân hóa
- Gợi ý điểm đến phù hợp.
- Gợi ý địa điểm tham quan, ăn uống và lưu trú.
- Xếp hạng địa điểm theo sở thích và điều kiện người dùng.
- Thu thập phản hồi để cải thiện chất lượng gợi ý.

### 4.3. AI Travel Agent
- Tiếp nhận yêu cầu bằng ngôn ngữ tự nhiên.
- Phân tích mục tiêu và ràng buộc chuyến đi.
- Chủ động gọi các công cụ truy vấn dữ liệu.
- Phối hợp Recommendation System và Optimization Engine.
- Tạo lịch trình chi tiết theo từng ngày.
- Điều chỉnh lịch trình khi người dùng thay đổi yêu cầu.
- Tự lập lại kế hoạch khi địa điểm không còn phù hợp.

### 4.4. Tối ưu hóa lịch trình
- Lựa chọn địa điểm theo thời gian khả dụng.
- Tối ưu thứ tự tham quan và tuyến đường.
- Hạn chế thời gian di chuyển không cần thiết.
- Kiểm tra khung giờ hoạt động của địa điểm.
- Tối ưu theo ngân sách dự kiến.
- Hỗ trợ các ràng buộc bắt buộc và tùy chọn.

Các phép tính khoảng cách, chi phí và tối ưu nên do thuật toán hoặc công cụ chuyên dụng thực hiện, không phụ thuộc vào phép tính do LLM tự sinh.

### 4.5. Quản lý chi phí du lịch
- Ước tính chi phí lưu trú.
- Ước tính chi phí di chuyển.
- Tính chi phí ăn uống và tham quan.
- Tổng hợp ngân sách toàn chuyến đi.
- Cảnh báo khi vượt ngân sách.
- Phân biệt giá quan sát được, giá ước tính và giá giả lập.
- Hỗ trợ lưu dữ liệu giá lịch sử để phục vụ tính toán và đánh giá.

### 4.6. Quản lý chuyến đi
- Tạo, lưu và chỉnh sửa chuyến đi.
- Xem lịch trình theo ngày.
- Hiển thị địa điểm và tuyến đường trên bản đồ.
- Chia sẻ lịch trình.
- Quản lý kế hoạch cho nhóm có sẵn.

### 4.7. Quản trị
- Quản lý tài khoản.
- Quản lý danh mục điểm đến.
- Quản lý nguồn dữ liệu và thời điểm cập nhật.
- Theo dõi hoạt động của AI Agent.
- Thống kê và đánh giá chất lượng hệ thống.

## 5. Thiết kế các thành phần AI

### A. Recommendation System

Mục tiêu: Xếp hạng điểm đến và hoạt động phù hợp với từng người dùng.

Hướng tiếp cận:
- Content-based Recommendation cho người dùng mới.
- Collaborative Filtering hoặc Hybrid Recommendation nếu dữ liệu tương tác đủ tốt.
- Kết hợp sở thích, ngân sách, loại hình du lịch và lịch sử tương tác.

Có thể đánh giá bằng Precision@K, Recall@K và NDCG@K khi có dữ liệu và nhãn phù hợp.

### B. Optimization Engine

Mục tiêu: Tìm lịch trình khả thi và có chất lượng tốt dưới nhiều ràng buộc.

Input:
- Danh sách địa điểm ứng viên.
- Tọa độ và thời gian di chuyển.
- Thời gian tham quan dự kiến.
- Giờ hoạt động.
- Ngân sách.
- Số ngày du lịch.
- Sở thích và mức độ ưu tiên.

Output:
- Các địa điểm được lựa chọn.
- Thứ tự tham quan.
- Thời điểm dự kiến đến và rời đi.
- Chi phí dự kiến.
- Các ràng buộc được thỏa mãn và những ràng buộc chưa thể đáp ứng.

Có thể nghiên cứu Constraint Programming, Orienteering Problem, Vehicle Routing Problem và Google OR-Tools tùy cách mô hình hóa.

### C. AI Travel Agent

AI Agent đóng vai trò điều phối các thành phần của hệ thống.

Quy trình:

1. Tiếp nhận yêu cầu.
2. Trích xuất thông tin và ràng buộc.
3. Xác định dữ liệu còn thiếu.
4. Truy vấn Recommendation System.
5. Thu thập dữ liệu địa điểm, tuyến đường và chi phí.
6. Gọi Optimization Engine.
7. Kiểm tra tính khả thi của kết quả.
8. Trình bày lịch trình và giải thích phương án.
9. Tiếp nhận thay đổi và tự động lập kế hoạch lại.

AI Agent không được tự tạo ra giá, khoảng cách hoặc giờ hoạt động mà không có nguồn dữ liệu hoặc cơ chế ước tính được công bố.

## 6. Nguồn dữ liệu dự kiến

Ưu tiên dữ liệu du lịch Việt Nam.

Các nguồn có thể nghiên cứu:

- OpenStreetMap: Địa điểm, tọa độ và mạng lưới đường.
- Cơ sở dữ liệu du lịch Việt Nam: Danh sách điểm đến.
- ViHoRec: Dữ liệu phục vụ nghiên cứu hệ gợi ý khách sạn.
- Dữ liệu giá từ nguồn công khai được phép sử dụng.
- API bản đồ, định tuyến hoặc giá dịch vụ khi có quyền truy cập.

Cần kiểm tra giấy phép, mức độ đầy đủ và khả năng truy cập thực tế trước khi lựa chọn nguồn.

### Yêu cầu về dữ liệu giá

Hệ thống cần hỗ trợ ba loại giá:

- Giá quan sát được từ nguồn thực tế.
- Giá ước tính bằng mô hình hoặc phương pháp thống kê.
- Giá giả lập phục vụ kiểm thử.

Mỗi bản ghi giá nên có thông tin về nguồn, thời điểm ghi nhận, ngày sử dụng dịch vụ, đơn vị tiền tệ và điều kiện áp dụng.

Có thể triển khai chế độ mô phỏng lịch sử, ví dụ người dùng lập kế hoạch tại một ngày trong quá khứ. Khi đó hệ thống chỉ được sử dụng những thông tin đã có tại thời điểm mô phỏng.

Không được trình bày giá giả lập hoặc ước tính như giá đặt dịch vụ trực tiếp.

## 7. Phạm vi MVP

Tập trung vào du lịch tự túc tại Việt Nam, bắt đầu với một hoặc hai điểm đến có dữ liệu đủ tốt.

Các chức năng ưu tiên:

1. Hồ sơ người dùng và sở thích du lịch.
2. Danh mục địa điểm du lịch.
3. Gợi ý địa điểm cá nhân hóa.
4. AI Agent tiếp nhận yêu cầu lập lịch trình.
5. Tối ưu lịch trình theo thời gian, tuyến đường và ngân sách.
6. Dự toán chi phí dựa trên dữ liệu có nguồn.
7. Hiển thị lịch trình trên bản đồ.
8. Lưu và điều chỉnh lịch trình.

Chưa triển khai:
- Thanh toán thực tế.
- Đặt vé máy bay hoặc khách sạn trực tiếp.
- Ghép bạn đồng hành là người lạ.
- Cam kết giá dịch vụ theo thời gian thực khi chưa có API phù hợp.
- Mở rộng toàn bộ địa điểm tại Việt Nam ngay từ đầu.

## 8. Kịch bản sử dụng tiêu biểu

Người dùng nhập:

"Tôi muốn đi Đà Nẵng 3 ngày 2 đêm, ngân sách 3 triệu đồng/người, thích biển và ẩm thực địa phương. Tôi muốn hạn chế di chuyển xa và ưu tiên các địa điểm có chi phí hợp lý."

Hệ thống cần:

1. Hiểu yêu cầu và các ràng buộc.
2. Gợi ý danh sách địa điểm phù hợp.
3. Thu thập dữ liệu khoảng cách, thời gian và chi phí.
4. Tối ưu lịch trình theo từng ngày.
5. Trả về lịch trình có thời gian, địa điểm và ngân sách dự kiến.
6. Hiển thị lịch trình trên bản đồ.
7. Tự điều chỉnh nếu người dùng thay đổi ngân sách, thời gian hoặc loại bỏ một địa điểm.

Đầu ra cần là lịch trình có cấu trúc, không chỉ là văn bản do LLM sinh.

## 9. Đánh giá hệ thống

Các tiêu chí dự kiến:

**Recommendation**
- Precision@K / Recall@K.
- NDCG@K.
- Mức độ phù hợp với sở thích người dùng.

**Optimization**
- Tỷ lệ lịch trình thỏa mãn ràng buộc.
- Tổng thời gian di chuyển.
- Mức độ sử dụng ngân sách.
- Chất lượng phương án so với baseline.

**AI Agent**
- Task Completion Rate.
- Tỷ lệ lập kế hoạch thành công.
- Replanning Success Rate.
- Tỷ lệ sử dụng thông tin không có căn cứ.
- Độ trễ và chi phí xử lý.

Cần xây dựng bộ tình huống kiểm thử và baseline để xác minh các cải tiến, không giả định trước kết quả.

## 10. Định hướng triển khai

Phát triển theo phương pháp Top-down:

1. Phân tích yêu cầu và pain point.
2. Xây dựng Functional Mind Map.
3. Xác định phạm vi MVP và use case.
4. Khảo sát, đánh giá chất lượng dữ liệu.
5. Thiết kế các module và luồng nghiệp vụ.
6. Thiết kế kiến trúc hệ thống.
7. Triển khai Recommendation và Optimization.
8. Tích hợp AI Agent.
9. Xây dựng giao diện và backend.
10. Kiểm thử, benchmark và hoàn thiện demo.

Ưu tiên kiến trúc module hóa để có thể thay đổi nguồn dữ liệu, thuật toán gợi ý hoặc Optimization Engine mà không cần viết lại toàn bộ hệ thống.

## 11. Yêu cầu đối với AI Coding Agent

Hãy xem đây là tài liệu mô tả ý tưởng và định hướng sản phẩm, chưa phải đặc tả kỹ thuật cuối cùng.

Trước khi triển khai:

- Phân tích yêu cầu và xác định các điểm chưa rõ.
- Đánh giá tính khả thi của từng phân hệ.
- Kiểm chứng những nguồn dữ liệu và API thực sự sử dụng được.
- Đề xuất kiến trúc phù hợp, tránh thiết kế quá phức tạp.
- Phân biệt rõ những chức năng cần AI, thuật toán tối ưu và business logic thông thường.
- Đề xuất kế hoạch MVP và tiêu chí nghiệm thu.

Không tự giả định rằng API thương mại đã được cấp quyền, dữ liệu giá đã có đầy đủ hoặc thuật toán đã được chứng minh hiệu quả.

**Mục tiêu cuối cùng:** Xây dựng một nền tảng du lịch thông minh có khả năng tự động lập và điều chỉnh lịch trình cá nhân hóa, sử dụng dữ liệu có căn cứ và các thuật toán tối ưu để tạo ra kế hoạch khả thi về thời gian, tuyến đường và ngân sách.