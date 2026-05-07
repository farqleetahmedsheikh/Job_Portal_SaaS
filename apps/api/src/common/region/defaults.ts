import { CountryCode, CurrencyCode, SupportedTimezone } from '../enums/enums';

export const DEFAULT_COUNTRY = CountryCode.PK;
export const DEFAULT_CURRENCY = CurrencyCode.PKR;
export const DEFAULT_TIMEZONE = SupportedTimezone.ASIA_KARACHI;

export const COUNTRY_DEFAULTS: Record<
  CountryCode,
  { currency: CurrencyCode; timezone: SupportedTimezone }
> = {
  [CountryCode.PK]: {
    currency: CurrencyCode.PKR,
    timezone: SupportedTimezone.ASIA_KARACHI,
  },
  [CountryCode.IN]: {
    currency: CurrencyCode.INR,
    timezone: SupportedTimezone.ASIA_KOLKATA,
  },
  [CountryCode.BD]: {
    currency: CurrencyCode.BDT,
    timezone: SupportedTimezone.ASIA_DHAKA,
  },
};

export function currencyForCountry(country?: CountryCode | null): CurrencyCode {
  return (
    COUNTRY_DEFAULTS[country ?? DEFAULT_COUNTRY]?.currency ?? DEFAULT_CURRENCY
  );
}

export function timezoneForCountry(
  country?: CountryCode | null,
): SupportedTimezone {
  return (
    COUNTRY_DEFAULTS[country ?? DEFAULT_COUNTRY]?.timezone ?? DEFAULT_TIMEZONE
  );
}
