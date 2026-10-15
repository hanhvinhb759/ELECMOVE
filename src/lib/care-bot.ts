import { createServerFn } from "@tanstack/react-start";

export const askElecmove = createServerFn({ method: "POST" })
  .validator((input: { question: string; lang: "vi" | "en" }) => {
    const question = String(input?.question ?? "").trim().slice(0, 500);
    if (!question) throw new Error("empty");
    return { question, lang: input?.lang === "en" ? "en" as const : "vi" as const };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };
    const langLine =
      data.lang === "en"
        ? "Answer in English, in at most 80 words."
        : "Trả lời bằng tiếng Việt, tối đa 80 từ.";
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are ELECMOVE customer care for last-mile delivery on the Ho Chi Minh City, Binh Duong, and Dong Nai corridor. Package fees: EMStandard 28000, EMPrecise 36000, EMSecure 45000 VND. Per-km rates, motorcycle then van: Standard 4800/9500, Precise 6800/12500, Secure 8900/16800. Distance is the road route from pickup to delivery. First 3 kg included; extra chargeable kg is 1800 (motorcycle) or 2200 (van). Chargeable kg is the greater of actual weight and length×width×height/6000. Goods over 20 kg or one side over 55 cm go by van only. Green packing is priced from material: kraft bag 9000, recycled carton 18000, large carton 36000 VND. Self-packing is free. Vouchers: EMXANH10 is 10 percent, EMMOI20 is 20000 VND, SECURE15 is 15 percent on EMSecure only. COD does not replace the enterprise fee. " +
              langLine,
          },
          { role: "user", content: data.question },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `status ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "empty" };
    return { ok: true as const, text: text.slice(0, 800) };
  });
