import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Container } from "@/components/common/container";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminComingSoonPage() {
  return (
    <PageShell>
      <Container className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-2xl overflow-hidden rounded-[2rem] border-border bg-card/95 shadow-sm">
          <CardContent className="p-8 text-center sm:p-12">
            <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
              <Sparkles className="size-6" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Midi Cosmetics</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Khu vực quản trị đang được bảo vệ
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Trang này chỉ hiển thị thông báo giới thiệu. Các công cụ quản lý sản phẩm, blog và import Excel dành riêng cho chủ shop qua đường dẫn nội bộ đã được cấu hình riêng.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link to={ROUTE_PATHS.home}>
                  <ArrowLeft className="size-4" /> Về trang chủ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </PageShell>
  );
}
