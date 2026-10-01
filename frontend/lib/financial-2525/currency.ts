/**
 * THE CURRENCY LABEL (r.049, operator addenda 86–87: "ensure all financials with min wage exist in this ; add currency to drop down
 * settings in Accrual section" · his answer "$ changes to currency symbol if there is one, or have label of currency somewhere at top
 * (Subscript to Accrual Units) in gray"). A LABEL, never a conversion: the numbers stay as entered; only the symbol (or a gray code
 * under ACCRUAL UNITS) changes. One row per jurisdiction in the minimum-wage table (lib/min-wage.ts) — a country added there without a
 * row here fails the gate (tests/financial-surface.test.mjs).
 */
import { COUNTRY_RATES, DEFAULT_COUNTRY } from "@/lib/min-wage";

export interface Currency { code: string; country: string; name: string; /** null = no single symbol: the gray label shows */ symbol: string | null }
export const CURRENCY_BY_COUNTRY: Record<string, Currency> = {
  "United States": { code: "USD", country: "United States", name: "US dollar", symbol: "$" },
  Nigeria: { code: "NGN", country: "Nigeria", name: "Nigerian naira", symbol: "\u20A6" },
  Nepal: { code: "NPR", country: "Nepal", name: "Nepalese rupee", symbol: null },
  Cambodia: { code: "KHR", country: "Cambodia", name: "Cambodian riel", symbol: "\u17DB" },
  Mexico: { code: "MXN", country: "Mexico", name: "Mexican peso", symbol: "Mex$" },
  Thailand: { code: "THB", country: "Thailand", name: "Thai baht", symbol: "\u0E3F" },
  Brazil: { code: "BRL", country: "Brazil", name: "Brazilian real", symbol: "R$" },
  Honduras: { code: "HNL", country: "Honduras", name: "Honduran lempira", symbol: "L" },
  Colombia: { code: "COP", country: "Colombia", name: "Colombian peso", symbol: "COL$" },
  Chile: { code: "CLP", country: "Chile", name: "Chilean peso", symbol: "CLP$" },
};
/** Every country of the minimum-wage table, the United States first. */
export const CURRENCY_COUNTRIES: readonly string[] = [DEFAULT_COUNTRY, ...Object.keys(COUNTRY_RATES)];
export const CURRENCIES: readonly Currency[] = CURRENCY_COUNTRIES.map((c) => CURRENCY_BY_COUNTRY[c]).filter(Boolean);
export const DEFAULT_CURRENCY = "USD";
export const CURRENCY_KEY = "fin-currency";
export const currencyOf = (code: string | null | undefined): Currency => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
/** The header mark: the symbol, or the code when there is none. */
export const currencyMark = (c: Currency): string => c.symbol ?? c.code;
