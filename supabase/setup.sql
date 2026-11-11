-- =====================================================================
--  النوبي — إعداد الداتابيز على Supabase
--  انسخ الملف ده كله، والصقه في SQL Editor، ودوس Run مرة واحدة.
--  آخر سطر هيطلعلك "مفتاح المزامنة" — انسخه وحطه في إعدادات البرنامج.
-- =====================================================================

-- ---------- الجداول ----------
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);

create table if not exists public.shop (
  id        int primary key default 1 check (id = 1),
  data      jsonb not null default '{}'::jsonb,
  synced_at timestamptz
);

create table if not exists public.customers (
  id          text primary key,
  phone_norm  text,
  nid4        text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists customers_phone_idx on public.customers (phone_norm);

create table if not exists public.contracts (
  id          text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  data        jsonb not null
);
create index if not exists contracts_customer_idx on public.contracts (customer_id);

create table if not exists public.portal_attempts (
  phone_norm text not null,
  at         timestamptz not null default now(),
  ok         boolean not null
);
create index if not exists portal_attempts_idx on public.portal_attempts (phone_norm, at);

-- ---------- قفل الجداول: محدش يقرا أو يكتب فيها مباشرة ----------
alter table public.app_config      enable row level security;
alter table public.shop            enable row level security;
alter table public.customers       enable row level security;
alter table public.contracts       enable row level security;
alter table public.portal_attempts enable row level security;
revoke all on public.app_config, public.shop, public.customers, public.contracts, public.portal_attempts from anon, authenticated;

-- ---------- مفتاح المزامنة (بيتعمل مرة واحدة بس) ----------
insert into public.app_config (key, value)
values ('sync_key', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- ---------- توحيد شكل رقم الموبايل: 01012345678 / +201012345678 → 1012345678 ----------
create or replace function public.norm_phone(p text)
returns text language sql immutable as $$
  select case
    when d like '0020%' then substr(d, 5)
    when d like '20%' and length(d) = 12 then substr(d, 3)
    when d like '0%' then substr(d, 2)
    else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

create or replace function public._check_key(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_key is null or p_key <> (select value from app_config where key = 'sync_key') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end $$;
revoke all on function public._check_key(text) from public, anon, authenticated;

-- ---------- البرنامج بيرفع كل الداتا (البرنامج هو المصدر الأساسي) ----------
create or replace function public.sync_push(p_key text, p_data jsonb, p_force boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  n_in int := coalesce(jsonb_array_length(p_data->'customers'), 0);
  n_cloud int;
begin
  perform _check_key(p_key);
  select count(*) into n_cloud from customers;
  -- حماية: جهاز جديد فاضي ميمسحش الداتا اللي على السحابة
  if n_in = 0 and n_cloud > 0 and not p_force then
    raise exception 'would_wipe' using errcode = 'P0001';
  end if;

  delete from contracts;
  delete from customers;

  insert into customers (id, phone_norm, nid4, data)
  select c->>'id',
         norm_phone(c->>'phone'),
         case when length(regexp_replace(coalesce(c->>'nationalId', ''), '\D', '', 'g')) >= 4
              then right(regexp_replace(c->>'nationalId', '\D', '', 'g'), 4) end,
         c
  from jsonb_array_elements(coalesce(p_data->'customers', '[]'::jsonb)) c
  where c->>'id' is not null;

  insert into contracts (id, customer_id, data)
  select k->>'id', k->>'customerId', k
  from jsonb_array_elements(coalesce(p_data->'contracts', '[]'::jsonb)) k
  where k->>'id' is not null
    and exists (select 1 from customers where id = k->>'customerId');

  insert into shop (id, data, synced_at) values (1, coalesce(p_data->'shop', '{}'::jsonb), now())
  on conflict (id) do update set data = excluded.data, synced_at = excluded.synced_at;

  return jsonb_build_object('ok', true, 'customers', (select count(*) from customers),
                            'contracts', (select count(*) from contracts), 'at', now());
end $$;

-- ---------- استرجاع كل الداتا للبرنامج (لو الجهاز اتغير) ----------
create or replace function public.sync_pull(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_key(p_key);
  return jsonb_build_object(
    'shop',      (select data from shop where id = 1),
    'customers', coalesce((select jsonb_agg(data) from customers), '[]'::jsonb),
    'contracts', coalesce((select jsonb_agg(data) from contracts), '[]'::jsonb),
    'synced_at', (select synced_at from shop where id = 1));
end $$;

create or replace function public.sync_ping(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_key(p_key);
  return jsonb_build_object('ok', true, 'customers', (select count(*) from customers),
                            'synced_at', (select synced_at from shop where id = 1));
end $$;

-- ---------- موقع العملاء: رقم الموبايل + آخر 4 من الرقم القومي ----------
-- بيرجّع بس اللي يخص العميل (من غير سعر الكاش أو نسبة الزيادة أو بيانات الضامن)
create or replace function public.customer_portal(p_phone text, p_nid4 text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_phone text := norm_phone(p_phone);
  v_nid4  text := regexp_replace(coalesce(p_nid4, ''), '\D', '', 'g');
  v_fails int;
  v_ids   text[];
begin
  if length(v_phone) < 9 or length(v_nid4) <> 4 then
    return jsonb_build_object('error', 'invalid');
  end if;

  delete from portal_attempts where at < now() - interval '1 day';
  select count(*) into v_fails from portal_attempts
   where phone_norm = v_phone and not ok and at > now() - interval '15 minutes';
  if v_fails >= 5 then
    return jsonb_build_object('error', 'locked');
  end if;

  select array_agg(id) into v_ids from customers where phone_norm = v_phone and nid4 = v_nid4;

  if v_ids is null then
    insert into portal_attempts (phone_norm, ok) values (v_phone, false);
    return jsonb_build_object('error', 'not_found', 'left', greatest(0, 4 - v_fails));
  end if;
  insert into portal_attempts (phone_norm, ok) values (v_phone, true);

  return jsonb_build_object(
    'shop', (select jsonb_build_object('name', data->>'name', 'phone', data->>'phone', 'currency', data->>'currency')
               from shop where id = 1),
    'synced_at', (select synced_at from shop where id = 1),
    'name', (select data->>'name' from customers where id = v_ids[1]),
    'contracts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id,
        'device', k.data->>'device',
        'date', k.data->>'date',
        'totalPrice', (k.data->>'totalPrice')::numeric,
        'downPayment', (k.data->>'downPayment')::numeric,
        'installments', (select coalesce(jsonb_agg(jsonb_build_object(
                            'n', i->'n', 'due', i->'due', 'amount', i->'amount', 'paid', i->'paid', 'paidAt', i->'paidAt')), '[]'::jsonb)
                         from jsonb_array_elements(k.data->'installments') i),
        'payments', (select coalesce(jsonb_agg(jsonb_build_object('date', p->'date', 'amount', p->'amount')), '[]'::jsonb)
                     from jsonb_array_elements(coalesce(k.data->'payments', '[]'::jsonb)) p)
      ) order by k.data->>'date' desc)
      from contracts k where k.customer_id = any(v_ids)), '[]'::jsonb));
end $$;

-- ---------- الصلاحيات ----------
revoke all on function public.sync_push(text, jsonb, boolean), public.sync_pull(text), public.sync_ping(text),
                       public.customer_portal(text, text) from public;
grant execute on function public.sync_push(text, jsonb, boolean), public.sync_pull(text), public.sync_ping(text),
                          public.customer_portal(text, text) to anon, authenticated;

-- ---------- انسخ المفتاح ده ----------
select value as "مفتاح المزامنة - انسخه" from public.app_config where key = 'sync_key';
