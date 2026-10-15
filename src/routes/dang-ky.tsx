import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Field, inputClass, Page } from "@/components/shell";
import { useTx } from "@/lib/i18n";
import { useElec } from "@/lib/store";
import type { PackageId } from "@/lib/catalog";

export const Route = createFileRoute("/dang-ky")({ component: RegisterPage });

function RegisterPage() {
  const { tx } = useTx();
  const addLead = useElec((state) => state.addLead);
  const [done, setDone] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState("d2c");
  const [volume, setVolume] = useState("");
  const [packageId, setPackageId] = useState<PackageId>("precise");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!company.trim() || !contact.trim() || !email.trim()) {
      setError(tx("Cần tên doanh nghiệp, người liên hệ và email.", "Company, contact, and email are required."));
      return;
    }
    addLead({
      company: company.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      segment,
      volume: volume.trim(),
      packageId,
      note: note.trim(),
    });
    setError("");
    setDone(company.trim());
  }

  return (
    <Page>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            {tx("Hợp đồng thử", "Trial contract")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-navy">
            {tx("Đăng ký dùng thử trước khi mở rộng đội xe.", "Request a trial before the fleet is scaled.")}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {tx(
              "Gửi yêu cầu dùng thử. ELECMOVE liên hệ để chốt sản lượng và khung giờ.",
              "Send a trial request. ELECMOVE will contact you to settle volume and time windows.",
            )}
          </p>
          <img
            src="/media/packing.jpg"
            alt={tx("Vật liệu đóng gói giấy", "Paper packing materials")}
            className="mt-6 h-48 w-full rounded-lg object-cover"
          />
        </div>
        <div className="lg:col-span-3">
          {done ? (
            <div className="rounded-lg border border-line bg-card p-6">
              <h2 className="font-display text-2xl font-semibold text-navy">
                {tx("Đã ghi nhận yêu cầu", "Request recorded")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {tx(`Đã nhận yêu cầu của ${done}.`, `The request from ${done} is in.`)}
              </p>
              <Link
                to="/cong-thong-tin"
                className="mt-5 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper"
              >
                {tx("Vào cổng khách hàng", "Enter the customer portal")}
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 rounded-lg border border-line bg-card p-5 sm:grid-cols-2 sm:p-6">
              <Field label={tx("Doanh nghiệp", "Company")}>
                <input className={inputClass} value={company} onChange={(event) => setCompany(event.target.value)} />
              </Field>
              <Field label={tx("Người liên hệ", "Contact")}>
                <input className={inputClass} value={contact} onChange={(event) => setContact(event.target.value)} />
              </Field>
              <Field label={tx("Điện thoại", "Telephone")}>
                <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
              </Field>
              <Field label="Email">
                <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </Field>
              <Field label={tx("Nhóm khách", "Segment")}>
                <select className={inputClass} value={segment} onChange={(event) => setSegment(event.target.value)}>
                  <option value="d2c">{tx("Thương hiệu bán trực tiếp", "Direct-to-consumer brand")}</option>
                  <option value="chain">{tx("Chuỗi bán lẻ", "Retail chain")}</option>
                  <option value="sme">{tx("Doanh nghiệp vừa và nhỏ ngoài sàn", "Off-marketplace SME")}</option>
                  <option value="pharma">{tx("Dược không chuỗi lạnh, quà doanh nghiệp", "Non-cold-chain pharma, corporate gifts")}</option>
                </select>
              </Field>
              <Field label={tx("Sản lượng nội vùng mỗi ngày", "Intra-region volume per day")}>
                <input className={inputClass} value={volume} onChange={(event) => setVolume(event.target.value)} />
              </Field>
              <Field label={tx("Gói quan tâm", "Package of interest")}>
                <select
                  className={inputClass}
                  value={packageId}
                  onChange={(event) => setPackageId(event.target.value as PackageId)}
                >
                  <option value="standard">EMStandard</option>
                  <option value="precise">EMPrecise</option>
                  <option value="secure">EMSecure</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label={tx("Ghi chú", "Note")}>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </Field>
              </div>
              {error ? <p className="text-sm text-warn sm:col-span-2">{error}</p> : null}
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper">
                  {tx("Gửi yêu cầu", "Submit the request")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Page>
  );
}
