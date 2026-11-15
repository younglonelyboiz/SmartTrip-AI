# Khảo sát Wikipedia cho 30 địa điểm — 06/11/2026

## Kết quả

Đã rà đủ 30 ID trong `backend/catalog.json`. Tìm được **14 địa điểm có bài phù hợp phạm vi** (13 tiếng Việt, 1 tiếng Anh), **2 điểm chỉ tìm thấy bài rộng hơn**, **13 điểm chưa xác nhận** và **1 điểm có mâu thuẫn danh tính**. Chỉ 3/30 OSM node có sẵn tag Wikipedia; không đồng nghĩa chỉ 3 điểm có bài.

Đây là khảo sát ghép thực thể, chưa phải dữ liệu độ nổi tiếng. API Wikimedia trả **HTTP 403** cho yêu cầu mẫu lấy lượt xem Chùa Láng tháng 10/2026, cùng thông báo robot policy. Không tiếp tục thử hàng loạt sau phản hồi này. Vì chưa lấy được lượt xem, tất cả `pageviews` và `popularityScore` được giữ **null**, không gán 0 hoặc tạo thứ hạng giả. Không thay đổi catalog, thuật toán hoặc giao diện.

| Thành phố | Bài phù hợp | Chỉ bài rộng hơn | Chưa xác nhận | Mâu thuẫn danh tính |
|---|---:|---:|---:|---:|
| Hà Nội | 2 | 1 | 6 | 1 |
| Huế | 6 | 0 | 4 | 0 |
| Đà Nẵng | 6 | 1 | 3 | 0 |

## Phương pháp và mức chắc chắn

