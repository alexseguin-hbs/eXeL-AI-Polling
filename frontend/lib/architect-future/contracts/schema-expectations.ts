// ARCHITECT-2525 / FUTURE · contracts/schema-expectations — TYPE-LEVEL negatives, part of T-SCHEMA (plan §30).
// Compiled by tsc / next build. Each @ts-expect-error asserts an INVALID state is rejected by the type system;
// if the error ever stops occurring, @ts-expect-error itself becomes TS2578 and fails the build. This file passing
// clean IS the proof. Negatives are single-line so the directive sits on the exact erroring line. Type-only at runtime.

import type { ProjectQualification } from "../domain/ratings";
import type { ProjectLaborCost, LocalSettlement } from "../domain/economics";
import { tagUsd } from "../domain/economics";
import type { ActorRef } from "../domain/actors";

const AUTH = { kind: "AUTHENTICATED_HUMAN", id: "u1" } as const;

// (1) A ProjectQualification cannot exist without project-specific evidence (FCRS-31).
// @ts-expect-error — qualification_evidence is required.
const _q1: ProjectQualification = { qualification_id: "q1", label: "x", qualified_value: "v", qualified_by: AUTH, qualified_at: "2026-01-01" };

// (2) A ProjectQualification cannot be signed by a non-authenticated actor (FCRS-32).
// @ts-expect-error — qualified_by must be AuthenticatedHumanActor, not SYSTEM.
const _q2: ProjectQualification = { qualification_id: "q2", label: "x", qualified_value: "v", qualification_evidence: "e", qualified_by: { kind: "SYSTEM", id: "ai" }, qualified_at: "2026-01-01" };

// (3) The economic FIREWALL: a settlement value is not assignable into a labour input (FCRS-26, T-FIREWALL).
const _settlementMoney = tagUsd("settlement", 5200);
// @ts-expect-error — Usd<"settlement"> is not assignable to Usd<"labor">.
const _labor: ProjectLaborCost = { kind: "ProjectLaborCost", labor_usd: _settlementMoney, evidence: "QUOTED" };

// Positive controls (MUST compile — no directive): a valid qualification, labour value, settlement record.
const _qOk: ProjectQualification = { qualification_id: "q3", label: "x", qualified_value: "v", qualification_evidence: "e", qualified_by: AUTH, qualified_at: "2026-01-01" };
const _laborOk: ProjectLaborCost = { kind: "ProjectLaborCost", labor_usd: tagUsd("labor", 5200), evidence: "QUOTED" };
const _settleOk: LocalSettlement = { kind: "LocalSettlement", jurisdiction_id: "us-tx-austin", native_currency: "USD", settlement_native: _settlementMoney, evidence: "REFERENCE" };

export type _SchemaExpectationsHold = [typeof _q1, typeof _q2, typeof _labor, typeof _qOk, typeof _laborOk, typeof _settleOk, ActorRef];
