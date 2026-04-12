-- ==========================================================================
-- Migration 010 — Enable Realtime + Triggers for live data delivery
-- ==========================================================================
-- Enables Supabase Realtime on tables that need live push to frontend.
-- Adds triggers for backend notifications on key state changes.
-- ==========================================================================

-- ─── REALTIME PUBLICATIONS ─────────────────────────────────────────
-- Tables that push live updates to connected clients via WebSocket
-- Using DO blocks to gracefully handle "already member" errors

do $$ begin
  alter publication supabase_realtime add table sessions;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table session_status;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table responses;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table participants;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table themes;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table payment_transactions;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table response_summaries;
exception when duplicate_object then null;
end $$;

-- ─── NOTIFICATION TRIGGERS ─────────────────────────────────────────
-- These notify the backend (via pg_notify) when key events happen

-- Trigger: Notify on new response (for Cube 5 pipeline orchestration)
create or replace function notify_new_response()
returns trigger as $$
begin
  perform pg_notify('new_response', json_build_object(
    'id', NEW.id,
    'session_code', NEW.session_code,
    'created_at', NEW.created_at
  )::text);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_new_response on responses;
create trigger trg_notify_new_response
  after insert on responses
  for each row execute function notify_new_response();

-- Trigger: Notify on session status change (for pipeline orchestration)
create or replace function notify_session_status_change()
returns trigger as $$
begin
  if OLD.status is distinct from NEW.status then
    perform pg_notify('session_status_change', json_build_object(
      'id', NEW.id,
      'short_code', NEW.short_code,
      'old_status', OLD.status,
      'new_status', NEW.status
    )::text);
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_session_status on sessions;
create trigger trg_notify_session_status
  after update on sessions
  for each row execute function notify_session_status_change();

-- Trigger: Notify on payment completion (for token distribution)
create or replace function notify_payment_completed()
returns trigger as $$
begin
  if NEW.status = 'completed' and (OLD.status is null or OLD.status != 'completed') then
    perform pg_notify('payment_completed', json_build_object(
      'id', NEW.id,
      'session_id', NEW.session_id,
      'transaction_type', NEW.transaction_type,
      'amount_cents', NEW.amount_cents
    )::text);
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_payment_completed on payment_transactions;
create trigger trg_notify_payment_completed
  after insert or update on payment_transactions
  for each row execute function notify_payment_completed();

-- Trigger: Notify on new ranking submission (for live aggregation)
create or replace function notify_new_ranking()
returns trigger as $$
begin
  perform pg_notify('new_ranking', json_build_object(
    'id', NEW.id,
    'session_id', NEW.session_id,
    'participant_id', NEW.participant_id
  )::text);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_new_ranking on rankings;
create trigger trg_notify_new_ranking
  after insert on rankings
  for each row execute function notify_new_ranking();

-- Trigger: Notify on participant join (for lobby count)
create or replace function notify_participant_joined()
returns trigger as $$
begin
  perform pg_notify('participant_joined', json_build_object(
    'id', NEW.id,
    'session_id', NEW.session_id,
    'display_name', NEW.display_name
  )::text);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_participant_joined on participants;
create trigger trg_notify_participant_joined
  after insert on participants
  for each row execute function notify_participant_joined();
