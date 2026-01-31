create table quotes (
    id uuid primary key default gen_random_uuid(),
    quote text not null,
    author text not null,
    created_at timestamp with time zone default now()
);