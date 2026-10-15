import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import {
  cellById,
  CELLS,
  cargoMetrics,
  formatVnd,
  GRAMS_PER_KM,
  GRID_FACTOR,
  PACKAGES,
  PACKAGE_RATES,
  settle,
  SECURE_THRESHOLD,
  SLOTS,
  slotById,
  type PackageId,
  type PackMode,
  type SlotId,
  type VehicleId,
} from "@/lib/catalog";
import { Field, inputClass } from "@/components/shell";
import { slotLabel, useTx } from "@/lib/i18n";
import { useElec, type Handover, type Order } from "@/lib/store";
import { Monitor } from "@/components/monitor";
import { measureRoute } from "@/lib/route-distance";

type Tab = "board" | "order" | "watch" | "pay" | "emissions" | "claims" | "log" | "leads";

const AUDIT_COPY: Record<string, [string, string]> = {
  lead: ["Ghi nhận yêu cầu dùng thử", "Trial request recorded"],
  order_created: ["Tạo đơn và giữ chỗ", "Order created and slot held"],
  slot_full: ["Từ chối vì cửa sổ đã đầy", "Refused because the window is full"],
  collected: ["Tài xế đã nhận hàng", "Courier collected the goods"],
  driver_message: ["Tin nhắn tới tài xế", "Message to the courier"],
  incident_opened: ["Gửi sự cố cho chăm sóc khách hàng", "Incident sent to customer care"],
  cancelled: ["Hủy đơn", "Order cancelled"],
  receipt_confirmed: ["Người nhận xác nhận đã nhận hàng", "Recipient confirmed receipt"],
  rated: ["Ghi đánh giá dịch vụ", "Service rating recorded"],
  paid: ["ELECMOVE ghi nhận thanh toán", "ELECMOVE recorded the payment"],
  dispatched: ["Điều tài xế tới điểm lấy", "Courier dispatched to the pickup"],
  care_chat: ["Tin nhắn chăm sóc khách hàng", "Customer-care message"],
  delivered: ["Giao thành công", "Delivery closed"],
  claim_opened: ["Mở yêu cầu bồi thường", "Claim opened"],
  claim_reconciled: ["Đối soát yêu cầu", "Claim reconciled"],
};

export function Portal({ initialTab = "board", trackCode }: { initialTab?: Tab; trackCode?: string }) {
  const { lang, tx } = useTx();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const orders = useElec((state) => state.orders);
  const resetDemo = useElec((state) => state.resetDemo);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const tabs: { id: Tab; vi: string; en: string }[] = [
    { id: "board", vi: "Bảng điều khiển", en: "Dashboard" },
    { id: "order", vi: "Tạo đơn", en: "New order" },
    { id: "watch", vi: "Giám sát", en: "Monitoring" },
    { id: "pay", vi: "Thanh toán", en: "Payment" },
    { id: "emissions", vi: "Báo cáo CO2", en: "CO2 report" },
    { id: "claims", vi: "Bồi thường", en: "Claims" },
    { id: "log", vi: "Nhật ký", en: "Audit log" },
    { id: "leads", vi: "Yêu cầu thử", en: "Trials" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            {tx("Cổng doanh nghiệp", "Enterprise portal")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-navy">
            {tx("Cổng thông tin khách hàng", "Customer portal")}
          </h1>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm font-medium text-navy"
        >
          {tx("Xóa sổ đơn", "Clear the order book")}
        </button>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "h-11 shrink-0 rounded-md bg-navy px-4 text-sm font-semibold text-paper"
                : "h-11 shrink-0 rounded-md border border-line bg-card px-4 text-sm font-medium text-ink"
            }
          >
            {lang === "vi" ? item.vi : item.en}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "board" ? (
          <Board
            orders={orders}
            onWatch={(id) => {
              setWatchId(id);
              setTab("watch");
            }}
            onPay={(id) => {
              setPayId(id);
              setTab("pay");
            }}
          />
        ) : null}
        {tab === "order" ? (
          <NewOrder
            onCreated={(id) => {
              setPayId(id);
              setTab("pay");
            }}
          />
        ) : null}
        {tab === "watch" ? (
          <Monitor
            focusId={
              trackCode
                ? (orders.find((order) => order.id.toLowerCase() === trackCode.toLowerCase())?.id ?? null)
                : watchId
            }
            missingCode={
              trackCode && !orders.some((order) => order.id.toLowerCase() === trackCode.toLowerCase())
                ? trackCode
                : undefined
            }
          />
        ) : null}
        {tab === "pay" ? (
          <Payment
            orders={orders}
            focusId={payId}
            onDispatched={(id) => {
              setWatchId(id);
              setTab("watch");
            }}
          />
        ) : null}
        {tab === "emissions" ? <Emissions orders={orders} /> : null}
        {tab === "claims" ? <Claims /> : null}
        {tab === "log" ? <Log /> : null}
        {tab === "leads" ? <Leads /> : null}
      </div>
    </div>
  );
}

