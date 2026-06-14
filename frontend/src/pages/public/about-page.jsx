import { SectionHeading } from "@/components/brand/section-heading";
import { Container } from "@/components/common/container";
import { PageShell } from "@/components/common/page-shell";

export function AboutPage() {
  return (
    <PageShell>
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <SectionHeading
          eyebrow="Về Midi Cosmetics"
          title="Chúng tôi tin rằng vẻ đẹp nên nhẹ nhàng, tinh tế và dễ duy trì."
        />
        <div className="space-y-6 text-base leading-8 text-muted-foreground">
          <p>
            Midi Cosmetics hướng đến những sản phẩm chăm sóc cá nhân có cảm giác mềm mại, bảng màu ấm và trải nghiệm sử dụng chỉn chu. Mỗi lựa chọn đều được đặt trong tinh thần tối giản nhưng vẫn đủ nổi bật.
          </p>
          <p>
            Từ skincare, body care, hair care, hương thơm đến mỹ phẩm và phụ kiện, Midi Cosmetics mong muốn tạo nên một không gian mua sắm rõ ràng, đẹp mắt và truyền cảm hứng cho routine hằng ngày.
          </p>
        </div>
      </Container>
    </PageShell>
  );
}
