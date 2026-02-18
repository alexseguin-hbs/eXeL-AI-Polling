"""웃 rate table — minimum wage by country/state in $/hr.

Default: Austin, Texas = $7.25/hr (US federal minimum wage).

Vision: pay out 웃 globally at local minimum wage to leverage global talent.
When person_enabled=True, each participant earns 웃 based on their jurisdiction.
Rate lookup: resolve_person_rate(country, state) → $/hr.
"""

# Default fallback rate (US federal / Texas)
DEFAULT_PERSON_RATE = 7.25
DEFAULT_COUNTRY = "United States"
DEFAULT_STATE = "Texas"

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


def resolve_person_rate(
    country: str | None = None,
    state: str | None = None,
) -> float:
    """Resolve 웃 rate ($/hr) for a given country + state.

    Lookup order:
      1. US + state → _US_STATE_RATES
      2. Country → _COUNTRY_RATES
      3. Fallback → DEFAULT_PERSON_RATE ($7.25)
    """
    if country and country.lower() in ("us", "usa", "united states"):
        if state and state.title() in _US_STATE_RATES:
            return _US_STATE_RATES[state.title()]
        return DEFAULT_PERSON_RATE  # US without recognized state → federal

    if country:
        # Try exact match, then title-case match
        rate = _COUNTRY_RATES.get(country) or _COUNTRY_RATES.get(country.title())
        if rate is not None:
            return rate

    return DEFAULT_PERSON_RATE


def get_all_rates() -> list[dict]:
    """Return all 웃 rates as a list for API exposure / admin UI."""
    rates = []

    for country, rate in sorted(_COUNTRY_RATES.items()):
        rates.append({
            "country": country,
            "state": None,
            "person_rate": rate,
            "currency": "USD",
        })

    for state, rate in sorted(_US_STATE_RATES.items()):
        rates.append({
            "country": "United States",
            "state": state,
            "person_rate": rate,
            "currency": "USD",
        })

    return rates
