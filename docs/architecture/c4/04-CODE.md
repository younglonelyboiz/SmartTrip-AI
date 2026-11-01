# C4 — Code/module mapping

## Target interfaces (chưa code)
| Module | Input → Output | Trách nhiệm |
|---|---|---|
| recommend | preference, snapshot → CandidateScore[] | Xếp hạng, không quyết định lịch |
| optimize | TravelRequest, DatasetSnapshot, SolverConfig → OptimizationResult | Chọn điểm/tuyến, ghi trạng thái và bound |
| validate | request, snapshot, plan → ConstraintCheck[] | Kiểm tra độc lập |
| replan | parentVersion, updatedRequest, lockedPrefix → OptimizationResult | Giữ phần khóa, tạo version mới |
| agent | confirmed user context, tools → request draft / explanation | Không thay ràng buộc chưa xác nhận |

## Prototype code
`frontend/src/domain/types.ts` và `mocks/scenarios.json` dùng tên schema trong API. `services/mockTravelService.ts` chỉ tìm fixture khớp request, không optimize. `services/tripStorage.ts` quản lý localStorage namespace và version. `pages/` xử lý điều hướng; `components/` hiển thị timeline/cost/checks/SVG. `frontend/scripts/check-fixtures.mjs` kiểm tra dữ liệu mẫu; không phải thuật toán xây lịch.

Những file code ở đây không phải triển khai target interfaces trên. Snapshot và contract được giữ để sau này thay service mock bằng API mà không đổi nghĩa dữ liệu.
