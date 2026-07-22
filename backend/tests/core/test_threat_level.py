"""Tests for the threat-level classification engine (core/threat_level.py)."""

from app.core.threat_level import (
    SecuritySignals,
    ThreatLevel,
    assess_threat,
)


def test_none_when_quiet():
    a = assess_threat(SecuritySignals())
    assert a.level is ThreatLevel.NONE
    assert a.label == "Nominal"
    assert a.should_alert is False
    assert a.should_pause is False


def test_likely_on_probing():
    a = assess_threat(SecuritySignals(auth_failures=25, rate_limit_breaches=6))
    assert a.level is ThreatLevel.LIKELY
    assert a.label == "Attack Likely"
    assert a.should_alert is False  # monitor, don't alert yet
    assert a.should_pause is False
    assert a.reasons


def test_imminent_on_exploit_signatures():
    a = assess_threat(SecuritySignals(exploit_attempts=4))
    assert a.level is ThreatLevel.IMMINENT
    assert a.label == "Attack Imminent"
    assert a.should_alert is True
    assert a.should_pause is False


def test_imminent_on_credential_stuffing():
    a = assess_threat(SecuritySignals(auth_failures=80, distinct_attacker_ips=5))
    assert a.level is ThreatLevel.IMMINENT
    assert a.should_alert is True


def test_imminent_on_admin_probing():
    a = assess_threat(SecuritySignals(admin_probe_hits=6))
    assert a.level is ThreatLevel.IMMINENT


def test_in_progress_on_integrity_mismatch():
    a = assess_threat(SecuritySignals(integrity_mismatch=True))
    assert a.level is ThreatLevel.IN_PROGRESS
    assert a.label == "Attack In Progress"
    assert a.should_alert is True
    assert a.should_pause is True  # trips the kill-switch


def test_in_progress_on_unexpected_state_change():
    a = assess_threat(SecuritySignals(unexpected_state_change=True))
    assert a.level is ThreatLevel.IN_PROGRESS
    assert a.should_pause is True


def test_in_progress_on_rls_deny_spike():
    a = assess_threat(SecuritySignals(rls_denies=12))
    assert a.level is ThreatLevel.IN_PROGRESS


def test_in_progress_on_exfil():
    a = assess_threat(SecuritySignals(exfil_response_bytes=30_000_000))
    assert a.level is ThreatLevel.IN_PROGRESS
    assert a.should_pause is True


def test_hard_indicator_overrides_soft_counts():
    # Even with only mild probing counts, a compromise indicator forces red.
    a = assess_threat(SecuritySignals(auth_failures=5, integrity_mismatch=True))
    assert a.level is ThreatLevel.IN_PROGRESS


def test_monotonic_escalation_ordering():
    quiet = assess_threat(SecuritySignals())
    likely = assess_threat(SecuritySignals(auth_failures=25))
    imminent = assess_threat(SecuritySignals(exploit_attempts=4))
    inprog = assess_threat(SecuritySignals(integrity_mismatch=True))
    scores = [quiet.score, likely.score, imminent.score, inprog.score]
    assert scores == sorted(scores)
    assert quiet.score == 0 and inprog.score == 100


def test_actions_present_and_pause_only_at_in_progress():
    for sig, expect_pause in [
        (SecuritySignals(auth_failures=25), False),
        (SecuritySignals(exploit_attempts=4), False),
        (SecuritySignals(integrity_mismatch=True), True),
    ]:
        a = assess_threat(sig)
        assert a.actions  # every level lists "actions we are taking now"
        assert a.should_pause is expect_pause


def test_as_dict_serializable():
    a = assess_threat(SecuritySignals(exploit_attempts=4))
    d = a.as_dict()
    assert d["level"] == "imminent"
    assert d["label"] == "Attack Imminent"
    assert isinstance(d["reasons"], list) and isinstance(d["actions"], list)
    assert d["should_alert"] is True and d["should_pause"] is False
