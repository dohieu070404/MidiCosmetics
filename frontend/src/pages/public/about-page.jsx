import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { Button } from '@/components/ui/button';
import { mediaUrl, publicApi } from '@/lib/api/public-api';

const DEFAULT_CONTENT = {
  eyebrow: 'Về Midi Cosmetics',
  title: 'Vẻ đẹp nên nhẹ nhàng, tinh tế và dễ duy trì.',
  intro:
    'Midi Cosmetics xây dựng một không gian tuyển chọn mỹ phẩm, chăm sóc cá nhân và hương thơm chính hãng dành cho người Việt.',
  imageUrl: '/images/products/midi-body-cream.svg',
  eyebrow2: 'Về Midi Cosmetics',
  title2: 'Vẻ đẹp nên nhẹ nhàng, tinh tế và dễ duy trì.',
  intro2: 'Midi Cosmetics xây dựng một không gian tuyển chọn mỹ phẩm, chăm sóc cá nhân và hương thơm chính hãng dành cho người Việt.',
  imageUrl2: '/images/products/midi-body-cream.svg',
  sectionEyebrow: 'Cách MIDI lựa chọn',
  sectionTitle: 'Ít hơn, nhưng đúng hơn.',
  paragraphOne:
    'Mỗi sản phẩm được cân nhắc dựa trên công thức, trải nghiệm sử dụng, nguồn gốc và khả năng phù hợp với khí hậu Việt Nam.',
  paragraphTwo:
    'Chúng tôi không yêu cầu bạn tạo tài khoản hay đi qua một quy trình mua hàng dài. Bạn chỉ cần chọn sản phẩm, tạo phiếu và trò chuyện trực tiếp với cửa hàng để xác nhận.',
};

export function AboutPage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    publicApi
      .about()
      .then((response) =>
        setContent((current) => ({ ...current, ...(response.data.content || {}) })),
      )
      .catch(() => { });
  }, []);
  return (
    <div className="pb-24">
      <section className="grid min-h-[38rem] bg-secondary lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-20 sm:px-12 lg:px-[max(4rem,8vw)]">
          <p className="midi-eyebrow">{content.eyebrow}</p>
          <h1 className="mt-5 font-display text-6xl font-normal leading-[.93] tracking-[-0.06em] sm:text-7xl">
            {content.title}
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-8 text-muted-foreground">{content.intro}</p>
        </div>
        <ImageWithFallback
          src={mediaUrl(content.imageUrl)}
          alt="Sản phẩm Midi Cosmetics"
          className="h-full min-h-96 w-full object-cover"
        />
      </section>
      <section className="grid min-h-[38rem] bg-secondary lg:grid-cols-2">
        <ImageWithFallback
          src={mediaUrl(content.imageUrl)}
          alt="Sản phẩm Midi Cosmetics"
          className="h-full min-h-96 w-full object-cover"
        />
        <div className="flex flex-col justify-center px-6 py-20 sm:px-12 lg:px-[max(4rem,8vw)]">
          <p className="midi-eyebrow">{content.eyebrow2}</p>
          <h1 className="mt-5 font-display text-6xl font-normal leading-[.93] tracking-[-0.06em] sm:text-7xl">
            {content.title2}
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-8 text-muted-foreground">{content.intro2}</p>
        </div>

      </section>
      <Container className="grid gap-10 py-20 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="midi-eyebrow">{content.sectionEyebrow}</p>
          <h2 className="mt-4 font-display text-5xl font-normal leading-[.96] tracking-[-0.05em]">
            {content.sectionTitle}
          </h2>
        </div>
        <div className="space-y-6 text-base leading-8 text-muted-foreground">
          <p>{content.paragraphOne}</p>
          <p>{content.paragraphTwo}</p>
          <Button asChild variant="outline" className="midi-link-arrow">
            <Link to={ROUTE_PATHS.products}>
              Khám phá tuyển chọn <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
