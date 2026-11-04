# Quản trị OAuth bằng DB

Better Auth và OAuth Provider giữ nguyên phiên bản 1.7.13. URL/policy client,
resource và liên kết client–resource dùng các bảng hiện có. Bảng mới
`oauth_scope_revision` chỉ lưu những phiên bản catalog scope đã xuất bản.

DB cloud đã được cập nhật và tách client trong phiên triển khai ngày 27/10/2026.
Xem kết quả và client ID local tại [biên bản migration](oauth-cloud-migration-vi.md).

## Triển khai lần đầu

Nếu cần lặp lại thao tác quản trị cloud, dùng script lấy cấu hình thực tế trong DB,
không lấy seed làm nguồn cập nhật policy:

```sh
pnpm exec drizzle-kit push --explain --output=json
pnpm exec drizzle-kit push
node database/migrate-oauth-administration.mjs
node database/migrate-oauth-administration.mjs --apply
```

Lệnh `node` không có `--apply` sẽ kiểm tra và rollback toàn bộ. Script chỉ tiếp nhận
client hệ thống chưa có chủ sở hữu người dùng; chỉ tách public client có PKCE,
không clone secret. Client confidential hoặc cấu hình xung đột cần review riêng.
Audit ghi nhận thao tác bằng `actorType=database-operator`, không giả danh master.
Lệnh dùng bộ nạp env hiện có, không in credentials. Chạy lại sau khi hoàn tất không
tạo thêm client, không sửa lại policy và không khôi phục liên kết đã bị gỡ.

1. Sao lưu và kiểm tra DB đích. Chạy migration bổ sung trước khi deploy code:

   ```sh
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/setup-oauth-registry.sql
   ```

   Lệnh dùng biến môi trường shell đã được cấu hình an toàn; không đọc
   `.env.local`. Migration không sửa client/resource/token/link hiện có.
   Revision 1 giữ đúng 31 scope provider cũ; không tự kích hoạt tên scope mới
   chỉ vì tên đó đã xuất hiện trong một policy DB.
   Chạy lại không thay đổi revision đã tồn tại.

2. Đặt `NEXT_OAUTH_SCOPE_REVISION=1` trên tất cả instance SSO, rồi deploy.
   Thiếu revision, cấu hình sai hoặc lỗi DB sẽ làm khởi tạo auth thất bại;
   không tự quay về một catalog scope khác.
3. Vào `/admin/oauth/client`, dùng tài khoản master để mở từng client cũ và
   bấm **Adopt for central management**. Thao tác chuyển ownership sang
   `sso-administration`, có audit; không đổi client ID, secret hoặc policy.
   Chỉ client do SSO quản lý chung mới được dùng để bổ sung trusted origins/CORS.
   Origin của chính SSO vẫn đến từ env, nên quản trị viên vẫn đăng nhập SSO được.
4. Tách từng client đang trộn local/production: tạo client local mới, giữ client
   ID production hiện tại, bỏ URL local khỏi bản production sau khi cập nhật
   consumer local. Không tự sao chép secret hoặc consent sang client mới.
   Việc đổi consumer client ID là một thay đổi cấu hình deployment riêng.

Seed JSON hiện có tách hai môi trường; các ID có hậu tố `-local` là dữ liệu
bootstrap, không phải fallback của client production. Seed không phải dữ liệu DB
thực tế. Không chạy lại seed để “đồng bộ” policy production. Các script seed
desktop/website cũ sẽ yêu cầu review nếu bản ghi thực tế khác manifest.

## Thêm ứng dụng / đổi domain

- Tạo ứng dụng ở `/admin/oauth/client/create`; chọn Local hoặc Production.
- Điền homepage, callback chính xác, URL sau logout và backchannel logout.
  Production chỉ dùng HTTPS; Local dùng địa chỉ loopback. Không trộn môi trường.
- Confidential client nhận secret một lần sau khi tạo; lưu vào secret manager
  trước khi chuyển trang. List/Get không trả secret.
- Public client dùng PKCE và `token_endpoint_auth_method=none`.
- Chọn scope từ revision đang hoạt động, không tự cấp mọi scope cho client mới.
- Tạo/chỉnh resource ở `/admin/oauth/resource`, rồi vào client để Link/Unlink
  các resource cần thiết. Có tìm kiếm/phân trang; không tự link tất cả service.
- Cấu hình client ID và URL/resource tương ứng ở deployment của ứng dụng.

Các URL này cập nhật qua DB/API quản trị, không phải sửa source SSO. Đổi domain
callback không tự đổi audience. Identifier resource là audience và được giữ
bất biến: nếu cần audience mới, tạo resource mới, chuyển client/service sang
audience mới rồi thu hồi resource cũ theo kế hoạch.

## Xuất bản scope mới

1. Kiểm tra các client cũ có scope ceiling rõ ràng. Catalog từ chối publish nếu
   còn client có `scopes = NULL`, vì Better Auth hiểu đó là không giới hạn scope.
   Dùng form client để đặt danh sách quyền tường minh trước.
2. Master vào `/admin/oauth/scope`, thêm tên scope, bấm Publish next revision.
3. Ghi lại số revision mới. Xuất bản không kích hoạt provider đang chạy.
4. Đặt `NEXT_OAUTH_SCOPE_REVISION` bằng số mới và deploy/restart đồng bộ tất cả
   instance. Với rollout có nhiều phiên bản chạy đồng thời, chỉ cấu hình client
   dùng scope mới sau khi rollout hoàn tất; không phân luồng auth giữa revision cũ/mới.
5. Sau đó mới thêm scope vào policy client/resource và cấu hình consumer.

Mỗi runtime khởi tạo Better Auth một lần từ revision được ghim; các request
đồng thời dùng chung promise. Không tạo instance mới cho từng request, không nạp
“revision mới nhất” tự động. Lỗi khởi tạo có thể retry, lỗi một request không thay
thế một instance đang hoạt động. Quay lại revision cũ phải đồng bộ cả các client
đã dùng scope mới. Catalog chỉ hỗ trợ thêm scope; bỏ/đổi scope cần migration
client, resource và grant riêng, không sửa lịch sử publication.

Scope máy–máy chỉ dành cho confidential client có grant `client_credentials`.
Thay đổi ceiling cần master. Khai báo catalog, liên kết resource và user consent
không tự cấp quyền máy–máy. Service vẫn kiểm tra issuer/audience/scope và quyền
trên dữ liệu. Thay đổi policy không làm JWT đã phát hành tự mất hiệu lực ngay.

## Bootstrap resource

`database/seed-oauth-resources.ts` yêu cầu cờ `--local` rõ ràng và chỉ thêm identifier còn thiếu. Không cập nhật
TTL, scope, metadata, trạng thái, không bật lại resource đã tắt và không khôi phục
link đã gỡ. Các URL localhost trong manifest chỉ là ví dụ local/bootstrap;
production được tạo qua giao diện quản trị, không lấy manifest đó làm nguồn chuẩn.

## Tài liệu và ranh giới tùy biến

- https://better-auth.com/docs/plugins/oauth-provider
- https://better-auth.com/docs/reference/options#trustedorigins

Client/resource CRUD, resource link, PKCE và kiểm tra redirect là Better Auth.
Catalog revision, quy trình publish/deploy và audit gateway là phần Gorth xây
thêm. Native API vẫn kiểm tra ownership; role admin không tự bỏ qua ownership.
Client mới thuộc reference quản trị chung, client cũ phải được master tiếp nhận
rõ ràng trước khi quản trị qua API native. Không sửa thư viện hoặc lockfile.
