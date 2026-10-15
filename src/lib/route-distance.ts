import { createServerFn } from "@tanstack/react-start";

async function geocode(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ELECMOVE/1.0 (lienhe@elecmove.vn)",
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { lat?: string; lon?: string }[];
  const row = rows[0];
  if (!row?.lat || !row.lon) return null;
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const measureRoute = createServerFn({ method: "POST" })
  .validator((input: { from: string; to: string }) => {
    const from = String(input?.from ?? "").trim().slice(0, 180);
    const to = String(input?.to ?? "").trim().slice(0, 180);
    if (from.length < 6 || to.length < 6) throw new Error("short");
    return { from, to };
  })
  .handler(async ({ data }) => {
    const origin = (await geocode(data.from)) ?? (await geocode(`${data.from}, Vietnam`));
    await pause(1100);
    const destination = (await geocode(data.to)) ?? (await geocode(`${data.to}, Vietnam`));
    if (!origin || !destination) return { ok: false as const, error: "geocode" as const };
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`,
    );
    if (!res.ok) return { ok: false as const, error: "route" as const };
    const body = (await res.json()) as { routes?: { distance?: number }[] };
    const meters = body.routes?.[0]?.distance ?? 0;
    if (meters < 200) return { ok: false as const, error: "route" as const };
    return { ok: true as const, km: Math.round((meters / 1000) * 10) / 10 };
  });