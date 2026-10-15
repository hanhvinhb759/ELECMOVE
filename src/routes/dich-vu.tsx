import { createFileRoute, Link } from "@tanstack/react-router";
import { Estimator } from "@/components/estimator";
import { Page } from "@/components/shell";
import { useTx } from "@/lib/i18n";

export const Route = createFileRoute("/dich-vu")({ component: ServicesPage });

function ServicesPage() {
  const { tx } = useTx();
  const rows = [
    [tx("Cửa sổ thời gian", "Time windows"), "2", "4", "4"],
    [tx("Gọi trước 20 phút", "20-minute call ahead"), "—", tx("Có", "Yes"), tx("Có", "Yes")],
    [tx("Ảnh giao hàng", "Delivery photo"), tx("Có", "Yes"), tx("Có", "Yes"), tx("Ba điểm", "Three points")],
    [tx("Niêm phong", "Tamper-evident seal"), "—", "—", tx("Có", "Yes")],
    [tx("Trần bồi thường trong giá", "Cover included in the fee"), "—", "—", tx("5 triệu đồng", "5 million VND")],
    [tx("Báo cáo carbon theo đơn", "Carbon figure per order"), "—", "—", tx("Có", "Yes")],
    [tx("Tủ nhận và điểm đổi", "Locker and exchange point"), "—", tx("Có", "Yes"), tx("Có", "Yes")],
    [tx("Cước cơ bản của gói", "Package fee"), "28.000", "36.000", "45.000"],
    [tx("Xe máy điện hai bánh", "Electric motorcycle"), "4.800/km", "6.800/km", "8.900/km"],
    [tx("Xe van điện", "Electric van"), "9.500/km", "12.500/km", "16.800/km"],
  ];

  return (
    <Page>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          {tx("Danh mục dịch vụ", "Service catalogue")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy">
          {tx("Ba gói. Không bán hàng hóa.", "Three packages. No goods for sale.")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-muted">
          {tx(
            "Sản phẩm là năng lực giao, việc thực hiện chặng cuối, và việc lưu bằng chứng. EMReturn không nằm trong danh mục mặc định. Phí tích hợp hệ thống và EMReport là sản phẩm đi kèm sau khi lớp vận hành đã được chứng minh.",
            "The product is delivery capacity, execution of the final leg, and storage of evidence. EMReturn is not in the default catalogue. System integration and EMReport are accompanying products after the operating layer has been proved.",
          )}
        </p>
        <img
          src="/media/handover.jpg"
          alt={tx("Tài xế navy giao kiện tại cửa", "A navy courier handing over a parcel at the door")}
          className="mt-8 h-64 w-full rounded-lg object-cover sm:h-80"
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <PackageCard
            name="EMStandard"
            price={tx("28.000 đồng", "28,000 VND")}
            body={tx(
              "Giao trong ngày, hai cửa sổ thời gian, ảnh giao hàng. Dành cho doanh nghiệp vừa và nhỏ với giá trị đơn trung bình.",
              "Same-day delivery, two time windows, and a delivery photo. For SMEs with average order values.",
            )}
          />
          <PackageCard
            name="EMPrecise"
            price={tx("36.000 đồng", "36,000 VND")}
            body={tx(
              "Bốn cửa sổ, cuộc gọi trước 20 phút, ảnh giao hàng và nhận tại tủ. Dành cho thương hiệu bán trực tiếp và chuỗi.",
              "Four windows, a call 20 minutes ahead, a delivery photo, and locker pickup. For direct-to-consumer brands and chains.",
            )}
          />
          <PackageCard
            name="EMSecure"
            price={tx("45.000 đồng", "45,000 VND")}
            body={tx(
              "Niêm phong, ảnh ba điểm, trần bồi thường 5 triệu đồng trong giá, và số liệu carbon. Đề xuất khi giá trị khai báo từ 2 triệu đồng.",
              "A seal, three-point photography, a 5 million VND ceiling included in the fee, and a carbon figure. Suggested when the declared value is from 2 million VND.",
            )}
          />
        </div>

        <div className="mt-10 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-navy text-paper">
              <tr>
                <th className="px-4 py-3 font-medium">{tx("Hạng mục", "Item")}</th>
                <th className="px-4 py-3 font-medium">EMStandard</th>
                <th className="px-4 py-3 font-medium">EMPrecise</th>
                <th className="px-4 py-3 font-medium">EMSecure</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((cell, index) => (
                    <td key={index} className="px-4 py-3 text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          {tx(
            "Phí gói cộng km đường bộ từ điểm lấy tới điểm giao, nhân đơn giá của từng gói. Xe máy điện: EMStandard 4.800, EMPrecise 6.800, EMSecure 8.900 đồng/km. Xe van điện: 9.500, 12.500 và 16.800 đồng/km. Ba kilôgam đầu nằm trong phí gói. Mỗi kilôgam tính cước vượt thêm 1.800 đồng với xe máy hoặc 2.200 đồng với xe van. Hàng trên 20 kg hoặc một cạnh trên 55 cm chỉ đi xe van.",
            "The package fee plus road kilometres from pickup to delivery, times that package’s rate. Electric motorcycle: EMStandard 4,800, EMPrecise 6,800, EMSecure 8,900 VND/km. Electric van: 9,500, 12,500, and 16,800 VND/km. The first three kilograms sit inside the package fee. Each extra chargeable kilogram is 1,800 VND on the motorcycle or 2,200 VND on the van. Goods above 20 kg, or with one side above 55 cm, travel only by van.",
          )}
        </p>

        <div className="mt-10">
          <Estimator />
        </div>

        <p className="mt-8 text-sm text-muted">
          {tx(
            "Tạo đơn trong cổng khách hàng sau khi đã tính quãng đường.",
            "Create the order in the customer portal after the distance is calculated.",
          )}{" "}
          <Link to="/cong-thong-tin" search={{ tab: "order" }} className="font-semibold text-teal">
            {tx("Tạo đơn", "Create an order")}
          </Link>
        </p>
      </div>
    </Page>
  );
}

function PackageCard({ name, price, body }: { name: string; price: string; body: string }) {
  return (
    <article className="flex flex-col rounded-lg border border-line bg-card p-5">
      <h2 className="font-display text-xl font-semibold text-navy">{name}</h2>
      <p className="mt-2 font-display text-lg text-teal">{price}</p>
      <p className="mt-3 flex-1 text-sm text-muted">{body}</p>
    </article>
  );
}
