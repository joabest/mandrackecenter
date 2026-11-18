-- Execute depois de supabase/schema.sql. Keys sem validade, planos administrados.
alter table public.mc_users add column if not exists plan text not null default 'FREE';
alter table public.mc_users add column if not exists enabled boolean not null default true;
alter table public.mc_users drop constraint if exists mc_users_plan_check;
alter table public.mc_users add constraint mc_users_plan_check check(plan in ('FREE','PRO','PREMIUM'));

alter table public.mc_login_keys alter column expires_at drop not null;
alter table public.mc_login_keys add column if not exists revoked_at timestamptz;
create index if not exists mc_login_keys_active on public.mc_login_keys (telegram_id) where revoked_at is null;

-- Um novo /start substitui a key anterior; a nova não expira.
create or replace function public.mc_assign_key(p_telegram_id bigint,p_hash text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if length(p_hash)<>64 then raise exception 'Invalid hash';end if;
 perform 1 from public.mc_users where telegram_id=p_telegram_id for update;
 if not found then raise exception 'Unknown user'; end if;
 update public.mc_login_keys set revoked_at=now() where telegram_id=p_telegram_id and revoked_at is null;
 insert into public.mc_login_keys(telegram_id,key_hash,expires_at,consumed_at,revoked_at)
 values(p_telegram_id,p_hash,null,null,null);
end;
$$;

create or replace function public.mc_lookup_key(p_hash text)
returns table (telegram_id bigint, key_id uuid, plan text, credits bigint)
language sql security definer set search_path=public as $$
 select u.telegram_id,k.id,u.plan,u.credits
 from public.mc_login_keys k
 join public.mc_users u on u.telegram_id=k.telegram_id
 where k.key_hash=p_hash and k.revoked_at is null and u.enabled=true
 limit 1;
$$;

create or replace function public.mc_set_plan(p_telegram_id bigint,p_plan text)
returns text language plpgsql security definer set search_path=public as $$
begin
 if p_plan not in ('FREE','PRO','PREMIUM') then raise exception 'Invalid plan';end if;
 update public.mc_users set plan=p_plan where telegram_id=p_telegram_id;
 if not found then raise exception 'Unknown user';end if;
 return p_plan;
end;
$$;

create or replace function public.mc_set_user_enabled(p_telegram_id bigint,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.mc_users set enabled=p_enabled where telegram_id=p_telegram_id;
 if not found then raise exception 'Unknown user';end if;
 return p_enabled;
end;
$$;

create or replace function public.mc_revoke_user_key(p_telegram_id bigint)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 update public.mc_login_keys set revoked_at=now() where telegram_id=p_telegram_id and revoked_at is null;
 get diagnostics n=row_count;
 return n;
end;
$$;

revoke all on function public.mc_assign_key(bigint,text),public.mc_lookup_key(text),public.mc_set_plan(bigint,text),public.mc_set_user_enabled(bigint,boolean),public.mc_revoke_user_key(bigint) from public,anon,authenticated;
grant execute on function public.mc_assign_key(bigint,text),public.mc_lookup_key(text),public.mc_set_plan(bigint,text),public.mc_set_user_enabled(bigint,boolean),public.mc_revoke_user_key(bigint) to service_role;
