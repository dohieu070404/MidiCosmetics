import { SectionHeading } from "@/components/brand/section-heading";
import { Card, CardContent } from "@/components/ui/card";

export function AdminPlaceholderPage({ title }) {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Quản trị"
        title={title}
        description="Khu vực này dùng để quản lý dữ liệu tương ứng trong hệ thống Midi Cosmetics."
      />
      <Card>
        <CardContent className="p-6 text-sm leading-7 text-muted-foreground">
          Nội dung chi tiết sẽ được hiển thị tại đây khi kết nối với dữ liệu thực tế.
        </CardContent>
      </Card>
    </div>
  );
}
