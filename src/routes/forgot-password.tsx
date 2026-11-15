import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecovery } from "@/components/eris/PublicPages";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/forgot-password")({ head: () => pageHead("Khôi phục mật khẩu · ERIS", "Nhận mã OTP và đặt lại mật khẩu tài khoản ERIS."), component: () => <PasswordRecovery /> });
