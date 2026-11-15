import { createFileRoute } from "@tanstack/react-router";
import { AccountsView } from "@/components/eris/AdminPages";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/admin/users")({ head: () => pageHead("Tài khoản · Admin xem thử", "Quản lý tài khoản ERIS bằng dữ liệu minh họa."), component: Page });
function Page() { const preview = usePreview(); return <PreviewBoundary><AccountsView accounts={preview.accounts} preview onCreate={preview.createAccount} /></PreviewBoundary>; }
