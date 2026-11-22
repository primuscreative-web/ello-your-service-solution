-- Trigger functions execute through their table triggers and are not public RPCs.
-- Remove inherited/default API execution grants without changing trigger behavior.
revoke all on function public.localhub_apply_delivery_area() from public, anon, authenticated, service_role;
revoke all on function public.localhub_apply_food_loyalty() from public, anon, authenticated, service_role;
revoke all on function public.localhub_mark_food_cart_recovered() from public, anon, authenticated, service_role;
revoke all on function public.localhub_release_food_coupon_on_cancel() from public, anon, authenticated, service_role;
revoke all on function public.localhub_update_food_customer_totals() from public, anon, authenticated, service_role;
revoke all on function public.localhub_upsert_food_customer() from public, anon, authenticated, service_role;
revoke all on function public.prevent_localhub_booking_overlap() from public, anon, authenticated, service_role;
