# C2 — Containers target và prototype

```mermaid
flowchart TB
 B[Browser React SPA] -->|HTTPS JSON| API[API modular đề xuất FastAPI]
 API -->|Transaction| DB[(PostgreSQL)]
 API -->|Durable run record| DB
 W[Job worker dùng chung modules] -->|Claim run và lưu kết quả| DB
 W --> O[Optimizer adapter]
 W --> R[Recommendation adapter]
 API --> AG[Agent adapter]
 AG --> EXT[LLM và data provider khi được cấp quyền]
```

FastAPI/Python và PostgreSQL là đề xuất cho backend tương lai, không cài trong đợt này. Worker claim run có lease, heartbeat và retry idempotent; không coi in-process background task là queue bền vững. Solver chạy có giới hạn thời gian và validator trước commit. Kiến trúc modular monolith + worker tránh tách microservices khi chưa cần.

Prototype thực tế: trình duyệt → React → mockTravelService → JSON fixture; lưu localStorage. Vite chỉ dev/build/static server, không phải backend API. HTTPS, RBAC, durable jobs và DB không được giả lập như bảo mật thật.
