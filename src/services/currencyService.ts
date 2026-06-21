// ─── African Countries with Currency Data ────────────────────────────────────
export interface CountryCurrency {
  name: string;
  currency: string;    // ISO 4217 code
  symbol: string;
  locale: string;
  flag: string;
}

export const AFRICAN_COUNTRIES: CountryCurrency[] = [
  { name: 'Eswatini',      currency: 'SZL', symbol: 'E',    locale: 'en-SZ', flag: '🇸🇿' },
  { name: 'South Africa',  currency: 'ZAR', symbol: 'R',    locale: 'en-ZA', flag: '🇿🇦' },
  { name: 'Mozambique',    currency: 'MZN', symbol: 'MT',   locale: 'pt-MZ', flag: '🇲🇿' },
  { name: 'Zimbabwe',      currency: 'USD', symbol: '$',    locale: 'en-ZW', flag: '🇿🇼' },
  { name: 'Zambia',        currency: 'ZMW', symbol: 'K',    locale: 'en-ZM', flag: '🇿🇲' },
  { name: 'Malawi',        currency: 'MWK', symbol: 'MK',   locale: 'en-MW', flag: '🇲🇼' },
  { name: 'Botswana',      currency: 'BWP', symbol: 'P',    locale: 'en-BW', flag: '🇧🇼' },
  { name: 'Namibia',       currency: 'NAD', symbol: 'N$',   locale: 'en-NA', flag: '🇳🇦' },
  { name: 'Tanzania',      currency: 'TZS', symbol: 'TSh',  locale: 'sw-TZ', flag: '🇹🇿' },
  { name: 'Kenya',         currency: 'KES', symbol: 'KSh',  locale: 'en-KE', flag: '🇰🇪' },
  { name: 'Uganda',        currency: 'UGX', symbol: 'USh',  locale: 'en-UG', flag: '🇺🇬' },
  { name: 'Nigeria',       currency: 'NGN', symbol: '₦',    locale: 'en-NG', flag: '🇳🇬' },
  { name: 'Ghana',         currency: 'GHS', symbol: 'GH₵',  locale: 'en-GH', flag: '🇬🇭' },
  { name: 'Ethiopia',      currency: 'ETB', symbol: 'Br',   locale: 'am-ET', flag: '🇪🇹' },
  { name: 'Rwanda',        currency: 'RWF', symbol: 'RF',   locale: 'rw-RW', flag: '🇷🇼' },
  { name: 'Angola',        currency: 'AOA', symbol: 'Kz',   locale: 'pt-AO', flag: '🇦🇴' },
  { name: 'Democratic Republic of Congo', currency: 'CDF', symbol: 'FC', locale: 'fr-CD', flag: '🇨🇩' },
  { name: 'Madagascar',    currency: 'MGA', symbol: 'Ar',   locale: 'mg-MG', flag: '🇲🇬' },
  { name: 'Mauritius',     currency: 'MUR', symbol: '₨',    locale: 'en-MU', flag: '🇲🇺' },
  { name: 'Lesotho',       currency: 'LSL', symbol: 'L',    locale: 'st-LS', flag: '🇱🇸' },
];

// Exchange rates relative to USD (approximate, 2026 mid-market)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.00,
  SZL: 18.60,
  ZAR: 18.60,
  MZN: 63.80,
  ZMW: 27.20,
  MWK: 1730.00,
  BWP: 13.65,
  NAD: 18.60,
  TZS: 2650.00,
  KES: 129.50,
  UGX: 3750.00,
  NGN: 1580.00,
  GHS: 15.50,
  ETB: 56.80,
  RWF: 1385.00,
  AOA: 920.00,
  CDF: 2800.00,
  MGA: 4550.00,
  MUR: 45.60,
  LSL: 18.60,
};

/**
 * Convert a USD amount to the target currency
 */
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency] ?? 1;
  return amountUSD * rate;
}

/**
 * Format an amount in the given currency using Intl
 */
export function formatCurrency(amountUSD: number, currencyCode: string): string {
  const converted = convertFromUSD(amountUSD, currencyCode);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'TZS' || currencyCode === 'UGX' || currencyCode === 'RWF' || currencyCode === 'MGA' || currencyCode === 'MWK' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'TZS' || currencyCode === 'UGX' || currencyCode === 'RWF' || currencyCode === 'MGA' || currencyCode === 'MWK' ? 0 : 2,
    }).format(converted);
  } catch {
    const info = AFRICAN_COUNTRIES.find(c => c.currency === currencyCode);
    return `${info?.symbol ?? ''}${converted.toFixed(2)}`;
  }
}

/**
 * Get currency info for a country name
 */
export function getCurrencyForCountry(countryName: string): CountryCurrency {
  const found = AFRICAN_COUNTRIES.find(c => c.name === countryName);
  return found ?? { name: countryName, currency: 'USD', symbol: '$', locale: 'en-US', flag: '🌍' };
}
