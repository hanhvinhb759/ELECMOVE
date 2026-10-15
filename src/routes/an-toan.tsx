import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/shell";
import { useTx } from "@/lib/i18n";

export const Route = createFileRoute("/an-toan")({ component: SafetyPage });

function SafetyPage() {
  const { tx } = useTx();
  const steps = [
    {
      n: "01",
      title: tx("Tiếp nhận yêu cầu", "A claim is received"),
      body: tx(
        "Yêu cầu đi qua cổng thông tin trong vòng 24 giờ sau cửa sổ giao.",
        "The claim arrives through the portal within 24 hours after the delivery window.",
      ),
    },
    {
      n: "02",
      title: tx("Đối soát bằng chứng", "Evidence is reconciled"),
      body: tx(
        "Mã, ảnh giao, định vị và camera trạm được đối soát trong 4 giờ làm việc.",
        "The code, delivery photo, positioning, and station camera are reconciled within 4 working hours.",
      ),
    },
    {
      n: "03",
      title: tx("Lỗi thuộc về ELECMOVE", "The fault belongs to ELECMOVE"),
      body: tx(
        "Giá trị khai báo được bồi thường trong trần 5 triệu đồng của EMSecure, trong 3 ngày làm việc.",
        "The declared value is compensated within the EMSecure ceiling of 5 million VND, within 3 working days.",
      ),
    },
    {
      n: "04",
      title: tx("Lỗi đóng gói của người gửi", "A packing fault of the sender"),
      body: tx(
        "Biên bản được lập. Doanh nghiệp hỗ trợ yêu cầu với bên thứ ba và không từ chối tiếp nhận hồ sơ.",
        "Minutes are drawn up. The enterprise supports a third-party claim and does not refuse to receive the file.",
      ),
    },
    {
      n: "05",
      title: tx("Người nhận vắng mặt", "The recipient is absent"),
      body: tx(
        "Hàng chuyển sang chuyến đã thỏa thuận tiếp theo. Hàng chỉ về kho sau hai cửa sổ đã thống nhất.",
        "The consignment moves to the next agreed trip. It returns to the station only after two windows already agreed.",
      ),
    },
  ];

  return (
    <Page>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          {tx("Trang bán hàng chính", "Principal sales page")}
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold text-navy">
          {tx("An toàn hàng hóa là một thuộc tính của dịch vụ giao.", "Goods safety is an attribute of the delivery service.")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-muted">
          {tx(
            "EMSecure không phải hợp đồng bảo hiểm độc lập bán cho thị trường đại chúng. Bồi thường được kích hoạt khi lỗi thuộc về ELECMOVE, được xác lập bằng chuỗi bằng chứng. Người mua doanh nghiệp so trần 0,01% với tỷ lệ hoàn và khiếu nại mà họ đang gánh, không so với một lời hứa chung.",
            "EMSecure is not an independent insurance contract sold to the mass market. Compensation is triggered by a fault belonging to ELECMOVE, established by the chain of evidence. The business buyer compares the 0.01% ceiling with the return and claim rate that buyer already bears, not with a general promise.",
          )}
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
          <img
            src="/media/seal.jpg"
            alt={tx(
              "Kiện hàng có niêm phong chống giả mạo trên bàn trạm",
              "A parcel with a tamper-evident seal on a station table",
            )}
            className="h-80 w-full rounded-lg object-cover"
          />
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.n} className="rounded-lg border border-line bg-card p-4">
                <p className="font-display text-sm font-semibold text-teal">{step.n}</p>
                <h2 className="mt-1 font-display text-lg font-semibold text-navy">{step.title}</h2>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-navy">
              {tx("Ba điểm ảnh", "Three photographs")}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {tx(
                "Ảnh niêm phong trước khi rời trạm, ảnh hàng tại điểm giao, và ảnh niêm phong còn nguyên. Thiếu ảnh hoặc thiếu lần quét mã thì vận đơn không được đóng là thành công.",
                "A seal photo before the consignment leaves the station, a photo of the goods at the delivery point, and a photo of the seal still intact. If a photo or a scan is missing, the consignment cannot be closed as successful.",
              )}
            </p>
          </article>
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-navy">
              {tx("Trần và thời hạn", "Ceiling and time")}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {tx(
                "Trần thiết kế 0,01%. EMSecure bồi thường tối đa 5 triệu đồng mỗi đơn. Gói khác, khi lỗi thuộc về doanh nghiệp, mức sàn tham chiếu là bốn lần cước theo Nghị định 47/2011/NĐ-CP.",
                "A design ceiling of 0.01%. EMSecure compensates up to 5 million VND per order. For other packages, when the fault belongs to the enterprise, the reference floor is four times the tariff under Decree 47/2011/ND-CP.",
              )}
            </p>
          </article>
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-navy">
              {tx("Nhật ký kiểm toán", "Audit log")}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {tx(
                "Mọi tạo đơn, giữ chỗ, giao hàng và yêu cầu bồi thường đều được ghi. Ảnh bằng chứng giữ trong thời hạn khiếu nại rồi xóa.",
                "Every order, slot hold, delivery, and claim is written to the log. Proof photographs are kept for the claim period, then deleted.",
              )}
            </p>
          </article>
        </section>

        <Link
          to="/cong-thong-tin"
          className="mt-8 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper"
        >
          {tx("Mở yêu cầu bồi thường", "Open a claim")}
        </Link>
      </div>
    </Page>
  );
}
