"""R-CORE analytical-result synthesis (A2) — pure, deterministic, explainable."""

from app.cubes.cube4_collector.analysis import synthesize_analysis


def test_rich_data_high_confidence_low_risk_ready():
    r = synthesize_analysis(
        analytics={"total_responses": 500, "unique_participants": 300,
                   "summary_coverage": 95, "top_theme": "mobile"},
        emerging={"convergence_score": 0.9, "emerging_leader": "mobile"},
        cqs=[{"composite_cqs": 0.85}, {"composite_cqs": 0.8}],
        compression={"overall_ratio": "166:1"},
    )
    assert r["cube"] == "cube4_collector"
    assert r["confidence"] >= 0.8
    assert r["risk"] <= 0.2
    assert r["recommended_actions"][0].startswith("Ready to advance")
    assert r["evidence_quality"] > 0.8


def test_thin_data_raises_risk_and_recommends_more():
    r = synthesize_analysis(
        analytics={"total_responses": 5, "unique_participants": 4, "summary_coverage": 20},
        emerging={"convergence_score": 0.2},
    )
    assert r["risk"] > 0.5
    assert any("Collect more responses" in a for a in r["recommended_actions"])


def test_falling_themes_flagged():
    r = synthesize_analysis(
        analytics={"total_responses": 100, "unique_participants": 60, "summary_coverage": 80},
        emerging={"convergence_score": 0.7},
        trends={"falling": ["theme_a", "theme_b"], "forecast": {"predicted_top_3": ["theme_x"]}},
    )
    assert any("declining theme" in a for a in r["recommended_actions"])
    # Alternative scenario uses the trend forecast.
    projected = next(s for s in r["alternative_scenarios"] if s["name"] == "projected")
    assert projected["top"] == "theme_x"


def test_rcore_object_has_all_memo_fields():
    r = synthesize_analysis(source_crs="CRS-09", replay_hash="a" * 64,
                            human_authority_status="approved")
    for k in ("source_crs", "inputs", "confidence", "evidence_quality",
              "human_authority_status", "replay_hash", "ssses_observations", "risk",
              "recommended_actions", "alternative_scenarios", "version"):
        assert k in r
    assert r["source_crs"] == "CRS-09"
    assert r["human_authority_status"] == "approved"


def test_deterministic():
    kw = dict(analytics={"total_responses": 42, "unique_participants": 20, "summary_coverage": 70},
              emerging={"convergence_score": 0.55})
    assert synthesize_analysis(**kw) == synthesize_analysis(**kw)
