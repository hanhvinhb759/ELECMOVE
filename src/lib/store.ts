import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  compensationFor,
  emptyCapacity,
  settle,
  type PackageId,
  type SlotId,
  type Cargo,
  type VehicleId,
  PACKAGES,
} from "@/lib/catalog";

export type Lang = "vi" | "en";

export type Handover = "door" | "locker" | "reception" | "neighbour";

export type Order = {
  id: string;
  company: string;
  cellId: string;
  recipient: string;
  phone: string;
  pickupAddress: string;
  pickupContact: string;
  pickupPhone: string;
  address: string;
  accessNote: string;
  handover: Handover;
  packageId: PackageId;
  declaredValue: number;
  slotId: SlotId;
  vehicle: VehicleId;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  km: number;
  packMode: "self" | "green";
  packFee: number;
  voucherCode: string;
  discount: number;
  cod: boolean;
  codAmount: number;
  paymentStatus: "unpaid" | "paid";
  paymentMethod: "transfer" | "card" | "statement" | null;
  price: number;
  co2e: number;
  status: "booked" | "delivered" | "claim" | "cancelled";
  collectedAt: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  receivedAt: string | null;
  rating: number | null;
  ratingNote: string;
  suggestedSecure: boolean;
  createdAt: string;
};

export type ThreadMessage = {
  id: string;
  orderId: string;
  from: "customer" | "driver" | "care";
  body: string;
  at: string;
};

export type IncidentKind = "access" | "delay" | "seal" | "absent" | "other";

export type Incident = {
  id: string;
  orderId: string;
  kind: IncidentKind;
  note: string;
  ack: string;
  at: string;
};

export type Claim = {
  id: string;
  orderId: string;
  note: string;
  fault: "pending" | "elecmove" | "sender";
  compensation: number | null;
  createdAt: string;
};

export type Audit = { id: string; at: string; code: string; detail: string };

export type Lead = {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  segment: string;
  volume: string;
  packageId: PackageId;
  note: string;
  at: string;
};

type BookInput = {
  company: string;
  cellId: string;
  recipient: string;
  phone: string;
  pickupAddress: string;
  pickupContact: string;
  pickupPhone: string;
  address: string;
  accessNote: string;
  handover: Handover;
  packageId: PackageId;
  declaredValue: number;
  slotId: SlotId;
  suggestedSecure: boolean;
  vehicle: VehicleId;
  cargo: Cargo;
  km: number;
  pack: "self" | "green";
  voucher: string;
  cod: boolean;
  codAmount: number;
};

export type DriverApplication = {
  id: string;
  name: string;
  phone: string;
  area: string;
  vehicle: "moto" | "van";
  note: string;
  at: string;
};

type BookResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "full" | "not_allowed" | "noroute"; next: SlotId | null };

type State = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  capacity: Record<string, Record<SlotId, number>>;
  orders: Order[];
  claims: Claim[];
  messages: ThreadMessage[];
  incidents: Incident[];
  audit: Audit[];
  leads: Lead[];
  drivers: DriverApplication[];
  addLead: (lead: Omit<Lead, "id" | "at">) => void;
  addDriver: (driver: Omit<DriverApplication, "id" | "at">) => void;
  book: (input: BookInput) => BookResult;
  markCollected: (id: string) => void;
  sendToDriver: (orderId: string, body: string) => void;
  openIncident: (orderId: string, kind: IncidentKind, note: string) => void;
  cancelOrder: (id: string, reason: string) => void;
  confirmReceipt: (id: string) => void;
  rateOrder: (id: string, score: number, note: string) => void;
  payOrder: (id: string, method: "transfer" | "card" | "statement") => void;
  askCare: (body: string) => void;
  recordCare: (question: string, answer: string) => void;
  markDelivered: (id: string) => void;
  openClaim: (orderId: string, note: string) => void;
  reconcile: (claimId: string, fault: "elecmove" | "sender") => void;
  resetDemo: () => void;
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function stamp() {
  return new Date().toISOString();
}

