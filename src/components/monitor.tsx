import { useEffect, useState } from "react";
import { cellById } from "@/lib/catalog";
import { driverPhone, driverPhoneTel } from "@/lib/contact";
import { slotLabel, useTx } from "@/lib/i18n";
import { useElec, type IncidentKind, type Order } from "@/lib/store";
import { Field, inputClass } from "@/components/shell";

const DURATION_MS = 48_000;

export function Monitor({ focusId, missingCode }: { focusId: string | null; missingCode?: string }) {
  const { lang, tx } = useTx();
  const orders = useElec((state) => state.orders);
  const messages = useElec((state) => state.messages ?? []);
  const incidents = useElec((state) => state.incidents ?? []);
  const markCollected = useElec((state) => state.markCollected);
  const confirmReceipt = useElec((state) => state.confirmReceipt);
  const cancelOrder = useElec((state) => state.cancelOrder);
  const rateOrder = useElec((state) => state.rateOrder);
  const sendToDriver = useElec((state) => state.sendToDriver);
  const openIncident = useElec((state) => state.openIncident);
  const [orderId, setOrderId] = useState(focusId ?? "");
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<IncidentKind>("access");
  const [note, setNote] = useState("");
  const [cancelReason, setCancelReason] = useState("sender_stop");
  const [cancelNote, setCancelNote] = useState("");
  const [score, setScore] = useState(0);
  const [ratingNote, setRatingNote] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const activeId = orders.some((order) => order.id === orderId) ? orderId : (orders[0]?.id ?? "");
  const order = orders.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    if (focusId) setOrderId(focusId);
  }, [focusId]);

  useEffect(() => {
    if (!order?.collectedAt || order.status !== "booked") return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [order?.collectedAt, order?.status, order?.id]);

  if (missingCode) {
    return (
      <p className="text-sm text-ink">
        {tx(`Không thấy mã vận đơn ${missingCode}.`, `No shipment was found for ${missingCode}.`)}
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-sm text-muted">
        {tx("Chưa có đơn để giám sát.", "No order to monitor yet.")}
      </p>
    );
  }

  const cell = cellById(order.cellId);
  const progress = legProgress(order, now);
  const thread = messages.filter((item) => item.orderId === order.id).slice().reverse();
  const cases = incidents.filter((item) => item.orderId === order.id);
  const near = progress >= 0.82;

  const phone = driverPhone(order.id);

  function send(event: React.FormEvent) {
    event.preventDefault();
    sendToDriver(order!.id, draft);
    setDraft("");
  }

  function report(event: React.FormEvent) {
    event.preventDefault();
    openIncident(order!.id, kind, note);
    setNote("");
  }

  function cancel(event: React.FormEvent) {
    event.preventDefault();
    const reason = cancelLabel(lang, cancelReason);
    const detail = cancelNote.trim();
    cancelOrder(order!.id, detail ? `${reason}. ${detail}` : reason);
    setCancelNote("");
  }

  function rate(event: React.FormEvent) {
    event.preventDefault();
    rateOrder(order!.id, score, ratingNote);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl font-semibold text-navy">
          {tx("Giám sát chuyến giao", "Delivery monitoring")}
        </h2>
        <div className="mt-4 max-w-md">
          <Field label={tx("Đơn", "Order")}>
            <select className={inputClass} value={order.id} onChange={(event) => setOrderId(event.target.value)}>
              {orders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.address || item.company}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-lg border border-line bg-card p-5 lg:col-span-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">
              {tx("Bản đồ Google", "Google map")} · {lang === "vi" ? cell.vi : cell.en}
            </h3>
            <p className="text-sm text-muted">{slotLabel(lang, order.slotId)}</p>
          </div>
          <p className="mt-1 text-sm text-ink">{tx("Người nhận", "Recipient")}: {order.address || tx("Chưa có địa chỉ", "No address")}</p>
          <p className="text-sm text-muted">{tx("Người gửi", "Sender")}: {order.pickupAddress || "—"}</p>
          <iframe
            title={tx("Lộ trình lấy hàng tới điểm giao", "Route from pickup to delivery")}
            src={`https://maps.google.com/maps?saddr=${encodeURIComponent(`${order.pickupAddress}, Việt Nam`)}&daddr=${encodeURIComponent(`${order.address}, Việt Nam`)}&hl=${lang === "vi" ? "vi" : "en"}&output=embed`}
            className="mt-4 h-72 w-full rounded-md border border-line"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p className="mt-3 text-sm text-ink">{order.km} km · {statusLine(order, progress, near, tx)}</p>
          {order.paymentStatus !== "paid" && order.status === "booked" ? (
            <p className="mt-4 text-sm text-ink">
              {tx(
                "Đơn chưa được thanh toán. Tài xế chưa được điều tới điểm lấy.",
                "The fee is not recorded yet. No courier has been dispatched to the pickup.",
              )}
            </p>
          ) : null}
          {order.paymentStatus === "paid" && !order.collectedAt && order.status === "booked" ? (
            <button
              type="button"
              className="mt-4 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper"
              onClick={() => markCollected(order.id)}
            >
              {tx("Tài xế đã tới và nhận hàng", "The courier has arrived and collected the goods")}
            </button>
          ) : null}
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label={tx("Tài xế", "Courier")}
              value={order.paymentStatus === "paid" ? `TX-${order.id.slice(-3)}` : tx("Chưa điều", "Not dispatched")}
            />
            <div className="rounded-md bg-paper px-3 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                {tx("Số điện thoại tài xế", "Courier telephone")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-navy">
                {order.paymentStatus === "paid" ? (
                  <a href={`tel:${driverPhoneTel(order.id)}`}>{phone}</a>
                ) : (
                  tx("Có sau khi ELECMOVE điều xe", "Shown after ELECMOVE dispatches")
                )}
              </dd>
            </div>
            <Stat
              label={tx("Phương tiện", "Vehicle")}
              value={
                order.vehicle === "van"
                  ? tx("Xe van điện", "Electric van")
                  : tx("Xe máy điện hai bánh", "Electric motorcycle")
              }
            />
            <Stat label={tx("Mức hoàn thành chặng", "Leg completion")} value={order.collectedAt && order.status !== "cancelled" ? `${Math.round(progress * 100)}%` : "—"} />
          </dl>
        </section>

        <section className="rounded-lg border border-line bg-card p-5 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold text-navy">
            {tx("Trao đổi với tài xế", "Messages to the courier")}
          </h3>
          <ol className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {thread.length === 0 ? (
              <li className="text-sm text-muted">{tx("Chưa có tin.", "No messages yet.")}</li>
            ) : (
              thread.map((item) => (
                <li key={item.id} className="rounded-md bg-paper px-3 py-2 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {item.from === "customer"
                      ? tx("Doanh nghiệp", "Enterprise")
                      : item.from === "driver"
                        ? tx("Tài xế", "Courier")
                        : tx("Chăm sóc khách hàng", "Customer care")}
                  </p>
                  <p className="mt-1 text-ink">{item.body}</p>
                </li>
              ))
            )}
          </ol>
          <form onSubmit={send} className="mt-4 grid gap-3">
            <Field label={tx("Nội dung gửi tài xế", "Message to the courier")}>
              <input
                className={inputClass}
                value={draft}
                disabled={order.paymentStatus !== "paid" || order.status !== "booked"}
                onChange={(event) => setDraft(event.target.value)}
              />
            </Field>
            <button
              type="submit"
              disabled={order.paymentStatus !== "paid" || order.status !== "booked" || !draft.trim()}
              className="inline-flex h-11 items-center justify-center rounded-md bg-navy px-5 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tx("Gửi", "Send")}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-navy">
          {tx("Sự cố — chăm sóc khách hàng ELECMOVE", "Incident — ELECMOVE customer care")}
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          {tx(
            "Dùng khi chuyến đang chạy: không vào được địa chỉ, trễ khung giờ, niêm phong bất thường, hoặc người nhận vắng.",
            "Use this while a trip is running: no access, a missed window, an abnormal seal, or an absent recipient.",
          )}
        </p>
        <form onSubmit={report} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={tx("Loại sự cố", "Incident type")}>
            <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as IncidentKind)}>
              <option value="access">{tx("Không vào được địa chỉ", "Cannot access the address")}</option>
              <option value="delay">{tx("Có nguy cơ trễ cửa sổ", "Risk of missing the window")}</option>
              <option value="seal">{tx("Niêm phong hoặc hàng bất thường", "Seal or goods look abnormal")}</option>
              <option value="absent">{tx("Người nhận vắng", "Recipient is absent")}</option>
              <option value="other">{tx("Sự cố khác", "Other incident")}</option>
            </select>
          </Field>
          <Field label={tx("Mô tả để xử lý", "Description for handling")}>
            <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className="inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper">
              {tx("Gửi chăm sóc khách hàng", "Send to customer care")}
            </button>
          </div>
        </form>
        {cases.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {cases.map((item) => (
              <li key={item.id} className="rounded-md border border-line px-3 py-3 text-sm">
                <p className="font-medium text-navy">
                  {item.id} · {kindLabel(lang, item.kind)}
                </p>
                <p className="mt-1 text-ink">{item.note}</p>
                <p className="mt-1 text-muted">{item.ack}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-lg border border-line bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-navy">
          {tx("Xác nhận nhận hàng", "Confirm receipt")}
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          {tx(
            "Thao tác này thuộc về người nhận, sau khi tài xế đã nhận hàng đi giao. Xác nhận xong mới mở phần đánh giá.",
            "This action belongs to the recipient, after the courier has collected the goods. The rating opens only after confirmation.",
          )}
        </p>
        {order.receivedAt ? (
          <p className="mt-4 text-sm text-ink">
            {tx("Người nhận đã xác nhận.", "The recipient has confirmed.")}{" "}
            {new Date(order.receivedAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-GB")}
          </p>
        ) : (
          <button
            type="button"
            disabled={!order.collectedAt || order.status !== "booked"}
            onClick={() => confirmReceipt(order.id)}
            className="mt-4 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tx("Xác nhận đã nhận hàng", "Confirm the goods were received")}
          </button>
        )}
        <div className="mt-6 border-t border-line pt-5">
          <h4 className="font-display text-lg font-semibold text-navy">
            {tx("Đánh giá dịch vụ", "Service rating")}
          </h4>
          {order.receivedAt ? (
            <form onSubmit={rate} className="mt-4 grid gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-ink">{tx("Mức độ", "Score")}</p>
                <div className="flex gap-2" role="group" aria-label={tx("Mức đánh giá từ 1 đến 5", "Rating from 1 to 5")}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setScore(value)}
                      className={
                        (order.rating === value && score === 0) || score === value
                          ? "h-11 w-11 rounded-md bg-navy text-sm font-semibold text-paper"
                          : "h-11 w-11 rounded-md border border-line text-sm font-semibold text-navy"
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <Field label={tx("Nhận xét", "Comment")}>
                <input className={inputClass} value={ratingNote} onChange={(event) => setRatingNote(event.target.value)} />
              </Field>
              <button
                type="submit"
                disabled={score < 1}
                className="inline-flex h-11 w-fit items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tx("Ghi đánh giá", "Save the rating")}
              </button>
              {order.rating ? (
                <p className="text-sm text-ink">
                  {tx(`Đã ghi ${order.rating}/5.`, `Saved at ${order.rating}/5.`)} {order.ratingNote}
                </p>
              ) : null}
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {tx("Chưa mở. Người nhận cần xác nhận đã nhận hàng trước.", "Not open yet. The recipient confirms receipt first.")}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-navy">{tx("Hủy đơn", "Cancel the order")}</h3>
        {order.status === "cancelled" ? (
          <p className="mt-3 text-sm text-ink">
            {tx("Đơn đã hủy.", "The order is cancelled.")} {order.cancelReason}
          </p>
        ) : order.status === "booked" ? (
          <form onSubmit={cancel} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={tx("Lý do hủy", "Reason for cancellation")}>
              <select className={inputClass} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
                <option value="sender_stop">{tx("Doanh nghiệp dừng đơn", "The enterprise stops the order")}</option>
                <option value="wrong_address">{tx("Sai địa chỉ", "Wrong address")}</option>
                <option value="goods_not_ready">{tx("Hàng chưa sẵn sàng", "Goods are not ready")}</option>
                <option value="recipient_reschedule">{tx("Người nhận đổi lịch", "The recipient changes the time")}</option>
                <option value="other">{tx("Lý do khác", "Another reason")}</option>
              </select>
            </Field>
            <Field label={tx("Diễn giải thêm", "Further note")}>
              <input className={inputClass} value={cancelNote} onChange={(event) => setCancelNote(event.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" className="inline-flex h-11 items-center rounded-md border border-navy px-5 text-sm font-semibold text-navy">
                {tx("Hủy đơn này", "Cancel this order")}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {tx("Đơn không còn ở trạng thái giữ chỗ nên không hủy được.", "The order is no longer held, so it cannot be cancelled.")}
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper px-3 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-navy">{value}</dd>
    </div>
  );
}

function legProgress(order: Order, now: number) {
  if (!order.collectedAt || order.status === "cancelled") {
    if (!order.collectedAt || !order.cancelledAt) return 0;
    const elapsed = new Date(order.cancelledAt).getTime() - new Date(order.collectedAt).getTime();
    return Math.min(1, Math.max(0, elapsed / DURATION_MS));
  }
  if (order.status !== "booked") return 1;
  const elapsed = now - new Date(order.collectedAt).getTime();
  return Math.min(1, Math.max(0, elapsed / DURATION_MS));
}

function statusLine(
  order: Order,
  progress: number,
  near: boolean,
  tx: (vi: string, en: string) => string,
) {
  if (order.status === "cancelled") {
    return tx(
      `Đơn đã hủy. ${order.cancelReason ?? ""}`.trim(),
      `The order is cancelled. ${order.cancelReason ?? ""}`.trim(),
    );
  }
  if (order.receivedAt) {
    return tx("Người nhận đã xác nhận nhận hàng. Sơ đồ giữ mốc cuối tại địa chỉ.", "The recipient confirmed receipt. The diagram holds the final mark at the address.");
  }
  if (order.status === "delivered") {
    return tx("Đơn đã đóng giao. Sơ đồ giữ mốc cuối tại địa chỉ.", "The order is closed. The diagram holds the final mark at the address.");
  }
  if (order.status === "claim") {
    return tx("Đơn đang trong yêu cầu bồi thường. Sơ đồ không còn cập nhật chặng.", "The order is in a claim. The diagram no longer advances the leg.");
  }
  if (!order.collectedAt) {
    if (order.paymentStatus !== "paid") {
      return tx("Chờ thanh toán. Tài xế chưa được điều tới điểm lấy.", "Waiting for payment. No courier has been dispatched to the pickup.");
    }
    return tx("ELECMOVE đã điều tài xế tới điểm lấy.", "ELECMOVE has dispatched a courier to the pickup.");
  }
  if (near || progress >= 1) {
    return tx(
      "Đã vào vùng gần địa chỉ nhận. Tài xế gọi trước 20 phút.",
      "Near the delivery address. The courier calls 20 minutes ahead.",
    );
  }
  return tx("Đã nhận hàng và đang di chuyển tới địa chỉ giao.", "Collected and moving toward the delivery address.");
}

function cancelLabel(lang: "vi" | "en", reason: string) {
  const map: Record<string, [string, string]> = {
    sender_stop: ["Doanh nghiệp dừng đơn", "The enterprise stops the order"],
    wrong_address: ["Sai địa chỉ", "Wrong address"],
    goods_not_ready: ["Hàng chưa sẵn sàng", "Goods are not ready"],
    recipient_reschedule: ["Người nhận đổi lịch", "The recipient changes the time"],
    other: ["Lý do khác", "Another reason"],
  };
  const pair = map[reason] ?? map.other;
  return lang === "vi" ? pair[0] : pair[1];
}

function kindLabel(lang: "vi" | "en", kind: IncidentKind) {
  const map: Record<IncidentKind, [string, string]> = {
    access: ["Không vào được địa chỉ", "Cannot access the address"],
    delay: ["Có nguy cơ trễ cửa sổ", "Risk of missing the window"],
    seal: ["Niêm phong hoặc hàng bất thường", "Seal or goods look abnormal"],
    absent: ["Người nhận vắng", "Recipient is absent"],
    other: ["Sự cố khác", "Other incident"],
  };
  return lang === "vi" ? map[kind][0] : map[kind][1];
}
