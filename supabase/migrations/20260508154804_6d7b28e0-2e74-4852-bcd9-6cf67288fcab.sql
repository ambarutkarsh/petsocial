create table if not exists public.pet_blog_articles (
  id              text primary key,
  url             text not null,
  title           text not null,
  excerpt         text,
  image           text,
  image_alt       text,
  date_published  timestamptz,
  date_modified   timestamptz,
  author          text,
  source          text not null default 'nurtureyourpet.com',
  category        text not null,
  category_label  text not null,
  tags            text[] default '{}',
  word_count      int default 0,
  reading_time_min int default 1,
  body_text       text,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists pet_blog_articles_category_idx on public.pet_blog_articles(category);
create index if not exists pet_blog_articles_pub_idx on public.pet_blog_articles(is_published, date_modified desc);

alter table public.pet_blog_articles enable row level security;

create policy "pet_blog_articles read"
  on public.pet_blog_articles for select
  using (is_published = true);