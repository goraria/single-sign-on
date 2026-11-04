# Chuẩn hóa Team và event log theo Better Auth

Ngày áp cloud: 2026-11-04. Better Auth đang cài: **1.7.13**. Phạm vi: SSO; không sửa các app, Commerce, package hoặc lockfile.

## Schema hiện tại

| Trước | Sau |
|---|---|
| `auth_team` đang được plugin sử dụng | `team` |
| `auth_team_member` đang được plugin sử dụng | `teamMember` |
| `team`, `team_member` legacy | Đã bỏ, vì cả hai bảng trống tại preflight và tại transaction áp migration |
| `authentication_event` | `event_log` |
| `authentication_event_type_enum` | `event_log_type_enum` |
| `invitation.team_id`: UUID + FK đơn | TEXT nullable, theo cách native lưu một hoặc nhiều team ID |

Hai model `team`/`teamMember` trong `betterAuthSchema` trỏ tới đúng bảng cùng tên; không cấu hình alias `modelName` cho team. Tên cột vẫn theo quy ước snake_case hiện có của toàn DB. Vì tên vật lý `teamMember` có chữ hoa, raw SQL phải dùng `"teamMember"`; Drizzle tự quote đúng tên.

Giữ `teamMember.role` mở rộng, mặc định `member`, các ràng buộc role và logic cấp quyền Commerce hiện có. Cập nhật các query quyền, fixture cloud và relations sang bảng mới. Bỏ relation invitation–team đơn vì một trường TEXT có thể chứa nhiều ID.

Không thay issuer, signing key, secret, cookie, session đăng nhập hoặc luồng OAuth của các app. Các bảng `role`, `permission`, `member_role`, `role_permission` vẫn được giữ; đây là RBAC riêng/cũ, không tự trở thành Dynamic Access Control của Better Auth.

## Tại sao invitation dùng TEXT

Adapter Organization trong package 1.7.13 lưu `teamIds.join(",")` và khi accept tách bằng `split(",")`. UUID + FK đơn không biểu diễn được lời mời nhiều team. Kiểm tra team thuộc org vẫn do native Organization API thực hiện; chuyển kiểu DB không biến trường này thành nguồn cấp quyền tùy ý cho browser.

Đã kiểm thử bằng **Better Auth + Drizzle + PostgreSQL thật**: tạo org/team, tạo lời mời hai team, accept, tạo membership có `membership_key` và role mặc định, cập nhật active org/team. Không thay bằng lời gọi SQL giả lập luồng nghiệp vụ này.

## Migration và bảo toàn dữ liệu

Source: `database/migrations/20261104-native-organization.sql`.

```sh
# Diễn tập; mặc định rollback
bun database/migrate-native-organization.mjs
# Commit cloud, đã được thực hiện
bun database/migrate-native-organization.mjs --apply
```

Runner dùng transaction REPEATABLE READ, advisory lock, lock timeout, fingerprint các bản ghi mục tiêu trước/sau và kiểm tra schema/dữ liệu các bảng public ngoài phạm vi. Migration không dùng DROP CASCADE; nếu legacy có dữ liệu hoặc có dependency ngoài dự kiến thì rollback, không âm thầm xóa/chuyển quyền. Bản ghi native, membership, invitation và event giữ nguyên ID/nội dung; đổi UUID thành TEXT giữ nguyên giá trị lời mời một team.

Preflight thực tế: bốn bảng team, invitation và authentication_event đều có 0 bản ghi. Migration đã commit; chạy lại cũng an toàn. Runner role lịch sử nhận diện schema mới và không tái tạo `auth_team_member`. Các migration SQL lịch sử trước cutover được giữ nguyên, không chạy riêng lẻ lại sau cutover.

DB hiện có **27 bảng** khai báo trong source thay vì 29. Không thêm bảng thay thế cho hai bảng legacy.

## Kiểm thử

- **3 test migration cloud trước cutover đạt**: bảo toàn fixture có dữ liệu, từ chối legacy có dữ liệu, rollback khi có FK ngoài dự kiến. Mọi fixture của ba ca này đều rollback. Suite này dành DB trước cutover và sẽ skip khi DB đã chuyển xong.
- **11 test cloud sau cutover đạt**: 5 native Organization/event-log + 6 hồi quy quyền Commerce. Chỉ tạo/dọn fixture riêng của test.
- **28 test liên quan schema/quyền/bearer/plugin đạt**; TypeScript đạt.
- Bộ Vitest SSO đầy đủ: **334 passed / 8 failed**, 56 file. Tám lỗi trùng nhóm đã tồn tại trước thay đổi: 6 resource-contract của app, 1 màu orbit GorCer, 1 storage credential mong 403 nhưng nhận 401. Không sửa các phần ngoài yêu cầu để làm xanh suite.

```sh
# Chỉ chạy trước cutover, hoặc trên bản DB trước migration
NODE_ENV=development bun run test -- --config vitest.migration-cloud.config.ts
# Hồi quy sau cutover
NODE_ENV=development bun run test -- --config vitest.commerce-cloud.config.ts
bun run typecheck
```

**Cần deploy/restart SSO với source mới** để runtime dùng các tên bảng mới. Database đã cập nhật, đây không phải bằng chứng production đã tự redeploy. Không cần đổi genericOAuth của các app. Không thay đổi enum OAuth client ngoài yêu cầu này.

Tham khảo: [Better Auth Organization](https://better-auth.com/docs/plugins/organization), [Database/schema](https://better-auth.com/docs/concepts/database).
