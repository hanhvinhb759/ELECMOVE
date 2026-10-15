import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { formatVnd, PACKAGES, ratePerKm, settle, SLOTS, type PackageId, type SlotId, type VehicleId } from "@/lib/catalog";
import { measureRoute } from "@/lib/route-distance";
import { useTx } from "@/lib/i18n";
import { Field, inputClass } from "@/components/shell";

export function Estimator() {
  const { lang, tx } = useTx();
  const measure = useServerFn(measureRoute);
  const [packageId, setPackageId] = useState<PackageId>("precise");
  const [slotId, setSlotId] = useState<SlotId>("s1");
  const [vehicle, setVehicle] = useState<VehicleId>("moto");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [km, setKm] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [weightKg, setWeightKg] = useState("2");
  const allowed = PACKAGES[packageId].slots;
  const activeSlot = allowed.includes(slotId) ? slotId : allowed[0];
  const priced = settle({
    packageId,
    cellId: "q1",
    slotId: activeSlot,
    cargo: { lengthCm: 30, widthCm: 20, heightCm: 15, weightKg: Number(weightKg) || 0 },
    vehicle,
    km: km ?? 0,
    pack: "self",
    voucher: "",
  });

  async function calculate() {
    setBusy(true);
    setNote("");
    try {
      const result = await measure({ data: { from, to } });
      if (!result.ok) {
        setKm(null);
        setNote(tx("Chưa tìm được đường giữa hai địa chỉ.", "No road route was found between the two addresses."));
        return;
      }
      setKm(result.km);
    } catch {
      setKm(null);
      setNote(tx("Không tính được quãng đường lúc này.", "The distance could not be calculated just now."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-card p-5 sm:p-6">
      <h2 className="font-display text-3xl font-semibold text-navy">{tx("Tính cước theo đường đi", "Price a route")}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={tx("Điểm lấy", "Pickup")}>
          <input className={inputClass} value={from} onChange={(event) => { setFrom(event.target.value); setKm(null); }} />
        </Field>
        <Field label={tx("Điểm giao", "Delivery")}>
          <input className={inputClass} value={to} onChange={(event) => { setTo(event.target.value); setKm(null); }} />
        </Field>
        <Field label={tx("Gói", "Package")}>
          <select className={inputClass} value={packageId} onChange={(event) => setPackageId(event.target.value as PackageId)}>
            <option value="standard">EMStandard</option>
            <option value="precise">EMPrecise</option>
            <option value="secure">EMSecure</option>
          </select>
        </Field>
        <Field label={tx("Phương tiện", "Vehicle")}>
          <select className={inputClass} value={vehicle} onChange={(event) => setVehicle(event.target.value as VehicleId)}>
            <option value="moto">{tx(`Xe máy điện · ${ratePerKm(packageId, "moto").toLocaleString("vi-VN")} đồng/km`, `Electric motorcycle · ${ratePerKm(packageId, "moto").toLocaleString("en-US")} VND/km`)}</option>
            <option value="van">{tx(`Xe van điện · ${ratePerKm(packageId, "van").toLocaleString("vi-VN")} đồng/km`, `Electric van · ${ratePerKm(packageId, "van").toLocaleString("en-US")} VND/km`)}</option>
          </select>
        </Field>
        <Field label={tx("Cửa sổ thời gian", "Time window")}>
          <select className={inputClass} value={activeSlot} onChange={(event) => setSlotId(event.target.value as SlotId)}>
            {SLOTS.filter((slot) => allowed.includes(slot.id)).map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.vi}
                {slot.evening ? tx(" · phụ phí tối", " · evening surcharge") : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tx("Khối lượng (kg)", "Weight (kg)")}>
          <input className={inputClass} inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
        </Field>
      </div>
      <button
        type="button"
        onClick={() => void calculate()}
        disabled={busy}
        className="mt-4 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper disabled:opacity-50"
      >
        {busy ? tx("Đang tính km", "Calculating km") : tx("Tính quãng đường", "Calculate the distance")}
      </button>
      {note ? <p className="mt-3 text-sm text-warn">{note}</p> : null}
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={tx("Quãng đường", "Distance")} value={km ? `${km} km` : "—"} />
        <Metric label={tx("Cước theo km", "Distance fee")} value={km ? formatVnd(priced.distanceFee, lang) : "—"} />
        <Metric label={tx("Phụ phí khối lượng", "Weight surcharge")} value={formatVnd(priced.weightFee, lang)} />
        <Metric label={tx("Tổng", "Total")} value={km ? formatVnd(priced.total, lang) : "—"} />
      </dl>
      {km ? (
        <p className="mt-4 text-sm text-ink">
          CO2e: <strong className="font-semibold text-navy">{priced.co2e} g</strong>
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper px-3 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-navy">{value}</dd>
    </div>
  );
}
