# Đánh giá khả năng deploy SSO

Ngày kiểm tra: 13/11/2026. Phạm vi: source hiện tại của `single-sign-on`, Next.js 16.4.6, Better Auth và OAuth Provider 1.7.21, Bun 1.4.4. Không deploy, không sửa auth, không đọc nội dung `.env.local`, không chạy migration hoặc ghi registry cloud trong lượt đánh giá này.

**Kết luận: kiến trúc phù hợp Vercel, nhưng chưa đủ bằng chứng để chốt source hiện tại sẵn sàng production.** Build mặc định chưa hoàn thành trong môi trường kiểm tra; lint chưa đạt; cấu hình production và hành trình đăng nhập thật cần được xác minh trên deployment.

## Kết quả thực chạy

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| `bun run test` | 69 file, 434 test đạt | Vitest loại trừ `*.cloud.test.ts`; không chứng minh cloud schema hay OAuth end-to-end production. |
| `bun run typecheck --incremental false` | Đạt | Không thay thế build. |
| `bun run lint` | 12 lỗi, 2 cảnh báo | Lỗi `no-explicit-any` trong test; cảnh báo dependency effect trong OAuth editor và import không dùng ở dashboard shell. Đây là quality gate chưa đạt, không tự khẳng định Vercel sẽ chạy lint. |
| `bun run build` | Chưa đạt | Turbopack lỗi tại `styles/dashboard-flags.css`: tạo subprocess → mở cổng → `Operation not permitted`. Thử lại ngoài sandbox vẫn cùng lỗi. Chưa xác định lỗi có tái hiện trên Linux/Vercel; không kết luận CSS sai hoặc build cloud chắc chắn thất bại. |
| GET production `/health` | HTTP 200 | Health hiện chỉ phản hồi tiến trình, không kiểm tra DB/SMTP. |
| GET production `/.well-known/openid-configuration` | HTTP 200 | Chỉ xác nhận deployment đang online; không chứng minh deployment chứa source vừa sửa. |

## Những phần đã phù hợp

- Auth, API catch-all và các endpoint cần Node khai báo `runtime = "nodejs"`; không có yêu cầu custom listener cho SSO.
- Better Auth dùng Drizzle PostgreSQL; `getAuth` khởi tạo một lần mỗi runtime, nạp scope revision từ DB. Hono composition cũng được tái sử dụng.
- Better Auth rate limit dùng database khi production; Hono dùng atomic PostgreSQL upsert, không phụ thuộc Map riêng từng instance.
- Tác vụ email và background task được đưa vào `waitUntil`; production cookie có Secure/HttpOnly, kiểm tra origin do Better Auth sở hữu vẫn được giữ.
- Secret OAuth được tạo ở server; metadata trả cho trình duyệt và registry không thay thế kiểm tra token, scope hay quyền nghiệp vụ.
- Bun lockfile hiện có; phiên bản Better Auth/OAuth Provider trong lock là 1.7.21.

## Điều kiện cần chốt trước phát hành

1. **Build production:** chạy thành công `bun run build` trên môi trường có quyền mở cổng IPC của Turbopack, hoặc Vercel Preview trước khi promote. Không dùng kết quả build cũ để chứng nhận source hiện tại.
2. **Quality gate:** xử lý 12 lỗi lint và xem xét 2 cảnh báo. Các file bị lỗi: `tests/commerce-access.test.ts`, `commerce-bearer.test.ts`, `commerce-credential-native.test.ts`, `commerce-notification.test.ts`, `commerce-organization.test.ts`, `commerce-team-plugin.test.ts`, `oauth-credential.test.ts`, `unified-oauth-client-native.test.ts`.
3. **Vercel Production env:** giữ nguyên `BETTER_AUTH_SECRET`; đặt `BETTER_AUTH_URL` và `NEXT_PUBLIC_APP_URL` về đúng origin SSO ổn định. Cấu hình `DATABASE_URL`, scope revision đã xuất bản tương ứng (`.env.example` hiện ghi 5), SMTP và Google credentials nếu dùng. Local build tự nạp env không chứng minh Vercel đã có các biến đó. Better Auth yêu cầu secret ít nhất 32 ký tự, entropy cao.
4. **Cloud schema:** kiểm tra deployment kết nối đúng DB và đã có `team_member`, `event_log`, registry scope/resource cùng các migration cần thiết. Lượt này không chạy lại cloud suite hay migration; không suy ra trạng thái cloud từ schema TypeScript.
5. **Registry:** kiểm tra đúng client confidential đã đăng ký Basic, callback/logout URI, resource audience và grant production. Policy Basic khi đăng ký mới không tự chuyển toàn bộ client cũ trong DB; không đổi issuer khi deploy.
6. **Smoke test thực:** đăng nhập email/OTP và Google nếu bật; authorize PKCE → callback → Basic token exchange; refresh/revoke/logout; API nghiệp vụ Bearer; từ chối redirect lạ, scope sai và truy cập admin trái quyền. Thử từ ít nhất một app production thật, không chỉ test fixture.

## Những điểm nên theo dõi

- `next.config.ts` còn placeholder `transpilePackages: [""]`, `allowedDevOrigins: [""]`. Chưa có bằng chứng đây là nguyên nhân build fail; nên xóa hoặc điền giá trị thực khi chỉnh cấu hình.
- PostgreSQL pool tái sử dụng qua `globalThis`, tối đa mặc định 5 kết nối **mỗi instance**. Cần đối chiếu giới hạn DB/pooler với số instance; chưa có `attachDatabasePool` trong adapter hiện tại. Đây là điểm vận hành cần đánh giá theo tải, không phải lỗi build đã xác nhận.
- SMTP sử dụng `waitUntil` nhưng lỗi gửi được ghi log; thành công HTTP không đảm bảo người dùng nhận OTP. Cần thử delivery trên môi trường production.
- Không có bước deploy hoặc phiên quản trị Vercel trong lượt này, nên chưa xác minh project settings, runtime Node được chọn, deployment protection hoặc production environment variables.

## Tài liệu đối chiếu

- [Better Auth 1.7 documentation index](https://better-auth.com/llms.txt)
- [Better Auth installation: URL và secret](https://better-auth.com/docs/installation)
- [OAuth Provider: PKCE, client authentication và exact redirect](https://better-auth.com/docs/plugins/oauth-provider)
- [Vercel Node.js runtime và Next.js Route Handlers](https://vercel.com/docs/functions/runtimes/node-js)

Đã đối chiếu thêm tài liệu Next.js đi kèm bản cài tại `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` và `01-app/02-guides/production-checklist.md`.