Đọc tags của đúng 30 node từ [OSM API](https://www.openstreetmap.org/api/0.6/nodes), đối chiếu tên tiếng Việt/Anh, rồi mở bài Wikipedia và kiểm tra đối tượng/thành phố. Việc ghép dựa trên phạm vi bài và vị trí mô tả, chưa phải xác minh thực địa. Danh mục cục bộ và tags OSM truy vấn hiện tại có thể khác thời điểm snapshot.

“Chưa xác nhận” nghĩa là chưa tìm hoặc đọc được bài riêng đủ chắc trong lượt khảo sát này; cache miss của công cụ web không chứng minh Wikipedia không có bài. Không ghép bài về nhân vật vào tượng đài, bài về thành phố vào địa điểm, trang định hướng vào điểm tham quan, hoặc cả quần thể vào một bộ phận. Trường broaderArticle chỉ lưu đầu mối để rà tiếp, không đủ điều kiện tính điểm.

## Hà Nội

| Địa điểm / OSM ID | Trạng thái | Bài / ghi chú |
|---|---|---|
| [Tượng đài Lý Thái Tổ](https://www.openstreetmap.org/node/443033827) · `node/443033827` | Chưa xác nhận | Chưa xác nhận bài riêng về tượng đài tại Hà Nội. Loại bài tiểu sử Lý Thái Tổ và công viên cùng tên ở TP.HCM. |
| [Nhà 48 phố Hàng Ngang](https://www.openstreetmap.org/node/445345255) · `node/445345255` | Đúng phạm vi địa điểm | [Nhà 48 Hàng Ngang](https://vi.wikipedia.org/wiki/Nh%C3%A0_48_H%C3%A0ng_Ngang) (vi). OSM có wikipedia và wikidata; bài mô tả chính ngôi nhà tại Hà Nội. |
| [Di Tích Lịch Sử Chùa Láng](https://www.openstreetmap.org/node/1498111667) · `node/1498111667` | Đúng phạm vi địa điểm | [Chùa Láng](https://vi.wikipedia.org/wiki/Ch%C3%B9a_L%C3%A1ng) (vi). Tên khác Chiêu Thiền tự; nội dung xác định ngôi chùa ở Hà Nội. |
| [Ô Thuỵ Chương](https://www.openstreetmap.org/node/1716371376) · `node/1716371376` | Chưa xác nhận | Chưa xác nhận được bài đúng Ô Thụy Chương; không tự đổi sang Ô Thụy Khuê. |
| [Bảo tàng Binh chủng Thông tin liên lạc](https://www.openstreetmap.org/node/2810302635) · `node/2810302635` | Chưa xác nhận | Chưa tìm được bài riêng đủ chắc cho đúng bảo tàng thông tin liên lạc này. |
| [Chợ Đêm Hàng Đào – Đồng Xuân](https://www.openstreetmap.org/node/4489385889) · `node/4489385889` | Chưa xác nhận | Chưa xác nhận bài riêng chợ đêm Hàng Đào–Đồng Xuân. Không dùng lượt xem bài chợ Đồng Xuân hoặc phố cổ thay thế. |
| [Bảo tàng Địa chất Việt Nam](https://www.openstreetmap.org/node/4499978190) · `node/4499978190` | Chưa xác nhận | Tên bài thử mở bị cache miss; chưa xác nhận bài tồn tại hoặc ghép đúng, không kết luận không có bài. |
| [Đài Tưởng Niệm Vua Lê Thái Tổ](https://www.openstreetmap.org/node/4742507123) · `node/4742507123` | Chưa xác nhận | Chưa xác nhận bài riêng cho đài tưởng niệm; loại tiểu sử Lê Lợi/Lê Thái Tổ. |
| [Tượng kỷ niệm chiến thắng B52](https://www.openstreetmap.org/node/4927916321) · `node/4927916321` | Mâu thuẫn danh tính | OSM name nói chiến thắng B52 nhưng name:en nói John McCain capture memorial. Cần xác minh danh tính trước khi ghép Wikipedia; không lấy lượt xem John McCain. |
| [Đài quan sát Lotte Skywalk](https://www.openstreetmap.org/node/5406262022) · `node/5406262022` | Chỉ có bài rộng hơn | [Lotte Center Hà Nội](https://vi.wikipedia.org/wiki/Lotte_Center_H%C3%A0_N%E1%BB%99i) (vi). Bài về toàn tòa nhà, không riêng đài quan sát. Chưa dùng làm điểm nổi tiếng cho Skywalk. |

## Huế

| Địa điểm / OSM ID | Trạng thái | Bài / ghi chú |
|---|---|---|
| [Lăng Tự Đức](https://www.openstreetmap.org/node/669249193) · `node/669249193` | Đúng phạm vi địa điểm | [Lăng Tự Đức](https://vi.wikipedia.org/wiki/L%C4%83ng_T%E1%BB%B1_%C4%90%E1%BB%A9c) (vi). Bài về khu lăng tại Huế, không phải tiểu sử vua Tự Đức. |
| [Lăng Dục Đức](https://www.openstreetmap.org/node/12411957519) · `node/12411957519` | Đúng phạm vi địa điểm | [Lăng Dục Đức](https://vi.wikipedia.org/wiki/L%C4%83ng_D%E1%BB%A5c_%C4%90%E1%BB%A9c) (vi). Bài về khu lăng tại Huế, không phải tiểu sử vua Dục Đức. |
| [Tử Cấm Thành](https://www.openstreetmap.org/node/2899189013) · `node/2899189013` | Đúng phạm vi địa điểm | [Tử Cấm thành (Huế)](https://vi.wikipedia.org/wiki/T%E1%BB%AD_C%E1%BA%A5m_th%C3%A0nh_(Hu%E1%BA%BF)) (vi). Bài riêng cho khu bên trong Hoàng thành Huế; giữ nhóm loại trừ trải nghiệm hiện có. |
| [Hoàng Thành Huế](https://www.openstreetmap.org/node/5182931945) · `node/5182931945` | Đúng phạm vi địa điểm | [Hoàng thành Huế](https://vi.wikipedia.org/wiki/Ho%C3%A0ng_th%C3%A0nh_Hu%E1%BA%BF) (vi). OSM có wikipedia và wikidata; không dùng bài về cả thành phố Huế. |
| [Điềm Phùng Thį](https://www.openstreetmap.org/node/4555464591) · `node/4555464591` | Chưa xác nhận | OSM name:en xác định nhà trưng bày nghệ thuật. Không dùng bài tiểu sử nghệ sĩ Điềm Phùng Thị làm độ nổi tiếng của nhà trưng bày. |
| [Tượng đài Phan Bội Châu](https://www.openstreetmap.org/node/4555491489) · `node/4555491489` | Chưa xác nhận | Chưa xác nhận bài riêng tượng đài tại Huế. Không dùng tiểu sử Phan Bội Châu. |
| [Tượng đài vua Quang Trung](https://www.openstreetmap.org/node/6099306388) · `node/6099306388` | Chưa xác nhận | Chưa xác nhận bài riêng tượng đài tại Huế. Không dùng tiểu sử Quang Trung hoặc bảo tàng Quang Trung ở địa phương khác. |
| [Đàn Xã Tắc](https://www.openstreetmap.org/node/6533792207) · `node/6533792207` | Đúng phạm vi địa điểm | [Đàn Xã Tắc (Huế)](https://vi.wikipedia.org/wiki/%C4%90%C3%A0n_X%C3%A3_T%E1%BA%AFc_(Hu%E1%BA%BF)) (vi). Bài riêng có tọa độ gần trùng node; không dùng bài chung Đàn Xã Tắc. |
| [Đúc đồng Dương Xuân](https://www.openstreetmap.org/node/9960090217) · `node/9960090217` | Chưa xác nhận | Chưa xác nhận bài đúng điểm đúc đồng Dương Xuân; bài về phường hoặc nghề chung chưa đủ. |
| [Thanh Toan Bridge](https://www.openstreetmap.org/node/13503143701) · `node/13503143701` | Đúng phạm vi địa điểm | [Cầu ngói Thanh Toàn](https://vi.wikipedia.org/wiki/C%E1%BA%A7u_ng%C3%B3i_Thanh_To%C3%A0n) (vi). Nội dung xác định cầu tại Thủy Thanh, Huế; tên catalog hiện ở tiếng Anh. |

## Đà Nẵng

| Địa điểm / OSM ID | Trạng thái | Bài / ghi chú |
|---|---|---|
| [Đèo Hải Vân](https://www.openstreetmap.org/node/1036552571) · `node/1036552571` | Đúng phạm vi địa điểm | [Đèo Hải Vân](https://vi.wikipedia.org/wiki/%C4%90%C3%A8o_H%E1%BA%A3i_V%C3%A2n) (vi). OSM có wikipedia và wikidata; điểm OSM đại diện cho địa danh đèo, chưa xác minh điểm dừng/cổng vào. |
| [Thuỷ Sơn](https://www.openstreetmap.org/node/1758586662) · `node/1758586662` | Chỉ có bài rộng hơn | [Ngũ Hành Sơn](https://en.wikipedia.org/wiki/Ng%C5%A9_H%C3%A0nh_S%C6%A1n) (en). Bài về cả cụm núi, không riêng Thủy Sơn. Trang vi:Thủy Sơn là định hướng, không dùng lượt xem. |
| [Non Nuoc Beach](https://www.openstreetmap.org/node/4172034499) · `node/4172034499` | Đúng phạm vi địa điểm | [Bãi biển Non Nước](https://vi.wikipedia.org/wiki/B%C3%A3i_bi%E1%BB%83n_Non_N%C6%B0%E1%BB%9Bc) (vi). Bài về bãi biển ở Đà Nẵng; không dùng trang định hướng Non Nước hoặc phim China Beach. |
| [My An Beach](https://www.openstreetmap.org/node/4347089780) · `node/4347089780` | Chưa xác nhận | Chưa xác nhận bài riêng bãi Mỹ An; không tự đồng nhất với bãi Mỹ Khê. |
| [Cầu Trần Thị Lý](https://www.openstreetmap.org/node/5273998823) · `node/5273998823` | Đúng phạm vi địa điểm | [Cầu Trần Thị Lý](https://vi.wikipedia.org/wiki/C%E1%BA%A7u_Tr%E1%BA%A7n_Th%E1%BB%8B_L%C3%BD) (vi). Bài về cầu bắc qua sông Hàn tại Đà Nẵng; tên và vị trí phù hợp. |
| [Cầu Thuận Phước](https://www.openstreetmap.org/node/5273999121) · `node/5273999121` | Đúng phạm vi địa điểm | [Cầu Thuận Phước](https://vi.wikipedia.org/wiki/C%E1%BA%A7u_Thu%E1%BA%ADn_Ph%C6%B0%E1%BB%9Bc) (vi). Bài về cầu ở Đà Nẵng; tọa độ trong các bản ngôn ngữ có độ chính xác khác nhau. |
| [Khu Du Lịch Sinh Thái Suối Lương](https://www.openstreetmap.org/node/5383428522) · `node/5383428522` | Chưa xác nhận | Chưa xác nhận bài riêng đúng khu du lịch Suối Lương. |
| [Cầu Sông Hàn](https://www.openstreetmap.org/node/7276380289) · `node/7276380289` | Đúng phạm vi địa điểm | [Cầu Sông Hàn](https://vi.wikipedia.org/wiki/C%E1%BA%A7u_S%C3%B4ng_H%C3%A0n) (vi). Đúng cầu tại Đà Nẵng; không ghép với cầu qua sông Hàn ở Hàn Quốc. |
| [Chợ đêm Helio](https://www.openstreetmap.org/node/7301996085) · `node/7301996085` | Chưa xác nhận | Chưa xác nhận bài riêng đúng chợ đêm Helio; kết quả cầu thủ Helio là sai đối tượng. |
| [Làng đá mỹ nghệ Non Nước](https://www.openstreetmap.org/node/10709724107) · `node/10709724107` | Đúng phạm vi địa điểm | [Non Nước Village](https://en.wikipedia.org/wiki/Non_N%C6%B0%E1%BB%9Bc_Village) (en). Tìm thấy bài tiếng Anh đúng làng đá. Chưa xác nhận bài tiếng Việt; không so lượt xem thô en với vi. |

## Cách dùng đề xuất sau khảo sát

1. Ưu tiên 13 bài tiếng Việt đã ghép; bài Non Nước Village tiếng Anh để riêng. Ghép qua Wikidata khi đã xác nhận QID và sitelink; lưu project, canonical title, page ID, nguồn và ngày cập nhật. Không lấy kết quả search đầu tiên tự động.
2. Dùng [Wikimedia Analytics API](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html), `all-access`, `user`, cùng cửa sổ ngày cho mọi điểm. Yêu cầu mẫu dùng 01–31/10/2026 (31 ngày), không gọi nhầm là 30 ngày. Xác nhận đủ ngày và canonical title/redirect trước khi tổng hợp. Tuân thủ [access policy](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html); khi 403/429 không lặp liên tục, không đổi đường truy cập để né hạn chế.
3. Lượt xem chỉ đại diện mức quan tâm trên Wikipedia, không phải lượng khách thực tế hay chất lượng. Có thể thử `log1p(views)` rồi chuẩn hóa trên một tập so sánh cùng ngôn ngữ và thời gian; cần đánh giá độ lệch khi một thành phố chỉ có ít bài. Chưa chốt trọng số kết hợp với ưu tiên biên tập hiện tại.
4. Điểm thiếu bài/lượt xem giữ null và dùng cơ chế dự phòng được ghi nhãn ưu tiên biên tập. Không biến dữ liệu thiếu thành 0 lượt xem hoặc tự nhận là nổi tiếng thấp. Không so raw English với Vietnamese như cùng một thang đo.
5. Khi có số liệu thực và thống nhất cách kết hợp mới thiết kế tích hợp vào bộ gợi ý. Điểm bắt buộc, tính khả thi về giờ/tuyến/ngân sách và nhóm loại trừ trải nghiệm vẫn được giữ.

## Tệp đi kèm và giới hạn

[JSON chi tiết](2026-11-06-wikipedia-popularity-survey.json) chứa đủ 30 ID, liên kết nguồn, tags wiki hiện có, trạng thái ghép và kết quả probe API. SHA-256 của catalog được lưu để phát hiện thay đổi sau khảo sát. JSON không phải runtime dataset và chưa được import vào backend.

Việc không lấy được Pageviews là giới hạn truy cập của lượt khảo sát này. Đã hoàn thành rà độ phủ bài; chưa hoàn thành thu thập tín hiệu lượt xem. Cần thực hiện lại qua kênh truy cập được Wikimedia cho phép trước khi công bố điểm độ nổi tiếng thực.
