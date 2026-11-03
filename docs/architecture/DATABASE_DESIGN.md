# Database design — Target PostgreSQL

Chỉ thiết kế; FE hiện tại không dùng database. UUID là ID target, fixture dùng chuỗi dễ đọc; API chỉ ràng buộc string để adapter không phụ thuộc dạng UUID. Timestamp dùng timestamptz UTC khi lưu; ngày dịch vụ và phút địa phương lưu riêng, timezone chuyến đi cố định Asia/Ho_Chi_Minh.

```mermaid
erDiagram
 users ||--o{ trips : owns
 users ||--o{ preferences : sets
 trips ||--o{ trip_versions : has
 trips ||--o{ optimization_runs : requests
 dataset_snapshots ||--o{ optimization_runs : grounds
 dataset_snapshots ||--o{ trip_versions : grounds
 trip_versions ||--o{ itinerary_items : contains
 trip_versions ||--o{ feedback : receives
 trip_versions ||--o{ share_links : exposes
 data_sources ||--o{ price_records : provides
 places ||--o{ opening_windows : opens
 places ||--o{ price_records : costs
 users {
  uuid id PK
  varchar email UK
  varchar password_hash
  varchar role
 }
 trips {
  uuid id PK
  uuid owner_id FK
  varchar title
  timestamptz created_at
 }
 dataset_snapshots {
  uuid id PK
  varchar content_hash UK
  jsonb payload
  varchar config_version
 }
 optimization_runs {
  uuid id PK
  uuid trip_id FK
  uuid snapshot_id FK
  jsonb request
  jsonb config
  varchar execution_state
  varchar solver_status
 }
 trip_versions {
  uuid id PK
  uuid trip_id FK
  uuid parent_version_id FK
  uuid run_id FK
  uuid snapshot_id FK
  bigint total_cost_vnd
  int travel_minutes
 }
 itinerary_items {
  uuid id PK
  uuid version_id FK
  uuid place_id FK
  date service_date
  int sequence_no
  int start_minute
  int end_minute
 }
 price_records {
  uuid id PK
  uuid source_id FK
  varchar kind
  bigint amount_vnd
  varchar basis
  date service_date
  timestamptz recorded_at
 }
```

## Data dictionary
| Bảng | Trường chính, khóa và ý nghĩa |
|---|---|
| users | id PK UUID, email UNIQUE, password_hash, role traveler/admin, display_name, is_active, created_at |
| preferences | user_id FK users, interest_code; composite PK(user_id,interest_code) |
| places | id PK, name, category, latitude/longitude nullable khi chưa xác minh, duration_minutes>0, source_id FK, updated_at |
| opening_windows | id PK, place_id FK, service_date, open_minute>=0, close_minute<=1440, open<close, source_id FK |
| data_sources | id PK, name, status verified/unverified/simulated, license_url nullable, verification_notes, recorded_at |
| price_records | id PK, place_id nullable FK, source_id FK, kind observed/estimated/simulated, amount_vnd BIGINT>=0, basis per_person/per_group, currency VND, recorded_at, service_date, valid_from/to, conditions, estimate_method nullable |
| dataset_snapshots | id PK, content_hash UNIQUE, payload JSONB đầy đủ nơi/giờ/ma trận/giá, config_version, created_at; bất biến |
| trips | id PK, owner_id FK users, title, created_at, archived_at nullable |
| optimization_runs | id PK, trip_id FK, snapshot_id FK, parent_version_id nullable, request JSONB, config JSONB, execution_state QUEUED/RUNNING/COMPLETED/FAILED, solver_status nullable, stop_reason, checks JSONB, error_code, started_at/ended_at |
| trip_versions | id PK, trip_id FK, version_no>0, parent_version_id nullable FK self, run_id UNIQUE FK, snapshot_id FK, request JSONB, total_cost_vnd>=0, travel_minutes>=0, solver_status, cost_items JSONB, created_at; UNIQUE(trip_id,version_no) |
| itinerary_items | id PK, version_id FK, service_date, sequence_no, place_id FK, start_minute/end_minute, arrival_travel_minutes; UNIQUE(version_id,place_id), UNIQUE(version_id,service_date,sequence_no) |
| feedback | id PK, version_id FK, user_id FK, useful, comment, created_at; UNIQUE(version_id,user_id) |
| share_links | id PK, version_id FK, token_hash UNIQUE, expires_at, revoked_at nullable; không lưu token plaintext |

Snapshot payload là bản sao dữ kiện chuẩn hóa tại lúc publish, không join dữ liệu live để tái dựng lịch cũ. Travel edges/fixed costs nằm trong payload; tương lai tách bảng nếu cần truy vấn khối lượng lớn. Giá theo nhiều đêm được chuẩn hóa thành line item tổng đúng số đêm trước đưa vào solver.

