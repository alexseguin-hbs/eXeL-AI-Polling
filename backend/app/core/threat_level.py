"""Threat-level classification engine (defensive security).

Pure, deterministic, dependency-free. Consumes a snapshot of security telemetry
over a short window and returns one of four escalating levels:

    NONE  ->  LIKELY  ->  IMMINENT  ->  IN_PROGRESS

with the reasons, the OpenAI-style "actions we are taking now" for that level,
and two decisions the platform acts on:

    should_alert  -> email explore@eXeL-AI.com  (IMMINENT and above)
    should_pause  -> trip the edge kill-switch   (IN_PROGRESS only)

Definitions (what each level MEANS):
  LIKELY       reconnaissance / probing: scanning, moderate auth-failure bursts,
               a few blocked payloads. Someone is looking for a way in.
  IMMINENT     active exploitation attempts: real exploit signatures (SQLi/XSS/
               traversal) being fired, credential-stuffing across many IPs, admin
               endpoint probing. The attack is underway but has not landed.
  IN_PROGRESS  compromise indicators: a served asset's integrity failed, an
               unverified-origin state change, an RLS-deny spike, or an
               exfiltration-sized response. Treat as a live breach.

The classifier is intentionally conservative and monotonic: a single hard
compromise indicator forces IN_PROGRESS regardless of the softer counts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class ThreatLevel(str, Enum):
    NONE = "none"
    LIKELY = "likely"
    IMMINENT = "imminent"
    IN_PROGRESS = "in_progress"


# Human labels, exactly as reported to the operator.
LEVEL_LABEL = {
    ThreatLevel.NONE: "Nominal",
    ThreatLevel.LIKELY: "Attack Likely",
    ThreatLevel.IMMINENT: "Attack Imminent",
    ThreatLevel.IN_PROGRESS: "Attack In Progress",
}

# Tunable thresholds (per `window_seconds`).
T_AUTH_FAIL_LIKELY = 20        # 401/403 bursts that look like probing
T_AUTH_FAIL_STUFFING = 60      # credential-stuffing volume
T_STUFFING_DISTINCT_IPS = 3    # ...spread across this many sources
T_RATE_BREACH_LIKELY = 5
T_WAF_BLOCK_LIKELY = 5
T_WAF_BLOCK_IMMINENT = 25
T_EXPLOIT_IMMINENT = 3         # confirmed exploit-signature hits
T_ADMIN_PROBE_IMMINENT = 5     # unauth hits on admin/moderator endpoints
T_RLS_DENY_INPROGRESS = 10     # Supabase RLS deny spike
T_EXFIL_BYTES = 25_000_000     # anomalously large response to one client (~25MB)


@dataclass
class SecuritySignals:
    """A window of security telemetry. All counts default to 0 / False so a
    partial snapshot is always valid."""

    auth_failures: int = 0
    distinct_attacker_ips: int = 0
    rate_limit_breaches: int = 0
    admin_probe_hits: int = 0
    waf_blocked: int = 0
    exploit_attempts: int = 0
    rls_denies: int = 0
    exfil_response_bytes: int = 0
    integrity_mismatch: bool = False
    unexpected_state_change: bool = False
    window_seconds: int = 60


@dataclass
class ThreatAssessment:
    level: ThreatLevel
    label: str
    score: int
    reasons: list[str] = field(default_factory=list)
    actions: list[str] = field(default_factory=list)
    should_alert: bool = False
    should_pause: bool = False

    def as_dict(self) -> dict:
        return {
            "level": self.level.value,
            "label": self.label,
            "score": self.score,
            "reasons": self.reasons,
            "actions": self.actions,
            "should_alert": self.should_alert,
            "should_pause": self.should_pause,
        }


# OpenAI-style "actions we are taking now", escalated per level.
_ACTIONS = {
    ThreatLevel.NONE: [
        "Continuous monitoring active; no action required.",
    ],
    ThreatLevel.LIKELY: [
        "Tighten monitoring and correlate the probing sources.",
        "Confirm rate limits and WAF managed rules are active.",
        "Log every security event for forensic correlation.",
    ],
    ThreatLevel.IMMINENT: [
        "Enter strict mode: lower rate limits at the edge.",
        "Block the offending IPs / signatures at the edge.",
        "Alert explore@eXeL-AI.com with the signal dashboard.",
        "Brief the safety & security review; prepare to pause.",
    ],
    ThreatLevel.IN_PROGRESS: [
        "PAUSE the site (kill-switch: home page only).",
        "Alert explore@eXeL-AI.com immediately (SMS-verify to pause).",
        "Begin forensic capture; preserve logs and asset checksums.",
        "Rotate credentials/secrets and revoke suspect sessions.",
        "Responsibly disclose any confirmed zero-day and patch.",
    ],
}


def assess_threat(s: SecuritySignals) -> ThreatAssessment:
    """Classify a telemetry snapshot into a threat level + response."""
    reasons: list[str] = []
    score = 0

    # ---- IN_PROGRESS: hard compromise indicators (any one forces red) ----
    if s.integrity_mismatch:
        reasons.append("Served-asset integrity check failed (possible tampering).")
    if s.unexpected_state_change:
        reasons.append("State-changing request from an unverified origin.")
    if s.rls_denies >= T_RLS_DENY_INPROGRESS:
        reasons.append(f"Row-Level-Security deny spike ({s.rls_denies} in window).")
    if s.exfil_response_bytes >= T_EXFIL_BYTES:
        reasons.append(f"Exfiltration-sized response ({s.exfil_response_bytes:,} bytes) to one client.")
    if reasons:
        score = 100
        return _build(ThreatLevel.IN_PROGRESS, score, reasons)

    # ---- IMMINENT: active exploitation attempts ----
    if s.exploit_attempts >= T_EXPLOIT_IMMINENT:
        reasons.append(f"Confirmed exploit signatures fired ({s.exploit_attempts}).")
    if s.waf_blocked >= T_WAF_BLOCK_IMMINENT:
        reasons.append(f"High volume of WAF-blocked payloads ({s.waf_blocked}).")
    if s.admin_probe_hits >= T_ADMIN_PROBE_IMMINENT:
        reasons.append(f"Admin/moderator endpoint probing ({s.admin_probe_hits}).")
    if s.auth_failures >= T_AUTH_FAIL_STUFFING and s.distinct_attacker_ips >= T_STUFFING_DISTINCT_IPS:
        reasons.append(
            f"Credential-stuffing pattern ({s.auth_failures} failures across "
            f"{s.distinct_attacker_ips} IPs)."
        )
    if reasons:
        score = 70 + min(29, s.exploit_attempts + s.admin_probe_hits)
        return _build(ThreatLevel.IMMINENT, score, reasons)

    # ---- LIKELY: reconnaissance / probing ----
    if s.auth_failures >= T_AUTH_FAIL_LIKELY:
        reasons.append(f"Elevated auth failures ({s.auth_failures}) — probing.")
    if s.rate_limit_breaches >= T_RATE_BREACH_LIKELY:
        reasons.append(f"Rate-limit breaches ({s.rate_limit_breaches}).")
    if s.waf_blocked >= T_WAF_BLOCK_LIKELY:
        reasons.append(f"Blocked payloads observed ({s.waf_blocked}).")
    if s.admin_probe_hits > 0:
        reasons.append(f"Some admin-endpoint touches ({s.admin_probe_hits}).")
    if reasons:
        score = 30 + min(39, s.auth_failures // 2 + s.waf_blocked)
        return _build(ThreatLevel.LIKELY, score, reasons)

    # ---- NONE ----
    return _build(ThreatLevel.NONE, 0, ["No anomalous signals in window."])


def _build(level: ThreatLevel, score: int, reasons: list[str]) -> ThreatAssessment:
    return ThreatAssessment(
        level=level,
        label=LEVEL_LABEL[level],
        score=score,
        reasons=reasons,
        actions=list(_ACTIONS[level]),
        should_alert=level in (ThreatLevel.IMMINENT, ThreatLevel.IN_PROGRESS),
        should_pause=level == ThreatLevel.IN_PROGRESS,
    )
