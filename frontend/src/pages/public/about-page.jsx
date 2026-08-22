import { ArrowRight, Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { Button } from '@/components/ui/button';
import { mediaUrl, publicApi } from '@/lib/api/public-api';

const DEFAULT_CONTENT = {
  eyebrow: 'Về Midi Cosmetics',
  title: 'Một không gian làm đẹp được tuyển chọn bằng sự tinh tế.',
  intro:
    'Midi Cosmetics mang đến mỹ phẩm, sản phẩm chăm sóc cá nhân và hương thơm chính hãng, được lựa chọn phù hợp với nhu cầu và nhịp sống của người Việt.',
  imageUrl: '/images/products/midi-body-cream.svg',

  eyebrow2: 'Câu chuyện của MIDI',
  title2: 'Bắt đầu từ mong muốn làm đẹp đơn giản và đáng tin cậy hơn.',
  intro2:
    'Được thành lập với mong muốn xây dựng một nơi mua sắm mỹ phẩm gần gũi, minh bạch và dễ lựa chọn, Midi Cosmetics luôn ưu tiên trải nghiệm thực tế thay vì chạy theo những xu hướng ngắn hạn.',
  imageUrl2: '/images/products/midi-body-cream.svg',

  foundedLabel: 'Thành lập',
  foundedYear: '2024',
  storyParagraph:
    'Chúng tôi tin rằng mỗi sản phẩm tốt không chỉ nằm ở vẻ ngoài đẹp mắt, mà còn cần có nguồn gốc rõ ràng, trải nghiệm sử dụng dễ chịu và phù hợp với người dùng.',

  valuesEyebrow: 'Điều MIDI trân trọng',
  valuesTitle: 'Chân thành trong từng lựa chọn.',

  sectionEyebrow: 'Cách MIDI lựa chọn',
  sectionTitle: 'Ít hơn, nhưng đúng hơn.',
  paragraphOne:
    'Mỗi sản phẩm được cân nhắc dựa trên công thức, trải nghiệm sử dụng, nguồn gốc và khả năng phù hợp với khí hậu Việt Nam.',
  paragraphTwo:
    'Chúng tôi không yêu cầu bạn tạo tài khoản hay đi qua một quy trình mua hàng dài. Bạn chỉ cần chọn sản phẩm, tạo phiếu và trò chuyện trực tiếp với cửa hàng để được tư vấn và xác nhận.',
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Nguồn gốc rõ ràng',
    description:
      'Ưu tiên sản phẩm chính hãng, thông tin minh bạch và có xuất xứ đáng tin cậy.',
  },
  {
    icon: Heart,
    title: 'Tuyển chọn có chủ đích',
    description:
      'Không chạy theo số lượng. Mỗi sản phẩm đều được cân nhắc về chất lượng và trải nghiệm.',
  },
  {
    icon: MessageCircle,
    title: 'Tư vấn gần gũi',
    description:
      'Lắng nghe nhu cầu thực tế để giúp khách hàng lựa chọn sản phẩm phù hợp hơn.',
  },
];

export function AboutPage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    publicApi
      .about()
      .then((response) => {
        setContent((current) => ({
          ...current,
          ...(response.data.content || {}),
        }));
      })
      .catch(() => { });
  }, []);

  return (
    <main className="overflow-hidden pb-20 sm:pb-28">
      {/* Hero */}
      <section className="bg-secondary">
        <div className="grid min-h-[36rem] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 sm:py-20 lg:px-[max(4rem,8vw)]">
            <p className="midi-eyebrow">{content.eyebrow}</p>

            <h1 className="mt-5 max-w-2xl font-display text-5xl font-normal leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {content.title}
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {content.intro}
            </p>

            <div className="mt-9">
              <Button asChild variant="outline" className="midi-link-arrow">
                <Link to={ROUTE_PATHS.products}>
                  Khám phá sản phẩm
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative min-h-[28rem] lg:min-h-full">
            <ImageWithFallback
              src={mediaUrl(content.imageUrl)}
              alt="Không gian và sản phẩm tại Midi Cosmetics"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 border border-white/30 bg-white/90 px-5 py-4 backdrop-blur-sm sm:bottom-8 sm:left-8">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Mỹ phẩm tuyển chọn
              </p>
              <p className="mt-1 font-display text-xl">
                Tinh tế · Gần gũi · Tin cậy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Câu chuyện cửa hàng */}
      <Container className="py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden bg-muted">
              <ImageWithFallback
                src={mediaUrl(content.imageUrl2)}
                alt="Câu chuyện của Midi Cosmetics"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>

            <div className="absolute -bottom-6 right-0 bg-background px-7 py-5 shadow-sm sm:right-8">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {content.foundedLabel}
              </p>
              <p className="mt-1 font-display text-4xl tracking-[-0.04em]">
                {content.foundedYear}
              </p>
            </div>
          </div>

          <div className="pt-4 lg:pl-4">
            <p className="midi-eyebrow">{content.eyebrow2}</p>

            <h2 className="mt-5 max-w-xl font-display text-4xl font-normal leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              {content.title2}
            </h2>

            <div className="mt-7 max-w-xl space-y-5 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              <p>{content.intro2}</p>
              <p>{content.storyParagraph}</p>
            </div>

            <div className="mt-9 h-px w-20 bg-foreground/30" />

            <p className="mt-6 max-w-md font-display text-2xl leading-snug tracking-[-0.02em]">
              “Đẹp hơn mỗi ngày, theo một cách tự nhiên và vừa đủ.”
            </p>
          </div>
        </div>
      </Container>

      {/* Giá trị thương hiệu */}
      <section className="bg-secondary/60 py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="midi-eyebrow">{content.valuesEyebrow}</p>

            <h2 className="mt-4 font-display text-4xl font-normal leading-tight tracking-[-0.045em] sm:text-5xl">
              {content.valuesTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="group bg-background p-8 transition-colors duration-300 hover:bg-secondary/40 sm:p-10"
              >
                <Icon
                  className="h-5 w-5 stroke-[1.4]"
                  aria-hidden="true"
                />

                <h3 className="mt-8 font-display text-2xl tracking-[-0.025em]">
                  {title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Cách lựa chọn */}
      <Container className="py-20 sm:py-28">
        <div className="grid gap-10 border-b border-border pb-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="midi-eyebrow">{content.sectionEyebrow}</p>

            <h2 className="mt-4 max-w-md font-display text-4xl font-normal leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              {content.sectionTitle}
            </h2>
          </div>

          <div className="max-w-2xl space-y-6 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            <p>{content.paragraphOne}</p>
            <p>{content.paragraphTwo}</p>
          </div>
        </div>

        {/* Lời ngỏ */}
        <div className="flex flex-col items-start justify-between gap-8 pt-14 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="midi-eyebrow">Lời ngỏ từ MIDI</p>

            <p className="mt-4 font-display text-3xl leading-tight tracking-[-0.035em] sm:text-4xl">
              Cảm ơn bạn đã để Midi Cosmetics đồng hành trong những lựa chọn
              chăm sóc bản thân mỗi ngày.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="midi-link-arrow shrink-0"
          >
            <Link to={ROUTE_PATHS.products}>
              Xem bộ sưu tập
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}