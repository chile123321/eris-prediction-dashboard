import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/eris/PublicPages";
import { pageHead } from "@/lib/eris/head";

export const Route = createFileRoute("/")({
  head: () => pageHead("ERIS · Hiểu nhân viên sớm hơn, giữ chân đúng lúc", "Dự đoán nguy cơ nghỉ việc có giải thích và hỗ trợ quyết định nhân sự bằng dữ liệu, khảo sát và AI."),
  component: LandingPage,
});
