# C1 — System context

```mermaid
flowchart LR
 G[Guest] -->|Xem danh mục| S[SmartTrip AI]
 T[Traveler] -->|Lập và điều chỉnh kế hoạch| S
 A[Admin] -->|Quản trị dữ liệu| S
 S -->|Gọi khi có quyền truy cập| M[Provider dữ liệu và routing]
 S -->|Trích xuất và diễn giải| L[LLM provider chưa chọn]
```

M và L là dependency target, chưa có key/quyền truy cập. Agent không trực tiếp chỉnh DB hoặc bỏ ràng buộc. Bên ngoài không nhận dữ liệu riêng người dùng quá mức cần thiết. Prototype không gọi M/L, không có backend.
