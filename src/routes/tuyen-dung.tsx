import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Page, Field, inputClass } from "@/components/shell";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_PHONE_TEL } from "@/lib/contact";
import { useTx } from "@/lib/i18n";
import { useElec } from "@/lib/store";

export const Route = createFileRoute("/tuyen-dung")({ component: RecruitPage });

function RecruitPage() {
  const { tx } = useTx();
  const addDriver = useElec((state) => state.addDriver);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("Thành phố Hồ Chí Minh");
  const [vehicle, setVehicle] = useState<"moto" | "van">("moto");
  const [note, setNote] = useState("");
  const [done, setDone] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || phone.trim().length < 8) return;
    addDriver({ name: name.trim(), phone: phone.trim(), area, vehicle, note: note.trim() });
    setDone(name.trim());
  }

  return (
    <Page>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            {tx("Đồng hành cùng ELECMOVE", "With ELECMOVE")}
          </p>
          <h1 className="mt-2 font-display text-5xl font-semibold text-navy">
            {tx("Tuyển tài xế xe điện", "Electric courier roles")}
          </h1>
          <p className="mt-4 text-base text-ink">
            {tx(
              "ELECMOVE tuyển tài xế xe máy điện hai bánh và tài xế xe van điện trên hành lang Thành phố Hồ Chí Minh, Bình Dương và Đồng Nai. Đây là tuyển dụng đội giao, không phải tìm khách hàng.",
              "ELECMOVE is hiring electric-motorcycle and electric-van couriers on the Ho Chi Minh City, Binh Duong, and Dong Nai corridor. This is fleet recruitment, not a search for customers.",
            )}
          </p>
          <img
            src="/media/pickup.jpg"
            alt={tx("Tài xế navy nhận hàng tại kho", "A navy courier collecting goods at a warehouse")}
            className="mt-6 h-56 w-full rounded-lg object-cover"
          />
          <ul className="mt-6 space-y-3 text-base text-ink">
            <li>{tx("Ca theo bốn khung giờ trong ngày.", "Shifts follow the four daily windows.")}</li>
            <li>{tx("Xe máy điện kiểu Dat Bike hoặc VinFast, hoặc xe van điện của đội.", "A Dat Bike or VinFast type motorcycle, or a fleet electric van.")}</li>
            <li>{tx("Ưu tiên người đã chạy chặng cuối trong nội thành.", "Preference for people who have run urban last-mile routes.")}</li>
          </ul>
          <p className="mt-6 text-base font-semibold text-navy">
            <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
            <span className="mx-2 text-muted">·</span>
            <a href={`tel:${COMPANY_PHONE_TEL}`}>{COMPANY_PHONE}</a>
          </p>
        </div>
        {done ? (
          <div className="rounded-lg border border-line bg-card p-6">
            <h2 className="font-display text-3xl font-semibold text-navy">{tx("Đã nhận hồ sơ", "Application received")}</h2>
            <p className="mt-3 text-base text-ink">
              {tx(`Hồ sơ của ${done} đã vào danh sách tuyển dụng.`, `${done} is on the recruitment list.`)}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 rounded-lg border border-line bg-card p-6">
            <Field label={tx("Họ tên", "Name")}>
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label={tx("Số điện thoại", "Telephone")}>
              <input className={inputClass} inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label={tx("Khu vực nhận ca", "Area")}>
              <select className={inputClass} value={area} onChange={(event) => setArea(event.target.value)}>
                <option>Thành phố Hồ Chí Minh</option>
                <option>Bình Dương</option>
                <option>Đồng Nai</option>
              </select>
            </Field>
            <Field label={tx("Phương tiện", "Vehicle")}>
              <select className={inputClass} value={vehicle} onChange={(event) => setVehicle(event.target.value as "moto" | "van")}>
                <option value="moto">{tx("Xe máy điện hai bánh", "Electric motorcycle")}</option>
                <option value="van">{tx("Xe van điện", "Electric van")}</option>
              </select>
            </Field>
            <Field label={tx("Kinh nghiệm", "Experience")}>
              <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
            <button type="submit" className="inline-flex h-12 items-center justify-center rounded-md bg-navy px-5 text-base font-semibold text-paper">
              {tx("Gửi hồ sơ tài xế", "Send the courier application")}
            </button>
          </form>
        )}
      </div>
    </Page>
  );
}
