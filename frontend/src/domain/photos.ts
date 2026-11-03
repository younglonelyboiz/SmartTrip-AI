export const photos = {
  hanoi: {
    src: "/images/hanoi-mausoleum.jpg", alt: "Lăng Chủ tịch Hồ Chí Minh tại Quảng trường Ba Đình, Hà Nội",
    title: "Lăng Chủ tịch Hồ Chí Minh", file: "Lăng_Bác_-_NKS.jpg", position: "center 55%",
  },
  hue: {
    src: "/images/hue-citadel.jpg", alt: "Ngọ Môn và Hoàng thành Huế nhìn từ phía trước",
    title: "Ngọ Môn – Hoàng thành Huế", file: "Đại_nội.jpg", position: "center",
  },
  beach: {
    src: "/images/my-khe.jpg",
    alt: "Bãi cát và sóng biển tại Mỹ Khê, Đà Nẵng",
    title: "Biển Mỹ Khê",
    file: "My_Khe_Beach_2.jpg",
    position: "center 58%",
  },
  city: {
    src: "/images/danang-bridge.jpg",
    alt: "Cầu Rồng bắc qua sông Hàn tại Đà Nẵng",
    title: "Đà Nẵng bên sông Hàn",
    file: "Dragon_Bridge_Da_Nang_5.jpg",
    position: "center 55%",
  },
  market: {
    src: "/images/han-market.jpg",
    alt: "Không gian mua sắm bên trong Chợ Hàn, Đà Nẵng",
    title: "Chợ Hàn",
    file: "Han_Market_1.jpg",
    position: "center",
  },
  marble: {
    src: "/images/marble.jpg",
    alt: "Bên trong động Huyền Không thuộc Ngũ Hành Sơn",
    title: "Ngũ Hành Sơn",
    file: "Huyen_Khong_Cave_1.jpg",
    position: "center 60%",
  },
  haGiang: {
    src: "/images/ha-giang-ma-pi-leng.png",
    alt: "Đèo Mã Pí Lèng và dòng sông Nho Quế giữa núi đá Hà Giang",
    title: "Đèo Mã Pí Lèng, Hà Giang",
    file: "Ảnh minh họa được tạo bằng AI",
    position: "center 54%",
  },
} as const;
export type PhotoKey = keyof typeof photos;
export const placePhotos: Record<string, PhotoKey | undefined> = {
  "my-khe": "beach",
  "han-market": "market",
  marble: "marble",
};
export const photoSource = (key: PhotoKey) =>
  "https://commons.wikimedia.org/wiki/File:" + photos[key].file;
