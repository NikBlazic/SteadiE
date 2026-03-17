-- We moved like toggle logic to the client (TypeScript).
-- Remove the old RPC to avoid confusion / ambiguous column errors.

drop function if exists public.toggle_community_post_like(int);

