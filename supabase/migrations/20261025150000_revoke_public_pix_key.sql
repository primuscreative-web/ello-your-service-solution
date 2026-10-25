-- A published storefront must never expose the business PIX destination as a
-- direct PostgREST column. Payment collection remains disabled by policy.
revoke select (pix_key) on public.localhub_businesses from anon;

notify pgrst, 'reload schema';
