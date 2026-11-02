export const destinations = [
  {
    id: "da-nang", name: "Đà Nẵng", region: "Miền Trung", duration: "3 ngày · 2 đêm",
    description: "Biển xanh, nhịp sống bên sông Hàn và những điểm dừng văn hóa.",
    href: "/trips/danang-demo/versions/v1", photo: "city" as const,
    days: [],
  },
  {
    id: "ha-noi", name: "Hà Nội", region: "Miền Bắc", duration: "3 ngày · 2 đêm",
    description: "Dạo phố cổ, khám phá di sản và dành thời gian cho ẩm thực địa phương.",
    href: "/diem-den/ha-noi", photo: "hanoi" as const,
    days: [
      { title: "Phố cổ và hồ Hoàn Kiếm", stops: ["Sáng: dạo khu vực hồ Hoàn Kiếm", "Chiều: khám phá phố cổ theo nhịp riêng", "Tối: trải nghiệm ẩm thực địa phương"] },
      { title: "Một ngày tìm hiểu văn hóa", stops: ["Sáng: tham quan Văn Miếu – Quốc Tử Giám", "Chiều: chọn một bảo tàng phù hợp sở thích", "Tối: nghỉ ngơi hoặc dạo phố"] },
      { title: "Thảnh thơi trước khi trở về", stops: ["Sáng: dạo khu vực hồ Tây", "Trưa: ăn uống và chuẩn bị hành lý", "Chiều: dành thời gian cho hành trình trở về"] },
    ],
  },
  {
    id: "hue", name: "Huế", region: "Miền Trung", duration: "2 ngày · 1 đêm",
    description: "Chậm lại giữa dấu ấn kinh thành, sông Hương và hương vị xứ Huế.",
    href: "/diem-den/hue", photo: "hue" as const,
    days: [
      { title: "Dấu ấn kinh thành", stops: ["Sáng: dành thời gian khám phá Đại Nội", "Chiều: nghỉ ngơi, dạo bên sông Hương", "Tối: thưởng thức ẩm thực Huế"] },
      { title: "Một ngày đi chậm", stops: ["Sáng: tham quan chùa Thiên Mụ", "Trưa: ăn uống và nghỉ ngơi", "Chiều: chuẩn bị hành lý, kết thúc hành trình"] },
    ],
  },
];
