import { createFileRoute } from "@tanstack/react-router";
import { AccountDetailView } from "@/components/eris/AdminPages";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { EmptyState } from "@/components/eris/Workspace";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/admin/users_/$id")({ head: () => pageHead("Chi tiết tài khoản · Admin xem thử", "Trạng thái, lời mời và quy trình kích hoạt tài khoản ERIS minh họa."), component: Page });
function Page() { const { id } = Route.useParams(); const preview = usePreview(); const account = preview.accounts.find((item) => item.id === Number(id)); return <PreviewBoundary>{account ? <AccountDetailView account={account} preview onStatus={(status) => preview.setAccountStatus(account.id, status)} onInvite={() => preview.invite(account.id)} /> : <EmptyState title="Không tìm thấy tài khoản" description="Tài khoản minh họa này không tồn tại hoặc đã được đặt lại." />}</PreviewBoundary>; }
