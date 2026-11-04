# Kết quả migration OAuth trên cloud — 27/10/2026

Đã chạy `pnpm exec drizzle-kit push` vào DB cloud cấu hình của SSO. Dry run trước
khi chạy chỉ có bảng catalog và FK mới. Sau push, Drizzle trả `no_changes`.

| Hạng mục                           | Kết quả                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| Catalog                            | Revision 1, 31 scope giữ nguyên từ provider cũ          |
| Client ban đầu                     | 10, giữ ID và các quyền đã cấp                          |
| Client sau chuyển đổi              | 18, đều thuộc `sso-administration`                      |
| Web production                     | 8 client, chỉ chứa callback production                  |
| Local                              | 8 client web mới và 2 client native loopback giữ nguyên |
| Client trộn local/production       | 0                                                       |
| Client có scope ceiling NULL       | 0                                                       |
| Public client thiếu PKCE           | 0                                                       |
| Resource link cũ                   | Giữ nguyên cả 30 link                                   |
| Resource link cho client local mới | 30 link tương ứng đúng policy hiện tại của client gốc   |
| Audit                              | 19 bản ghi cho bootstrap, tiếp nhận và tạo client local |

Migration chạy trong transaction. Đã kiểm tra fingerprint các trường client được
bảo vệ, dữ liệu resource, liên kết gốc và số lượng bản ghi user/account/session/
token/consent/JWKS trước khi commit. Không sao chép token, consent hoặc secret sang
client mới. Audit không chứa credential hay metadata riêng tư.

Dry run sau commit trả `changes: []`, số client vẫn là 18; không phát sinh audit
hay link mới. Các domain production đã đăng ký của Chat được giữ đầy đủ, gồm cả
alias và domain chính, không thay bằng danh sách cũ trong seed.

Kiểm tra HTTP trên SSO production: `/auth/ok` trả 200. Bốn yêu cầu authorize của
Browser/Launcher, gồm cả client production và local mới, đều trả đường dẫn tiếp
tục tới `/auth/sign-in`. Dùng callback localhost với client production chuyển tới
`/auth/error`, xác nhận allowlist đã tách. Phép thử dừng tại trang đăng nhập,
chưa kiểm thử phiên người dùng đầy đủ hoặc phát token. Signed query không được
in ra log.

Kiểm tra source: TypeScript và lint các file migration qua; 26/26 test liên quan
qua, gồm lập kế hoạch migration, catalog, quyền quản trị và Better Auth native.

## Client ID dùng khi chạy local

Production giữ client ID cũ. Những ứng dụng chạy localhost cần cấu hình ID mới:

| Ứng dụng         | Origin local            | Client ID local                            |
| ---------------- | ----------------------- | ------------------------------------------ |
| Chat             | `http://localhost:3030` | `gorth-interactive-messaging-portal-local` |
| Video            | `http://localhost:3031` | `gorth-video-streaming-platform-local`     |
| Reader           | `http://localhost:3032` | `gorth-content-reader-platform-local`      |
| Social           | `http://localhost:3033` | `gorth-social-networking-portal-local`     |
| Task             | `http://localhost:3034` | `gorth-task-productivity-suite-local`      |
| Marketplace      | `http://localhost:3035` | `gorth-online-marketplace-solution-local`  |
| Browser website  | `http://localhost:5503` | `gorth-browser-website-local`              |
| Launcher website | `http://localhost:5504` | `gorth-launcher-website-local`             |

Hai native client `gorth-browser` và `gorth-launcher` giữ nguyên ID/callback
loopback. Chúng không cần thêm một ID mới theo kiến trúc máy Intel/ARM hay OS.

Homepage và backchannel của hai website production đã chuyển sang đúng domain
production. Với những app chưa có backchannel trong DB, migration giữ NULL;
không tự bật endpoint chưa được cấu hình. Identifier audience/resource không đổi.

## Cấu hình và triển khai code

`.env.example` của SSO có `NEXT_OAUTH_SCOPE_REVISION=1`. Khi deploy code SSO,
cấu hình cùng giá trị trên mọi instance. Việc push DB không triển khai code hoặc
sửa env của Vercel và các ứng dụng tiêu thụ; cần cập nhật client ID local theo
bảng trên trong cấu hình runtime tương ứng.

Không có scope mới được thêm trong lần chuyển đổi này nên chưa xuất bản revision 2. Khi thêm scope, master publish catalog mới, đổi revision của deployment rồi
deploy/restart đồng bộ; sau khi hoàn tất mới cấp scope đó cho client/resource.
