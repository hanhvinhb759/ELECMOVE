export type PackageId = "standard" | "precise" | "secure";
export type SlotId = "s1" | "s2" | "s3" | "s4";
export type ProvinceId = "hcmc" | "bd" | "dn";

export const SLOTS: { id: SlotId; vi: string; en: string; evening: boolean }[] = [
  { id: "s1", vi: "08:00–11:00", en: "08:00–11:00", evening: false },
  { id: "s2", vi: "11:00–14:00", en: "11:00–14:00", evening: false },
  { id: "s3", vi: "14:00–17:00", en: "14:00–17:00", evening: false },
  { id: "s4", vi: "17:00–20:00", en: "17:00–20:00", evening: true },
];

export const PACKAGES: Record<PackageId, { base: number; slots: SlotId[]; cover: number }> = {
  standard: { base: 28000, slots: ["s1", "s3"], cover: 0 },
  precise: { base: 36000, slots: ["s1", "s2", "s3", "s4"], cover: 0 },
  secure: { base: 45000, slots: ["s1", "s2", "s3", "s4"], cover: 5_000_000 },
};

export const PROVINCES: { id: ProvinceId; vi: string; en: string }[] = [
  { id: "hcmc", vi: "Thành phố Hồ Chí Minh", en: "Ho Chi Minh City" },
  { id: "bd", vi: "Bình Dương", en: "Binh Duong" },
  { id: "dn", vi: "Đồng Nai", en: "Dong Nai" },
];

export type Cell = {
  id: string;
  province: ProvinceId;
  vi: string;
  en: string;
  km: number;
};

export const CELLS: Cell[] = [
  { id: "q1", province: "hcmc", vi: "Quận 1", en: "District 1", km: 6 },
  { id: "q3", province: "hcmc", vi: "Quận 3", en: "District 3", km: 7 },
  { id: "q7", province: "hcmc", vi: "Quận 7", en: "District 7", km: 12 },
  { id: "td", province: "hcmc", vi: "Thủ Đức", en: "Thu Duc", km: 14 },
  { id: "bt", province: "hcmc", vi: "Bình Thạnh", en: "Binh Thanh", km: 8 },
  { id: "tdm", province: "bd", vi: "Thủ Dầu Một", en: "Thu Dau Mot", km: 28 },
  { id: "da", province: "bd", vi: "Dĩ An", en: "Di An", km: 22 },
  { id: "ta", province: "bd", vi: "Thuận An", en: "Thuan An", km: 20 },
  { id: "bh", province: "dn", vi: "Biên Hòa", en: "Bien Hoa", km: 32 },
  { id: "lt", province: "dn", vi: "Long Thành", en: "Long Thanh", km: 40 },
];

/** Well-to-wheel xe máy điện: 0.025 kWh/km × 659.2 g CO2/kWh. Xe van điện: 0.18 kWh/km. */
export const GRAMS_PER_KM = 16.48;
export const VAN_GRAMS_PER_KM = 118.66;
export const GRID_FACTOR = 0.6592;
export const SECURE_THRESHOLD = 2_000_000;
export const EVENING_FEE = 12_000;
export const INCLUDED_KG = 3;
export const MOTO_EXTRA_PER_KG = 1_800;
export const VAN_EXTRA_PER_KG = 2_200;
export const MOTO_MAX_KG = 20;
export const MOTO_MAX_SIDE = 55;

export type VehicleId = "moto" | "van";

/** Đơn giá đồng/km theo gói, nhân với km đường giữa điểm lấy và điểm giao. */
export const PACKAGE_RATES: Record<PackageId, { moto: number; van: number }> = {
  standard: { moto: 4_800, van: 9_500 },
  precise: { moto: 6_800, van: 12_500 },
  secure: { moto: 8_900, van: 16_800 },
};

export function ratePerKm(packageId: PackageId, vehicle: VehicleId) {
  return PACKAGE_RATES[packageId][vehicle];
}

export type Cargo = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
};

export const DEFAULT_CARGO: Cargo = { lengthCm: 30, widthCm: 20, heightCm: 15, weightKg: 2 };

export type PackMode = "self" | "green";
export type PackMaterial = "self" | "kraft" | "carton" | "crate";

export function packQuote(mode: PackMode, cargo: Cargo): { fee: number; material: PackMaterial } {
  if (mode === "self") return { fee: 0, material: "self" };
  const volume = Math.max(0, cargo.lengthCm) * Math.max(0, cargo.widthCm) * Math.max(0, cargo.heightCm);
  if (volume <= 8_000) return { fee: 9_000, material: "kraft" };
  if (volume <= 24_000) return { fee: 18_000, material: "carton" };
  return { fee: 36_000, material: "crate" };
}

