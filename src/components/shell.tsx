import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_PHONE_TEL } from "@/lib/contact";
import { CareChat } from "@/components/care-chat";
import { useTx } from "@/lib/i18n";
import type { Lang } from "@/lib/store";

type MenuItem = {
  to: "/" | "/dich-vu" | "/an-toan" | "/phu-song" | "/ve-chung-toi" | "/dang-ky" | "/cong-thong-tin" | "/login" | "/tuyen-dung";
  search?: { tab: "order" | "watch" | "pay" };
  vi: string;
  en: string;
};

const MENUS: { vi: string; en: string; items: MenuItem[] }[] = [
  {
    vi: "Vận chuyển",
    en: "Shipping",
    items: [
      { to: "/cong-thong-tin", search: { tab: "order" }, vi: "Tạo đơn", en: "Create an order" },
      { to: "/dich-vu", vi: "Ước tính cước", en: "Estimate the fee" },
      { to: "/cong-thong-tin", search: { tab: "watch" }, vi: "Theo dõi đơn", en: "Track an order" },
      { to: "/phu-song", vi: "Địa bàn phủ sóng", en: "Coverage" },
    ],
  },
  {
    vi: "Dịch vụ",
    en: "Services",
    items: [
      { to: "/dich-vu", vi: "Ba gói", en: "Three packages" },
      { to: "/an-toan", vi: "An toàn hàng hóa", en: "Goods safety" },
      { to: "/cong-thong-tin", search: { tab: "pay" }, vi: "Thanh toán", en: "Payment" },
    ],
  },
  {
    vi: "Đồng hành cùng ELECMOVE",
    en: "With ELECMOVE",
    items: [
      { to: "/tuyen-dung", vi: "Tuyển dụng tài xế", en: "Courier recruitment" },
    ],
  },
  {
    vi: "Trung tâm trợ giúp",
    en: "Help centre",
    items: [
      { to: "/an-toan", vi: "Khiếu nại và niêm phong", en: "Claims and seals" },
      { to: "/ve-chung-toi", vi: "Cam kết và phương pháp", en: "Commitments and method" },
    ],
  },
];

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CareChat />
    </div>
  );
}

function Header() {
  const { lang, setLang, tx } = useTx();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold text-navy">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-navy text-navy">
            <Zap className="h-4 w-4" aria-hidden="true" />
          </span>
          ELECMOVE
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label={tx("Điều hướng chính", "Primary")}>
          <Link
            to="/"
            className={path === "/" ? "inline-flex h-11 items-center px-2 text-sm font-semibold text-teal" : "inline-flex h-11 items-center px-2 text-sm font-medium text-ink"}
          >
            Home
          </Link>
          {MENUS.map((menu) => (
            <div key={menu.vi} className="group relative">
              <button type="button" className="inline-flex h-11 items-center gap-1 px-2 text-sm font-medium text-ink">
                {lang === "vi" ? menu.vi : menu.en}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="absolute left-0 top-11 z-30 hidden min-w-52 rounded-md border border-line bg-card py-1 shadow-sm group-hover:block group-focus-within:block">
                {menu.items.map((item) => (
                  <MenuLink key={`${menu.vi}-${item.vi}`} item={item} lang={lang} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitch lang={lang} setLang={setLang} />
          <Link
            to="/login"
            className="hidden h-11 items-center rounded-full bg-navy px-4 text-sm font-semibold text-paper sm:inline-flex"
          >
            {tx("Đăng nhập", "Sign in")}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-navy lg:hidden"
            aria-expanded={open}
            aria-label={open ? tx("Đóng menu", "Close menu") : tx("Mở menu", "Open menu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-line bg-paper px-4 py-3 lg:hidden" aria-label={tx("Điều hướng di động", "Mobile")}>
          <Link to="/" className="flex h-11 items-center text-sm font-semibold text-teal" onClick={() => setOpen(false)}>
            Home
          </Link>
          {MENUS.map((menu) => (
            <div key={menu.vi} className="border-t border-line py-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {lang === "vi" ? menu.vi : menu.en}
              </p>
              {menu.items.map((item) => (
                <MenuLink key={`${menu.vi}-${item.vi}`} item={item} lang={lang} onDone={() => setOpen(false)} />
              ))}
            </div>
          ))}
          <Link
            to="/login"
            className="mt-2 flex h-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-paper"
            onClick={() => setOpen(false)}
          >
            {tx("Đăng nhập", "Sign in")}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}

function MenuLink({ item, lang, onDone }: { item: MenuItem; lang: Lang; onDone?: () => void }) {
  const label = lang === "vi" ? item.vi : item.en;
  const className = "flex h-11 items-center px-3 text-sm font-medium text-ink";
  if (item.search) {
    return (
      <Link to="/cong-thong-tin" search={item.search} className={className} onClick={onDone}>
        {label}
      </Link>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onDone}>
      {label}
    </Link>
  );
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return (
    <div className="flex h-11 items-center gap-1" role="group" aria-label="Language">
      {(["vi", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={
            lang === code
              ? "h-8 rounded px-1.5 text-xs font-semibold uppercase text-navy"
              : "h-8 rounded px-1.5 text-xs font-semibold uppercase text-muted"
          }
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function Footer() {
  const { tx } = useTx();
  return (
    <footer className="mt-16 border-t border-line bg-navy text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">ELECMOVE</p>
          <p className="mt-2 text-sm text-paper/80">
            {tx(
              "Giao hàng chặng cuối cao cấp trên hành lang Thành phố Hồ Chí Minh, Bình Dương và Đồng Nai.",
              "Premium last-mile delivery on the Ho Chi Minh City, Binh Duong, and Dong Nai corridor.",
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/dich-vu" className="inline-flex h-11 items-center text-paper/90">
            {tx("Gói dịch vụ", "Services")}
          </Link>
          <Link to="/an-toan" className="inline-flex h-11 items-center text-paper/90">
            {tx("An toàn hàng hóa", "Goods safety")}
          </Link>
          <Link to="/phu-song" className="inline-flex h-11 items-center text-paper/90">
            {tx("Phủ sóng", "Coverage")}
          </Link>
          <Link to="/ve-chung-toi" className="inline-flex h-11 items-center text-paper/90">
            {tx("Đồng sáng lập", "Founders")}
          </Link>
          <Link to="/login" className="inline-flex h-11 items-center text-paper/90">
            {tx("Đăng nhập", "Sign in")}
          </Link>
        </div>
        <div>
          <p className="text-sm font-semibold">{tx("Liên hệ ELECMOVE", "Contact ELECMOVE")}</p>
          <a href={`mailto:${COMPANY_EMAIL}`} className="mt-2 inline-flex h-11 items-center text-sm font-semibold text-paper">
            {COMPANY_EMAIL}
          </a>
          <a href={`tel:${COMPANY_PHONE_TEL}`} className="flex h-11 items-center text-sm font-semibold text-paper">
            {COMPANY_PHONE}
          </a>
        </div>
      </div>
    </footer>
  );
}

export const inputClass =
  "h-11 w-full rounded-md border border-line bg-card px-3 text-sm text-ink outline-none transition-colors focus:border-teal";

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-warn"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
