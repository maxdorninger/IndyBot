-- Grant the service_role full access to the private schema and its tables.
-- Without this, supabaseAdmin (which connects as service_role via PostgREST)
-- receives "permission denied for schema private" even though it bypasses RLS.

GRANT USAGE ON SCHEMA private TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA private TO service_role;
