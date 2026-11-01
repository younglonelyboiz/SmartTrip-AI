import { photos, type PhotoKey } from "../domain/photos";
export function DestinationPhoto({
  photo,
  className = "",
  eager = false,
}: {
  photo: PhotoKey;
  className?: string;
  eager?: boolean;
}) {
  const item = photos[photo];
  return (
    <img
      className={"destination-photo " + className}
      src={item.src}
      alt={item.alt}
      width="1280"
      height="960"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      style={{ objectPosition: item.position }}
    />
  );
}
