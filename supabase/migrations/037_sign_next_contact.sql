-- 037 — the hand-off never lands on nobody (fleet pass 2, Christo · Krishna; operator 2026-09-09: "speed to generate and get two +
-- signatories"). APPEND to 036, never an edit of it:
--   * sign_envelope_sign now also returns `next_contact` — the NEXT signer's contact as the creator typed it — so a middle signer
--     (3+ signatories) can text or e-mail the hand-off link; before, only the creator knew the contacts and the second signer's
--     sms:/mailto: opened empty.
--   * on completion it returns `creator_contact` — signer 0's contact — so the LAST signer's phone can send the finished file
--     back to the creator (the send row is prefilled; with the site's mail key the PDF goes as an attachment).
--   * the wrong-secret path RETURNS {error:'bad_secret'} instead of raising, so the failed-attempt counter and the 'refused' event
--     COMMIT — under 036 the exception rolled them back and the one-hour lock after 20 wrong secrets never engaged.
-- Both contacts are ones the creator supplied for that very envelope, handed only to a party that just proved its own secret;
-- sign__shape (the public shape) still masks every contact for everyone.
create or replace function sign_envelope_sign(
  p_token text, p_signer_idx int, p_secret text, p_files jsonb, p_chain text, p_ip_hash text default null, p_user_agent text default null, p_marks jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare e sign_envelopes; v_h text; v_cur int; v_n int; f jsonb; v_last boolean; v_ver int; v_signers jsonb; v_next text := null; v_shas text[]; v_chain text;
begin
  select * into e from sign_envelopes where token = p_token for update;
  if not found then raise exception 'not_found'; end if;
  if e.status = 'awaiting' and e.expires_at is not null and e.expires_at < now() then
    update sign_envelopes set status = 'expired', updated_at = now() where id = e.id; raise exception 'expired';
  end if;
  if e.status <> 'awaiting' then raise exception '%', e.status; end if;
  if e.locked_until is not null and e.locked_until > now() then raise exception 'locked'; end if;
  if p_signer_idx <> e.current_signer_idx then raise exception 'not_your_turn'; end if;
  v_h := sign__hash(p_secret);
  if (e.signers->p_signer_idx->>'secret_hash') is distinct from v_h then
    update sign_envelopes set failed_attempts = case when locked_until is not null and locked_until < now() then 1 else failed_attempts + 1 end,
      locked_until = case when failed_attempts + 1 >= 20 then now() + interval '1 hour' else locked_until end, updated_at = now() where id = e.id;
    insert into sign_events (envelope_id, signer_idx, kind, ip_hash, user_agent) values (e.id, p_signer_idx, 'refused', p_ip_hash, left(p_user_agent, 300));
    -- RETURNED, not raised: `raise exception` rolls the whole call back, so under 036 the failed-attempt counter and the refused
    -- event never persisted and twenty wrong secrets never locked anything (found by the PGlite test, 2026-09-09). The client
    -- turns {error:'bad_secret'} into the same SignStoreError it threw before.
    return jsonb_build_object('error', 'bad_secret', 'locked', e.failed_attempts + 1 >= 20);
  end if;
  select count(*) into v_n from sign_files where envelope_id = e.id and version = (select max(version) from sign_files where envelope_id = e.id);
  if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) <> v_n then raise exception 'file_count_mismatch'; end if;
  if (select coalesce(sum(length(f2->>'pdf_base64')), 0) from jsonb_array_elements(p_files) as f2) > 17000000 then raise exception 'envelope_too_large'; end if;
  select max(version) + 1 into v_ver from sign_files where envelope_id = e.id;
  v_n := 0;
  for f in select * from jsonb_array_elements(p_files) loop
    if length(coalesce(f->>'pdf_base64', '')) > 4300000 then raise exception 'file_too_large'; end if;
    insert into sign_files (envelope_id, name, page_count, pdf_base64, sha256, version, ordinal)
    values (e.id, left(coalesce(f->>'name', 'document.pdf'), 200), coalesce((f->>'page_count')::int, 0), f->>'pdf_base64',
            encode(digest(decode(f->>'pdf_base64', 'base64'), 'sha256'), 'hex'), v_ver, v_n);
    v_n := v_n + 1;
  end loop;
  select array_agg(encode(digest(decode(fj->>'pdf_base64', 'base64'), 'sha256'), 'hex') order by ord) into v_shas
    from jsonb_array_elements(p_files) with ordinality as t(fj, ord);
  v_chain := sign__hash(e.chain || ':' || array_to_string(v_shas, ','));
  v_last := p_signer_idx = jsonb_array_length(e.signers) - 1;
  v_signers := jsonb_set(e.signers, array[p_signer_idx::text, 'signed_at'], to_jsonb(now()), true);
  if not v_last then
    v_next := replace(translate(encode(gen_random_bytes(16), 'base64'), '+/', '-_'), '=', '');
    v_signers := jsonb_set(v_signers, array[(p_signer_idx + 1)::text, 'secret_hash'], to_jsonb(sign__hash(v_next)), true);
  end if;
  update sign_envelopes set signers = v_signers, chain = v_chain,
    current_signer_idx = case when v_last then current_signer_idx else current_signer_idx + 1 end,
    status = case when v_last then 'complete' else 'awaiting' end,
    completed_at = case when v_last then now() else null end, updated_at = now()
  where id = e.id returning * into e;
  insert into sign_events (envelope_id, signer_idx, kind, file_shas, version, marks, contact_hash, ip_hash, user_agent)
  values (e.id, p_signer_idx, 'signed', v_shas, v_ver, p_marks, sign__hash(e.signers->p_signer_idx->>'contact'), p_ip_hash, left(p_user_agent, 300));
  return sign__shape(e, p_signer_idx, true) || jsonb_build_object(
    'next_secret', v_next,
    'next_contact', case when v_last then null else e.signers->(p_signer_idx + 1)->>'contact' end,
    'creator_contact', case when v_last then e.signers->0->>'contact' else null end);
end $$;
revoke all on function sign_envelope_sign(text, int, text, jsonb, text, text, text, jsonb) from public;
grant execute on function sign_envelope_sign(text, int, text, jsonb, text, text, text, jsonb) to anon, authenticated;
comment on function sign_envelope_sign(text, int, text, jsonb, text, text, text, jsonb) is '037: also returns next_contact (the next signer''s contact, for the hand-off) and creator_contact on completion (so the finished file can go back to the creator).';
