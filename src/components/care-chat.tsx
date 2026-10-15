import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { askElecmove } from "@/lib/care-bot";
import { useTx } from "@/lib/i18n";
import { useElec } from "@/lib/store";

export function CareChat() {
  const { tx } = useTx();
  const ask = useServerFn(askElecmove);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const messages = useElec((state) => state.messages);
  const askCare = useElec((state) => state.askCare);
  const recordCare = useElec((state) => state.recordCare);
  const lang = useElec((state) => state.lang);
  const thread = (messages ?? []).filter((item) => item.orderId === "desk").slice(0, 8).reverse();

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setBusy(true);
    try {
      const reply = await ask({ data: { question: text, lang } });
      if (reply.ok) recordCare(text, reply.text);
      else askCare(text);
    } catch {
      askCare(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-3">
      {open ? (
        <section className="w-72 rounded-lg border border-line bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-navy">
                {tx("Chăm sóc khách hàng", "Customer care")}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {tx(
                  "Chăm sóc khách hàng ELECMOVE.",
                  "ELECMOVE customer care.",
                )}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-navy"
              aria-label={tx("Đóng khung chat", "Close the chat")}
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {thread.length === 0 ? (
              <li className="text-sm text-muted">
                {tx("Hỏi về cước, COD, hoặc một chuyến đang chạy.", "Ask about the fee, COD, or a leg that is running.")}
              </li>
            ) : (
              thread.map((item) => (
                <li key={item.id} className="rounded-md bg-paper px-3 py-2 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {item.from === "customer" ? tx("Doanh nghiệp", "Enterprise") : tx("ELECMOVE", "ELECMOVE")}
                  </p>
                  <p className="mt-1 text-ink">{item.body}</p>
                </li>
              ))
            )}
          </ol>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <input
              className="h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-3 text-sm text-ink"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label={tx("Nội dung gửi chăm sóc khách hàng", "Message to customer care")}
            />
            <button type="submit" disabled={busy} className="inline-flex h-11 items-center rounded-md bg-navy px-3 text-sm font-semibold text-paper disabled:opacity-50">
              {busy ? tx("Đang trả lời", "Replying") : tx("Gửi", "Send")}
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        className="inline-flex h-14 items-center gap-2 rounded-full bg-navy px-4 text-sm font-semibold text-paper"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {tx("Chat", "Chat")}
      </button>
    </div>
  );
}
