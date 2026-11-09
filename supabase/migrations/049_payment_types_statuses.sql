-- 049: widen payment_transactions CHECKs to the values the payments code writes (superset — every existing value
-- stays valid; 0 completed rows at apply time). Found by the first signed live webhook (500 on a DeRisking donation).
--   transaction_type + derisking_strategies_donation (DeRisking Strategies product line), usage_billing (metered usage)
--   status           + expired (checkout.session.expired)
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_transaction_type_check;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_transaction_type_check
    CHECK (transaction_type = ANY (ARRAY['moderator_fee','cost_split','donation','divinity_guide_donation',
                                         'derisking_strategies_donation','usage_billing','reward_payout']));
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_status_check;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_status_check
    CHECK (status = ANY (ARRAY['pending','completed','failed','expired','refunded']));
