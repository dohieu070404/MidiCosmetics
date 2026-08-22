# Quy ước code Midi Cosmetics

Mục tiêu của dự án là ưu tiên code dễ đọc, dễ tìm lỗi và hạn chế thay đổi hành vi ngoài ý muốn.

## Định dạng tự động

- Frontend: chạy `npm run format` trong thư mục `frontend`.
- Backend: chạy `npm run format` trong thư mục `backend`.
- Kiểm tra mà không sửa file: chạy `npm run format:check` trong từng thư mục.
- Chiều dài dòng mục tiêu là 100 ký tự. Prettier sẽ tự xuống dòng cho JSX, object, mảng, lời gọi hàm và chuỗi biểu thức dài.

## Nguyên tắc bảo trì

- Mỗi hàm chỉ nên đảm nhiệm một công việc rõ ràng.
- Đặt tên theo mục đích nghiệp vụ; tránh tên một ký tự trừ biến lặp rất ngắn.
- Tách điều kiện phức tạp thành biến có tên hoặc helper function.
- Không lồng ternary nhiều tầng. Ưu tiên `if`, `switch` hoặc helper có tên.
- Controller chỉ nhận request và trả response; nghiệp vụ và truy vấn dữ liệu đặt ở service.
- Component trang chỉ điều phối dữ liệu và bố cục; logic dùng lại đặt trong hook, helper hoặc component con.
- Giữ nguyên cấu trúc response API và tên route khi tái cấu trúc để không làm hỏng frontend.

## Kiểm tra trước khi đưa lên production

1. Chạy `npm run format:check` ở frontend và backend.
2. Chạy `npm run lint` và `npm run build` ở frontend.
3. Chạy `npm run check:syntax` và `npm run prisma:generate` ở backend.
4. Kiểm tra lại các luồng admin, giỏ hàng và tạo phiếu trên môi trường staging.
