"""Shared R-CORE substrate (build-once / consume-many across Vision-2525 cubes).

Houses the reusable R-Core primitives every cube consumes: the execution-mode
dispatch (approver/automation gate) lives here; per-cube analytical/token logic
stays in its cube. Extracted from cube4_collector/analysis.py so cubes 4/5/6/7/8
share ONE mode gate instead of duplicating it.
"""