function Board({
  orders,
  onWatch,
  onPay,
}: {
  orders: Order[];
  onWatch: (id: string) => void;
  onPay: (id: string) => void;
}) {
  const { lang, tx } = useTx();
  const delivered = orders.filter((order) => order.status === "delivered" || order.status === "claim").length;
  const co2 = orders.reduce((sum, order) => sum + order.co2e, 0);
  const claims = orders.filter((order) => order.status === "claim").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={tx("Đơn đang giữ", "Open orders")} value={String(orders.length)} />
        <Tile label={tx("Đã đóng giao hoặc khiếu nại", "Closed or claimed")} value={String(delivered)} />
        <Tile label={tx("Yêu cầu bồi thường", "Claims")} value={String(claims)} />
        <Tile label={tx("Tổng CO2e thống kê", "Statistical CO2e")} value={`${co2} g`} />
      </div>
      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-navy">
          {tx("Ngưỡng thiết kế, không phải kết quả đo", "Design thresholds, not measured results")}
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Tile label={tx("Đúng cửa sổ", "On the window")} value="97%" />
          <Tile label={tx("Thành công lần đầu", "First attempt")} value="95%" />
          <Tile label={tx("Trần lỗi", "Error ceiling")} value="0,01%" />
        </dl>
      </section>
      <Co2Chart
        rows={orders.slice(0, 8).map((order) => ({ name: order.id.slice(-5), co2e: order.co2e }))}
        empty={tx("Chưa có đơn để vẽ phát thải.", "No orders yet to chart emissions.")}
        title={tx("Gram CO2e theo đơn gần nhất — chỉ để xem thống kê", "Grams CO2e on the latest orders — statistical view only")}
      />
      <p className="text-sm text-muted">
        {tx(
          "Số trên bảng và biểu đồ là tổng hợp để theo dõi. Bản để lưu và gửi nội bộ nằm ở tab Báo cáo CO2, xuất thành file.",
          "Figures on the board and chart are aggregates for monitoring. The copy to keep or send internally is the file from the CO2 report tab.",
        )}
      </p>
      <OrderTable orders={orders} lang={lang} tx={tx} onWatch={onWatch} onPay={onPay} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}

