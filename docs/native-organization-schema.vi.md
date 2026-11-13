# Chuẩn hóa Team và event log theo Better Auth

Ngày áp cloud: 2026-11-04. Better Auth đang cài: **1.7.13**. Phạm vi: SSO; không sửa các app, Commerce, package hoặc lockfile.

Cập nhật 2026-11-13 (Better Auth 1.7.21): đã đổi tên vật lý `teamMember` thành `team_member` trên cloud bằng `database/migrations/20261113-team-member-snake-case.sql`. Chỉ rename bảng/index, giữ khóa ngoại và dữ liệu; preflight có 0 hàng. Runner `bun database/migrate-team-member.mjs --apply` kiểm tra fingerprint và chạy lại an toàn. Migration lịch sử phía dưới vẫn mô tả cutover ngày 04/11, không chạy lại riêng sau rename này.

Cloud test: `bun --env-file=.env.local run test -- --config vitest.team-member.cloud.config.ts --configLoader native`. Bun nạp env trực tiếp cho tiến trình vì Next bỏ qua .env.local khi NODE_ENV=test; không in credentials.

Kết quả 13/11: migration đã COMMIT lên Neon; typecheck passed; 42 test liên quan passed; 6 test cloud passed, gồm native Organization API với nhiều team/role và migration chạy lại không đổi dữ liệu. Cần restart/deploy code SSO mới để khớp tên bảng trên cloud.

## Schema hiện tại

| Trước | Sau |
|---|---|
| `auth_team` đang được plugin sử dụng | `team` |
| `auth_team_member` → `teamMember` ngày 04/11 | `team_member` từ 13/11 |
| `team`, `team_member` legacy | Đã bỏ, vì cả hai bảng trống tại preflight và tại transaction áp migration |
| `authentication_event` | `event_log` |
| `authentication_event_type_enum` | `event_log_type_enum` |
| `invitation.team_id`: UUID + FK đơn | TEXT nullable, theo cách native lưu một hoặc nhiều team ID |

Model `teamMember` trong `betterAuthSchema` giữ nguyên tên native Better Auth, còn đối tượng Drizzle trỏ tới bảng vật lý `team_member`. `team` vẫn trỏ tới `team`. Không đổi `modelName` plugin hoặc tên field; các câu raw SQL quyền/thông báo và fixture cloud đã dùng `team_member`.

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
