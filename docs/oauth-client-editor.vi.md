# OAuth client editor

Cập nhật 13/11/2026, Better Auth 1.7.21.

- Khi tạo, admin có thể nhập ID hợp lệ hoặc generate/copy ở cuối input. Bỏ trống để provider tự generate. Native generateClientId lấy ID yêu cầu qua AsyncLocalStorage theo từng request; không đổi ID bằng SQL. Unique constraint client_id của database vẫn ngăn trùng ID. Khi edit chỉ đọc/copy ID, theo lựa chọn đã xác nhận của người dùng.
- generateClientSecret dùng crypto.randomInt để chọn đều 32 ký tự trong A–Z, a–z, 0–9, không có ký tự đặc biệt. Native Better Auth tiếp tục hash/lưu/cấp secret và rotate; không nhận secret nhập tay. Secret đã cấp trước đây giữ nguyên cho tới khi operator rotate.
- Client ID/secret/environment có tỷ lệ 2/2/1. Secret input luôn disabled, không có nút show. Chỉ copy được secret vừa tạo/rotate; khi mở lại chỉ có ***** và nút copy disabled vì không thể khôi phục plaintext từ hash.
- Tạo xong chuyển thẳng đến edit. Secret chuyển qua bộ nhớ JS theo đúng record ID, được xóa khỏi handoff khi editor nhận và hết hạn sau 60 giây nếu không nhận; không dùng URL, cookie, localStorage hoặc sessionStorage. Rời/reload editor không khôi phục secret cũ; cần rotate.
- Cancel/Delete/Save thành công về danh sách client. Save disabled khi form không đổi hoặc đang lưu. Create thành công là ngoại lệ: chuyển tới edit để copy secret một lần.
- Protected resources dùng Primitive DataTable với tìm kiếm/phân trang server, badge Linked/Not linked và menu Link/Unlink. Khóa action khi chưa tải được quyền liên kết, đang mutation hoặc resource disabled chưa được link. Native resource authorization, master-only machine ceiling, issuer/audience/scope và Basic/Bearer được giữ nguyên.

Phạm vi code trong SSO, không đổi dependency/lockfile/schema, không tự rotate hoặc cấp lại client cloud. Deploy/restart SSO để sử dụng editor và generator mới.

Kiểm tra editor trước điều chỉnh độ dài: TypeScript passed; toàn bộ Vitest 69 file / 437 test passed. Test generator/native provider đã cập nhật để xác nhận secret create/rotate gồm đúng 32 ký tự chữ/số; test handoff xác nhận cách ly ID và hết hạn. Chưa chạy kiểm thử thao tác trực tiếp trên trình duyệt.
