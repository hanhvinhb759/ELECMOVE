export const COMPANY_EMAIL = "lienhe@elecmove.vn";
export const COMPANY_PHONE = "028 7300 2418";
export const COMPANY_PHONE_TEL = "+842873002418";

/** Số mô phỏng, cố định theo đơn. Đầu số 0999 không phải thuê bao đang khai thác. */
export function driverPhone(orderId: string) {
  const seed = [...orderId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const mid = String(100 + (seed % 900));
  const end = String(100 + ((seed * 7) % 900));
  return `0999 ${mid} ${end}`;
}

export function driverPhoneTel(orderId: string) {
  return `+84${driverPhone(orderId).replace(/\s/g, "").slice(1)}`;
}
