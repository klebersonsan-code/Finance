create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('receita', 'despesa')),
  category text not null,
  date date not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists transactions_user_id_idx
  on public.transactions (user_id);

create index if not exists transactions_user_id_date_idx
  on public.transactions (user_id, date desc);

create index if not exists transactions_user_id_date_created_id_idx
  on public.transactions (user_id, date desc, created_at desc, id desc);

create index if not exists transactions_user_id_type_date_created_idx
  on public.transactions (user_id, type, date desc, created_at desc);

create index if not exists transactions_user_id_month_idx
  on public.transactions (user_id, date_trunc('month', date));

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
on public.transactions
for select
using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
on public.transactions
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
on public.transactions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
on public.transactions
for delete
using (auth.uid() = user_id);

create or replace function public.get_transaction_months()
returns table (month_key text)
language sql
stable
as $$
  select to_char(date_trunc('month', t.date), 'YYYY-MM') as month_key
  from public.transactions t
  where t.user_id = auth.uid()
  group by 1
  order by 1 desc;
$$;

create or replace function public.get_transaction_metrics(
  p_type_filter text default null,
  p_month_filter text default null
)
returns table (
  receitas numeric,
  despesas numeric,
  total_count bigint,
  expense_categories jsonb
)
language sql
stable
as $$
  with params as (
    select
      nullif(p_type_filter, '') as type_filter,
      case
        when nullif(p_month_filter, '') is null then null
        else (p_month_filter || '-01')::date
      end as month_start
  ),
  filtered as (
    select t.amount, t.type, t.category
    from public.transactions t
    cross join params p
    where t.user_id = auth.uid()
      and (p.type_filter is null or t.type = p.type_filter)
      and (
        p.month_start is null
        or (
          t.date >= p.month_start
          and t.date < (p.month_start + interval '1 month')
        )
      )
  ),
  expense_grouped as (
    select
      f.category,
      sum(f.amount)::numeric as value
    from filtered f
    where f.type = 'despesa'
    group by f.category
  )
  select
    coalesce(sum(f.amount) filter (where f.type = 'receita'), 0)::numeric as receitas,
    coalesce(sum(f.amount) filter (where f.type = 'despesa'), 0)::numeric as despesas,
    count(*)::bigint as total_count,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'category', eg.category,
            'value', eg.value
          )
          order by eg.value desc, eg.category asc
        )
        from expense_grouped eg
      ),
      '[]'::jsonb
    ) as expense_categories
  from filtered f;
$$;

create or replace function public.get_transaction_history_page(
  p_type_filter text default null,
  p_month_filter text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  description text,
  amount numeric,
  type text,
  category text,
  date date,
  created_at timestamptz
)
language sql
stable
as $$
  with params as (
    select
      nullif(p_type_filter, '') as type_filter,
      case
        when nullif(p_month_filter, '') is null then null
        else (p_month_filter || '-01')::date
      end as month_start,
      greatest(coalesce(p_limit, 20), 1) as page_limit,
      greatest(coalesce(p_offset, 0), 0) as page_offset
  )
  select
    t.id,
    t.description,
    t.amount,
    t.type,
    t.category,
    t.date,
    t.created_at
  from public.transactions t
  cross join params p
  where t.user_id = auth.uid()
    and (p.type_filter is null or t.type = p.type_filter)
    and (
      p.month_start is null
      or (
        t.date >= p.month_start
        and t.date < (p.month_start + interval '1 month')
      )
    )
  order by t.date desc, t.created_at desc, t.id desc
  limit (select page_limit from params)
  offset (select page_offset from params);
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end;
$$;