function driverReply(lang: Lang, text: string) {
  const q = text.toLowerCase();
  if (/(đâu|vị trí|where|location|sơ đồ|map)/.test(q)) {
    return lang === "vi"
      ? "Tài xế đang trên lộ trình từ điểm lấy tới điểm giao của đơn. Bản đồ mở cả hai đầu."
      : "The courier is on the route from pickup to delivery. The map shows both ends.";
  }
  if (/(gọi|call|điện|phone)/.test(q)) {
    return lang === "vi"
      ? "Tài xế gọi trước 20 phút khi vào vùng gần địa chỉ nhận."
      : "The courier calls 20 minutes ahead when nearing the delivery address.";
  }
  if (/(chờ|wait|trễ|late|đến|arrive)/.test(q)) {
    return lang === "vi"
      ? "Đã nhận tin. Chuyến tiếp tục trong khung giờ đã giữ. Nếu có sự cố, gửi chăm sóc khách hàng trên cùng màn hình."
      : "Received. The trip continues inside the held window. If there is an incident, send it to customer care on this screen.";
  }
  return lang === "vi"
    ? "Tài xế đã nhận tin và tiếp tục chuyến."
    : "The courier has the message and is continuing the trip.";
}

function careReply(lang: Lang, text: string) {
  const q = text.toLowerCase();
  if (/(cước|giá|phí|price|fee|km)/.test(q)) {
    return lang === "vi"
      ? "Cước = phí gói + km đường lấy–giao × đơn giá của gói + kg tính cước vượt 3 kg + phí đóng gói nếu có, trừ voucher. EMStandard 4.800/9.500, EMPrecise 6.800/12.500, EMSecure 8.900/16.800 đồng mỗi km cho xe máy điện và xe van điện."
      : "The fee is the package fee plus pickup-to-delivery kilometres times that package’s rate, plus chargeable kilograms above 3 kg, plus packing if chosen, minus a voucher. EMStandard is 4,800/9,500, EMPrecise 6,800/12,500, and EMSecure 8,900/16,800 VND per km for the motorcycle and the van.";
  }
  if (/(cod|thu hộ|thanh toán|pay|chuyển khoản)/.test(q)) {
    return lang === "vi"
      ? "Doanh nghiệp chỉ chọn phương thức ở tab Thanh toán: chuyển khoản, thẻ, hoặc sao kê cuối kỳ. ELECMOVE ghi nhận thanh toán. Thu hộ COD là khoản thu từ người nhận, không thay cho cước."
      : "On the Payment tab the enterprise only chooses a method: transfer, card, or an end-of-period statement. ELECMOVE records the payment. COD is collected from the recipient and does not replace the fee.";
  }
  return lang === "vi"
    ? "Chăm sóc khách hàng ELECMOVE đã nhận tin. Nếu chuyến đang chạy, ghi sự cố trong mục Giám sát."
    : "ELECMOVE customer care has the message. If a trip is running, record the incident under Monitoring.";
}

