# Gợi ý và lập lịch cho ba thành phố

## Mục đích và phạm vi đã thống nhất

Người dùng chọn Hà Nội, Huế hoặc Đà Nẵng, nhập số ngày, có thể nhập ngân sách và chọn các điểm bắt buộc. Hệ thống tự gợi ý thêm điểm và tạo lịch trình cụ thể. Ngân sách tính cho một người, gồm tham quan và di chuyển giữa các điểm tại thành phố; không gồm ăn uống, khách sạn hoặc vé đến/rời thành phố.

Mục tiêu là một luồng chạy từ giao diện qua backend đến GraphHopper rồi hiển thị lịch được tính từ yêu cầu, thay cho việc trả lịch fixture hoặc chia điểm luân phiên. Không yêu cầu sở thích, đăng nhập, LLM hoặc mô hình học máy. Chưa triển khai lưu lịch mới, chia sẻ hay đặt dịch vụ. Không được bỏ điểm bắt buộc âm thầm, báo lịch vượt ngân sách là thành công hoặc coi dữ liệu ước tính là giá/giờ đã xác minh.

## Các hướng đã cân nhắc

1. Hoàn thiện Đà Nẵng rồi mở rộng: ít dữ liệu cần kiểm chứng hơn nhưng không đáp ứng phạm vi ba thành phố người dùng chọn.
2. Làm đồng thời ba thành phố: dùng chung thuật toán và hợp đồng dữ liệu, kết nối ba GraphHopper sẵn có; cần rà dữ liệu và kiểm tra từng thành phố. Người dùng chọn hướng này.

Các lựa chọn kỹ thuật bên dưới là đề xuất của người triển khai, chờ người dùng duyệt tài liệu này.

## Đầu vào và các mặc định đề xuất

- Thành phố thuộc ba giá trị hỗ trợ; số ngày nguyên từ 1 đến 14.
- Ngân sách bỏ trống nghĩa là không giới hạn chi phí; số nguyên VND không âm, 0 là giới hạn thật.
- Danh sách ID OSM bắt buộc có thể rỗng, không trùng và phải thuộc thành phố.
- Chỉ số Ngày 1, Ngày 2…; chưa yêu cầu ngày đi thực tế. Không khẳng định lịch mở cửa theo thứ trong tuần hoặc ngày lễ.
- Dùng chung khung giờ cho toàn chuyến. Mặc định mỗi ngày 08:00–22:00, nghỉ trưa 12:00–13:00. Người dùng có thể tùy chọn chỉnh giờ bắt đầu/kết thúc và giờ nghỉ hoặc tắt nghỉ trưa; không bắt buộc nhập các trường này. Không hỗ trợ khung qua nửa đêm trong bản đầu.
- Backend áp dụng mặc định khi thiếu cấu hình giờ, kiểm tra giờ bắt đầu trước giờ kết thúc và khoảng nghỉ (nếu bật) nằm trong khung ngày. Kết quả trả lại cấu hình giờ thực tế đã dùng. Thời lượng ghé và khung tham quan từng điểm là dữ liệu ước tính được khai báo; giờ kết thúc ngày 22:00 không có nghĩa mọi điểm đều mở đến 22:00.
- Chuyến bắt đầu tại điểm tham quan đầu tiên và kết thúc tại điểm cuối mỗi ngày. Không tính chặng từ khách sạn, chặng trở về hoặc chặng nối giữa hai ngày.
- Di chuyển dùng profile ô tô hiện có. Chi phí tính từ quãng đường theo biểu phí minh họa có phiên bản, công khai trong kết quả, không phải báo giá taxi.

## Dữ liệu và gợi ý

Giữ nguồn OSM, ID, tọa độ và attribution. Bổ sung metadata tách biệt nguồn OSM: thời lượng tham quan, khung tham quan giả định, phí tham quan ước tính, mức ưu tiên biên tập và nhóm hoạt động. Không gán những số liệu bổ sung này cho OSM. Dữ liệu mẫu hiện có chỉ khoảng 10 điểm mỗi thành phố; rà các điểm chồng lấn (ví dụ Hoàng Thành và Tử Cấm Thành) bằng nhóm loại trừ để không tự gợi ý trùng trải nghiệm. Nếu người dùng bắt buộc hai điểm trong cùng nhóm thì trả lý do xung đột rõ ràng.

Khi chưa có sở thích, gợi ý dựa trên ưu tiên biên tập, đa dạng nhóm hoạt động, thời lượng, chi phí và khả năng ghép tuyến. Hiển thị lý do ngắn như điểm tiêu biểu, phù hợp quỹ thời gian hoặc gần điểm bắt buộc; không quảng bá là cá nhân hóa bằng AI.

## Backend và thuật toán đề xuất

Giữ API fixture hiện có để tránh phá demo cũ. Tạo API lập lịch catalog mới với destination, dayCount, budgetVnd nullable, mandatoryPlaceIds và cấu hình giờ chung tùy chọn (giờ bắt đầu, kết thúc, khoảng nghỉ nullable để tắt nghỉ). Chuẩn hóa kết quả gồm request, phiên bản dữ liệu/giả định, trạng thái, ngày, lượt ghé, các chặng, tổng chi phí và lý do gợi ý.

