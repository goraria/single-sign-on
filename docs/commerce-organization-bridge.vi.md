# Bridge Organization và credential Media cho Commerce

Cập nhật 2026-11-05. Các thay đổi này nằm trong phạm vi SSO được phê duyệt cho Marketplace/Restaurant; genericOAuth của ứng dụng được giữ nguyên.

SSO sở hữu toàn bộ organization/member/team/teamMember/invitation. Endpoint bearer /auth/commerce/organization/[operation] là phần mở rộng Gorth, không phải API bearer sẵn có của Organization plugin. Nó xác minh OAuth bằng module Better Auth, kiểm tra binding resource/client và scope đọc/ghi, đối chiếu subject với phiên SSO đang hoạt động và gọi native OAuth UserInfo để kiểm tra grant bị thu hồi. Session chỉ được truyền nội bộ bằng AsyncLocalStorage trước khi gọi API native. Không tạo cookie giả, không nhận session do browser cung cấp.

Các thao tác được cho phép: list/create/update/leave organization; list/create/update/remove team; list/update-role/remove member; list/add/remove team member; invitation create/list/cancel/accept/reject và danh sách lời mời của chính user. Input strict; không cho caller truyền userId tạo org cho người khác hoặc chọn tên auth.api tùy ý.

Owner/admin org được đọc roster mọi team mà không cần assignment. Team manager vẫn là member cấp org: không có quyền mời/xóa member org hoặc tạo team từ role manager. Extension team-member-role chỉ đổi role thấp hơn trong đúng team, không tự nâng quyền hay sửa/cấp manager. Các thay đổi role team có audit transaction. Không khẳng định tất cả thao tác native khác đã có audit nghiệp vụ bổ sung.

Client confidential Media ban đầu là draft disabled. API quản trị POST /admin/gateway/sso-application/:id/credential:
- Kiểm tra quyền admin, CSRF và client managed/confidential.
- Client đã có secret: dùng native rotateClientSecret.
- Draft chưa có secret: serialize bằng cờ provisioning, dùng native adminCreateOAuthClient với resource/scope đã đăng ký; giữ client mới disabled và xóa draft chưa dùng. Nếu setup lỗi, cố dọn đăng ký mới và mở lại claim để retry.
- Native provider tự tạo ID/secret và hash. Lần đầu ID thay đổi; các lần rotate sau giữ ID.
- ID + secret chỉ xuất hiện trong response no-store và UI một lần; không ghi file/log/chat. Client mới chỉ bật sau khi operator cấu hình Media.
- Metadata storageCredentialReader giúp script registry nhận lại client native ở lần chạy sau, tránh tạo thêm draft.

Registry cloud đã có revision 2 (restaurant scopes), revision 3 (hai scope storage) và resource/binding được phê duyệt. Deploy SSO với NEXT_OAUTH_SCOPE_REVISION=3; sau đó đăng nhập lại các app. URL production phải đăng ký HTTPS thực tế. Các script registry bổ sung chỉ hai client app và Media, không mở wildcard resource.

Kiểm thử: sáu suite mục tiêu có 43 test qua, gồm verifier token ký thật, Organization/OAuth Provider dùng memory adapter thật và các ranh giới DB giả lập. TypeScript SSO qua. Full suite trước bốn case manager bổ sung: 348 qua / 8 lỗi (6 fixture app-resource-contract, 1 Orbit color, 1 storage-credential 403/401). Không thay đổi các policy ngoài phạm vi chỉ để làm xanh suite.

Chi tiết cấu hình, migration cloud, luồng upload và giới hạn nghiệm thu: [báo cáo Marketplace](../../online-marketplace-solution/docs/ecosystem-organization-integration.vi.md).
Nguồn: [Organization](https://better-auth.com/docs/plugins/organization), [Generic OAuth](https://better-auth.com/docs/plugins/generic-oauth). Quyền nghiệp vụ dữ liệu Commerce và teamMember.role vẫn là logic ứng dụng.
