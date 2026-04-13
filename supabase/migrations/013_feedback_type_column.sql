-- ==========================================================================
-- Migration 013 — Add feedback_type column to product_feedback (Enlil)
-- ==========================================================================
-- Schema drift fix: SQLAlchemy model has feedback_type but migration 005 lacks it.
-- feedback_type: "CRS" (maps to requirement) | "DI" (Design Idea — new feature)
-- ==========================================================================

alter table product_feedback
  add column if not exists feedback_type varchar(10) default 'CRS';

create index if not exists ix_product_feedback_type on product_feedback(feedback_type);
