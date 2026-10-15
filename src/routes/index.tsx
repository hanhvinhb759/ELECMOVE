import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FOUNDERS } from "@/lib/founders";
import { formatVnd, PACKAGE_RATES, PACKAGES } from "@/lib/catalog";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_PHONE_TEL } from "@/lib/contact";
import { Page } from "@/components/shell";
import { useTx } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { lang, tx } = useTx();
  const price = (value: number) =>
    lang === "vi" ? `${new Intl.NumberFormat("vi-VN").format(value)} đ` : formatVnd(value, "en");

  return (
    <Page>
      <section className="relative overflow-hidden bg-navy">
        <img src="/media/hero-street.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy/75" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="rounded-xl bg-paper p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-navy">
              {tx("Hành lang phía Đông", "Eastern corridor")}
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight text-navy sm:text-5xl">
              {tx(
                "Giao hàng chặng cuối cho hàng cần sự chắc chắn",
                "Last-mile delivery for goods that need certainty",
              )}
            </h1>
            <p className="mt-5 max-w-md text-base text-navy">
              {tx(
                "ELECMOVE không cạnh tranh bằng giá sàn. Chúng tôi giao đúng khung giờ đã chọn, giữ hàng nguyên vẹn và xuất gram khí nhà kính trên từng đơn.",
                "ELECMOVE does not compete on a price floor. We deliver inside the chosen window, keep the goods intact, and state the grams of greenhouse gas on each order.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dang-ky"
                className="inline-flex h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-semibold text-paper"
              >
                {tx("Đăng ký dùng thử", "Request a trial")}
              </Link>
              <a
                href="#goi"
                className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-card px-5 text-sm font-semibold text-navy"
              >
                {tx("Xem ba gói dịch vụ", "See the three packages")}
              </a>
            </div>
            <TrackLookup />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Fact
              title={tx("Khung giờ", "Time window")}
              body={tx("Giao đúng khung đã chọn.", "Deliver inside the chosen window.")}
            />
            <Fact
              title="95%"
              body={tx("Thành công ngay lần giao đầu.", "Succeed on the first attempt.")}
            />
            <Fact
              title="0,01%"
              body={tx("Trần thất lạc trên mỗi đơn.", "Loss ceiling on each order.")}
            />
            <Fact
              title={tx("0 ống xả", "No tailpipe")}
              body={tx("Chặng cuối không phát thải ống xả.", "The final leg emits nothing at the tailpipe.")}
            />
          </div>
        </div>
      </section>

      <section id="goi" className="bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-navy">
            {tx("Ba cách mua sự chắc chắn", "Three ways to buy certainty")}
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <Offer
              name="ELEC Standard"
              price={price(PACKAGES.standard.base)}
              body={tx("Trong ngày, hai khung tùy chọn, ảnh giao.", "Same day, two windows to choose, a delivery photo.")}
              note={kmNote(lang, "standard")}
            />
            <Offer
              name="ELEC Precise"
              price={price(PACKAGES.precise.base)}
              body={tx(
                "Một khung giờ, gọi trước 20 phút, tủ nhận nếu vắng.",
                "One chosen window, a call 20 minutes ahead, a locker if no one is there.",
              )}
              note={kmNote(lang, "precise")}
            />
            <Offer
              name="ELEC Secure"
              price={price(PACKAGES.secure.base)}
              body={tx(
                "Niêm phong, bồi thường đến 5 triệu đồng trong giá, báo cáo carbon.",
                "A seal, compensation up to 5 million VND inside the fee, and a carbon report.",
              )}
              note={kmNote(lang, "secure")}
            />
          </div>
          <p className="mt-6 text-sm text-muted">
            <Link to="/dich-vu" className="font-semibold text-navy">
              {tx("Mở bảng cước và ước lượng CO2e", "Open the fee table and the CO2e estimate")}
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 lg:grid-cols-3">
          <FunctionPhoto
            src="/media/courier-navy.jpg"
            title={tx("Xe máy điện hai bánh", "Electric motorcycle")}
            body={tx(
              "Dòng Dat Bike hoặc VinFast. Đồng phục xanh navy, không phải xanh của Grab hay Xanh SM.",
              "Dat Bike or VinFast type. A navy uniform, not Grab green and not Xanh SM cyan.",
            )}
          />
          <FunctionPhoto
            src="/media/van-navy.jpg"
            title={tx("Xe van điện", "Electric van")}
            body={tx(
              "Hàng to, hàng nặng, hoặc hàng nhỏ nhưng cần giữ cẩn thận.",
              "Large goods, heavy goods, or small goods that need careful handling.",
            )}
          />
          <FunctionPhoto
            src="/media/parcel-measure.jpg"
            title={tx("Kích thước và khối lượng", "Size and weight")}
            body={tx(
              "Dài, rộng, cao và nặng đi vào cước. Hàng nặng đi xa tính theo km và kg.",
              "Length, width, height, and weight enter the fee. Heavy goods over a long leg are priced by kilometre and kilogram.",
            )}
          />
          <FunctionPhoto
            src="/media/handover.jpg"
            title={tx("Giao tận người nhận", "Handed to the recipient")}
            body={tx(
              "Người nhận và điện thoại người nhận nằm riêng với bên gửi.",
              "The recipient and the recipient’s telephone are separate from the sender.",
            )}
          />
          <FunctionPhoto
            src="/media/pickup.jpg"
            title={tx("Lấy tại người gửi", "Collected from the sender")}
            body={tx(
              "Người gửi, điện thoại người gửi và địa chỉ lấy hàng là một nhóm.",
              "The sender, the sender’s telephone, and the pickup address are one group.",
            )}
          />
          <FunctionPhoto
            src="/media/packing.jpg"
            title={tx("Đóng gói xanh", "Green packing")}
            body={tx(
              "Tự đóng hoặc để ELECMOVE đóng bằng giấy kraft và carton tái chế.",
              "Pack it yourself, or let ELECMOVE pack it in kraft and recycled carton.",
            )}
          />
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-navy">{tx("Đồng sáng lập", "Founders")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FOUNDERS.map((person) => (
              <article key={person.email} className="rounded-xl border border-line bg-paper p-4">
                <h3 className="font-display text-xl font-semibold text-navy">{person.name}</h3>
                <a href={`mailto:${person.email}`} className="mt-2 block text-sm font-semibold text-navy">
                  {person.email}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-navy">
            {tx("Liên hệ ELECMOVE", "Contact ELECMOVE")}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted">
            {tx(
              "Doanh nghiệp gửi yêu cầu dùng thử hoặc hỏi về một chuyến đang giám sát qua hai kênh dưới đây.",
              "An enterprise sends a trial request, or asks about a leg under monitoring, through the two channels below.",
            )}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a href={`mailto:${COMPANY_EMAIL}`} className="inline-flex h-11 items-center text-sm font-semibold text-navy">
              {COMPANY_EMAIL}
            </a>
            <a href={`tel:${COMPANY_PHONE_TEL}`} className="inline-flex h-11 items-center text-sm font-semibold text-navy">
              {COMPANY_PHONE}
            </a>
          </div>
        </div>
      </section>
    </Page>
  );
}

function FunctionPhoto({ src, title, body }: { src: string; title: string; body: string }) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-card">
      <img src={src} alt="" className="h-44 w-full object-cover" />
      <div className="p-4">
        <h2 className="font-display text-xl font-semibold text-navy">{title}</h2>
        <p className="mt-2 text-sm text-muted">{body}</p>
      </div>
    </article>
  );
}

