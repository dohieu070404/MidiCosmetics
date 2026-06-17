import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/common/container";
import { Separator } from "@/components/ui/separator";
import { CONTACT_PHONE, SHOP_ADDRESS, SOCIAL_LINKS } from "@/constants/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e1d3c1]/80 bg-[#f4ecdf]/85 text-foreground dark:border-[#4a3b32] dark:bg-[#241c17]/95">
      <Container className="py-8 sm:py-10">
        <div className="grid gap-8 text-center sm:text-left lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <BrandLogo />
            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:mx-0">
              Your beauty, your scent, your confidence
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Kết nối</h2>
              <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Liên hệ</h2>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <a className="font-medium text-primary hover:text-primary/80" href={CONTACT_PHONE.href}>
                  {CONTACT_PHONE.label}
                </a>
                <p>{SHOP_ADDRESS}</p>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-3 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Midi Cosmetics</p>
          <p>Mỹ phẩm & nước hoa chính hãng</p>
        </div>
      </Container>
    </footer>
  );
}