function Co2Chart({
  rows,
  empty,
  title,
}: {
  rows: { name: string; co2e: number }[];
  empty: string;
  title: string;
}) {
  const [lib, setLib] = useState<typeof import("recharts") | null>(null);
  useEffect(() => {
    void import("recharts").then(setLib);
  }, []);
  return (
    <section className="rounded-lg border border-line bg-card p-5">
      <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
      {rows.length === 0 || !lib ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-4 h-56">
          <lib.ResponsiveContainer width="100%" height="100%">
            <lib.BarChart data={rows}>
              <lib.XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
              <lib.YAxis stroke="var(--color-muted)" fontSize={12} />
              <lib.Tooltip />
              <lib.Bar dataKey="co2e" fill="var(--color-teal)" radius={4} />
            </lib.BarChart>
          </lib.ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function OrderTable({
  orders,
  lang,
  tx,
  onWatch,
  onPay,
}: {
  orders: Order[];
  lang: "vi" | "en";
  tx: (vi: string, en: string) => string;
  onWatch: (id: string) => void;
  onPay: (id: string) => void;
}) {
  const markDelivered = useElec((state) => state.markDelivered);
  const markCollected = useElec((state) => state.markCollected);
  if (orders.length === 0) {
    return <p className="text-sm text-muted">{tx("Chưa có đơn.", "No orders yet.")}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="bg-paper text-muted">
          <tr>
            <th className="px-3 py-3 font-medium">{tx("Mã", "Code")}</th>
            <th className="px-3 py-3 font-medium">{tx("Người gửi và người nhận", "Sender and recipient")}</th>
            <th className="px-3 py-3 font-medium">{tx("Gói", "Package")}</th>
            <th className="px-3 py-3 font-medium">{tx("Cửa sổ", "Window")}</th>
            <th className="px-3 py-3 font-medium">{tx("Cước", "Fee")}</th>
            <th className="px-3 py-3 font-medium">CO2e</th>
            <th className="px-3 py-3 font-medium">{tx("Trạng thái", "Status")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-line">
              <td className="px-3 py-3 font-medium text-navy">{order.id}</td>
              <td className="px-3 py-3">
                <p>{order.company}</p>
                <p className="text-muted">
                  {tx("Người gửi", "Sender")}: {order.pickupContact || order.company}
                  {order.pickupPhone ? ` · ${order.pickupPhone}` : ""}
                </p>
                <p className="text-muted">
                  {tx("Người nhận", "Recipient")}: {order.recipient || "—"}
                  {order.phone ? ` · ${order.phone}` : ""}
                </p>
                <p className="text-muted">{tx("Địa chỉ lấy", "Pickup address")}: {order.pickupAddress || "—"}</p>
                <p className="text-muted">{tx("Địa chỉ nhận", "Delivery address")}: {order.address || "—"}</p>
                {order.accessNote ? <p className="text-muted">{order.accessNote}</p> : null}
              </td>
              <td className="px-3 py-3">{order.packageId}</td>
              <td className="px-3 py-3">{slotLabel(lang, order.slotId)}</td>
              <td className="px-3 py-3">{formatVnd(order.price, lang)}</td>
              <td className="px-3 py-3">{order.co2e} g</td>
              <td className="px-3 py-3">
                {order.status === "booked" && order.paymentStatus !== "paid" ? (
                  <button
                    type="button"
                    className="h-11 rounded-md bg-navy px-3 text-xs font-semibold text-paper"
                    onClick={() => onPay(order.id)}
                  >
                    {tx("Thanh toán để điều xe", "Pay to dispatch")}
                  </button>
                ) : order.status === "booked" && !order.collectedAt ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="h-11 rounded-md bg-navy px-3 text-xs font-semibold text-paper"
                      onClick={() => onWatch(order.id)}
                    >
                      {tx("Tài xế đang đến điểm lấy", "Courier is coming to the pickup")}
                    </button>
                    <button
                      type="button"
                      className="h-11 rounded-md border border-navy px-3 text-xs font-semibold text-navy"
                      onClick={() => {
                        markCollected(order.id);
                        onWatch(order.id);
                      }}
                    >
                      {tx("Tài xế đã nhận hàng", "Courier collected the goods")}
                    </button>
                  </div>
                ) : order.status === "booked" ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="h-11 rounded-md bg-navy px-3 text-xs font-semibold text-paper"
                      onClick={() => onWatch(order.id)}
                    >
                      {tx("Giám sát", "Monitor")}
                    </button>
                    <button
                      type="button"
                      className="h-11 rounded-md border border-navy px-3 text-xs font-semibold text-navy"
                      onClick={() => markDelivered(order.id)}
                    >
                      {tx("Đóng giao", "Close the delivery")}
                    </button>
                  </div>
                ) : (
                  <span>
                    {order.status === "cancelled"
                      ? tx("Đã hủy", "Cancelled")
                      : order.receivedAt
                        ? tx("Người nhận đã xác nhận", "Recipient confirmed")
                        : order.status === "delivered"
                          ? tx("Đã giao", "Delivered")
                          : tx("Đang khiếu nại", "In claim")}
                    {order.status === "cancelled" && order.cancelReason ? ` · ${order.cancelReason}` : ""}
                    {order.rating ? ` · ${order.rating}/5` : ""}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewOrder({ onCreated }: { onCreated: (id: string) => void }) {
  const { lang, tx } = useTx();
  const book = useElec((state) => state.book);
  const capacity = useElec((state) => state.capacity);
  const [company, setCompany] = useState("");
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [address, setAddress] = useState("");
  const [accessNote, setAccessNote] = useState("");
  const [handover, setHandover] = useState<Handover>("door");
  const [cellId, setCellId] = useState("q1");
  const [packageId, setPackageId] = useState<PackageId>("precise");
  const [slotId, setSlotId] = useState<SlotId>("s1");
  const [value, setValue] = useState("1500000");
  const [lengthCm, setLengthCm] = useState("30");
  const [widthCm, setWidthCm] = useState("20");
  const [heightCm, setHeightCm] = useState("15");
  const [weightKg, setWeightKg] = useState("2");
  const [vehicle, setVehicle] = useState<VehicleId>("moto");
  const [cod, setCod] = useState(false);
  const [codAmount, setCodAmount] = useState("");
  const measureDistance = useServerFn(measureRoute);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [pack, setPack] = useState<PackMode>("self");
  const [voucher, setVoucher] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [warn, setWarn] = useState(false);
  const [message, setMessage] = useState("");
  const declared = Number(value.replace(/\D/g, "")) || 0;
  const cargo = {
    lengthCm: Number(lengthCm) || 0,
    widthCm: Number(widthCm) || 0,
    heightCm: Number(heightCm) || 0,
    weightKg: Number(weightKg) || 0,
  };
  const metrics = cargoMetrics(cargo);
  const activeVehicle: VehicleId = metrics.motoOk ? vehicle : "van";
  const allowed = PACKAGES[packageId].slots;
  const activeSlot = allowed.includes(slotId) ? slotId : allowed[0];
  const suggest = declared >= SECURE_THRESHOLD && packageId !== "secure";
  const priced = settle({
    packageId,
    cellId,
    slotId: activeSlot,
    cargo,
    vehicle: activeVehicle,
    km: routeKm ?? 0,
    pack,
    voucher: appliedVoucher,
  });
  const left = capacity[cellId]?.[activeSlot] ?? 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !company.trim() ||
      !pickupContact.trim() ||
      pickupPhone.replace(/\D/g, "").length < 9 ||
      !recipient.trim() ||
      phone.replace(/\D/g, "").length < 9 ||
      pickupAddress.trim().length < 6 ||
      address.trim().length < 6 ||
      declared <= 0 ||
      cargo.weightKg <= 0 ||
      !routeKm
    ) {
      setWarn(true);
      setMessage(
        tx(
          "Điền đủ người gửi, người nhận, hai số điện thoại, hai địa chỉ, giá trị, khối lượng, rồi tính quãng đường.",
          "Fill in the sender, the recipient, both telephones, both addresses, the value, and the weight, then calculate the distance.",
        ),
      );
      return;
    }
    const result = book({
      company,
      cellId,
      recipient,
      phone,
      pickupAddress,
      pickupContact,
      pickupPhone,
      address,
      accessNote,
      handover,
      packageId,
      declaredValue: declared,
      slotId: activeSlot,
      suggestedSecure: suggest,
      vehicle: activeVehicle,
      cargo,
      km: routeKm,
      pack,
      voucher: appliedVoucher,
      cod,
      codAmount: Number(codAmount.replace(/\D/g, "")) || 0,
    });
    if (!result.ok) {
      setWarn(true);
      if (result.reason === "noroute") {
        setMessage(tx("Hãy tính quãng đường trước khi giữ chỗ.", "Calculate the distance before holding the slot."));
        return;
      }
      const nextLabel = result.next ? slotById(result.next).vi : null;
      setMessage(
        nextLabel
          ? tx(
              `Cửa sổ đã đầy hoặc không thuộc gói. Cửa sổ còn chỗ: ${nextLabel}.`,
              `That window is full or not in the package. Next window with room: ${nextLabel}.`,
            )
          : tx("Không còn chỗ trong các cửa sổ của gói này.", "No remaining room in this package’s windows."),
      );
      if (result.next) setSlotId(result.next);
      return;
    }
    setWarn(false);
    onCreated(result.order.id);
  }

  async function measure() {
    if (pickupAddress.trim().length < 6 || address.trim().length < 6) {
      setWarn(true);
      setMessage(tx("Nhập đủ địa chỉ lấy và địa chỉ nhận.", "Enter both the pickup and the delivery address."));
      return;
    }
    setRouteBusy(true);
    setWarn(false);
    try {
      const result = await measureDistance({ data: { from: pickupAddress, to: address } });
      if (!result.ok) {
        setRouteKm(null);
        setWarn(true);
        setMessage(
          tx(
            "Chưa tìm được đường giữa hai địa chỉ. Kiểm tra lại tên đường và quận.",
            "No road route was found between the two addresses. Check the street and the district.",
          ),
        );
        return;
      }
      setRouteKm(result.km);
      setMessage(tx(`Quãng đường đường bộ: ${result.km} km.`, `Road distance: ${result.km} km.`));
    } catch {
      setRouteKm(null);
      setWarn(true);
      setMessage(tx("Không tính được quãng đường lúc này.", "The distance could not be calculated just now."));
    } finally {
      setRouteBusy(false);
    }
  }

  const senderReady = company.trim().length > 1 && pickupContact.trim().length > 1 && pickupPhone.replace(/\D/g, "").length >= 9 && pickupAddress.trim().length >= 6;
  const recipientReady = recipient.trim().length > 1 && phone.replace(/\D/g, "").length >= 9 && address.trim().length >= 6;
  const goodsReady = declared > 0 && cargo.weightKg > 0 && cargo.lengthCm > 0;
  const bad = (empty: boolean) => (warn && empty ? `${inputClass} border-warn` : inputClass);

  return (
    <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <Section
          step="1"
          title={tx("Bên gửi", "Sender")}
          ready={senderReady}
          note={tx("Người đưa hàng cho tài xế.", "The person who hands the goods to the courier.")}
        >
          <Field label={tx("Doanh nghiệp gửi", "Sending company")} required>
            <input className={bad(!company.trim())} autoComplete="organization" value={company} onChange={(event) => setCompany(event.target.value)} />
          </Field>
          <Field label={tx("Giá trị khai báo (đồng)", "Declared value (VND)")} required>
            <input className={bad(declared <= 0)} inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} />
          </Field>
          <Field label={tx("Người gửi", "Sender")} required>
            <input className={bad(!pickupContact.trim())} autoComplete="name" value={pickupContact} onChange={(event) => setPickupContact(event.target.value)} />
          </Field>
          <Field label={tx("Điện thoại người gửi", "Sender telephone")} required hint={tx("Số tài xế sẽ gọi khi lấy hàng.", "The number the courier calls at pickup.")}>
            <input className={bad(pickupPhone.replace(/\D/g, "").length < 9)} inputMode="tel" autoComplete="tel" placeholder="0901234567" value={pickupPhone} onChange={(event) => setPickupPhone(event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={tx("Địa chỉ lấy hàng", "Pickup address")} required>
              <input
                className={bad(pickupAddress.trim().length < 6)}
                autoComplete="street-address"
                value={pickupAddress}
                placeholder={tx("Kho 12, KCN Sóng Thần, Dĩ An", "Warehouse 12, Song Than, Di An")}
                onChange={(event) => {
                  setPickupAddress(event.target.value);
                  setRouteKm(null);
                }}
              />
            </Field>
          </div>
        </Section>

        <Section
          step="2"
          title={tx("Bên nhận", "Recipient")}
          ready={recipientReady}
          note={tx("Người được giao hàng. Không phải người gửi.", "The person who receives the goods. Not the sender.")}
        >
          <Field label={tx("Người nhận", "Recipient")} required>
            <input className={bad(!recipient.trim())} value={recipient} onChange={(event) => setRecipient(event.target.value)} />
          </Field>
          <Field label={tx("Điện thoại người nhận", "Recipient telephone")} required hint={tx("Số tài xế sẽ gọi khi giao.", "The number the courier calls on delivery.")}>
            <input className={bad(phone.replace(/\D/g, "").length < 9)} inputMode="tel" autoComplete="tel" placeholder="0987654321" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={tx("Địa chỉ nhận hàng", "Delivery address")} required>
              <input
                className={bad(address.trim().length < 6)}
                autoComplete="street-address"
                value={address}
                placeholder={tx("123 Lê Duẩn, Quận 1", "123 Le Duan, District 1")}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setRouteKm(null);
                }}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => void measure()}
              disabled={routeBusy || pickupAddress.trim().length < 6 || address.trim().length < 6}
              className="inline-flex h-11 items-center rounded-md bg-teal px-5 text-sm font-semibold text-paper disabled:opacity-40"
            >
              {routeBusy ? tx("Đang tính km…", "Calculating km…") : tx("Tính quãng đường", "Calculate distance")}
            </button>
            <p className={routeKm ? "text-sm font-semibold text-navy" : "text-sm text-muted"}>
              {routeKm ? `${routeKm} km` : tx("Nhập hai địa chỉ rồi tính km trước khi giữ chỗ.", "Enter both addresses, then calculate the kilometres before holding a slot.")}
            </p>
          </div>
          <Field label={tx("Hình thức bàn giao", "Handover")}>
            <select className={inputClass} value={handover} onChange={(event) => setHandover(event.target.value as Handover)}>
              <option value="door">{tx("Giao tại cửa", "At the door")}</option>
              <option value="locker">{tx("Tủ nhận cùng ô", "Locker in the same cell")}</option>
              <option value="reception">{tx("Lễ tân tòa nhà", "Building reception")}</option>
              <option value="neighbour">{tx("Người nhận thay", "Alternate recipient")}</option>
            </select>
          </Field>
          <Field label={tx("Chỉ dẫn vào tòa nhà", "Building access")}>
            <input className={inputClass} value={accessNote} placeholder={tx("Tầng, bảo vệ, giờ nhận", "Floor, security, receiving hours")} onChange={(event) => setAccessNote(event.target.value)} />
          </Field>
        </Section>

        <Section step="3" title={tx("Hàng và xe", "Goods and vehicle")} ready={goodsReady}>
          <Field label={tx("Dài (cm)", "Length (cm)")} required>
            <input className={bad(cargo.lengthCm <= 0)} inputMode="decimal" value={lengthCm} onChange={(event) => setLengthCm(event.target.value)} />
          </Field>
          <Field label={tx("Rộng (cm)", "Width (cm)")}>
            <input className={inputClass} inputMode="decimal" value={widthCm} onChange={(event) => setWidthCm(event.target.value)} />
          </Field>
          <Field label={tx("Cao (cm)", "Height (cm)")}>
            <input className={inputClass} inputMode="decimal" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
          </Field>
          <Field label={tx("Nặng (kg)", "Weight (kg)")} required>
            <input className={bad(cargo.weightKg <= 0)} inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
          </Field>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <Choice
              active={activeVehicle === "moto"}
              disabled={!metrics.motoOk}
              title={tx("Xe máy điện", "Electric motorcycle")}
              body={metrics.motoOk ? tx("Dat Bike hoặc VinFast. Hàng gọn.", "Dat Bike or VinFast. Compact goods.") : tx("Hàng vượt 20 kg hoặc 55 cm.", "Over 20 kg or 55 cm.")}
              onClick={() => setVehicle("moto")}
            />
            <Choice
              active={activeVehicle === "van"}
              title={tx("Xe van điện", "Electric van")}
              body={tx("Hàng to, nặng, hoặc cần giữ cẩn thận.", "Large, heavy, or careful goods.")}
              onClick={() => setVehicle("van")}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <Choice
              active={pack === "self"}
              title={tx("Tự đóng gói", "Pack it yourself")}
              body={tx("0 đồng", "0 VND")}
              onClick={() => setPack("self")}
            />
            <Choice
              active={pack === "green"}
              title={tx("Đóng gói xanh", "Green packing")}
              body={tx("Kraft hoặc carton tái chế, tính theo kích thước.", "Kraft or recycled carton, priced by size.")}
              onClick={() => setPack("green")}
            />
          </div>
        </Section>

        <Section step="4" title={tx("Gói, giờ và ưu đãi", "Package, window, and voucher")} ready={Boolean(routeKm)}>
          <div className="grid gap-2 sm:col-span-2">
            {(["standard", "precise", "secure"] as PackageId[]).map((id) => (
              <Choice
                key={id}
                active={packageId === id}
                title={id === "standard" ? "EMStandard" : id === "precise" ? "EMPrecise" : "EMSecure"}
                body={`${formatVnd(PACKAGES[id].base, lang)} + ${formatVnd(PACKAGE_RATES[id][activeVehicle], lang)}/km`}
                onClick={() => setPackageId(id)}
              />
            ))}
          </div>
          <Field label={tx("Ô phục vụ", "Service cell")}>
            <select className={inputClass} value={cellId} onChange={(event) => setCellId(event.target.value)}>
              {CELLS.map((cell) => (
                <option key={cell.id} value={cell.id}>
                  {lang === "vi" ? cell.vi : cell.en}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tx("Cửa sổ thời gian", "Time window")}>
            <select className={inputClass} value={activeSlot} onChange={(event) => setSlotId(event.target.value as SlotId)}>
              {SLOTS.filter((slot) => allowed.includes(slot.id)).map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.vi} · {capacity[cellId]?.[slot.id] ?? 0} {tx("chỗ", "left")}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label={tx("Mã ưu đãi", "Voucher")} hint="EMXANH10 · EMMOI20 · SECURE15">
              <input className={inputClass} value={voucher} placeholder="EMXANH10" onChange={(event) => setVoucher(event.target.value.toUpperCase())} />
            </Field>
            <button type="button" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm font-semibold text-navy" onClick={() => setAppliedVoucher(voucher.trim())}>
              {tx("Áp dụng", "Apply")}
            </button>
          </div>
          <label className="flex h-11 items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" checked={cod} onChange={(event) => setCod(event.target.checked)} />
            {tx("Thu hộ COD từ người nhận", "Collect COD from the recipient")}
          </label>
          {cod ? (
            <Field label={tx("Số tiền thu hộ (đồng)", "COD amount (VND)")}>
              <input className={inputClass} inputMode="numeric" value={codAmount} onChange={(event) => setCodAmount(event.target.value)} />
            </Field>
          ) : null}
        </Section>
      </div>

      <aside className="rounded-lg border border-line bg-card p-5 lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">{tx("Cước tạm tính", "Fee so far")}</p>
        <p className="mt-2 font-display text-4xl font-semibold text-navy">{routeKm ? formatVnd(priced.total, lang) : "—"}</p>
        <ul className="mt-4 space-y-2 text-sm text-ink">
          <li className="flex justify-between gap-3">
            <span className="text-muted">{tx("Quãng đường", "Distance")}</span>
            <span>{routeKm ? `${routeKm} km × ${formatVnd(priced.perKm, lang)}` : "—"}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-muted">{tx("Phí gói", "Package")}</span>
            <span>{formatVnd(priced.base, lang)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-muted">{tx("Đóng gói", "Packing")}</span>
            <span>{formatVnd(priced.packFee, lang)}</span>
          </li>
          {priced.weightFee ? (
            <li className="flex justify-between gap-3">
              <span className="text-muted">{tx("Khối lượng", "Weight")}</span>
              <span>{formatVnd(priced.weightFee, lang)}</span>
            </li>
          ) : null}
          {priced.evening ? (
            <li className="flex justify-between gap-3">
              <span className="text-muted">{tx("Cửa sổ tối", "Evening window")}</span>
              <span>{formatVnd(priced.evening, lang)}</span>
            </li>
          ) : null}
          {priced.discount ? (
            <li className="flex justify-between gap-3">
              <span className="text-muted">Voucher</span>
              <span>−{formatVnd(priced.discount, lang)}</span>
            </li>
          ) : null}
          <li className="flex justify-between gap-3 border-t border-line pt-2">
            <span className="text-muted">CO2e</span>
            <span>{priced.co2e} g</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-muted">{tx("Chỗ còn", "Places left")}</span>
            <span className={left <= 2 ? "font-semibold text-warn" : "font-semibold text-navy"}>{left}</span>
          </li>
        </ul>
        {priced.voucherState === "bad" ? <p className="mt-3 text-sm text-warn">{tx("Mã ưu đãi không dùng được.", "That voucher cannot be used.")}</p> : null}
        {priced.voucherState === "wrong_package" ? <p className="mt-3 text-sm text-warn">{tx("Mã này chỉ dành cho EMSecure.", "This code is only for EMSecure.")}</p> : null}
        {priced.forcedVan ? (
          <p className="mt-3 text-sm text-muted">{tx("Hàng này chỉ đi xe van điện.", "These goods go only by electric van.")}</p>
        ) : null}
        {suggest ? (
          <button type="button" className="mt-4 w-full rounded-md bg-teal-soft px-3 py-3 text-left text-sm text-ink" onClick={() => setPackageId("secure")}>
            {tx("Giá trị từ 2 triệu. Chuyển sang EMSecure.", "Value is from 2 million. Switch to EMSecure.")}
          </button>
        ) : null}
        {message ? <p className={warn ? "mt-4 text-sm text-warn" : "mt-4 text-sm text-teal"}>{message}</p> : null}
        <button type="submit" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-navy text-sm font-semibold text-paper">
          {routeKm ? tx("Giữ chỗ", "Hold the slot") : tx("Tính km rồi giữ chỗ", "Calculate km, then hold the slot")}
        </button>
      </aside>
    </form>
  );
}

function Payment({
  orders,
  focusId,
  onDispatched,
}: {
  orders: Order[];
  focusId: string | null;
  onDispatched: (id: string) => void;
}) {
  const { lang, tx } = useTx();
  const payOrder = useElec((state) => state.payOrder);
  const open = orders.filter((order) => order.status !== "cancelled");
  const [picked, setPicked] = useState(focusId ?? open[0]?.id ?? "");
  const current = open.find((order) => order.id === picked) ?? open[0];
  useEffect(() => {
    if (focusId) setPicked(focusId);
  }, [focusId]);
  const methods = [
    { id: "transfer" as const, title: tx("Chuyển khoản", "Bank transfer"), body: tx("Trả cước từ tài khoản doanh nghiệp.", "Pay the fee from the company account.") },
    { id: "card" as const, title: tx("Thẻ doanh nghiệp", "Company card"), body: tx("Trả cước bằng thẻ.", "Pay the fee by card.") },
    { id: "statement" as const, title: tx("Sao kê cuối kỳ", "End-of-period statement"), body: tx("Gộp cước vào kỳ đối soát.", "Add the fee to the settlement period.") },
  ];

  return (
    <section className="rounded-lg border border-line bg-card p-5">
      <h2 className="font-display text-2xl font-semibold text-navy">{tx("Thanh toán cước", "Pay the delivery fee")}</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        {tx(
          "Doanh nghiệp chỉ chọn phương thức. ELECMOVE là bên ghi nhận thanh toán. Thu hộ COD là tiền hàng thu từ người nhận và không thay cho cước này.",
          "The enterprise only chooses a method. ELECMOVE records the payment. COD is goods money collected from the recipient and does not replace this fee.",
        )}
      </p>
      {current ? (
        <div className="mt-5 grid gap-4">
          <Field label={tx("Đơn", "Order")}>
            <select className={inputClass} value={current.id} onChange={(event) => setPicked(event.target.value)}>
              {open.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} · {formatVnd(order.price, lang)}
                </option>
              ))}
            </select>
          </Field>
          <div className="rounded-md bg-paper p-3 text-sm text-ink">
            <p>
              {tx("Cước", "Fee")}: <strong>{formatVnd(current.price, lang)}</strong>
            </p>
            <p className="mt-1">
              COD:{" "}
              {current.cod
                ? tx(`Có, thu ${formatVnd(current.codAmount ?? 0, lang)} từ người nhận`, `Yes, collect ${formatVnd(current.codAmount ?? 0, lang)} from the recipient`)
                : tx("Không thu hộ", "No cash collection")}
            </p>
            <p className="mt-1">
              {current.paymentStatus === "paid"
                ? tx("ELECMOVE đã ghi nhận cước và đang điều tài xế tới điểm lấy.", "ELECMOVE recorded the fee and is sending a courier to the pickup.")
                : tx("Chọn một phương thức. Tài xế chỉ được điều đi sau khi ELECMOVE ghi nhận cước.", "Choose a method. A courier is dispatched only after ELECMOVE records the fee.")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {methods.map((item) => {
              const active = current.paymentMethod === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={current.paymentStatus === "paid"}
                  onClick={() => {
                    if (current.paymentStatus === "paid") return;
                    payOrder(current.id, item.id);
                    onDispatched(current.id);
                  }}
                  className={`rounded-lg border px-3 py-3 text-left disabled:cursor-default ${
                    active ? "border-teal bg-teal-soft" : "border-line bg-paper disabled:opacity-60"
                  }`}
                >
                  <span className="block text-sm font-semibold text-navy">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted">{item.body}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{tx("Chưa có đơn để thanh toán.", "No order to pay yet.")}</p>
      )}
    </section>
  );
}

function Section({
  step,
  title,
  note,
  ready,
  children,
}: {
  step: string;
  title: string;
  note?: string;
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-navy">
            <span className="mr-2 text-teal">{step}</span>
            {title}
          </h2>
          {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
        </div>
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ready ? "bg-teal" : "bg-line"}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Choice({
  active,
  disabled,
  title,
  body,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "border-teal bg-teal-soft" : "border-line bg-paper"
      }`}
    >
      <span className="block text-sm font-semibold text-navy">{title}</span>
      <span className="mt-1 block text-sm text-muted">{body}</span>
    </button>
  );
}

function packageName(id: PackageId) {
  if (id === "standard") return "EMStandard";
  if (id === "precise") return "EMPrecise";
  return "EMSecure";
}

function handoverLabel(lang: "vi" | "en", handover: Handover) {
  const map: Record<Handover, [string, string]> = {
    door: ["Giao tại cửa địa chỉ", "At the address door"],
    locker: ["Tủ nhận trong cùng ô", "Locker in the same cell"],
    reception: ["Lễ tân tòa nhà", "Building reception"],
    neighbour: ["Người nhận thay", "Alternate recipient"],
  };
  const pair = map[handover];
  return lang === "vi" ? pair[0] : pair[1];
}

function csvCell(value: string) {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function downloadCo2Report(orders: Order[], lang: "vi" | "en") {
  const vi = lang === "vi";
  const header = vi
    ? [
        "Mã đơn",
        "Doanh nghiệp",
        "Người nhận",
        "Điện thoại",
        "Địa chỉ lấy",
        "Địa chỉ nhận",
        "Hình thức bàn giao",
        "Ô",
        "Gói",
        "Cửa sổ",
        "Khoảng cách ước tính (km)",
        "CO2e (g)",
        "Thời điểm tạo",
      ]
    : [
        "Order",
        "Company",
        "Recipient",
        "Telephone",
        "Pickup address",
        "Delivery address",
        "Handover",
        "Cell",
        "Package",
        "Window",
        "Estimated distance (km)",
        "CO2e (g)",
        "Created",
      ];
  const total = orders.reduce((sum, order) => sum + order.co2e, 0);
  const preface = vi
    ? [
        ["Báo cáo", "Phát thải well-to-wheel — ELECMOVE"],
        ["Phương pháp", `0,025 kWh/km × ${GRID_FACTOR} tCO2/MWh = ${GRAMS_PER_KM} g CO2e/km`],
        [
          "Phạm vi",
          "Phát thải từ điện lưới theo khoảng cách của ô giao. Không đo thực tế từng chuyến. Không phải phát thải ống xả.",
        ],
        [
          "Cách dùng",
          "Số trên website chỉ để thống kê. File này là bản doanh nghiệp lưu hoặc gửi nội bộ.",
        ],
        ["Số đơn", String(orders.length)],
        ["Tổng CO2e (g)", String(total)],
      ]
    : [
        ["Report", "Well-to-wheel emissions — ELECMOVE"],
        ["Method", `0.025 kWh/km × ${GRID_FACTOR} tCO2/MWh = ${GRAMS_PER_KM} g CO2e/km`],
        [
          "Scope",
          "Grid electricity by the delivery cell’s distance. Not a measured trip. Not a tailpipe figure.",
        ],
        ["Use", "Figures on the website are statistical only. This file is the copy to keep or send internally."],
        ["Orders", String(orders.length)],
        ["Total CO2e (g)", String(total)],
      ];
  const rows = orders.map((order) => {
    const cell = cellById(order.cellId);
    return [
      order.id,
      order.company,
      order.recipient,
      order.phone,
      order.pickupAddress || "",
      order.address,
      handoverLabel(lang, order.handover),
      vi ? cell.vi : cell.en,
      packageName(order.packageId),
      slotLabel(lang, order.slotId),
      String(order.km),
      String(order.co2e),
      new Date(order.createdAt).toLocaleString(vi ? "vi-VN" : "en-GB"),
    ];
  });
  const body = [
    ...preface.map((line) => line.map(csvCell).join(",")),
    "",
    header.map(csvCell).join(","),
    ...rows.map((line) => line.map(csvCell).join(",")),
  ].join("\r\n");
  const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `elecmove-bao-cao-co2e-${day}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Emissions({ orders }: { orders: Order[] }) {
  const { lang, tx } = useTx();
  const total = orders.reduce((sum, order) => sum + order.co2e, 0);
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl font-semibold text-navy">
          {tx("Xuất báo cáo phát thải", "Export the emissions report")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          {tx(
            "File gồm từng đơn, địa chỉ lấy, địa chỉ nhận, quãng đường đường bộ và gram CO2e.",
            "The file lists each order, the pickup address, the delivery address, the road distance, and grams of CO2e.",
          )}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-paper px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{tx("Số đơn trong file", "Orders in the file")}</dt>
            <dd className="mt-1 font-display text-lg font-semibold text-navy">{orders.length}</dd>
          </div>
          <div className="rounded-md bg-paper px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{tx("Tổng sẽ ghi trong file", "Total written to the file")}</dt>
            <dd className="mt-1 font-display text-lg font-semibold text-navy">{total} g CO2e</dd>
          </div>
          <div className="rounded-md bg-paper px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{tx("Hệ số", "Factor")}</dt>
            <dd className="mt-1 font-display text-lg font-semibold text-navy">{GRAMS_PER_KM} g/km</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink">
          {tx(
            `Phương pháp: 0,025 kWh/km nhân hệ số lưới ${GRID_FACTOR} tCO2/MWh, ra ${GRAMS_PER_KM} g CO2e mỗi kilômét của ô giao. Đội xe không phát thải ống xả. Doanh nghiệp không tuyên bố hoạt động hoàn toàn không phát thải.`,
            `Method: 0.025 kWh/km times the grid factor ${GRID_FACTOR} tCO2/MWh, which is ${GRAMS_PER_KM} g CO2e per kilometre of the delivery cell. The fleet has no tailpipe emissions. The enterprise does not claim the activity is emission-free.`,
          )}
        </p>
        <button
          type="button"
          disabled={orders.length === 0}
          onClick={() => downloadCo2Report(orders, lang)}
          className="mt-5 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tx("Tải file CSV", "Download CSV")}
        </button>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {tx("Chưa có đơn để xuất. Hãy tạo đơn kèm địa chỉ cụ thể trước.", "No orders to export yet. Create an order with a specific address first.")}
          </p>
        ) : null}
      </div>
      {orders.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-paper text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">{tx("Mã", "Code")}</th>
                <th className="px-3 py-3 font-medium">{tx("Địa chỉ giao", "Delivery address")}</th>
                <th className="px-3 py-3 font-medium">{tx("Ô", "Cell")}</th>
                <th className="px-3 py-3 font-medium">{tx("km", "km")}</th>
                <th className="px-3 py-3 font-medium">CO2e</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const cell = cellById(order.cellId);
                return (
                  <tr key={order.id} className="border-t border-line">
                    <td className="px-3 py-3 font-medium text-navy">{order.id}</td>
                    <td className="px-3 py-3">{order.address || "—"}</td>
                    <td className="px-3 py-3">{lang === "vi" ? cell.vi : cell.en}</td>
                    <td className="px-3 py-3">{cell.km}</td>
                    <td className="px-3 py-3">{order.co2e} g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function Claims() {
  const { lang, tx } = useTx();
  const orders = useElec((state) => state.orders);
  const claims = useElec((state) => state.claims);
  const openClaim = useElec((state) => state.openClaim);
  const reconcile = useElec((state) => state.reconcile);
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [note, setNote] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!orderId || !note.trim()) return;
    openClaim(orderId, note);
    setNote("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-navy">
          {tx("Mở yêu cầu", "Open a claim")}
        </h2>
        <div className="mt-4 grid gap-4">
          <Field label={tx("Đơn", "Order")}>
            <select className={inputClass} value={orderId} onChange={(event) => setOrderId(event.target.value)}>
              <option value="">{tx("Chọn đơn", "Select an order")}</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} · {order.company}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tx("Mô tả", "Description")}>
            <textarea
              className="min-h-24 w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-md bg-navy text-sm font-semibold text-paper">
            {tx("Ghi nhận yêu cầu", "Record the claim")}
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {claims.length === 0 ? (
          <p className="text-sm text-muted">{tx("Chưa có yêu cầu.", "No claims yet.")}</p>
        ) : (
          claims.map((claim) => {
            const order = orders.find((item) => item.id === claim.orderId);
            return (
              <article key={claim.id} className="rounded-lg border border-line bg-card p-4">
                <p className="font-medium text-navy">
                  {claim.id} · {claim.orderId}
                </p>
                <p className="mt-1 text-sm text-muted">{claim.note}</p>
                <p className="mt-2 text-sm">
                  {tx("Kết luận", "Finding")}: {claim.fault}
                  {claim.compensation !== null
                    ? ` · ${formatVnd(claim.compensation, lang)}`
                    : ""}
                </p>
                {order?.packageId !== "secure" && claim.fault === "elecmove" ? (
                  <p className="mt-1 text-xs text-muted">
                    {tx(
                      "Mức hiển thị là bốn lần cước, theo sàn Nghị định 47/2011/NĐ-CP, vì đơn không thuộc EMSecure.",
                      "The amount shown is four times the tariff, the floor in Decree 47/2011/ND-CP, because the order is not EMSecure.",
                    )}
                  </p>
                ) : null}
                {claim.fault === "pending" ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="h-11 rounded-md bg-navy px-3 text-sm font-semibold text-paper"
                      onClick={() => reconcile(claim.id, "elecmove")}
                    >
                      {tx("Lỗi thuộc ELECMOVE", "Fault is ELECMOVE")}
                    </button>
                    <button
                      type="button"
                      className="h-11 rounded-md border border-navy px-3 text-sm font-semibold text-navy"
                      onClick={() => reconcile(claim.id, "sender")}
                    >
                      {tx("Lỗi đóng gói người gửi", "Sender packing fault")}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function Log() {
  const { lang, tx } = useTx();
  const audit = useElec((state) => state.audit);
  if (audit.length === 0) return <p className="text-sm text-muted">{tx("Nhật ký còn trống.", "The log is empty.")}</p>;
  return (
    <ol className="space-y-2">
      {audit.map((item) => {
        const copy = AUDIT_COPY[item.code] ?? [item.code, item.code];
        return (
          <li key={item.id} className="rounded-lg border border-line bg-card px-4 py-3 text-sm">
            <p className="font-medium text-navy">{lang === "vi" ? copy[0] : copy[1]}</p>
            <p className="text-muted">
              {new Date(item.at).toLocaleString(lang === "vi" ? "vi-VN" : "en-GB")} · {item.detail}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Leads() {
  const { tx } = useTx();
  const leads = useElec((state) => state.leads);
  if (leads.length === 0) {
    return <p className="text-sm text-muted">{tx("Chưa có yêu cầu dùng thử trên trình duyệt này.", "No trial requests in this browser yet.")}</p>;
  }
  return (
    <ul className="grid gap-3">
      {leads.map((lead) => (
        <li key={lead.id} className="rounded-lg border border-line bg-card p-4 text-sm">
          <p className="font-medium text-navy">
            {lead.company} · {lead.packageId}
          </p>
          <p className="mt-1 text-muted">
            {lead.contact} · {lead.email} {lead.phone ? `· ${lead.phone}` : ""}
          </p>
          <p className="mt-1 text-muted">
            {lead.segment}
            {lead.volume ? ` · ${lead.volume}` : ""}
            {lead.note ? ` · ${lead.note}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
