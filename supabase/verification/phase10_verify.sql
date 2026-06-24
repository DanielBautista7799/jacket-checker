-- Phase 10 verification. Run after applying the migration.

select extname, extversion
from pg_extension
where extname = 'vector';

select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'jacket_embeddings'
order by ordinal_position;

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'jacket_embeddings'
order by policyname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'jacket_embeddings'
order by indexname;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'match_user_jackets',
    'phase10_mark_jacket_embedding_stale',
    'phase10_mark_embedding_stale_from_image'
  )
order by routine_name;

select
  status,
  count(*) as embedding_count
from public.jacket_embeddings
where user_id = auth.uid()
group by status
order by status;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'get_user_jacket_similarity_pairs';
