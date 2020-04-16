create table public.context_state(
    user_id int references "user"(id),
    context_key text,
    store jsonb default '{}',
    primary key (user_id, context_key)
);
