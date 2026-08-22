import { ExternalLink, MapPin, Phone } from 'lucide-react';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { CONTACT_PHONE, SHOP_ADDRESS } from '@/constants/navigation';

export function ContactPage() {
  return (
    <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_.9fr]">
      <div>
        <p className="midi-eyebrow">Liên hệ MIDI</p>
        <h1 className="mt-5 max-w-3xl font-display text-6xl font-normal leading-[.94] tracking-[-0.06em] sm:text-7xl">
          Chúng tôi ở đây để giúp bạn chọn đúng.
        </h1>
        <p className="mt-7 max-w-xl text-sm leading-8 text-muted-foreground">
          Gửi phiếu sản phẩm qua Messenger hoặc liên hệ trực tiếp. Midi Cosmetics sẽ xác nhận giá,
          tồn kho và tư vấn theo nhu cầu của bạn.
        </p>
        <Button
          type="button"
          className="mt-8"
          onClick={() => window.open(env.MESSENGER_URL, '_blank', 'noopener,noreferrer')}
        >
          Mở Messenger Midi Cosmetics <ExternalLink />
        </Button>
      </div>
      <div className="h-fit border border-border bg-card p-6 sm:p-8">
        <div className="flex gap-4 border-b border-border pb-6">
          <Phone className="size-5 text-primary" />
          <div>
            <p className="midi-eyebrow text-muted-foreground">Điện thoại</p>
            <a href={CONTACT_PHONE.href} className="mt-2 block font-display text-2xl">
              {CONTACT_PHONE.label}
            </a>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <MapPin className="size-5 text-primary" />
          <div>
            <p className="midi-eyebrow text-muted-foreground">Địa chỉ</p>
            <p className="mt-2 font-display text-xl leading-7">{SHOP_ADDRESS}</p>
          </div>
        </div>
      </div>
    </Container>
  );
}
