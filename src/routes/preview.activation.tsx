import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecovery } from "@/components/eris/PublicPages";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/activation")({ head: () => pageHead("Kích hoạt tài khoản minh họa · ERIS", "Xem trạng thái OTP và thiết lập mật khẩu lần đầu của ERIS."), component: () => <PasswordRecovery preview activation /> });
