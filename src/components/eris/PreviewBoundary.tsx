import type { ReactNode } from "react";
import { usePreview } from "@/lib/eris/preview";
import { EmptyState, ErrorState, LoadingState } from "./Workspace";

export function PreviewBoundary({ children }: { children: ReactNode }) {
  const { viewState, setViewState } = usePreview();
  if (viewState === "loading") return <LoadingState />;
  if (viewState === "empty") return <div className="panel"><EmptyState title="Không có dữ liệu trong trạng thái này" description="Đây là trạng thái trống có chủ đích để bạn đánh giá bố cục và nội dung hướng dẫn." action={<button type="button" className="btn btn-secondary" onClick={() => setViewState("populated")}>Xem dữ liệu minh họa</button>} /></div>;
  if (viewState === "error") return <ErrorState onRetry={() => setViewState("populated")} />;
  return children;
}