export const VOUCHERS: Record<string, { kind: "percent" | "amount"; value: number; only?: PackageId }> = {
  EMXANH10: { kind: "percent", value: 10 },
  EMMOI20: { kind: "amount", value: 20_000 },
  SECURE15: { kind: "percent", value: 15, only: "secure" },
};

export function cargoMetrics(cargo: Cargo) {
  const lengthCm = Math.max(0, cargo.lengthCm);
  const widthCm = Math.max(0, cargo.widthCm);
  const heightCm = Math.max(0, cargo.heightCm);
  const weightKg = Math.max(0, cargo.weightKg);
  const volume = lengthCm * widthCm * heightCm;
  const volumetricKg = volume / 6000;
  const chargeableKg = Math.max(weightKg, volumetricKg);
  const motoOk = weightKg <= MOTO_MAX_KG && Math.max(lengthCm, widthCm, heightCm) <= MOTO_MAX_SIDE;
  return { volume, volumetricKg, chargeableKg, motoOk, weightKg };
}

export function cellById(id: string) {
  return CELLS.find((cell) => cell.id === id) ?? CELLS[0];
}

export function slotById(id: SlotId) {
  return SLOTS.find((slot) => slot.id === id) ?? SLOTS[0];
}

export function estimateCo2e(km: number) {
  return Math.round(km * GRAMS_PER_KM);
}

export function quote(
  packageId: PackageId,
  cellId: string,
  slotId: SlotId,
  cargo: Cargo = DEFAULT_CARGO,
  vehicle: VehicleId = "moto",
  km?: number,
) {
  const pkg = PACKAGES[packageId];
  const cell = cellById(cellId);
  const evening = slotId === "s4" ? EVENING_FEE : 0;
  const metrics = cargoMetrics(cargo);
  const vehicleId: VehicleId = metrics.motoOk ? vehicle : "van";
  const perKm = ratePerKm(packageId, vehicleId);
  const distanceKm = Math.max(0, km ?? cell.km);
  const distanceFee = Math.round(distanceKm * perKm);
  const extraKg = Math.max(0, metrics.chargeableKg - INCLUDED_KG);
  const weightFee = Math.round(extraKg * (vehicleId === "van" ? VAN_EXTRA_PER_KG : MOTO_EXTRA_PER_KG));
  const grams = vehicleId === "van" ? VAN_GRAMS_PER_KM : GRAMS_PER_KM;
  return {
    base: pkg.base,
    evening,
    leg: 0,
    distanceFee,
    weightFee,
    perKm,
    vehicleId,
    forcedVan: !metrics.motoOk,
    chargeableKg: Math.round(metrics.chargeableKg * 10) / 10,
    volumetricKg: Math.round(metrics.volumetricKg * 10) / 10,
    total: pkg.base + evening + distanceFee + weightFee,
    co2e: Math.round(distanceKm * grams),
    km: Math.round(distanceKm * 10) / 10,
    cover: pkg.cover,
  };
}

export function settle(input: {
  packageId: PackageId;
  cellId: string;
  slotId: SlotId;
  cargo: Cargo;
  vehicle: VehicleId;
  km: number;
  pack: PackMode;
  voucher: string;
}) {
  const priced = quote(input.packageId, input.cellId, input.slotId, input.cargo, input.vehicle, input.km);
  const pack = packQuote(input.pack, input.cargo);
  const before = priced.base + priced.evening + priced.distanceFee + priced.weightFee + pack.fee;
  const code = input.voucher.trim().toUpperCase();
  const rule = code ? VOUCHERS[code] : undefined;
  let discount = 0;
  let voucherState: "none" | "ok" | "bad" | "wrong_package" = "none";
  if (!code) voucherState = "none";
  else if (!rule) voucherState = "bad";
  else if (rule.only && rule.only !== input.packageId) voucherState = "wrong_package";
  else {
    discount = rule.kind === "percent" ? Math.round((before * rule.value) / 100) : Math.min(rule.value, before);
    voucherState = "ok";
  }
  return {
    ...priced,
    packFee: pack.fee,
    material: pack.material,
    discount,
    voucherCode: voucherState === "ok" ? code : "",
    voucherState,
    total: before - discount,
  };
}

export function emptyCapacity(): Record<string, Record<SlotId, number>> {
  const capacity: Record<string, Record<SlotId, number>> = {};
  for (const cell of CELLS) {
    capacity[cell.id] = { s1: 8, s2: 8, s3: 8, s4: 6 };
  }
  return capacity;
}

export function formatVnd(value: number, lang: "vi" | "en") {
  const formatted = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US").format(value);
  return lang === "vi" ? `${formatted} đồng` : `${formatted} VND`;
}

export function compensationFor(packageId: PackageId, declared: number, tariff: number) {
  if (packageId === "secure") return Math.min(declared, PACKAGES.secure.cover);
  return tariff * 4;
}
