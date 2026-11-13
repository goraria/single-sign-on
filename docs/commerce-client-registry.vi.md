# Ánh xạ Commerce client từ OAuth registry

SSO không còn đọc NEXT_OAUTH_COMMERCE_CLIENT_BINDINGS hoặc allowlist client ID cố định. Không cần thêm cột/bảng hay migrate schema: cấu hình nằm trong metadata JSON và scopes của oauth_client.

Form OAuth client có mục Commerce application: Marketplace, Restaurant hoặc Auto from registered scopes. Giá trị explicit lưu vào metadata.commerceApplication qua API quản trị native Better Auth; các metadata khác được giữ nguyên. Auto ưu tiên metadata.application hiện có, sau đó lấy namespace duy nhất marketplace/restaurant trong scopes đọc/ghi đã được đăng ký trong DB. Không dùng scopes do request tự khai báo để chọn ứng dụng.

Chỉ client centrally managed (referenceId=sso-administration), đang enabled và có liên kết tới resource Commerce enabled được chấp nhận. Metadata explicit phải khớp app scopes đã đăng ký; thiếu/mơ hồ/sai cấu hình thì fail closed. Token tiếp tục qua verifier Better Auth với issuer, audience, chữ ký, TTL, scope theo ứng dụng, subject người dùng và client_id khớp header. Mỗi request đọc registry mới; không cần redeploy khi admin thay mapping.

Client cũ có đúng một namespace trong scopes tiếp tục dùng Auto, không phụ thuộc ID cũ/mới. Client nhiều namespace cần admin chọn explicit. Việc chọn app không tự cấp scope hoặc quyền org/team. Client bị chuyển từ unmanaged cần admin adopt qua giao diện trước khi dùng bridge.

Đã bỏ biến khỏi .env.example và utils/environment.ts. Không đọc/sửa .env.local; có thể xóa biến cũ khỏi cấu hình riêng tư. Restart/deploy SSO một lần để áp dụng code mới; không thay đổi genericOAuth, client secret, Basic/Bearer hay service bindings NITRO_OAUTH_CLIENT_BINDINGS.

Kiểm tra: typecheck passed; toàn bộ Vitest 69 file / 434 test passed, gồm mapping ID mới bất kỳ, metadata không khớp scope, client không centrally managed, mapping mơ hồ, thay đổi registry giữa các request và kiểm tra scope theo ứng dụng lấy từ DB.
