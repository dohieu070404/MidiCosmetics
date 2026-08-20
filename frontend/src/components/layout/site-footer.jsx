import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Container } from "@/components/common/container";
import { CONTACT_PHONE, SHOP_ADDRESS, SOCIAL_LINKS } from "@/constants/navigation";

const footerGroups = [
  { title: "Khám phá", links: [["Sản phẩm", ROUTE_PATHS.products], ["Collections", ROUTE_PATHS.collections], ["Tạp chí Midi", ROUTE_PATHS.blog], ["Về MIDI", ROUTE_PATHS.about]] },
  { title: "Hỗ trợ", links: [["Liên hệ", ROUTE_PATHS.contact], ["Giỏ hàng", ROUTE_PATHS.cart], ["Cách tạo phiếu", ROUTE_PATHS.cart]] },
];

function FacebookIcon({ className = "" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M14.2 8H17V4h-3.3C10.5 4 9 5.9 9 9v2H6v4h3v7h4v-7h3.2l.8-4h-4V9.2c0-.8.4-1.2 1.2-1.2Z" /></svg>;
}

function InstagramIcon({ className = "" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>;
}

export function SiteFooter() {
  const socialIcon = (label) => label === "Facebook" ? FacebookIcon : InstagramIcon;
  return (
    <footer className="bg-[#251e1a] text-[#eee5d8]">
      <Container className="relative grid gap-0 py-14 sm:py-20 lg:grid-cols-[1.6fr_1fr_1fr_1.25fr] lg:gap-16 lg:py-24">
        <div className="border-b border-white/15 pb-8 lg:border-0 lg:pb-0"><h2 className="font-display text-7xl font-normal tracking-[-0.065em]">MIDI</h2><p className="mt-4 max-w-xs text-sm leading-7 text-white/55">Mỹ phẩm và nước hoa chính hãng, được tuyển chọn cho vẻ đẹp có chiều sâu.</p></div>
        {footerGroups.map((group) => <details key={group.title} className="border-b border-white/15 py-5 lg:border-0 lg:py-0" open><summary className="cursor-pointer list-none text-[0.74rem] font-semibold uppercase tracking-[0.13em]">{group.title}</summary><div className="mt-5 grid gap-3">{group.links.map(([label, href]) => <Link key={`${label}-${href}`} to={href} className="font-display text-lg text-white/65 hover:text-white">{label}</Link>)}</div></details>)}
        <div className="pt-7 lg:pt-0"><p className="text-[0.74rem] font-semibold uppercase tracking-[0.13em]">Liên hệ trực tiếp</p><p className="mt-5 font-display text-xl leading-7 text-white/75">Tư vấn thật lòng, chọn theo làn da thay vì trào lưu.</p><a href={CONTACT_PHONE.href} className="midi-link-arrow mt-5 inline-flex items-center gap-3 border-b border-white/50 pb-2 text-[0.78rem] font-semibold uppercase tracking-[0.09em]">{CONTACT_PHONE.label}<ArrowRight className="size-4" /></a><p className="mt-4 text-[0.78rem] leading-6 text-white/50">{SHOP_ADDRESS}</p></div>
        <div className="col-span-full mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-[0.7rem] uppercase tracking-[0.1em] text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Midi Cosmetics · Việt Nam</p><div className="flex items-center gap-2">{SOCIAL_LINKS.map((item) => { const Icon = socialIcon(item.label); return <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label} className="grid size-10 place-items-center rounded-full border border-white/20 text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:bg-white hover:text-[#251e1a]"><Icon className="size-[1.125rem]" /><span className="sr-only">{item.label}</span></a>; })}</div></div>
      </Container>
    </footer>
  );
}
