alter table public.quote_requests
  add column if not exists payment_mode text not null default 'external'
    check (payment_mode in ('external', 'platform')),
  add column if not exists payment_status text not null default 'not_applicable'
    check (
      payment_status in (
        'not_applicable',
        'pending',
        'authorized',
        'paid',
        'refunded',
        'failed',
        'disputed'
      )
    ),
  add column if not exists platform_fee_percent numeric(5, 2)
    check (platform_fee_percent is null or (platform_fee_percent >= 0 and platform_fee_percent <= 100));

comment on column public.quote_requests.payment_mode is
  'external means payment is arranged outside ELLO. platform is reserved for future gateway activation.';

comment on column public.quote_requests.payment_status is
  'not_applicable while ELLO does not process payments. Other statuses are reserved for future gateway activation.';

comment on column public.quote_requests.platform_fee_percent is
  'Reserved for future platform payments. Keep null while payment_mode is external.';