function TrackLookup() {
  const { tx } = useTx();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = code.trim();
    if (!id) return;
    void navigate({ to: "/cong-thong-tin", search: { tab: "watch", code: id } });
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <label className="text-sm font-semibold text-navy" htmlFor="track-code">
        {tx("Tra cứu mã vận đơn", "Track a shipment")}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="track-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="EM-XXXXX"
          className="h-12 w-full rounded-md border border-line bg-card px-3 text-base text-ink"
        />
        <button type="submit" className="inline-flex h-12 items-center justify-center rounded-md bg-navy px-5 text-sm font-semibold text-paper">
          {tx("Xem hành trình", "Open the trip")}
        </button>
      </div>
    </form>
  );
}

function kmNote(lang: "vi" | "en", id: "standard" | "precise" | "secure") {
  const rate = PACKAGE_RATES[id];
  const moto = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US").format(rate.moto);
  const van = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US").format(rate.van);
  return lang === "vi"
    ? `Phí gói, cộng ${moto} đồng/km xe máy điện hoặc ${van} đồng/km xe van theo quãng đường lấy–giao.`
    : `Package fee, plus ${moto} VND/km by motorcycle or ${van} VND/km by van on the pickup-to-delivery route.`;
}
function Fact({ title, body }: { title: string; body: string }) {
  const { tx } = useTx();
  return (
    <article className="rounded-xl border border-line bg-card p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">{tx("Cam kết", "Commitment")}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-navy">{body}</p>
    </article>
  );
}

function Offer({ name, price, body, note }: { name: string; price: string; body: string; note: string }) {
  return (
    <article className="flex flex-col rounded-xl border border-line bg-card p-6">
      <h3 className="font-display text-2xl font-semibold text-navy">{name}</h3>
      <p className="mt-3 font-display text-lg font-semibold text-navy">{price}</p>
      <p className="mt-3 text-sm text-ink">{body}</p>
      <p className="mt-6 text-sm text-muted">{note}</p>
    </article>
  );
}
