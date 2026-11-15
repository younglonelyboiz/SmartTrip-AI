export interface SampleItinerary {
  title: string;
  duration: string;
  description: string;
  days: { title: string; stops: string[] }[];
}

// Editorial examples only: hours, routes, prices, and availability are not verified.
export const additionalItineraries: Record<string, SampleItinerary[]> = {
  "ha-noi": [
    {
      title: "Hà Nội trong một ngày", duration: "1 ngày", description: "Một vòng ngắn quanh hồ và phố cổ.",
      days: [{ title: "Hồ Gươm và phố cổ", stops: ["Sáng: dạo quanh hồ Hoàn Kiếm và khu vực tượng đài Lý Thái Tổ", "Trưa: thưởng thức món Hà Nội trong khu phố cổ", "Chiều: ghé Nhà 48 Hàng Ngang hoặc thong thả khám phá các con phố"] }],
    },
    {
      title: "Văn hóa và ẩm thực", duration: "2 ngày · 1 đêm", description: "Dành thời gian cho di sản, bảo tàng và hương vị Hà Nội.",
      days: [
        { title: "Di sản giữa lòng thành phố", stops: ["Sáng: tham quan Văn Miếu – Quốc Tử Giám", "Chiều: chọn một bảo tàng phù hợp sở thích", "Tối: thưởng thức ẩm thực địa phương"] },
        { title: "Phố cổ theo nhịp riêng", stops: ["Sáng: dạo khu vực hồ Hoàn Kiếm", "Trưa: ăn trưa tại phố cổ", "Chiều: ghé Nhà 48 Hàng Ngang và chuẩn bị trở về"] },
      ],
    },
  ],
  hue: [
    {
      title: "Một ngày bên sông Hương", duration: "1 ngày", description: "Khám phá khu vực kinh thành và thư thả dạo phố.",
      days: [{ title: "Kinh thành và sông Hương", stops: ["Sáng: khám phá khu vực Đại Nội", "Trưa: thưởng thức món Huế", "Chiều: nghỉ ngơi và dạo bên sông Hương"] }],
    },
    {
      title: "Dấu ấn cố đô", duration: "2 ngày · 1 đêm", description: "Tìm hiểu di sản và dành thời gian cho văn hóa địa phương.",
      days: [
        { title: "Kinh thành Huế", stops: ["Sáng: tham quan Đại Nội", "Chiều: nghỉ ngơi và khám phá khu vực sông Hương", "Tối: thưởng thức ẩm thực Huế"] },
        { title: "Di sản và làng nghề", stops: ["Sáng: chọn tham quan Lăng Tự Đức hoặc Lăng Dục Đức", "Chiều: tìm hiểu nghề đúc đồng Dương Xuân và chuẩn bị trở về"] },
      ],
    },
  ],
};
