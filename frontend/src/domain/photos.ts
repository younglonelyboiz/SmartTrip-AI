export const photos = {
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
} as const;
export type PhotoKey = keyof typeof photos;
export const placePhotos: Record<string, PhotoKey | undefined> = {
  "my-khe": "beach",
  "han-market": "market",
  marble: "marble",
};
export const photoSource = (key: PhotoKey) =>
  "https://commons.wikimedia.org/wiki/File:" + photos[key].file;
