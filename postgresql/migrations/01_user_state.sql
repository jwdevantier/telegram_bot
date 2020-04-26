create table public.user (
    id int primary key,
    registered boolean default true,
    store jsonb not null default '{}'
);