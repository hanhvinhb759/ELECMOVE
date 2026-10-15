import { createFileRoute } from "@tanstack/react-router";
import { FOUNDERS } from "@/lib/founders";
import { GRID_FACTOR, GRAMS_PER_KM } from "@/lib/catalog";
import { Page } from "@/components/shell";
import { useTx } from "@/lib/i18n";

export const Route = createFileRoute("/ve-chung-toi")({ component: AboutPage });

function AboutPage() {
  const { tx } = useTx();
  return (
    <Page>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          {tx("Định vị", "Position")}
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold text-navy">
          {tx(
            "Nhà cung cấp dịch vụ, phân biệt tập trung, không phải sàn trung gian.",
            "A service provider, focused differentiation, not an intermediary marketplace.",
          )}
        </h1>
        <img
          src="/media/founders-room.jpg"
          alt={tx("Phòng làm việc ELECMOVE", "The ELECMOVE work room")}
          className="mt-8 h-72 w-full rounded-lg object-cover sm:h-96"
        />
        <section className="mt-10">
          <h2 className="font-display text-3xl font-semibold text-navy">{tx("Đồng sáng lập", "Founders")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FOUNDERS.map((person) => (
              <article key={person.email} className="rounded-lg border border-line bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">{tx("Đồng sáng lập", "Co-founder")}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-navy">{person.name}</h3>
                <a href={`mailto:${person.email}`} className="mt-2 inline-flex h-11 items-center text-sm font-semibold text-navy">
                  {person.email}
                </a>
              </article>
            ))}
          </div>
        </section>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-navy">{tx("Tầm nhìn đến 2030", "Vision to 2030")}</h2>
            <p className="mt-3 text-sm text-muted">
              {tx(
                "ELECMOVE là đơn vị chặng cuối được thương hiệu và chuỗi bán lẻ chọn trên hành lang Thành phố Hồ Chí Minh, Bình Dương và Đồng Nai khi hàng cần chắc chắn về cửa sổ thời gian, an toàn và hồ sơ phát thải. Tầm nhìn không phải phủ sóng quốc gia và không phải dẫn đầu khối lượng sàn đại chúng.",
                "By 2030 ELECMOVE is the last-mile provider chosen by brands and retail chains on the Ho Chi Minh City, Binh Duong, and Dong Nai corridor when goods require certainty of time window, safety, and an emissions file. The vision is not national coverage and not leadership in mass-marketplace volume.",
              )}
            </p>
          </article>
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-navy">{tx("Sứ mệnh", "Mission")}</h2>
            <p className="mt-3 text-sm text-muted">
              {tx(
                "Cung cấp dịch vụ chặng cuối với cam kết đo lường được, đội giao cuối không phát thải ống xả, và chuỗi bằng chứng đủ để quy trách nhiệm bồi thường. Giá thấp không phải sứ mệnh.",
                "Provide a last-mile service with measurable commitments, a tailpipe-emission-free final fleet, and a chain of evidence sufficient to assign liability. A low price is not the mission.",
              )}
            </p>
          </article>
        </div>

        <section className="mt-10 rounded-lg border border-line bg-card p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold text-navy">
            {tx("Phương pháp tính phát thải", "Emissions method")}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {tx(
              "Phát thải được tính trên cơ sở well-to-wheel theo ISO 14083, nghĩa là gồm phát thải từ việc sản xuất điện cho xe điện. Hệ số lưới điện Việt Nam năm 2023 do Cục Biến đổi khí hậu công bố là",
              "Emissions are calculated on a well-to-wheel basis under ISO 14083, which includes emissions from producing the electricity used by an electric vehicle. The Vietnamese grid factor for 2023 published by the Department of Climate Change is",
            )}{" "}
            <strong className="font-semibold text-navy">{GRID_FACTOR} tCO2/MWh</strong>.{" "}
            {tx(
              `Với suất tiêu thụ thiết kế 0,025 kWh/km, mỗi kilômét tương ứng khoảng ${GRAMS_PER_KM} g CO2e. ELECMOVE chỉ tuyên bố không phát thải ống xả.`,
              `At a design consumption of 0.025 kWh/km, each kilometre corresponds to about ${GRAMS_PER_KM} g CO2e. ELECMOVE claims only tailpipe-emission-free operation.`,
            )}
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Road
            title={tx("Tháng 0–3", "Months 0–3")}
            body={tx(
              "Website công khai và cổng đơn. Hai hợp đồng thử trước khi mua thêm xe. Mở 8 đến 12 trạm trên các ô đã chốt.",
              "Public website and order portal. Two trial contracts before further vehicles. Open 8 to 12 stations on the cells already fixed.",
            )}
          />
          <Road
            title={tx("Tháng 4–9", "Months 4–9")}
            body={tx(
              "Giữ đúng cửa sổ từ 97% trên các ô đã mở. Nối API với khách từ 80 đơn nội vùng mỗi ngày. EMReturn chưa mở.",
              "Hold on-slot performance from 97% on cells already open. Connect the API for customers with at least 80 intra-region orders a day. EMReturn stays closed.",
            )}
          />
          <Road
            title={tx("Tháng 10–18", "Months 10–18")}
            body={tx(
              "Hướng tới 600 đến 1.000 đơn thành công mỗi ngày vào tháng 12 của năm vận hành đầu, nếu hai khách neo giữ sản lượng.",
              "Aim for 600 to 1,000 successful consignments a day by December of the first operating year, if the two anchor customers hold volume.",
            )}
          />
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold text-navy">
            {tx("Những gì giai đoạn 1 không làm", "What stage 1 does not do")}
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
            {[
              tx("Không giao đơn sàn đại chúng theo giá sàn.", "No mass-marketplace delivery at marketplace prices."),
              tx("Không vận chuyển chuỗi lạnh.", "No cold-chain transport."),
              tx("Không phủ 34 địa phương.", "No coverage of 34 localities."),
              tx("Không bán hàng hóa.", "No sale of goods."),
              tx("Không tái chế bao bì ở quy mô nhà máy.", "No packaging recycling at factory scale."),
              tx("EMReturn chỉ là gói tùy chọn sau khi đúng cửa sổ đạt 97%.", "EMReturn is optional, and only after on-slot performance reaches 97%."),
            ].map((item) => (
              <li key={item} className="rounded-lg border border-line bg-card px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}

function Road({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-line bg-card p-5">
      <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </article>
  );
}
