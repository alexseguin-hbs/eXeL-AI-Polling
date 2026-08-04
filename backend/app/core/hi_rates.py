"""웃 SETTLEMENT rate table — minimum wage by country/state (per hour).

This table prices 웃 in local currency AT SETTLEMENT. It does NOT price the mint.

  MINT      웃 = hours × HI_PER_HOUR          — currency-free, identical on earth
  SETTLE    $ = 웃 ÷ HI_PER_HOUR × rate       — local minimum wage, stamped at mint

HI_PER_HOUR is derived, not chosen: 9,999 웃 ÷ 2,080 hours = 4.807 웃/hour, so one
full-time year of contribution lands exactly on the annual ceiling — for everyone,
in every jurisdiction. The locked definition says the goal is to help as many
people as possible REACH 9,999; a mint that varied by local wage made the ceiling
cost 29,409 hours in Nigeria and 614 hours in Washington State, inverting that
goal. The rate now enters only where it belongs: converting 웃 into local money.

Rate lookup: resolve_human_rate(country, state) → rate/hr.
웃 format: #.### (3 decimal places, no currency symbol).
"""

# Default fallback rate (US federal / Texas)
DEFAULT_HUMAN_RATE = 7.25
DEFAULT_COUNTRY = "United States"
DEFAULT_STATE = "Texas"

# ---------------------------------------------------------------------------
# Mint constants — currency-free, jurisdiction-free
# ---------------------------------------------------------------------------
HI_ANNUAL_CEILING = 9999.0        # hard ceiling, 웃 per natural person per year
FULL_TIME_HOURS_PER_YEAR = 2080.0  # 40h × 52w
HI_PER_HOUR = HI_ANNUAL_CEILING / FULL_TIME_HOURS_PER_YEAR  # 4.807…, derived


def hours_to_hi(hours: float) -> float:
    """Mint 웃 from contributed time. No currency, no jurisdiction.

    An hour is an hour anywhere on earth. 2,080 hours == 9,999.0 웃 exactly.
    """
    if hours <= 0:
        return 0.0
    return round(hours * HI_PER_HOUR, 4)


def settle_hi_to_currency(
    hi_tokens: float,
    country: str | None = None,
    state: str | None = None,
    rate: float | None = None,
) -> float:
    """Convert 웃 to local currency at settlement.

    Pass `rate` to settle at the rate STAMPED on the ledger entry at mint —
    that is what stops a holder re-pricing another person's hour by moving
    jurisdiction. Omit it only when stamping for the first time.
    """
    if hi_tokens <= 0:
        return 0.0
    settlement_rate = rate if rate is not None else resolve_human_rate(country, state)
    return round(hi_tokens / HI_PER_HOUR * settlement_rate, 2)


def settlement_stamp(
    country: str | None = None,
    state: str | None = None,
) -> tuple[str, float]:
    """Resolve the (jurisdiction, rate) pair to stamp on a ledger entry at mint.

    The stamp travels with the entry for its whole life. Settlement reads the
    stamp, never the holder's current location.
    """
    if country and country.lower() in ("us", "usa", "united states"):
        resolved_country = DEFAULT_COUNTRY  # canonicalise the aliases
    else:
        resolved_country = country or DEFAULT_COUNTRY
    resolved_state = state or (DEFAULT_STATE if country is None else None)
    label = f"{resolved_country}/{resolved_state}" if resolved_state else resolved_country
    return label, resolve_human_rate(country, state)

# ---------------------------------------------------------------------------
# International rates (country-level, no state subdivision)
# ---------------------------------------------------------------------------
_COUNTRY_RATES: dict[str, float] = {
    "Nigeria": 0.34,
    "Nepal": 0.65,
    "Cambodia": 1.04,
    "Mexico": 1.43,
    "Thailand": 1.49,
    "Brazil": 1.58,
    "Honduras": 2.11,
    "Colombia": 2.45,
    "Chile": 3.02,
}

# ---------------------------------------------------------------------------
# United States — state-level rates
# ---------------------------------------------------------------------------
_US_STATE_RATES: dict[str, float] = {
    # Federal minimum ($7.25)
    "Alabama": 7.25,
    "Georgia": 7.25,
    "Idaho": 7.25,
    "Indiana": 7.25,
    "Iowa": 7.25,
    "Kansas": 7.25,
    "Kentucky": 7.25,
    "Louisiana": 7.25,
    "Mississippi": 7.25,
    "New Hampshire": 7.25,
    "North Carolina": 7.25,
    "North Dakota": 7.25,
    "Oklahoma": 7.25,
    "Pennsylvania": 7.25,
    "South Carolina": 7.25,
    "Tennessee": 7.25,
    "Texas": 7.25,
    "Utah": 7.25,
    "Wisconsin": 7.25,
    "Wyoming": 7.25,
    # Above federal minimum
    "West Virginia": 8.75,
    "Michigan": 10.33,
    "Ohio": 10.45,
    "Montana": 10.55,
    "Minnesota": 10.85,
    "Arkansas": 11.00,
    "South Dakota": 11.20,
    "Alaska": 11.73,
    "Nebraska": 12.00,
    "Nevada": 12.00,
    "New Mexico": 12.00,
    "Virginia": 12.00,
    "Missouri": 12.30,
    "Florida": 13.00,
    "Vermont": 13.67,
    "Hawaii": 14.00,
    "Rhode Island": 14.00,
    "Maine": 14.15,
    "Colorado": 14.42,
    "Arizona": 14.70,
    "Oregon": 14.70,
    "Delaware": 15.00,
    "Illinois": 15.00,
    "Maryland": 15.00,
    "Massachusetts": 15.00,
    "New York": 15.00,
    "New Jersey": 15.13,
    "Connecticut": 15.69,
    "California": 16.00,
    "Washington": 16.28,
}


def resolve_human_rate(
    country: str | None = None,
    state: str | None = None,
) -> float:
    """Resolve 웃 rate (per hour) for a given country + state.

    Lookup order:
      1. US + state → _US_STATE_RATES
      2. Country → _COUNTRY_RATES
      3. Fallback → DEFAULT_HUMAN_RATE (7.25)
    """
    if country and country.lower() in ("us", "usa", "united states"):
        if state and state.title() in _US_STATE_RATES:
            return _US_STATE_RATES[state.title()]
        return DEFAULT_HUMAN_RATE  # US without recognized state → federal

    if country:
        # Try exact match, then title-case match
        rate = _COUNTRY_RATES.get(country) or _COUNTRY_RATES.get(country.title())
        if rate is not None:
            return rate

    return DEFAULT_HUMAN_RATE


def get_all_rates() -> list[dict]:
    """Return all 웃 rates as a list for API exposure / admin UI."""
    rates = []

    for country, rate in sorted(_COUNTRY_RATES.items()):
        rates.append({
            "country": country,
            "state": None,
            "human_rate": rate,
            "currency": "USD",
        })

    for state, rate in sorted(_US_STATE_RATES.items()):
        rates.append({
            "country": "United States",
            "state": state,
            "human_rate": rate,
            "currency": "USD",
        })

    return rates