Tách adapter GraphHopper dùng được ID catalog; giữ tương thích ID fixture. Lấy ma trận thời gian và khoảng cách có hướng giữa các ứng viên, giới hạn số yêu cầu đồng thời và timeout; dùng cùng số liệu đó cho lập lịch và tổng chi phí. Tuyến lỗi riêng lẻ bị loại khỏi lựa chọn; nếu không thể kiểm tra điểm bắt buộc do lỗi dịch vụ thì báo không tính được, không kết luận bài toán vô nghiệm. Không thay đường thẳng làm tuyến thật. Lấy geometry cho các chặng đã chọn, xử lý lỗi geometry như kết quả chưa hoàn thành.

Với catalog nhỏ, dùng tìm kiếm hữu hạn có giới hạn tài nguyên: xếp các điểm bắt buộc trước về ưu tiên tìm kiếm, xét phân ngày và thứ tự, rồi bổ sung các điểm được gợi ý theo điểm đánh giá. Kiểm tra giờ ghé, nghỉ trưa, kết thúc ngày, không lặp điểm và tổng ngân sách cho mỗi phương án. Chọn phương án có giá trị tham quan cao, sau đó ưu tiên ít thời gian di chuyển. Cách cắt nhánh và giới hạn tìm kiếm để người triển khai quyết định, nhưng phải phân biệt tìm kiếm chưa thấy lịch với chứng minh xung đột.

Trạng thái kết quả phân biệt: lịch tạo được theo giả định; xung đột đã chứng minh (kèm chứng cứ như tổng vé bắt buộc vượt ngân sách); chưa tìm được lịch trong giới hạn; lỗi dữ liệu hoặc định tuyến. Không tuyên bố tối ưu toàn cục. Không trả lịch vi phạm dưới nhãn thành công.

Nếu ít điểm hơn số ngày hoặc ngân sách quá thấp để bổ sung điểm, cho phép ngày trống với thông báo rõ danh mục chưa đủ; không lặp điểm để lấp ngày. Luôn hiển thị mức độ phủ lịch và không gọi lịch thiếu ngày là đầy đủ.

## Giao diện và luồng kết quả

Điều chỉnh planner chính thành thành phố, số ngày, ngân sách tùy chọn và chọn điểm bắt buộc. Phần tùy chọn chỉnh giờ dùng chung cho toàn chuyến hiển thị sẵn mặc định, có thể thu gọn để không làm dài biểu mẫu chính. Cho phép tạo lịch khi không chọn điểm nào. Khi đổi thành phố, xóa các lựa chọn cũ; khi đầu vào thay đổi, bỏ kết quả cũ để tránh gắn nhầm yêu cầu. Có trạng thái đang tính và lỗi có thể thử lại.

Hiển thị lịch theo từng ngày: giờ đến/rời, thời lượng tham quan, đánh dấu điểm bắt buộc/được đề xuất, lý do gợi ý, phí điểm và chi phí từng chặng; có nghỉ trưa, tổng km, thời gian và dự toán toàn chuyến. Bản đồ vẽ geometry các chặng đã tính. Ngày chỉ có một điểm vẫn hiện marker, chi phí di chuyển bằng 0 theo phạm vi đã nêu. Hiển thị giả định và các khoản ngoài ngân sách ở nơi xem dự toán. Kết quả mới có thể nằm trong planner; không ép vào schema fixture hiện có.

## Ràng buộc hiện trạng và xác minh

Giữ React/TypeScript/Vite, FastAPI và ba cấu hình GraphHopper. Giữ các thay đổi chưa commit của người dùng; không reset hoặc ghi đè hàng loạt. Không tải dữ liệu hoặc cài dependency nếu chưa cần thiết. Khởi chạy cục bộ, chưa triển khai Internet.

Kiểm tra backend cho ba thành phố, không điểm bắt buộc, có điểm bắt buộc, ngân sách trống/0/thấp, ID sai thành phố, ngày không hợp lệ, cấu hình giờ bỏ trống/dùng mặc định/tùy chỉnh/sai thứ tự/qua nửa đêm, nghỉ trưa bật/tắt/ngoài khung ngày, điểm trùng, tuyến lỗi, giới hạn tìm kiếm và ngày trống. Xác minh độc lập tổng tiền, chuỗi thời gian, chặng có hướng và mọi điểm bắt buộc trong kết quả thành công. Chạy build frontend và kiểm thử trình duyệt một luồng thực cho mỗi thành phố qua GraphHopper; kiểm tra sửa đầu vào và retry không hiển thị kết quả cũ. Kiểm tra hồi quy demo fixture và storage hiện có bằng các script liên quan.

## Phần để người triển khai quyết định

Tách module, chi tiết schema/HTTP status, cache ma trận, mức đồng thời, giới hạn tìm kiếm, trọng số ưu tiên và bố cục cụ thể theo giao diện hiện có. Các giá trị mặc định và mức phí minh họa phải tập trung trong dữ liệu/cấu hình và hiện rõ nguồn giả định.