export const useElec = create<State>()(
  persist(
    (set, get) => ({
      lang: "vi",
      setLang: (lang) => set({ lang }),
      capacity: emptyCapacity(),
      orders: [],
      claims: [],
      messages: [],
      incidents: [],
      audit: [],
      leads: [],
      drivers: [],
      addLead: (lead) =>
        set((state) => ({
          leads: [{ ...lead, id: uid("LEAD"), at: stamp() }, ...state.leads],
          audit: [
            { id: uid("LOG"), at: stamp(), code: "lead", detail: lead.company },
            ...state.audit,
          ],
        })),
      addDriver: (driver) =>
        set((state) => ({
          drivers: [{ ...driver, id: uid("TX"), at: stamp() }, ...(state.drivers ?? []),],
        })),
      book: (input) => {
        const allowed = PACKAGES[input.packageId].slots;
        const capacity = get().capacity[input.cellId] ?? emptyCapacity()[input.cellId];
        if (!allowed.includes(input.slotId)) {
          const next = allowed.find((slot) => (capacity[slot] ?? 0) > 0) ?? null;
          return { ok: false, reason: "not_allowed", next };
        }
        if ((capacity[input.slotId] ?? 0) <= 0) {
          const next = allowed.find((slot) => (capacity[slot] ?? 0) > 0) ?? null;
          set((state) => ({
            audit: [
              {
                id: uid("LOG"),
                at: stamp(),
                code: "slot_full",
                detail: `${input.cellId}:${input.slotId}`,
              },
              ...state.audit,
            ],
          }));
          return { ok: false, reason: "full", next };
        }
        if ((input.km ?? 0) <= 0) {
          return { ok: false, reason: "noroute", next: null };
        }
        const priced = settle({
          packageId: input.packageId,
          cellId: input.cellId,
          slotId: input.slotId,
          cargo: input.cargo,
          vehicle: input.vehicle,
          km: input.km,
          pack: input.pack,
          voucher: input.voucher,
        });
        const order: Order = {
          id: uid("EM"),
          company: input.company.trim(),
          cellId: input.cellId,
          recipient: input.recipient.trim(),
          phone: input.phone.trim(),
          pickupAddress: input.pickupAddress.trim(),
          pickupContact: input.pickupContact.trim(),
          pickupPhone: input.pickupPhone.trim(),
          address: input.address.trim(),
          accessNote: input.accessNote.trim(),
          handover: input.handover,
          packageId: input.packageId,
          declaredValue: input.declaredValue,
          slotId: input.slotId,
          vehicle: priced.vehicleId,
          lengthCm: input.cargo.lengthCm,
          widthCm: input.cargo.widthCm,
          heightCm: input.cargo.heightCm,
          weightKg: input.cargo.weightKg,
          km: priced.km,
          packMode: input.pack,
          packFee: priced.packFee,
          voucherCode: priced.voucherCode,
          discount: priced.discount,
          cod: input.cod,
          codAmount: input.cod ? input.codAmount : 0,
          paymentStatus: "unpaid",
          paymentMethod: null,
          price: priced.total,
          co2e: priced.co2e,
          status: "booked",
          collectedAt: null,
          cancelReason: null,
          cancelledAt: null,
          receivedAt: null,
          rating: null,
          ratingNote: "",
          suggestedSecure: input.suggestedSecure,
          createdAt: stamp(),
        };
        set((state) => ({
          capacity: {
            ...state.capacity,
            [input.cellId]: {
              ...capacity,
              [input.slotId]: (capacity[input.slotId] ?? 0) - 1,
            },
          },
          orders: [order, ...state.orders],
          audit: [
            {
              id: uid("LOG"),
              at: stamp(),
              code: "order_created",
              detail: `${order.id} ${order.packageId} ${order.slotId}`,
            },
            ...state.audit,
          ],
        }));
        return { ok: true, order };
      },
      markCollected: (id) => {
        const order = get().orders.find((item) => item.id === id);
        if (!order || order.collectedAt || order.status !== "booked" || order.paymentStatus !== "paid") return;
        const at = stamp();
        const lang = get().lang;
        const body =
          lang === "vi"
            ? "Đã nhận hàng tại điểm lấy. Lộ trình trên bản đồ đi từ điểm lấy tới điểm giao. Tài xế gọi trước 20 phút khi gần địa chỉ nhận."
            : "Collected at the pickup point. The map route runs from pickup to delivery. The courier calls 20 minutes ahead when nearing the address.";
        set((state) => ({
          orders: state.orders.map((item) => (item.id === id ? { ...item, collectedAt: at } : item)),
          messages: [
            { id: uid("MSG"), orderId: id, from: "driver", body, at },
            ...(state.messages ?? []),
          ],
          audit: [{ id: uid("LOG"), at, code: "collected", detail: id }, ...state.audit],
        }));
      },
      sendToDriver: (orderId, body) => {
        const text = body.trim().slice(0, 500);
        const order = get().orders.find((item) => item.id === orderId);
        if (!text || order?.paymentStatus !== "paid" || order.status !== "booked") return;
        const at = stamp();
        const lang = get().lang;
        const reply = order.collectedAt
          ? driverReply(lang, text)
          : lang === "vi"
            ? "Tài xế đang trên đường tới điểm lấy và chưa nhận hàng."
            : "The courier is on the way to the pickup and has not collected the goods.";
        set((state) => ({
          messages: [
            { id: uid("MSG"), orderId, from: "driver", body: reply, at },
            { id: uid("MSG"), orderId, from: "customer", body: text, at },
            ...(state.messages ?? []),
          ],
          audit: [
            { id: uid("LOG"), at, code: "driver_message", detail: orderId },
            ...state.audit,
          ],
        }));
      },
      openIncident: (orderId, kind, note) => {
        const text = note.trim().slice(0, 500);
        const order = get().orders.find((item) => item.id === orderId);
        if (!text || !order) return;
        const at = stamp();
        const lang = get().lang;
        const incident: Incident = {
          id: uid("CS"),
          orderId,
          kind,
          note: text,
          ack:
            lang === "vi"
              ? "Chăm sóc khách hàng ELECMOVE đã ghi nhận và giữ ca trong khung giờ đang chạy."
              : "ELECMOVE customer care has the case and is holding it inside the active window.",
          at,
        };
        set((state) => ({
          incidents: [incident, ...(state.incidents ?? [])],
          messages: [
            { id: uid("MSG"), orderId, from: "care", body: incident.ack, at },
            ...(state.messages ?? []),
          ],
          audit: [
            { id: uid("LOG"), at, code: "incident_opened", detail: `${incident.id} ${orderId} ${kind}` },
            ...state.audit,
          ],
        }));
      },
      cancelOrder: (id, reason) => {
        const text = reason.trim().slice(0, 300);
        const order = get().orders.find((item) => item.id === id);
        if (!text || !order || order.status !== "booked") return;
        const at = stamp();
        set((state) => {
          const cellCap = state.capacity[order.cellId] ?? emptyCapacity()[order.cellId];
          const ceiling = emptyCapacity()[order.cellId][order.slotId];
          return {
            orders: state.orders.map((item) =>
              item.id === id ? { ...item, status: "cancelled", cancelReason: text, cancelledAt: at } : item,
            ),
            capacity: {
              ...state.capacity,
              [order.cellId]: {
                ...cellCap,
                [order.slotId]: Math.min(ceiling, (cellCap[order.slotId] ?? 0) + 1),
              },
            },
            audit: [{ id: uid("LOG"), at, code: "cancelled", detail: `${id} ${text}` }, ...state.audit],
          };
        });
      },
      confirmReceipt: (id) => {
        const order = get().orders.find((item) => item.id === id);
        if (!order || order.status !== "booked" || !order.collectedAt || order.receivedAt) return;
        const at = stamp();
        set((state) => ({
          orders: state.orders.map((item) =>
            item.id === id ? { ...item, status: "delivered", receivedAt: at } : item,
          ),
          audit: [{ id: uid("LOG"), at, code: "receipt_confirmed", detail: id }, ...state.audit],
        }));
      },
      rateOrder: (id, score, note) => {
        const order = get().orders.find((item) => item.id === id);
        const value = Math.round(score);
        if (!order?.receivedAt || value < 1 || value > 5) return;
        const at = stamp();
        set((state) => ({
          orders: state.orders.map((item) =>
            item.id === id ? { ...item, rating: value, ratingNote: note.trim().slice(0, 300) } : item,
          ),
          audit: [{ id: uid("LOG"), at, code: "rated", detail: `${id} ${value}` }, ...state.audit],
        }));
      },
      payOrder: (id, method) => {
        const order = get().orders.find((item) => item.id === id);
        if (!order || order.status === "cancelled" || order.paymentStatus === "paid") return;
        const at = stamp();
        const lang = get().lang;
        const body =
          lang === "vi"
            ? "ELECMOVE đã ghi nhận cước và điều tài xế tới điểm lấy."
            : "ELECMOVE recorded the fee and dispatched a courier to the pickup.";
        set((state) => ({
          orders: state.orders.map((item) =>
            item.id === id ? { ...item, paymentStatus: "paid", paymentMethod: method } : item,
          ),
          messages: [
            { id: uid("MSG"), orderId: id, from: "driver", body, at },
            ...(state.messages ?? []),
          ],
          audit: [
            { id: uid("LOG"), at, code: "dispatched", detail: id },
            { id: uid("LOG"), at, code: "paid", detail: `${id} ${method}` },
            ...state.audit,
          ],
        }));
      },
      askCare: (body) => {
        const text = body.trim().slice(0, 500);
        if (!text) return;
        const at = stamp();
        const reply = careReply(get().lang, text);
        set((state) => ({
          messages: [
            { id: uid("MSG"), orderId: "desk", from: "care", body: reply, at },
            { id: uid("MSG"), orderId: "desk", from: "customer", body: text, at },
            ...(state.messages ?? []),
          ],
          audit: [{ id: uid("LOG"), at, code: "care_chat", detail: "desk" }, ...state.audit],
        }));
      },
      recordCare: (question, answer) => {
        const text = question.trim().slice(0, 500);
        const reply = answer.trim().slice(0, 800);
        if (!text || !reply) return;
        const at = stamp();
        set((state) => ({
          messages: [
            { id: uid("MSG"), orderId: "desk", from: "care", body: reply, at },
            { id: uid("MSG"), orderId: "desk", from: "customer", body: text, at },
            ...(state.messages ?? []),
          ],
        }));
      },
      markDelivered: (id) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id && order.status === "booked" ? { ...order, status: "delivered" } : order,
          ),
          audit: [{ id: uid("LOG"), at: stamp(), code: "delivered", detail: id }, ...state.audit],
        })),
      openClaim: (orderId, note) => {
        const claim: Claim = {
          id: uid("CLM"),
          orderId,
          note: note.trim(),
          fault: "pending",
          compensation: null,
          createdAt: stamp(),
        };
        set((state) => ({
          claims: [claim, ...state.claims],
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status: "claim" } : order,
          ),
          audit: [
            { id: uid("LOG"), at: stamp(), code: "claim_opened", detail: `${claim.id} ${orderId}` },
            ...state.audit,
          ],
        }));
      },
      reconcile: (claimId, fault) =>
        set((state) => {
          const claim = state.claims.find((item) => item.id === claimId);
          const order = state.orders.find((item) => item.id === claim?.orderId);
          let compensation: number | null = null;
          if (fault === "elecmove" && order) {
            compensation = compensationFor(order.packageId, order.declaredValue, order.price);
          }
          if (fault === "sender") compensation = 0;
          return {
            claims: state.claims.map((item) =>
              item.id === claimId ? { ...item, fault, compensation } : item,
            ),
            audit: [
              {
                id: uid("LOG"),
                at: stamp(),
                code: "claim_reconciled",
                detail: `${claimId} ${fault}`,
              },
              ...state.audit,
            ],
          };
        }),
      resetDemo: () =>
        set({
          capacity: emptyCapacity(),
          orders: [],
          claims: [],
          messages: [],
          incidents: [],
          audit: [],
          leads: [],
          drivers: [],
        }),
    }),
    { name: "elecmove-demo", skipHydration: true },
  ),
);
