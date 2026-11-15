import { createFileRoute } from "@tanstack/react-router";
import { PreviewChooser } from "@/components/eris/PublicPages";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/")({ head: () => pageHead("Chọn vai trò xem thử · ERIS", "Chọn Admin, HR hoặc Employee để khám phá giao diện ERIS với dữ liệu minh họa."), component: PreviewChooser });
