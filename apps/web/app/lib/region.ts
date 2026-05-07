export const DEFAULT_COUNTRY = "PK" as const;
export const DEFAULT_CURRENCY = "PKR" as const;
export const DEFAULT_TIMEZONE = "Asia/Karachi" as const;

export const COUNTRIES = [
  { code: "PK", label: "Pakistan", currency: "PKR", timezone: "Asia/Karachi" },
  { code: "IN", label: "India", currency: "INR", timezone: "Asia/Kolkata" },
  { code: "BD", label: "Bangladesh", currency: "BDT", timezone: "Asia/Dhaka" },
] as const;

export const CURRENCIES = [
  { code: "PKR", label: "Pakistani rupee" },
  { code: "INR", label: "Indian rupee" },
  { code: "BDT", label: "Bangladeshi taka" },
  { code: "USD", label: "US dollar" },
] as const;

export const TIMEZONES = [
  { code: "Asia/Karachi", label: "Pakistan time" },
  { code: "Asia/Kolkata", label: "India time" },
  { code: "Asia/Dhaka", label: "Bangladesh time" },
  { code: "UTC", label: "UTC" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export type SupportedTimezone = (typeof TIMEZONES)[number]["code"];

export function currencyForCountry(country?: string): CurrencyCode {
  return (
    COUNTRIES.find((item) => item.code === country)?.currency ??
    DEFAULT_CURRENCY
  );
}

export function timezoneForCountry(country?: string): SupportedTimezone {
  return (
    COUNTRIES.find((item) => item.code === country)?.timezone ??
    DEFAULT_TIMEZONE
  );
}

export function countryLabel(country?: string): string {
  return COUNTRIES.find((item) => item.code === country)?.label ?? "Pakistan";
}

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
}
