import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecovery } from "@/components/eris/PublicPages";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/recovery")({ head: () => pageHead("Khôi phục mật khẩu minh họa · ERIS", "Xem luồng khôi phục mật khẩu ERIS bằng các bước mô phỏng."), component: () => <PasswordRecovery preview /> });
