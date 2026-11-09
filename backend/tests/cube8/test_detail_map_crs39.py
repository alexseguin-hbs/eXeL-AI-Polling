"""CRS-39.01 — Detail 1/2/3 map rides the existing view_entitlement payment path."""
from app.cubes.cube8_tokens.view_entitlement import _ladder, _result


def test_detail_map_tracks_333_and_original():
    locked = _result("anonymous", "not_signed_in", 0, False, False)
    assert locked["detail_1"] is True
    assert locked["detail_2"] is False
    assert locked["detail_3"] is False
    assert locked["detail_map"]["detail_3"] == "original+expert_pager"

    mid = _ladder("participant", "donation_ladder", 999)
    assert mid["detail_2"] is True and mid["detail_3"] is False

    full = _ladder("participant", "donation_ladder", 1111)
    assert full["detail_2"] is True and full["detail_3"] is True
