import { createFileRoute } from "@tanstack/react-router";
import { CELLS, PROVINCES, SLOTS } from "@/lib/catalog";
import { slotLabel, useTx } from "@/lib/i18n";
import { Page } from "@/components/shell";
import { useElec } from "@/lib/store";

export const Route = createFileRoute("/phu-song")({ component: CoveragePage });

function CoveragePage() {
  const { lang, tx } = useTx();
  const capacity = useElec((state) => state.capacity);

  return (
    <Page>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          {tx("Hành lang giai đoạn 1", "Stage-1 corridor")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy">
          {tx("Khu vực đang nhận đơn", "Areas taking orders")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-muted">
          {tx(
            "Các quận và thành phố đang phục vụ. Số chỗ mỗi khung giờ giảm khi một đơn được giữ.",
            "The districts and cities in service. Places in each window fall when an order holds one.",
          )}
        </p>

        <img
          src="/media/locker.jpg"
          alt={tx("Tủ nhận hàng trong sân khu dân cư", "Parcel lockers in a residential courtyard")}
          className="mt-8 h-64 w-full rounded-lg object-cover sm:h-80"
        />

        <div className="mt-10 space-y-10">
          {PROVINCES.map((province) => (
            <section key={province.id}>
              <h2 className="font-display text-2xl font-semibold text-navy">
                {lang === "vi" ? province.vi : province.en}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {CELLS.filter((cell) => cell.province === province.id).map((cell) => (
                  <article key={cell.id} className="rounded-lg border border-line bg-card p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-navy">
                        {lang === "vi" ? cell.vi : cell.en}
                      </h3>
                      <p className="text-xs text-muted">
                        {cell.km} km · {Math.round(cell.km * 16.48)} g CO2e
                      </p>
                    </div>
                    <ul className="mt-3 grid grid-cols-2 gap-2">
                      {SLOTS.map((slot) => {
                        const left = capacity[cell.id]?.[slot.id] ?? 0;
                        return (
                          <li key={slot.id} className="rounded-md bg-paper px-3 py-2">
                            <p className="text-xs text-muted">{slotLabel(lang, slot.id)}</p>
                            <p className={left <= 2 ? "text-sm font-semibold text-warn" : "text-sm font-semibold text-navy"}>
                              {left} {tx("chỗ", "left")}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Page>
  );
}
