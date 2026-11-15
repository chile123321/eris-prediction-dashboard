import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PreviewProvider } from "@/lib/eris/preview";
import { pageHead } from "@/lib/eris/head";

export const Route = createFileRoute("/preview")({ head: () => pageHead("Xem thử giao diện · ERIS", "Khám phá toàn bộ giao diện ERIS bằng dữ liệu minh họa, không cần backend."), component: PreviewLayout });
function PreviewLayout() { return <PreviewProvider><Outlet /></PreviewProvider>; }
