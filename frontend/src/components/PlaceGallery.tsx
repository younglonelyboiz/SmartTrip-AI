import { DestinationPhoto } from "./DestinationPhoto";
import { Icon } from "./Icon";
export function PlaceGallery() {
  return (
    <section className="discovery-section">
      <div className="section-title">
        <div>
          <h2>Những điểm dừng đáng mong chờ</h2>
          <p className="muted">
            Một chút biển, một chút văn hóa và những hương vị địa phương.
          </p>
        </div>
      </div>
      <div className="destination-grid">
        {(
          [
            ["beach", "Biển Mỹ Khê", "Thảnh thơi bên biển", "biển"],
            ["market", "Chợ Hàn", "Khám phá nhịp sống địa phương", "ẩm thực"],
            ["marble", "Ngũ Hành Sơn", "Dạo qua miền di sản", "văn hóa"],
          ] as const
        ).map(([photo, title, description, category]) => (
          <article className="destination-card" key={photo}>
            <DestinationPhoto photo={photo} />
            <div>
              <span className="category-label">{category}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="place-location">
                <Icon name="pin" />
                Đà Nẵng
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
