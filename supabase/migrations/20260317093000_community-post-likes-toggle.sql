-- Enforce 1 like per user per post
alter table community_post_likes
  add constraint community_post_likes_user_post_unique unique (user_id, community_post_id);

create index if not exists community_post_likes_post_id_idx
  on community_post_likes (community_post_id);

create index if not exists community_post_likes_user_id_idx
  on community_post_likes (user_id);

-- Allow like tracking under RLS
alter table community_post_likes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'community_post_likes'
      and policyname = 'community_post_likes_select_own'
  ) then
    create policy community_post_likes_select_own
      on community_post_likes
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'community_post_likes'
      and policyname = 'community_post_likes_insert_own'
  ) then
    create policy community_post_likes_insert_own
      on community_post_likes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'community_post_likes'
      and policyname = 'community_post_likes_delete_own'
  ) then
    create policy community_post_likes_delete_own
      on community_post_likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- Toggle like and keep community_posts.likes consistent
create or replace function public.toggle_community_post_like(p_post_id int)
returns table (liked boolean, likes int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_liked boolean;
  v_likes int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1
    from community_post_likes
    where user_id = v_uid
      and community_post_id = p_post_id
  ) then
    delete from community_post_likes
    where user_id = v_uid
      and community_post_id = p_post_id;

    update community_posts
    set likes = greatest(likes - 1, 0),
        updated_at = current_timestamp
    where id = p_post_id
    returning community_posts.likes into v_likes;

    v_liked := false;
  else
    insert into community_post_likes (user_id, community_post_id)
    values (v_uid, p_post_id)
    on conflict (user_id, community_post_id) do nothing;

    update community_posts
    set likes = likes + 1,
        updated_at = current_timestamp
    where id = p_post_id
    returning community_posts.likes into v_likes;

    v_liked := true;
  end if;

  return query select v_liked, coalesce(v_likes, 0);
end;
$$;

revoke all on function public.toggle_community_post_like(int) from public;
grant execute on function public.toggle_community_post_like(int) to authenticated;

