--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP EVENT TRIGGER IF EXISTS "pgrst_drop_watch";
DROP EVENT TRIGGER IF EXISTS "pgrst_ddl_watch";
DROP EVENT TRIGGER IF EXISTS "issue_pg_net_access";
DROP EVENT TRIGGER IF EXISTS "issue_pg_graphql_access";
DROP EVENT TRIGGER IF EXISTS "issue_pg_cron_access";
DROP EVENT TRIGGER IF EXISTS "issue_graphql_placeholder";
DROP PUBLICATION IF EXISTS "supabase_realtime_messages_publication";
DROP PUBLICATION IF EXISTS "supabase_realtime";
ALTER TABLE IF EXISTS ONLY "storage"."vector_indexes" DROP CONSTRAINT IF EXISTS "vector_indexes_bucket_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads_parts" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_parts_upload_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads_parts" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_parts_bucket_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_bucket_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."objects" DROP CONSTRAINT IF EXISTS "objects_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."iceberg_tables" DROP CONSTRAINT IF EXISTS "iceberg_tables_namespace_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."iceberg_tables" DROP CONSTRAINT IF EXISTS "iceberg_tables_catalog_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."iceberg_namespaces" DROP CONSTRAINT IF EXISTS "iceberg_namespaces_catalog_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."sso_domains" DROP CONSTRAINT IF EXISTS "sso_domains_sso_provider_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."sessions" DROP CONSTRAINT IF EXISTS "sessions_oauth_client_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_relay_states" DROP CONSTRAINT IF EXISTS "saml_relay_states_sso_provider_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_relay_states" DROP CONSTRAINT IF EXISTS "saml_relay_states_flow_state_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_providers" DROP CONSTRAINT IF EXISTS "saml_providers_sso_provider_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_session_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."one_time_tokens" DROP CONSTRAINT IF EXISTS "one_time_tokens_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_consents" DROP CONSTRAINT IF EXISTS "oauth_consents_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_consents" DROP CONSTRAINT IF EXISTS "oauth_consents_client_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_authorizations" DROP CONSTRAINT IF EXISTS "oauth_authorizations_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_authorizations" DROP CONSTRAINT IF EXISTS "oauth_authorizations_client_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_factors" DROP CONSTRAINT IF EXISTS "mfa_factors_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_challenges" DROP CONSTRAINT IF EXISTS "mfa_challenges_auth_factor_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_amr_claims" DROP CONSTRAINT IF EXISTS "mfa_amr_claims_session_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."identities" DROP CONSTRAINT IF EXISTS "identities_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "_realtime"."extensions" DROP CONSTRAINT IF EXISTS "extensions_tenant_external_id_fkey";
DROP TRIGGER IF EXISTS "update_objects_updated_at" ON "storage"."objects";
DROP TRIGGER IF EXISTS "protect_objects_delete" ON "storage"."objects";
DROP TRIGGER IF EXISTS "protect_buckets_delete" ON "storage"."buckets";
DROP TRIGGER IF EXISTS "enforce_bucket_name_length_trigger" ON "storage"."buckets";
DROP TRIGGER IF EXISTS "tr_check_filters" ON "realtime"."subscription";
DROP INDEX IF EXISTS "supabase_functions"."supabase_functions_hooks_request_id_idx";
DROP INDEX IF EXISTS "supabase_functions"."supabase_functions_hooks_h_table_id_h_name_idx";
DROP INDEX IF EXISTS "storage"."vector_indexes_name_bucket_id_idx";
DROP INDEX IF EXISTS "storage"."name_prefix_search";
DROP INDEX IF EXISTS "storage"."idx_objects_bucket_id_name_lower";
DROP INDEX IF EXISTS "storage"."idx_objects_bucket_id_name";
DROP INDEX IF EXISTS "storage"."idx_multipart_uploads_list";
DROP INDEX IF EXISTS "storage"."idx_iceberg_tables_namespace_id";
DROP INDEX IF EXISTS "storage"."idx_iceberg_tables_location";
DROP INDEX IF EXISTS "storage"."idx_iceberg_namespaces_bucket_id";
DROP INDEX IF EXISTS "storage"."buckets_analytics_unique_name_idx";
DROP INDEX IF EXISTS "storage"."bucketid_objname";
DROP INDEX IF EXISTS "storage"."bname";
DROP INDEX IF EXISTS "realtime"."subscription_subscription_id_entity_filters_action_filter_key";
DROP INDEX IF EXISTS "realtime"."messages_2026_03_05_inserted_at_topic_idx";
DROP INDEX IF EXISTS "realtime"."messages_2026_03_04_inserted_at_topic_idx";
DROP INDEX IF EXISTS "realtime"."messages_2026_03_03_inserted_at_topic_idx";
DROP INDEX IF EXISTS "realtime"."messages_2026_03_02_inserted_at_topic_idx";
DROP INDEX IF EXISTS "realtime"."messages_2026_03_01_inserted_at_topic_idx";
DROP INDEX IF EXISTS "realtime"."messages_inserted_at_topic_index";
DROP INDEX IF EXISTS "realtime"."ix_realtime_subscription_entity";
DROP INDEX IF EXISTS "auth"."users_is_anonymous_idx";
DROP INDEX IF EXISTS "auth"."users_instance_id_idx";
DROP INDEX IF EXISTS "auth"."users_instance_id_email_idx";
DROP INDEX IF EXISTS "auth"."users_email_partial_key";
DROP INDEX IF EXISTS "auth"."user_id_created_at_idx";
DROP INDEX IF EXISTS "auth"."unique_phone_factor_per_user";
DROP INDEX IF EXISTS "auth"."sso_providers_resource_id_pattern_idx";
DROP INDEX IF EXISTS "auth"."sso_providers_resource_id_idx";
DROP INDEX IF EXISTS "auth"."sso_domains_sso_provider_id_idx";
DROP INDEX IF EXISTS "auth"."sso_domains_domain_idx";
DROP INDEX IF EXISTS "auth"."sessions_user_id_idx";
DROP INDEX IF EXISTS "auth"."sessions_oauth_client_id_idx";
DROP INDEX IF EXISTS "auth"."sessions_not_after_idx";
DROP INDEX IF EXISTS "auth"."saml_relay_states_sso_provider_id_idx";
DROP INDEX IF EXISTS "auth"."saml_relay_states_for_email_idx";
DROP INDEX IF EXISTS "auth"."saml_relay_states_created_at_idx";
DROP INDEX IF EXISTS "auth"."saml_providers_sso_provider_id_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_updated_at_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_session_id_revoked_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_parent_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_instance_id_user_id_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_instance_id_idx";
DROP INDEX IF EXISTS "auth"."recovery_token_idx";
DROP INDEX IF EXISTS "auth"."reauthentication_token_idx";
DROP INDEX IF EXISTS "auth"."one_time_tokens_user_id_token_type_key";
DROP INDEX IF EXISTS "auth"."one_time_tokens_token_hash_hash_idx";
DROP INDEX IF EXISTS "auth"."one_time_tokens_relates_to_hash_idx";
DROP INDEX IF EXISTS "auth"."oauth_consents_user_order_idx";
DROP INDEX IF EXISTS "auth"."oauth_consents_active_user_client_idx";
DROP INDEX IF EXISTS "auth"."oauth_consents_active_client_idx";
DROP INDEX IF EXISTS "auth"."oauth_clients_deleted_at_idx";
DROP INDEX IF EXISTS "auth"."oauth_auth_pending_exp_idx";
DROP INDEX IF EXISTS "auth"."mfa_factors_user_id_idx";
DROP INDEX IF EXISTS "auth"."mfa_factors_user_friendly_name_unique";
DROP INDEX IF EXISTS "auth"."mfa_challenge_created_at_idx";
DROP INDEX IF EXISTS "auth"."idx_user_id_auth_method";
DROP INDEX IF EXISTS "auth"."idx_oauth_client_states_created_at";
DROP INDEX IF EXISTS "auth"."idx_auth_code";
DROP INDEX IF EXISTS "auth"."identities_user_id_idx";
DROP INDEX IF EXISTS "auth"."identities_email_idx";
DROP INDEX IF EXISTS "auth"."flow_state_created_at_idx";
DROP INDEX IF EXISTS "auth"."factor_id_created_at_idx";
DROP INDEX IF EXISTS "auth"."email_change_token_new_idx";
DROP INDEX IF EXISTS "auth"."email_change_token_current_idx";
DROP INDEX IF EXISTS "auth"."custom_oauth_providers_provider_type_idx";
DROP INDEX IF EXISTS "auth"."custom_oauth_providers_identifier_idx";
DROP INDEX IF EXISTS "auth"."custom_oauth_providers_enabled_idx";
DROP INDEX IF EXISTS "auth"."custom_oauth_providers_created_at_idx";
DROP INDEX IF EXISTS "auth"."confirmation_token_idx";
DROP INDEX IF EXISTS "auth"."audit_logs_instance_id_idx";
DROP INDEX IF EXISTS "_realtime"."tenants_external_id_index";
DROP INDEX IF EXISTS "_realtime"."extensions_tenant_external_id_type_index";
DROP INDEX IF EXISTS "_realtime"."extensions_tenant_external_id_index";
ALTER TABLE IF EXISTS ONLY "supabase_migrations"."seed_files" DROP CONSTRAINT IF EXISTS "seed_files_pkey";
ALTER TABLE IF EXISTS ONLY "supabase_functions"."migrations" DROP CONSTRAINT IF EXISTS "migrations_pkey";
ALTER TABLE IF EXISTS ONLY "supabase_functions"."hooks" DROP CONSTRAINT IF EXISTS "hooks_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."vector_indexes" DROP CONSTRAINT IF EXISTS "vector_indexes_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads_parts" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_parts_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."objects" DROP CONSTRAINT IF EXISTS "objects_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."migrations" DROP CONSTRAINT IF EXISTS "migrations_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."migrations" DROP CONSTRAINT IF EXISTS "migrations_name_key";
ALTER TABLE IF EXISTS ONLY "storage"."iceberg_tables" DROP CONSTRAINT IF EXISTS "iceberg_tables_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."iceberg_namespaces" DROP CONSTRAINT IF EXISTS "iceberg_namespaces_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."buckets_vectors" DROP CONSTRAINT IF EXISTS "buckets_vectors_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."buckets" DROP CONSTRAINT IF EXISTS "buckets_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."buckets_analytics" DROP CONSTRAINT IF EXISTS "buckets_analytics_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."subscription" DROP CONSTRAINT IF EXISTS "pk_subscription";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2026_03_05" DROP CONSTRAINT IF EXISTS "messages_2026_03_05_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2026_03_04" DROP CONSTRAINT IF EXISTS "messages_2026_03_04_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2026_03_03" DROP CONSTRAINT IF EXISTS "messages_2026_03_03_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2026_03_02" DROP CONSTRAINT IF EXISTS "messages_2026_03_02_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2026_03_01" DROP CONSTRAINT IF EXISTS "messages_2026_03_01_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages" DROP CONSTRAINT IF EXISTS "messages_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."users" DROP CONSTRAINT IF EXISTS "users_phone_key";
ALTER TABLE IF EXISTS ONLY "auth"."sso_providers" DROP CONSTRAINT IF EXISTS "sso_providers_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."sso_domains" DROP CONSTRAINT IF EXISTS "sso_domains_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."sessions" DROP CONSTRAINT IF EXISTS "sessions_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_relay_states" DROP CONSTRAINT IF EXISTS "saml_relay_states_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_providers" DROP CONSTRAINT IF EXISTS "saml_providers_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_providers" DROP CONSTRAINT IF EXISTS "saml_providers_entity_id_key";
ALTER TABLE IF EXISTS ONLY "auth"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_token_unique";
ALTER TABLE IF EXISTS ONLY "auth"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."one_time_tokens" DROP CONSTRAINT IF EXISTS "one_time_tokens_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_consents" DROP CONSTRAINT IF EXISTS "oauth_consents_user_client_unique";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_consents" DROP CONSTRAINT IF EXISTS "oauth_consents_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_clients" DROP CONSTRAINT IF EXISTS "oauth_clients_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_client_states" DROP CONSTRAINT IF EXISTS "oauth_client_states_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_authorizations" DROP CONSTRAINT IF EXISTS "oauth_authorizations_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_authorizations" DROP CONSTRAINT IF EXISTS "oauth_authorizations_authorization_id_key";
ALTER TABLE IF EXISTS ONLY "auth"."oauth_authorizations" DROP CONSTRAINT IF EXISTS "oauth_authorizations_authorization_code_key";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_factors" DROP CONSTRAINT IF EXISTS "mfa_factors_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_factors" DROP CONSTRAINT IF EXISTS "mfa_factors_last_challenged_at_key";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_challenges" DROP CONSTRAINT IF EXISTS "mfa_challenges_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_amr_claims" DROP CONSTRAINT IF EXISTS "mfa_amr_claims_session_id_authentication_method_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."instances" DROP CONSTRAINT IF EXISTS "instances_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."identities" DROP CONSTRAINT IF EXISTS "identities_provider_id_provider_unique";
ALTER TABLE IF EXISTS ONLY "auth"."identities" DROP CONSTRAINT IF EXISTS "identities_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."flow_state" DROP CONSTRAINT IF EXISTS "flow_state_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."custom_oauth_providers" DROP CONSTRAINT IF EXISTS "custom_oauth_providers_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."custom_oauth_providers" DROP CONSTRAINT IF EXISTS "custom_oauth_providers_identifier_key";
ALTER TABLE IF EXISTS ONLY "auth"."audit_log_entries" DROP CONSTRAINT IF EXISTS "audit_log_entries_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_amr_claims" DROP CONSTRAINT IF EXISTS "amr_id_pk";
ALTER TABLE IF EXISTS ONLY "_realtime"."tenants" DROP CONSTRAINT IF EXISTS "tenants_pkey";
ALTER TABLE IF EXISTS ONLY "_realtime"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "_realtime"."extensions" DROP CONSTRAINT IF EXISTS "extensions_pkey";
ALTER TABLE IF EXISTS "supabase_functions"."hooks" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "auth"."refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;
DROP TABLE IF EXISTS "supabase_migrations"."seed_files";
DROP TABLE IF EXISTS "supabase_functions"."migrations";
DROP SEQUENCE IF EXISTS "supabase_functions"."hooks_id_seq";
DROP TABLE IF EXISTS "supabase_functions"."hooks";
DROP TABLE IF EXISTS "storage"."vector_indexes";
DROP TABLE IF EXISTS "storage"."s3_multipart_uploads_parts";
DROP TABLE IF EXISTS "storage"."s3_multipart_uploads";
DROP TABLE IF EXISTS "storage"."objects";
DROP TABLE IF EXISTS "storage"."migrations";
DROP TABLE IF EXISTS "storage"."iceberg_tables";
DROP TABLE IF EXISTS "storage"."iceberg_namespaces";
DROP TABLE IF EXISTS "storage"."buckets_vectors";
DROP TABLE IF EXISTS "storage"."buckets_analytics";
DROP TABLE IF EXISTS "storage"."buckets";
DROP TABLE IF EXISTS "realtime"."subscription";
DROP TABLE IF EXISTS "realtime"."schema_migrations";
DROP TABLE IF EXISTS "realtime"."messages_2026_03_05";
DROP TABLE IF EXISTS "realtime"."messages_2026_03_04";
DROP TABLE IF EXISTS "realtime"."messages_2026_03_03";
DROP TABLE IF EXISTS "realtime"."messages_2026_03_02";
DROP TABLE IF EXISTS "realtime"."messages_2026_03_01";
DROP TABLE IF EXISTS "realtime"."messages";
DROP TABLE IF EXISTS "public"."trucks";
DROP TABLE IF EXISTS "public"."trailer_list";
DROP TABLE IF EXISTS "public"."tractors";
DROP TABLE IF EXISTS "public"."status_values";
DROP TABLE IF EXISTS "public"."staging_doors";
DROP TABLE IF EXISTS "public"."route_imports";
DROP TABLE IF EXISTS "public"."role_permissions";
DROP TABLE IF EXISTS "public"."reset_log";
DROP TABLE IF EXISTS "public"."profiles";
DROP TABLE IF EXISTS "public"."printroom_entries";
DROP TABLE IF EXISTS "public"."notifications";
DROP TABLE IF EXISTS "public"."notification_preferences";
DROP TABLE IF EXISTS "public"."messages";
DROP TABLE IF EXISTS "public"."loading_doors";
DROP TABLE IF EXISTS "public"."live_movement";
DROP TABLE IF EXISTS "public"."global_messages";
DROP TABLE IF EXISTS "public"."door_status_values";
DROP TABLE IF EXISTS "public"."dock_lock_status_values";
DROP TABLE IF EXISTS "public"."device_nicknames";
DROP TABLE IF EXISTS "public"."debug_logs";
DROP TABLE IF EXISTS "public"."chat_rooms";
DROP TABLE IF EXISTS "public"."automation_rules";
DROP TABLE IF EXISTS "auth"."users";
DROP TABLE IF EXISTS "auth"."sso_providers";
DROP TABLE IF EXISTS "auth"."sso_domains";
DROP TABLE IF EXISTS "auth"."sessions";
DROP TABLE IF EXISTS "auth"."schema_migrations";
DROP TABLE IF EXISTS "auth"."saml_relay_states";
DROP TABLE IF EXISTS "auth"."saml_providers";
DROP SEQUENCE IF EXISTS "auth"."refresh_tokens_id_seq";
DROP TABLE IF EXISTS "auth"."refresh_tokens";
DROP TABLE IF EXISTS "auth"."one_time_tokens";
DROP TABLE IF EXISTS "auth"."oauth_consents";
DROP TABLE IF EXISTS "auth"."oauth_clients";
DROP TABLE IF EXISTS "auth"."oauth_client_states";
DROP TABLE IF EXISTS "auth"."oauth_authorizations";
DROP TABLE IF EXISTS "auth"."mfa_factors";
DROP TABLE IF EXISTS "auth"."mfa_challenges";
DROP TABLE IF EXISTS "auth"."mfa_amr_claims";
DROP TABLE IF EXISTS "auth"."instances";
DROP TABLE IF EXISTS "auth"."identities";
DROP TABLE IF EXISTS "auth"."flow_state";
DROP TABLE IF EXISTS "auth"."custom_oauth_providers";
DROP TABLE IF EXISTS "auth"."audit_log_entries";
DROP TABLE IF EXISTS "_realtime"."tenants";
DROP TABLE IF EXISTS "_realtime"."schema_migrations";
DROP TABLE IF EXISTS "_realtime"."extensions";
DROP FUNCTION IF EXISTS "supabase_functions"."http_request"();
DROP FUNCTION IF EXISTS "storage"."update_updated_at_column"();
DROP FUNCTION IF EXISTS "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text");
DROP FUNCTION IF EXISTS "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text");
DROP FUNCTION IF EXISTS "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text");
DROP FUNCTION IF EXISTS "storage"."protect_delete"();
DROP FUNCTION IF EXISTS "storage"."operation"();
DROP FUNCTION IF EXISTS "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text", "sort_order" "text");
DROP FUNCTION IF EXISTS "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text");
DROP FUNCTION IF EXISTS "storage"."get_size_by_bucket"();
DROP FUNCTION IF EXISTS "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text");
DROP FUNCTION IF EXISTS "storage"."foldername"("name" "text");
DROP FUNCTION IF EXISTS "storage"."filename"("name" "text");
DROP FUNCTION IF EXISTS "storage"."extension"("name" "text");
DROP FUNCTION IF EXISTS "storage"."enforce_bucket_name_length"();
DROP FUNCTION IF EXISTS "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb");
DROP FUNCTION IF EXISTS "realtime"."topic"();
DROP FUNCTION IF EXISTS "realtime"."to_regrole"("role_name" "text");
DROP FUNCTION IF EXISTS "realtime"."subscription_check_filters"();
DROP FUNCTION IF EXISTS "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean);
DROP FUNCTION IF EXISTS "realtime"."quote_wal2json"("entity" "regclass");
DROP FUNCTION IF EXISTS "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer);
DROP FUNCTION IF EXISTS "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]);
DROP FUNCTION IF EXISTS "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text");
DROP FUNCTION IF EXISTS "realtime"."cast"("val" "text", "type_" "regtype");
DROP FUNCTION IF EXISTS "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]);
DROP FUNCTION IF EXISTS "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text");
DROP FUNCTION IF EXISTS "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer);
DROP FUNCTION IF EXISTS "pgbouncer"."get_auth"("p_usename" "text");
DROP FUNCTION IF EXISTS "extensions"."set_graphql_placeholder"();
DROP FUNCTION IF EXISTS "extensions"."pgrst_drop_watch"();
DROP FUNCTION IF EXISTS "extensions"."pgrst_ddl_watch"();
DROP FUNCTION IF EXISTS "extensions"."grant_pg_net_access"();
DROP FUNCTION IF EXISTS "extensions"."grant_pg_graphql_access"();
DROP FUNCTION IF EXISTS "extensions"."grant_pg_cron_access"();
DROP FUNCTION IF EXISTS "auth"."uid"();
DROP FUNCTION IF EXISTS "auth"."role"();
DROP FUNCTION IF EXISTS "auth"."jwt"();
DROP FUNCTION IF EXISTS "auth"."email"();
DROP TYPE IF EXISTS "storage"."buckettype";
DROP TYPE IF EXISTS "realtime"."wal_rls";
DROP TYPE IF EXISTS "realtime"."wal_column";
DROP TYPE IF EXISTS "realtime"."user_defined_filter";
DROP TYPE IF EXISTS "realtime"."equality_op";
DROP TYPE IF EXISTS "realtime"."action";
DROP TYPE IF EXISTS "auth"."one_time_token_type";
DROP TYPE IF EXISTS "auth"."oauth_response_type";
DROP TYPE IF EXISTS "auth"."oauth_registration_type";
DROP TYPE IF EXISTS "auth"."oauth_client_type";
DROP TYPE IF EXISTS "auth"."oauth_authorization_status";
DROP TYPE IF EXISTS "auth"."factor_type";
DROP TYPE IF EXISTS "auth"."factor_status";
DROP TYPE IF EXISTS "auth"."code_challenge_method";
DROP TYPE IF EXISTS "auth"."aal_level";
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "supabase_vault";
DROP EXTENSION IF EXISTS "pgjwt";
DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "pg_stat_statements";
DROP EXTENSION IF EXISTS "pg_graphql";
DROP SCHEMA IF EXISTS "vault";
DROP SCHEMA IF EXISTS "supabase_migrations";
DROP SCHEMA IF EXISTS "supabase_functions";
DROP SCHEMA IF EXISTS "storage";
DROP SCHEMA IF EXISTS "realtime";
DROP SCHEMA IF EXISTS "pgbouncer";
DROP EXTENSION IF EXISTS "pg_net";
DROP SCHEMA IF EXISTS "graphql_public";
DROP SCHEMA IF EXISTS "graphql";
DROP SCHEMA IF EXISTS "extensions";
DROP SCHEMA IF EXISTS "auth";
DROP SCHEMA IF EXISTS "_realtime";
--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "_realtime";


ALTER SCHEMA "_realtime" OWNER TO "postgres";

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "extensions";


ALTER SCHEMA "extensions" OWNER TO "postgres";

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "graphql";


ALTER SCHEMA "graphql" OWNER TO "supabase_admin";

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "graphql_public";


ALTER SCHEMA "graphql_public" OWNER TO "supabase_admin";

--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_net"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA "pgbouncer";


ALTER SCHEMA "pgbouncer" OWNER TO "pgbouncer";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "realtime";


ALTER SCHEMA "realtime" OWNER TO "supabase_admin";

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";

--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "supabase_functions";


ALTER SCHEMA "supabase_functions" OWNER TO "supabase_admin";

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "supabase_migrations";


ALTER SCHEMA "supabase_migrations" OWNER TO "postgres";

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "vault";


ALTER SCHEMA "vault" OWNER TO "supabase_admin";

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgjwt"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pgjwt" IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."oauth_authorization_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE "auth"."oauth_authorization_status" OWNER TO "supabase_auth_admin";

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."oauth_client_type" AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE "auth"."oauth_client_type" OWNER TO "supabase_auth_admin";

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."oauth_registration_type" AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE "auth"."oauth_registration_type" OWNER TO "supabase_auth_admin";

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."oauth_response_type" AS ENUM (
    'code'
);


ALTER TYPE "auth"."oauth_response_type" OWNER TO "supabase_auth_admin";

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE "realtime"."action" OWNER TO "supabase_admin";

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."equality_op" AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE "realtime"."equality_op" OWNER TO "supabase_admin";

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."user_defined_filter" AS (
	"column_name" "text",
	"op" "realtime"."equality_op",
	"value" "text"
);


ALTER TYPE "realtime"."user_defined_filter" OWNER TO "supabase_admin";

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."wal_column" AS (
	"name" "text",
	"type_name" "text",
	"type_oid" "oid",
	"value" "jsonb",
	"is_pkey" boolean,
	"is_selectable" boolean
);


ALTER TYPE "realtime"."wal_column" OWNER TO "supabase_admin";

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."wal_rls" AS (
	"wal" "jsonb",
	"is_rls_enabled" boolean,
	"subscription_ids" "uuid"[],
	"errors" "text"[]
);


ALTER TYPE "realtime"."wal_rls" OWNER TO "supabase_admin";

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "email"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "role"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "uid"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."grant_pg_cron_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION "extensions"."grant_pg_cron_access"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "grant_pg_cron_access"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."grant_pg_cron_access"() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."grant_pg_graphql_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION "extensions"."grant_pg_graphql_access"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "grant_pg_graphql_access"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."grant_pg_graphql_access"() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."grant_pg_net_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


ALTER FUNCTION "extensions"."grant_pg_net_access"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "grant_pg_net_access"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."grant_pg_net_access"() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."pgrst_ddl_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION "extensions"."pgrst_ddl_watch"() OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."pgrst_drop_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION "extensions"."pgrst_drop_watch"() OWNER TO "supabase_admin";

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."set_graphql_placeholder"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION "extensions"."set_graphql_placeholder"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "set_graphql_placeholder"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."set_graphql_placeholder"() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth("text"); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION "pgbouncer"."get_auth"("p_usename" "text") RETURNS TABLE("username" "text", "password" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION "pgbouncer"."get_auth"("p_usename" "text") OWNER TO "supabase_admin";

--
-- Name: apply_rls("jsonb", integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer DEFAULT (1024 * 1024)) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "plpgsql"
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) OWNER TO "supabase_admin";

--
-- Name: broadcast_changes("text", "text", "text", "text", "text", "record", "record", "text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text" DEFAULT 'ROW'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") OWNER TO "supabase_admin";

--
-- Name: build_prepared_statement_sql("text", "regclass", "realtime"."wal_column"[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) RETURNS "text"
    LANGUAGE "sql"
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) OWNER TO "supabase_admin";

--
-- Name: cast("text", "regtype"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") OWNER TO "supabase_admin";

--
-- Name: check_equality_op("realtime"."equality_op", "regtype", "text", "text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") OWNER TO "supabase_admin";

--
-- Name: is_visible_through_filters("realtime"."wal_column"[], "realtime"."user_defined_filter"[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) OWNER TO "supabase_admin";

--
-- Name: list_changes("name", "name", integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "sql"
    SET "log_min_messages" TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) OWNER TO "supabase_admin";

--
-- Name: quote_wal2json("regclass"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."quote_wal2json"("entity" "regclass") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION "realtime"."quote_wal2json"("entity" "regclass") OWNER TO "supabase_admin";

--
-- Name: send("jsonb", "text", "text", boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) OWNER TO "supabase_admin";

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."subscription_check_filters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION "realtime"."subscription_check_filters"() OWNER TO "supabase_admin";

--
-- Name: to_regrole("text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."to_regrole"("role_name" "text") RETURNS "regrole"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION "realtime"."to_regrole"("role_name" "text") OWNER TO "supabase_admin";

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION "realtime"."topic"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION "realtime"."topic"() OWNER TO "supabase_realtime_admin";

--
-- Name: can_insert_object("text", "text", "uuid", "jsonb"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";

--
-- Name: extension("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: filename("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: foldername("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: get_common_prefix("text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") OWNER TO "supabase_storage_admin";

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";

--
-- Name: list_multipart_uploads_with_delimiter("text", "text", "text", integer, "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";

--
-- Name: list_objects_with_delimiter("text", "text", "text", integer, "text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text", "sort_order" "text") OWNER TO "supabase_storage_admin";

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."protect_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."protect_delete"() OWNER TO "supabase_storage_admin";

--
-- Name: search("text", "text", integer, integer, integer, "text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";

--
-- Name: search_by_timestamp("text", "text", integer, integer, "text", "text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") OWNER TO "supabase_storage_admin";

--
-- Name: search_v2("text", "text", integer, integer, "text", "text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";

--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE FUNCTION "supabase_functions"."http_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


ALTER FUNCTION "supabase_functions"."http_request"() OWNER TO "supabase_functions_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE "_realtime"."extensions" (
    "id" "uuid" NOT NULL,
    "type" "text",
    "settings" "jsonb",
    "tenant_external_id" "text",
    "inserted_at" timestamp(0) without time zone NOT NULL,
    "updated_at" timestamp(0) without time zone NOT NULL
);


ALTER TABLE "_realtime"."extensions" OWNER TO "supabase_admin";

--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE "_realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);


ALTER TABLE "_realtime"."schema_migrations" OWNER TO "supabase_admin";

--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE "_realtime"."tenants" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "external_id" "text",
    "jwt_secret" "text",
    "max_concurrent_users" integer DEFAULT 200 NOT NULL,
    "inserted_at" timestamp(0) without time zone NOT NULL,
    "updated_at" timestamp(0) without time zone NOT NULL,
    "max_events_per_second" integer DEFAULT 100 NOT NULL,
    "postgres_cdc_default" "text" DEFAULT 'postgres_cdc_rls'::"text",
    "max_bytes_per_second" integer DEFAULT 100000 NOT NULL,
    "max_channels_per_client" integer DEFAULT 100 NOT NULL,
    "max_joins_per_second" integer DEFAULT 500 NOT NULL,
    "suspend" boolean DEFAULT false,
    "jwt_jwks" "jsonb",
    "notify_private_alpha" boolean DEFAULT false,
    "private_only" boolean DEFAULT false NOT NULL,
    "migrations_ran" integer DEFAULT 0,
    "broadcast_adapter" character varying(255) DEFAULT 'gen_rpc'::character varying,
    "max_presence_events_per_second" integer DEFAULT 1000,
    "max_payload_size_in_kb" integer DEFAULT 3000,
    "max_client_presence_events_per_window" integer,
    "client_presence_window_ms" integer,
    CONSTRAINT "jwt_secret_or_jwt_jwks_required" CHECK ((("jwt_secret" IS NOT NULL) OR ("jwt_jwks" IS NOT NULL)))
);


ALTER TABLE "_realtime"."tenants" OWNER TO "supabase_admin";

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" "json",
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "audit_log_entries"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."custom_oauth_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_type" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "client_secret" "text" NOT NULL,
    "acceptable_client_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "pkce_enabled" boolean DEFAULT true NOT NULL,
    "attribute_mapping" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "authorization_params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "email_optional" boolean DEFAULT false NOT NULL,
    "issuer" "text",
    "discovery_url" "text",
    "skip_nonce_check" boolean DEFAULT false NOT NULL,
    "cached_discovery" "jsonb",
    "discovery_cached_at" timestamp with time zone,
    "authorization_url" "text",
    "token_url" "text",
    "userinfo_url" "text",
    "jwks_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_oauth_providers_authorization_url_https" CHECK ((("authorization_url" IS NULL) OR ("authorization_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_authorization_url_length" CHECK ((("authorization_url" IS NULL) OR ("char_length"("authorization_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_client_id_length" CHECK ((("char_length"("client_id") >= 1) AND ("char_length"("client_id") <= 512))),
    CONSTRAINT "custom_oauth_providers_discovery_url_length" CHECK ((("discovery_url" IS NULL) OR ("char_length"("discovery_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_identifier_format" CHECK (("identifier" ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::"text")),
    CONSTRAINT "custom_oauth_providers_issuer_length" CHECK ((("issuer" IS NULL) OR (("char_length"("issuer") >= 1) AND ("char_length"("issuer") <= 2048)))),
    CONSTRAINT "custom_oauth_providers_jwks_uri_https" CHECK ((("jwks_uri" IS NULL) OR ("jwks_uri" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_jwks_uri_length" CHECK ((("jwks_uri" IS NULL) OR ("char_length"("jwks_uri") <= 2048))),
    CONSTRAINT "custom_oauth_providers_name_length" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 100))),
    CONSTRAINT "custom_oauth_providers_oauth2_requires_endpoints" CHECK ((("provider_type" <> 'oauth2'::"text") OR (("authorization_url" IS NOT NULL) AND ("token_url" IS NOT NULL) AND ("userinfo_url" IS NOT NULL)))),
    CONSTRAINT "custom_oauth_providers_oidc_discovery_url_https" CHECK ((("provider_type" <> 'oidc'::"text") OR ("discovery_url" IS NULL) OR ("discovery_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_oidc_issuer_https" CHECK ((("provider_type" <> 'oidc'::"text") OR ("issuer" IS NULL) OR ("issuer" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_oidc_requires_issuer" CHECK ((("provider_type" <> 'oidc'::"text") OR ("issuer" IS NOT NULL))),
    CONSTRAINT "custom_oauth_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['oauth2'::"text", 'oidc'::"text"]))),
    CONSTRAINT "custom_oauth_providers_token_url_https" CHECK ((("token_url" IS NULL) OR ("token_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_token_url_length" CHECK ((("token_url" IS NULL) OR ("char_length"("token_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_userinfo_url_https" CHECK ((("userinfo_url" IS NULL) OR ("userinfo_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_userinfo_url_length" CHECK ((("userinfo_url" IS NULL) OR ("char_length"("userinfo_url") <= 2048)))
);


ALTER TABLE "auth"."custom_oauth_providers" OWNER TO "supabase_auth_admin";

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "code_challenge" "text",
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone,
    "invite_token" "text",
    "referrer" "text",
    "oauth_client_state_id" "uuid",
    "linking_target_id" "uuid",
    "email_optional" boolean DEFAULT false NOT NULL
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "flow_state"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."flow_state" IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "identities"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN "identities"."email"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "instances"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_amr_claims"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_challenges"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid",
    "last_webauthn_challenge_data" "jsonb"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_factors"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';


--
-- Name: COLUMN "mfa_factors"."last_webauthn_challenge_data"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."mfa_factors"."last_webauthn_challenge_data" IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."oauth_authorizations" (
    "id" "uuid" NOT NULL,
    "authorization_id" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "redirect_uri" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "state" "text",
    "resource" "text",
    "code_challenge" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "response_type" "auth"."oauth_response_type" DEFAULT 'code'::"auth"."oauth_response_type" NOT NULL,
    "status" "auth"."oauth_authorization_status" DEFAULT 'pending'::"auth"."oauth_authorization_status" NOT NULL,
    "authorization_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval) NOT NULL,
    "approved_at" timestamp with time zone,
    "nonce" "text",
    CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (("char_length"("authorization_code") <= 255)),
    CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (("char_length"("code_challenge") <= 128)),
    CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "oauth_authorizations_nonce_length" CHECK (("char_length"("nonce") <= 255)),
    CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (("char_length"("redirect_uri") <= 2048)),
    CONSTRAINT "oauth_authorizations_resource_length" CHECK (("char_length"("resource") <= 2048)),
    CONSTRAINT "oauth_authorizations_scope_length" CHECK (("char_length"("scope") <= 4096)),
    CONSTRAINT "oauth_authorizations_state_length" CHECK (("char_length"("state") <= 4096))
);


ALTER TABLE "auth"."oauth_authorizations" OWNER TO "supabase_auth_admin";

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."oauth_client_states" (
    "id" "uuid" NOT NULL,
    "provider_type" "text" NOT NULL,
    "code_verifier" "text",
    "created_at" timestamp with time zone NOT NULL
);


ALTER TABLE "auth"."oauth_client_states" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "oauth_client_states"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."oauth_client_states" IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."oauth_clients" (
    "id" "uuid" NOT NULL,
    "client_secret_hash" "text",
    "registration_type" "auth"."oauth_registration_type" NOT NULL,
    "redirect_uris" "text" NOT NULL,
    "grant_types" "text" NOT NULL,
    "client_name" "text",
    "client_uri" "text",
    "logo_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "client_type" "auth"."oauth_client_type" DEFAULT 'confidential'::"auth"."oauth_client_type" NOT NULL,
    "token_endpoint_auth_method" "text" NOT NULL,
    CONSTRAINT "oauth_clients_client_name_length" CHECK (("char_length"("client_name") <= 1024)),
    CONSTRAINT "oauth_clients_client_uri_length" CHECK (("char_length"("client_uri") <= 2048)),
    CONSTRAINT "oauth_clients_logo_uri_length" CHECK (("char_length"("logo_uri") <= 2048)),
    CONSTRAINT "oauth_clients_token_endpoint_auth_method_check" CHECK (("token_endpoint_auth_method" = ANY (ARRAY['client_secret_basic'::"text", 'client_secret_post'::"text", 'none'::"text"])))
);


ALTER TABLE "auth"."oauth_clients" OWNER TO "supabase_auth_admin";

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."oauth_consents" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "scopes" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "oauth_consents_scopes_length" CHECK (("char_length"("scopes") <= 2048)),
    CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "scopes")) > 0))
);


ALTER TABLE "auth"."oauth_consents" OWNER TO "supabase_auth_admin";

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "refresh_tokens"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "saml_providers"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "saml_relay_states"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "schema_migrations"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text",
    "oauth_client_id" "uuid",
    "refresh_token_hmac_key" "text",
    "refresh_token_counter" bigint,
    "scopes" "text",
    CONSTRAINT "sessions_scopes_length" CHECK (("char_length"("scopes") <= 4096))
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sessions"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN "sessions"."not_after"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN "sessions"."refresh_token_hmac_key"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sessions"."refresh_token_hmac_key" IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN "sessions"."refresh_token_counter"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sessions"."refresh_token_counter" IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sso_domains"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "disabled" boolean,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sso_providers"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN "sso_providers"."resource_id"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255) DEFAULT ''::character varying,
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255) DEFAULT ''::character varying,
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255) DEFAULT ''::character varying,
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "users"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN "users"."is_sso_user"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."automation_rules" (
    "id" integer,
    "rule_name" "text",
    "description" "text",
    "is_active" boolean,
    "trigger_type" "text",
    "trigger_field" "text",
    "trigger_value" "text",
    "action_type" "text",
    "action_value" "text",
    "sort_order" integer,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."automation_rules" OWNER TO "postgres";

--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."chat_rooms" (
    "id" integer,
    "name" "text",
    "type" "text",
    "role_target" "text",
    "participant_ids" "text"[],
    "created_at" timestamp with time zone,
    "allowed_roles" "text"[],
    "description" "text",
    "sort_order" integer,
    "read_only_roles" "text"[]
);


ALTER TABLE "public"."chat_rooms" OWNER TO "postgres";

--
-- Name: debug_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."debug_logs" (
    "id" integer,
    "device_id" "text",
    "device_name" "text",
    "level" "text",
    "tag" "text",
    "message" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."debug_logs" OWNER TO "postgres";

--
-- Name: device_nicknames; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."device_nicknames" (
    "device_id" "text",
    "nickname" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."device_nicknames" OWNER TO "postgres";

--
-- Name: dock_lock_status_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."dock_lock_status_values" (
    "id" integer,
    "status_name" "text",
    "status_color" "text",
    "sort_order" integer,
    "is_active" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."dock_lock_status_values" OWNER TO "postgres";

--
-- Name: door_status_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."door_status_values" (
    "id" integer,
    "status_name" "text",
    "status_color" "text",
    "sort_order" integer,
    "is_active" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."door_status_values" OWNER TO "postgres";

--
-- Name: global_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."global_messages" (
    "id" integer,
    "message" "text",
    "message_type" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "visible_roles" "text"[],
    "dismissed_by" "text"[],
    "is_active" boolean
);


ALTER TABLE "public"."global_messages" OWNER TO "postgres";

--
-- Name: live_movement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."live_movement" (
    "id" integer,
    "truck_number" "text",
    "current_location" timestamp with time zone,
    "status_id" integer,
    "in_front_of" "text",
    "notes" "text",
    "loading_door_id" "uuid",
    "last_updated" timestamp with time zone
);


ALTER TABLE "public"."live_movement" OWNER TO "postgres";

--
-- Name: loading_doors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."loading_doors" (
    "id" integer,
    "door_name" "text",
    "door_status" "text",
    "is_done_for_night" boolean,
    "sort_order" integer,
    "dock_lock_status" timestamp with time zone
);


ALTER TABLE "public"."loading_doors" OWNER TO "postgres";

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."messages" (
    "id" integer,
    "room_id" integer,
    "sender_id" "uuid",
    "content" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."messages" OWNER TO "postgres";

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."notification_preferences" (
    "id" integer,
    "user_id" "uuid",
    "notify_truck_status" boolean,
    "notify_door_status" boolean,
    "notify_chat_mention" boolean,
    "notify_preshift" boolean,
    "notify_system" boolean,
    "channel_app" boolean,
    "channel_sms" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."notifications" (
    "id" integer,
    "user_id" "uuid",
    "truck_number" "text",
    "message" "text",
    "type" "text",
    "is_read" boolean,
    "sent_sms" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";

--
-- Name: printroom_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."printroom_entries" (
    "id" integer,
    "loading_door_id" integer,
    "batch_number" integer,
    "row_order" integer,
    "route_info" "text",
    "truck_number" "text",
    "pods" integer,
    "pallets_trays" "text",
    "notes" "text",
    "is_end_marker" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."printroom_entries" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."profiles" (
    "id" "uuid",
    "username" "text",
    "display_name" "text",
    "role" "text",
    "phone" "text",
    "carrier" "text",
    "sms_enabled" boolean,
    "avatar_color" "text",
    "avatar_url" timestamp with time zone,
    "notify_email" boolean,
    "notify_email_address" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: reset_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."reset_log" (
    "id" integer,
    "reset_type" "text",
    "reset_by" "text",
    "reset_at" timestamp with time zone
);


ALTER TABLE "public"."reset_log" OWNER TO "postgres";

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."role_permissions" (
    "id" integer,
    "role_name" "text",
    "display_name" "text",
    "color" "text",
    "pages" "text"[],
    "features" "text"[],
    "is_system" boolean,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";

--
-- Name: route_imports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."route_imports" (
    "id" integer,
    "status" "text",
    "sent_at" timestamp with time zone,
    "received_at" timestamp with time zone,
    "csv_data" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."route_imports" OWNER TO "postgres";

--
-- Name: staging_doors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."staging_doors" (
    "id" integer,
    "door_label" "text",
    "door_number" integer,
    "door_side" "text",
    "in_front" "text",
    "in_back" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."staging_doors" OWNER TO "postgres";

--
-- Name: status_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."status_values" (
    "id" integer,
    "status_name" "text",
    "status_color" "text",
    "sort_order" integer,
    "is_active" boolean
);


ALTER TABLE "public"."status_values" OWNER TO "postgres";

--
-- Name: tractors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."tractors" (
    "id" integer,
    "truck_number" "text",
    "driver_name" "text",
    "driver_cell" "text",
    "trailer_1_id" "uuid",
    "trailer_2_id" "uuid",
    "trailer_3_id" "uuid",
    "trailer_4_id" "uuid",
    "notes" "text",
    "is_active" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."tractors" OWNER TO "postgres";

--
-- Name: trailer_list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."trailer_list" (
    "id" integer,
    "trailer_number" "text",
    "notes" "text",
    "is_active" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."trailer_list" OWNER TO "postgres";

--
-- Name: trucks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."trucks" (
    "id" integer,
    "truck_number" "text",
    "truck_type" "text",
    "transmission" "text",
    "is_active" boolean,
    "notes" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."trucks" OWNER TO "postgres";

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE "realtime"."messages" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
)
PARTITION BY RANGE ("inserted_at");


ALTER TABLE "realtime"."messages" OWNER TO "supabase_realtime_admin";

--
-- Name: messages_2026_03_01; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2026_03_01" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2026_03_01" OWNER TO "supabase_admin";

--
-- Name: messages_2026_03_02; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2026_03_02" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2026_03_02" OWNER TO "supabase_admin";

--
-- Name: messages_2026_03_03; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2026_03_03" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2026_03_03" OWNER TO "supabase_admin";

--
-- Name: messages_2026_03_04; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2026_03_04" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2026_03_04" OWNER TO "supabase_admin";

--
-- Name: messages_2026_03_05; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2026_03_05" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2026_03_05" OWNER TO "supabase_admin";

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);


ALTER TABLE "realtime"."schema_migrations" OWNER TO "supabase_admin";

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."subscription" (
    "id" bigint NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "entity" "regclass" NOT NULL,
    "filters" "realtime"."user_defined_filter"[] DEFAULT '{}'::"realtime"."user_defined_filter"[] NOT NULL,
    "claims" "jsonb" NOT NULL,
    "claims_role" "regrole" GENERATED ALWAYS AS ("realtime"."to_regrole"(("claims" ->> 'role'::"text"))) STORED NOT NULL,
    "created_at" timestamp without time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "action_filter" "text" DEFAULT '*'::"text",
    CONSTRAINT "subscription_action_filter_check" CHECK (("action_filter" = ANY (ARRAY['*'::"text", 'INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "realtime"."subscription" OWNER TO "supabase_admin";

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE "realtime"."subscription" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "realtime"."subscription_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";

--
-- Name: COLUMN "buckets"."owner"; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";

--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."iceberg_namespaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_name" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "catalog_id" "uuid" NOT NULL
);


ALTER TABLE "storage"."iceberg_namespaces" OWNER TO "supabase_storage_admin";

--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."iceberg_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "namespace_id" "uuid" NOT NULL,
    "bucket_name" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "location" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remote_table_id" "text",
    "shard_key" "text",
    "shard_id" "text",
    "catalog_id" "uuid" NOT NULL
);


ALTER TABLE "storage"."iceberg_tables" OWNER TO "supabase_storage_admin";

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";

--
-- Name: COLUMN "objects"."owner"; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";

--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE TABLE "supabase_functions"."hooks" (
    "id" bigint NOT NULL,
    "hook_table_id" integer NOT NULL,
    "hook_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "request_id" bigint
);


ALTER TABLE "supabase_functions"."hooks" OWNER TO "supabase_functions_admin";

--
-- Name: TABLE "hooks"; Type: COMMENT; Schema: supabase_functions; Owner: supabase_functions_admin
--

COMMENT ON TABLE "supabase_functions"."hooks" IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE SEQUENCE "supabase_functions"."hooks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "supabase_functions"."hooks_id_seq" OWNER TO "supabase_functions_admin";

--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER SEQUENCE "supabase_functions"."hooks_id_seq" OWNED BY "supabase_functions"."hooks"."id";


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE TABLE "supabase_functions"."migrations" (
    "version" "text" NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "supabase_functions"."migrations" OWNER TO "supabase_functions_admin";

--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE "supabase_migrations"."seed_files" (
    "path" "text" NOT NULL,
    "hash" "text" NOT NULL
);


ALTER TABLE "supabase_migrations"."seed_files" OWNER TO "postgres";

--
-- Name: messages_2026_03_01; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2026_03_01" FOR VALUES FROM ('2026-03-01 00:00:00') TO ('2026-03-02 00:00:00');


--
-- Name: messages_2026_03_02; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2026_03_02" FOR VALUES FROM ('2026-03-02 00:00:00') TO ('2026-03-03 00:00:00');


--
-- Name: messages_2026_03_03; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2026_03_03" FOR VALUES FROM ('2026-03-03 00:00:00') TO ('2026-03-04 00:00:00');


--
-- Name: messages_2026_03_04; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2026_03_04" FOR VALUES FROM ('2026-03-04 00:00:00') TO ('2026-03-05 00:00:00');


--
-- Name: messages_2026_03_05; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2026_03_05" FOR VALUES FROM ('2026-03-05 00:00:00') TO ('2026-03-06 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY "supabase_functions"."hooks" ALTER COLUMN "id" SET DEFAULT "nextval"('"supabase_functions"."hooks_id_seq"'::"regclass");


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY "_realtime"."extensions" ("id", "type", "settings", "tenant_external_id", "inserted_at", "updated_at") FROM stdin;
8c1f7906-e83a-4627-8193-8c5fefb5443a	postgres_cdc_rls	{"region": "us-east-1", "db_host": "+5JkR7EPoJsAtjz+cdk/ZP3k+YJlmbU8Xs7zXvw6pQ4=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2026-03-02 04:26:55	2026-03-02 04:26:55
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY "_realtime"."schema_migrations" ("version", "inserted_at") FROM stdin;
20210706140551	2026-03-02 03:36:43
20220329161857	2026-03-02 03:36:43
20220410212326	2026-03-02 03:36:43
20220506102948	2026-03-02 03:36:43
20220527210857	2026-03-02 03:36:43
20220815211129	2026-03-02 03:36:43
20220815215024	2026-03-02 03:36:43
20220818141501	2026-03-02 03:36:43
20221018173709	2026-03-02 03:36:43
20221102172703	2026-03-02 03:36:43
20221223010058	2026-03-02 03:36:43
20230110180046	2026-03-02 03:36:43
20230810220907	2026-03-02 03:36:43
20230810220924	2026-03-02 03:36:43
20231024094642	2026-03-02 03:36:43
20240306114423	2026-03-02 03:36:43
20240418082835	2026-03-02 03:36:43
20240625211759	2026-03-02 03:36:43
20240704172020	2026-03-02 03:36:43
20240902173232	2026-03-02 03:36:44
20241106103258	2026-03-02 03:36:44
20250424203323	2026-03-02 03:36:44
20250613072131	2026-03-02 03:36:44
20250711044927	2026-03-02 03:36:44
20250811121559	2026-03-02 03:36:44
20250926223044	2026-03-02 03:36:44
20251204170944	2026-03-02 03:36:44
20251218000543	2026-03-02 03:36:44
20260209232800	2026-03-02 03:36:44
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY "_realtime"."tenants" ("id", "name", "external_id", "jwt_secret", "max_concurrent_users", "inserted_at", "updated_at", "max_events_per_second", "postgres_cdc_default", "max_bytes_per_second", "max_channels_per_client", "max_joins_per_second", "suspend", "jwt_jwks", "notify_private_alpha", "private_only", "migrations_ran", "broadcast_adapter", "max_presence_events_per_second", "max_payload_size_in_kb", "max_client_presence_events_per_window", "client_presence_window_ms") FROM stdin;
06badaca-1e3b-4b6a-bf3a-61f4c77128bb	realtime-dev	realtime-dev	bUwnRN8veSeevcXoAK7pkA6sIwO3eFj83khZ583wU+Bfok4oTtj2rGpU1JVGcbnT	200	2026-03-02 04:26:55	2026-03-02 04:26:55	100	postgres_cdc_rls	100000	100	100	f	{"keys": [{"x": "M5Sjqn5zwC9Kl1zVfUUGvv9boQjCGd45G8sdopBExB4", "y": "P6IXMvA2WYXSHSOMTBH2jsw_9rrzGy89FjPf6oOsIxQ", "alg": "ES256", "crv": "P-256", "ext": true, "kid": "b81269f1-21d8-4f2e-b719-c2240a840d90", "kty": "EC", "use": "sig", "key_ops": ["verify"]}, {"k": "eW91cl9wcml2YXRlX3NlY3JldF9hdF9sZWFzdF8zMl9jaGFyYWN0ZXJzX2xvbmc", "kty": "oct"}]}	f	f	68	gen_rpc	1000	3000	\N	\N
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
rfa1991@gmail.com	464a2a27-2fcd-48ae-826a-594ac1062231	{"sub": "464a2a27-2fcd-48ae-826a-594ac1062231", "email": "rfa1991@gmail.com"}	email	2026-03-02 04:23:25.964962+00	2026-03-02 04:23:25.964962+00	2026-03-02 04:23:25.964962+00	f7ee37c9-1006-4f06-9667-8464f398c529
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."schema_migrations" ("version") FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	464a2a27-2fcd-48ae-826a-594ac1062231	authenticated	authenticated	rfa1991@gmail.com	$2a$06$3SdW8eq0Txn0Aa7LYTyTweh3BQfgbv3R91.63lyW4w2RmrM2.XkS6	2026-03-02 14:23:54.909221+00	\N		\N		\N		\N	\N	\N	\N	\N	t	2026-03-02 04:23:25.964962+00	2026-03-02 04:23:25.964962+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d5d004f9-5d2a-4e83-96b4-a9e578fcc331	authenticated	authenticated	admin@local	$2a$06$.n11vVWI4Zc30tUsAn1lk.yQEtN5F0B.yivagBh3slKS89ZY.tt0u	2026-03-02 14:26:40.77118+00	\N		\N		2026-03-02 14:26:40.77118+00		\N	\N	2026-03-02 14:26:40.77118+00	{"provider": "email", "providers": ["email"]}	{}	\N	2026-03-02 14:26:40.77118+00	2026-03-02 14:26:40.77118+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."automation_rules" ("id", "rule_name", "description", "is_active", "trigger_type", "trigger_field", "trigger_value", "action_type", "action_value", "sort_order", "created_at") FROM stdin;
1	Last END → Done for Night	When the last truck in a door has status END, set door to Done for Night	t	is_last_truck_with_status	\N	END	set_door_status	Done for Night	10	2026-02-18 11:07:10.063118+00
2	GAP → Gap Status	When truck number is "gap", set its status to Gap	t	truck_number_equals	\N	gap	set_truck_status	Gap	20	2026-02-18 11:07:10.063118+00
3	CPU → Ignore	When truck number is "cpu", set its status to Ignore	t	truck_number_equals	\N	cpu	set_truck_status	Ignore	30	2026-02-18 11:07:10.063118+00
4	999 → Ignore	When truck number is "999", set its status to Ignore	t	truck_number_equals	\N	999	set_truck_status	Ignore	40	2026-02-18 11:07:10.063118+00
9	PreShift In Front → Ready	Truck in front position on preshift gets Ready status	t	preshift_in_front	\N	\N	set_truck_status	Ready	50	2026-02-18 11:22:51.851162+00
10	PreShift In Back → In Back	Truck in back position on preshift gets In Back status	t	preshift_in_back	\N	\N	set_truck_status	In Back	60	2026-02-18 11:22:51.851162+00
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."chat_rooms" ("id", "name", "type", "role_target", "participant_ids", "created_at", "allowed_roles", "description", "sort_order", "read_only_roles") FROM stdin;
1	🌐 Global	global	\N	\N	2026-02-21 21:32:55.439993+00	\N	\N	0	\N
2	🖨️ Print Room	role	print_room	\N	2026-02-21 21:32:55.439993+00	{print_room,truck_mover,trainee,supervisor}	\N	3	\N
3	🚚 Truck Movers	role	truck_mover	\N	2026-02-21 21:32:55.439993+00	{print_room,truck_mover,trainee,supervisor}	\N	4	\N
4	🚛 Drivers	role	driver	\N	2026-02-21 21:32:55.439993+00	\N	\N	5	\N
7	💼 Supervisor	global	\N	\N	2026-02-27 13:00:02.752385+00	{print_room,supervisor,trainee,truck_mover}	\N	2	\N
8	📜 Notes	global	\N	\N	2026-02-27 13:00:49.554585+00	\N	Shift Notes	1	{driver}
9	📢 Change Logs	global	\N	\N	2026-02-27 13:02:14.897082+00	\N	website or app changes	6	{driver,print_room,supervisor,trainee,truck_mover}
\.


--
-- Data for Name: debug_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."debug_logs" ("id", "device_id", "device_name", "level", "tag", "message", "created_at") FROM stdin;
322161	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:20.018884+00
322162	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:20.331417+00
322163	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:20.398052+00
322164	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:20.414488+00
322165	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:20.46612+00
322166	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:20.73976+00
322167	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:20.842736+00
322168	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:21.110872+00
322169	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:21.229542+00
322170	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:21.521263+00
322171	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:21.619967+00
322172	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:21.620933+00
322173	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:21.66814+00
322174	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:21.723659+00
322175	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:21.783873+00
322176	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:22.312728+00
322177	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:22.386637+00
322178	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:22.589862+00
322179	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:22.642399+00
322180	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:22.648199+00
322181	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:22.679595+00
322182	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:22.752426+00
322183	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:22.764066+00
322184	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:23.469278+00
322185	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:23.536542+00
322186	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:23.547405+00
322187	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:23.56888+00
322188	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:23.635901+00
322189	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:23.642175+00
322190	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:23.85596+00
322191	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:23.955245+00
322192	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:24.637503+00
322193	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:24.642438+00
322194	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:24.711698+00
322195	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:24.72775+00
322196	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:24.743732+00
322197	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:24.880885+00
322198	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:25.022022+00
322199	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:25.073926+00
322200	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:25.477613+00
322201	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:25.542924+00
322202	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:25.755143+00
322203	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:25.823141+00
322204	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:25.82374+00
322205	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:25.949782+00
322206	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:26.145326+00
322207	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:26.212571+00
322208	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:26.440889+00
322209	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:26.495941+00
322210	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:26.579585+00
322211	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:26.640795+00
322212	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:27.087001+00
322213	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:27.167338+00
322214	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:27.330371+00
322215	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:27.459739+00
322216	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:27.493536+00
322217	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:27.561218+00
322218	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:27.703626+00
322219	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:27.812246+00
322220	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:28.241144+00
322221	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:28.386897+00
322222	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:28.428201+00
322223	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:28.529066+00
322224	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:28.631855+00
322225	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:28.707604+00
322226	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:28.736144+00
322227	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:28.825477+00
322228	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:29.442115+00
322229	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:29.513811+00
322230	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:29.553025+00
322231	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:29.585435+00
322232	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:29.620721+00
322233	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:29.64956+00
322234	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:29.656205+00
322235	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:29.760991+00
322236	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:30.615359+00
322237	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:30.655629+00
322238	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:30.687004+00
322239	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:30.699469+00
322240	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:30.715601+00
322241	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:30.725861+00
322242	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:30.773364+00
322243	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:30.818322+00
322244	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:31.579068+00
322245	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:31.62559+00
322246	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:31.679212+00
322247	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:31.704886+00
322248	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:31.778297+00
322249	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:31.840848+00
322250	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:31.862328+00
322251	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:31.94312+00
322252	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:32.529387+00
322253	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:32.57161+00
322254	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:32.611694+00
322255	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:32.673284+00
322256	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:32.959922+00
322257	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:33.035982+00
322258	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:33.04153+00
322259	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:33.103555+00
322260	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:33.653763+00
322261	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:33.749808+00
322262	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:33.752898+00
322263	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:33.865264+00
322264	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:34.126768+00
322265	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:34.165828+00
322266	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:34.203837+00
322267	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:34.222619+00
322268	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:34.575781+00
322269	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:34.667342+00
322270	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:34.678579+00
322271	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:34.754055+00
322272	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:35.343815+00
322273	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:35.348731+00
322274	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:35.444575+00
322275	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:35.468173+00
322276	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:35.621741+00
322277	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:35.702163+00
322278	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:35.720679+00
322279	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:35.801305+00
322280	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:36.525422+00
322281	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:36.592698+00
322282	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:36.593064+00
322283	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:36.598254+00
322284	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:36.707057+00
322285	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:36.715655+00
322286	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:36.794047+00
322287	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:36.874002+00
322288	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:37.535015+00
322289	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:37.592483+00
322290	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:37.621053+00
322291	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:37.700502+00
322292	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:37.70039+00
322293	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:37.797584+00
322294	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:37.802666+00
322295	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:37.877715+00
322296	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:38.351669+00
322297	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:38.411237+00
322298	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:38.546834+00
322299	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:38.626072+00
322300	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:38.917411+00
322301	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:39.022556+00
322302	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:39.067476+00
322303	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:39.142082+00
322304	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:39.588333+00
322305	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:39.685254+00
322306	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:39.69375+00
322307	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:39.788935+00
322308	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:40.0933+00
322309	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:40.152599+00
322310	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:40.241571+00
322311	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:40.320083+00
322312	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:40.474113+00
322313	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:40.572497+00
322314	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:40.649506+00
322315	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:40.734001+00
322316	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:41.234439+00
322317	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:41.303209+00
322318	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:41.410181+00
322319	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:41.450126+00
322320	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:41.483961+00
322321	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:41.538085+00
322322	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:41.661004+00
322323	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:41.78313+00
322324	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:42.412612+00
322325	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:42.511754+00
322326	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:42.579496+00
322327	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:42.58459+00
322328	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:42.657316+00
322329	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:42.661756+00
322330	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:42.673596+00
322331	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:42.751622+00
322332	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:43.634913+00
322333	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:43.635136+00
322334	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:43.689672+00
322335	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:43.814808+00
322336	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:43.815239+00
322337	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:43.857975+00
322338	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:43.882527+00
322339	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:44.115213+00
322340	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:44.513754+00
322341	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:44.577078+00
322342	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:44.763621+00
322343	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:44.825673+00
322344	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:44.835418+00
322345	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:44.909657+00
322346	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:44.972063+00
322347	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:45.044696+00
322348	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:45.399276+00
322349	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:45.466657+00
322350	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:45.638434+00
322351	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:45.724905+00
322352	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:45.940005+00
322353	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:46.045612+00
322354	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:46.153368+00
322355	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:46.264039+00
322356	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:46.551022+00
322357	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:46.659448+00
322358	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:46.750345+00
322359	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:46.852395+00
322360	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:47.165757+00
322361	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:47.232704+00
322362	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:47.391393+00
322363	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:47.453636+00
322364	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:47.496622+00
322365	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:47.564541+00
322366	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:47.627348+00
322367	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:47.716752+00
322368	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:48.304318+00
322369	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:48.358908+00
322370	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:48.556515+00
322371	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:48.568913+00
322372	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:48.669044+00
322373	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:48.673702+00
322374	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:48.757185+00
322375	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:48.836734+00
322376	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:49.433666+00
322377	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:49.492895+00
322378	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:49.588057+00
322379	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:49.603163+00
322380	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:49.6748+00
322381	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:49.693643+00
322382	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:49.755624+00
322383	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:49.831483+00
322384	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:50.549729+00
322385	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:50.607651+00
322386	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:50.617672+00
322387	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:50.649005+00
322388	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:50.700688+00
322389	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:50.782595+00
322390	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:50.951186+00
322391	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:51.04973+00
322392	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:51.640732+00
322393	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:51.67054+00
322394	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:51.704619+00
322395	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:51.707698+00
322396	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:51.725336+00
322397	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:51.821188+00
322398	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:52.168498+00
322399	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:52.240881+00
322400	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:52.672885+00
322401	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:52.696905+00
322402	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:52.764267+00
322403	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:52.778927+00
322404	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:52.792624+00
322405	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:52.837461+00
322406	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:53.329265+00
322407	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:53.450577+00
322408	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:53.52309+00
322409	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:53.582006+00
322410	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:53.797575+00
322411	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:53.91065+00
322412	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:53.915462+00
322413	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:53.970656+00
322414	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:54.366997+00
322415	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:54.429+00
322416	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:54.518557+00
322417	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:54.580768+00
322418	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:54.641851+00
322419	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:54.756168+00
322420	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:55.055538+00
322421	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:55.112461+00
322422	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:55.620558+00
322423	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:55.669045+00
322424	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:55.723311+00
322425	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:55.734468+00
322426	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:55.760912+00
322427	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:55.836159+00
322428	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:56.187483+00
322429	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:56.24208+00
322430	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:56.461063+00
322431	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:56.520975+00
322432	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:56.795756+00
322433	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:56.872449+00
322434	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:56.878399+00
322435	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:56.983347+00
322436	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:57.305818+00
322437	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:57.364133+00
322438	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:57.469714+00
322439	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:57.574373+00
322440	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:57.706765+00
322441	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:57.783889+00
322442	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:57.956561+00
322443	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:58.028072+00
322444	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:58.433841+00
322445	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:58.486775+00
322446	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:58.520819+00
322447	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:58.554919+00
322448	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:58.577148+00
322449	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:58.623963+00
322450	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:59.143434+00
322451	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:59.218989+00
322452	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:59.554565+00
322453	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:59.615955+00
322454	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:59.619461+00
322455	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:59.763585+00
322456	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:47:59.796113+00
322457	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:47:59.922766+00
322458	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:00.296677+00
322459	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:00.377554+00
322460	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:00.53785+00
322461	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:00.586415+00
322462	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:00.629804+00
322463	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:00.7054+00
322464	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:00.738582+00
322465	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:00.84532+00
322466	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:01.457665+00
322467	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:01.530472+00
322468	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:01.606862+00
322469	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:01.639941+00
322470	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:01.663993+00
322471	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:01.758416+00
322472	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:01.967488+00
322473	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:02.072561+00
322474	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:02.613906+00
322475	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:02.631564+00
322476	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:02.690849+00
322477	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:02.69758+00
322478	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:02.734883+00
322479	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:02.777129+00
322480	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:03.142308+00
322481	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:03.202834+00
322482	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:03.409942+00
322483	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:03.515934+00
322484	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:03.774347+00
322485	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:03.847548+00
322486	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:03.85615+00
322487	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:04.001684+00
322488	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:04.280274+00
322489	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:04.347564+00
322490	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:04.470662+00
322491	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:04.577709+00
322492	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:04.818649+00
322493	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:04.885682+00
322494	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:04.921861+00
322495	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:04.993651+00
322496	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:05.419566+00
322497	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:05.488727+00
322498	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:05.525567+00
322499	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:05.58714+00
322500	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:05.737063+00
322501	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:05.81843+00
322502	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:06.079648+00
322503	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:06.162117+00
322504	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:06.563749+00
322505	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:06.644738+00
322506	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:06.672136+00
322507	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:06.672345+00
322508	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:06.71698+00
322509	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:06.802065+00
322510	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:07.292359+00
322511	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:07.365583+00
322512	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:07.421995+00
322513	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:07.492378+00
322514	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:07.690008+00
322515	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:07.737899+00
322516	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:07.80404+00
322517	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:07.809921+00
322518	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:08.364201+00
322519	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:08.423217+00
322520	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:08.456775+00
322521	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:08.521974+00
322522	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:08.772849+00
322523	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:08.884867+00
322524	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:08.982412+00
322525	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:09.041896+00
322526	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:09.596304+00
322527	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:09.597308+00
322528	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:09.679515+00
322529	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:09.679725+00
322530	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:09.700124+00
322531	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:09.755456+00
322532	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:10.120225+00
322533	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:10.179646+00
322534	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:10.479503+00
322535	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:10.545148+00
322536	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:10.766337+00
322537	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:10.830063+00
322538	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:10.856477+00
322539	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:10.961612+00
322540	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:11.292318+00
322541	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:11.399919+00
322542	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:11.686821+00
322543	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:11.797653+00
322544	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:11.85401+00
322545	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:11.90411+00
322546	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:11.924769+00
322547	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:11.972376+00
322548	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:12.46937+00
322549	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:12.53369+00
322550	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:12.577651+00
322551	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:12.683731+00
322552	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:12.702753+00
322553	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:12.759611+00
322554	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:13.047133+00
322555	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:13.121611+00
322556	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:13.614576+00
322557	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:13.665044+00
322558	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:13.665249+00
322559	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:13.689914+00
322560	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:13.768813+00
322561	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:13.769047+00
322562	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:14.224566+00
322563	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:14.308292+00
322564	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:14.568386+00
322565	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:14.634205+00
322566	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:14.703973+00
322567	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:14.809598+00
322568	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:14.844613+00
322569	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:14.912974+00
322570	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:15.388532+00
322571	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:15.417728+00
322572	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:15.465797+00
322573	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:15.478961+00
322574	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:15.69958+00
322575	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:15.775067+00
322576	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:16.048771+00
322577	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:16.11701+00
322578	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:16.608516+00
322579	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:16.662757+00
322580	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:16.679534+00
322581	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:16.76108+00
322582	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:16.805439+00
322583	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:16.923277+00
322584	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:17.190614+00
322585	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:17.259689+00
322586	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:17.481756+00
322587	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:17.553776+00
322588	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:17.579618+00
322589	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:17.64171+00
322590	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:17.789041+00
322591	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:17.861448+00
322592	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:18.38639+00
322593	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:18.48939+00
322594	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:18.667313+00
322595	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:18.774962+00
322596	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:18.851372+00
322597	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:18.930721+00
322598	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:18.931202+00
322599	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:19.043674+00
322600	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:19.48359+00
322601	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:19.553708+00
322602	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:19.560907+00
322603	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:19.633618+00
322604	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:19.725187+00
322605	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:19.79676+00
322606	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:20.12904+00
322607	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:20.197921+00
322608	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:20.689473+00
322609	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:20.689728+00
322610	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:20.764924+00
322611	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:20.805269+00
322612	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:20.805717+00
322613	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:20.988548+00
322614	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:21.363095+00
322615	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:21.428902+00
322616	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:21.481149+00
322617	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:21.546918+00
322618	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:21.77246+00
322619	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:21.870726+00
322620	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:21.877185+00
322621	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:21.941194+00
322622	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:22.416129+00
322623	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:22.484317+00
322624	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:22.560333+00
322625	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:22.636782+00
322626	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:22.715074+00
322627	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:22.798266+00
322628	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:23.088019+00
322629	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:23.192889+00
322630	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:23.727642+00
322631	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:23.769047+00
322632	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:23.829501+00
322633	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:23.894617+00
322634	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:23.939875+00
322635	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:23.973395+00
322636	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:24.268744+00
322637	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:24.339117+00
322638	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:24.4517+00
322639	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:24.547218+00
322640	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:24.699422+00
322641	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:24.786684+00
322642	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:24.864529+00
322643	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:24.945123+00
322644	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:25.469498+00
322645	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:25.566498+00
322646	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:25.65465+00
322647	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:25.674129+00
322648	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:25.731666+00
322649	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:25.775834+00
322650	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:26.073686+00
322651	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:26.15869+00
322652	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:26.412267+00
322653	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:26.483015+00
322654	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:26.63913+00
322655	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:26.708326+00
322656	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:26.828574+00
322657	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:26.948484+00
322658	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:27.263043+00
322659	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:27.338072+00
322660	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:27.706929+00
322661	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:27.757624+00
322662	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:27.817728+00
322663	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:27.818176+00
322664	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:27.837792+00
322665	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:27.92658+00
322666	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:28.424898+00
322667	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:28.530136+00
322668	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:28.536006+00
322669	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:28.602539+00
322670	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:28.835842+00
322671	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:28.932354+00
322672	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:29.051026+00
322673	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:29.12145+00
322674	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:29.593311+00
322675	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:29.598843+00
322676	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:29.657158+00
322677	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:29.6634+00
322678	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:29.820409+00
322679	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:29.889612+00
322680	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:30.189459+00
322681	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:30.254701+00
322682	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:30.477506+00
322683	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:30.546382+00
322684	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:30.702175+00
322685	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:30.770246+00
322686	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:30.79142+00
322687	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:30.898314+00
322688	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:31.329262+00
322689	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:31.399832+00
322690	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:31.501037+00
322691	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:31.570998+00
322692	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:31.859176+00
322693	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:31.925749+00
322694	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:31.953225+00
322695	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:32.068328+00
322696	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:32.523915+00
322697	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:32.634457+00
322698	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:32.74103+00
322699	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:32.811838+00
322700	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:32.839569+00
322701	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:32.929849+00
322702	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:33.036524+00
322703	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:33.132836+00
322704	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:33.558025+00
322705	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:33.658478+00
322706	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:33.765573+00
322707	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:33.862145+00
322708	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:33.871155+00
322709	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:33.980178+00
322710	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:34.265097+00
322711	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:34.332066+00
322712	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:34.556471+00
322713	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:34.654161+00
322714	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:34.666154+00
322715	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:34.738398+00
322716	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:34.979541+00
322717	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:35.083521+00
322718	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:35.42076+00
322719	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:35.493181+00
322720	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:35.574411+00
322721	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:35.640209+00
322722	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:35.770462+00
322723	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:35.896861+00
322724	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:36.190511+00
322725	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:36.292995+00
322726	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:36.578143+00
322727	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:36.648517+00
322728	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:36.695578+00
322729	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:36.721328+00
322730	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:36.799881+00
322731	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:36.817937+00
322732	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:37.51551+00
322733	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:37.615721+00
322734	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:37.655366+00
322735	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:37.721588+00
322736	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:37.796709+00
322737	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:37.921593+00
322738	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:37.921073+00
322739	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:38.033115+00
322740	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:38.627051+00
322741	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:38.731867+00
322742	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:38.73413+00
322743	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:38.824673+00
322744	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:38.837375+00
322745	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:38.943186+00
322746	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:38.990595+00
322747	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:39.053217+00
322748	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:39.503075+00
322749	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:39.56896+00
322750	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:39.794722+00
322751	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:39.801726+00
322752	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:39.874206+00
322753	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:39.891945+00
322754	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:40.160618+00
322755	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:40.230916+00
322756	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:40.424058+00
322757	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:40.49144+00
322758	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:40.85998+00
322759	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:40.980922+00
322760	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:41.033784+00
322761	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:41.101187+00
322762	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:41.31008+00
322763	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:41.381356+00
322764	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:41.653775+00
322765	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:41.746278+00
322766	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:41.769358+00
322767	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:41.885678+00
322768	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:42.174526+00
322769	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:42.228871+00
322770	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:42.466768+00
322771	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:42.538226+00
322772	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:42.586607+00
322773	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:42.602223+00
322774	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:42.811581+00
322775	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:42.882369+00
322776	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:43.302286+00
322777	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:43.369067+00
322778	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:43.58966+00
322779	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:43.687301+00
322780	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:43.693462+00
322781	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:43.766792+00
322782	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:43.888452+00
322783	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:43.959649+00
322784	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:44.488299+00
322785	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:44.554815+00
322786	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:44.611728+00
322787	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:44.680121+00
322788	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:44.853823+00
322789	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:44.913965+00
322790	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:44.926513+00
322791	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:45.045066+00
322792	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:45.648891+00
322793	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:45.705624+00
322794	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:45.712988+00
322795	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:45.815739+00
322796	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:45.848353+00
322797	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:45.941761+00
322798	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:46.007298+00
322799	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:46.118399+00
322800	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:46.64936+00
322801	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:46.73088+00
322802	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:46.786332+00
322803	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:46.844249+00
322804	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:46.903137+00
322805	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:47.022899+00
322806	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:47.199515+00
322807	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:47.315908+00
322808	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:47.593508+00
322809	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:47.689322+00
322810	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:47.886861+00
322811	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:47.951706+00
322812	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:47.991486+00
322813	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:48.055422+00
322814	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:48.390035+00
322815	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:48.457049+00
322816	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:48.500334+00
322817	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:48.571188+00
322818	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:48.838655+00
322819	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:48.957256+00
322820	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:49.140134+00
322821	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:49.211234+00
322822	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:49.471331+00
322823	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:49.528087+00
322824	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:49.582927+00
322825	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:49.589625+00
322826	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:49.768328+00
322827	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:49.889272+00
322828	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:50.267303+00
322829	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:50.350756+00
322830	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:50.626518+00
322831	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:50.677524+00
322832	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:50.734185+00
322833	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:50.737175+00
322834	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:50.823463+00
322835	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:50.894786+00
322836	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:51.431444+00
322837	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:51.487909+00
322838	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:51.578547+00
322839	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:51.683398+00
322840	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:51.870067+00
322841	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:51.976629+00
322842	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:51.976462+00
322843	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:52.083549+00
322844	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:52.607915+00
322845	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:52.70644+00
322846	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:52.706522+00
322847	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:52.808591+00
322848	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:52.899744+00
322849	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:52.996997+00
322850	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:53.06208+00
322851	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:53.177671+00
322852	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:53.521669+00
322853	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:53.587663+00
322854	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:53.741056+00
322855	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:53.774324+00
322856	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:53.807199+00
322857	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:53.84362+00
322858	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:54.262434+00
322859	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:54.33575+00
322860	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:54.418607+00
322861	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:54.474465+00
322862	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:54.949691+00
322863	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:54.958516+00
322864	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:55.016308+00
322865	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:55.051133+00
322866	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:55.400711+00
322867	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:55.467429+00
322868	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:55.579751+00
322869	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:55.677834+00
322870	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:55.700025+00
322871	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:55.776385+00
322872	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:56.145351+00
322873	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:56.24476+00
322874	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:56.45774+00
322875	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:56.544384+00
322876	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:56.557282+00
322877	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:56.619514+00
322878	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:56.773654+00
322879	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:56.880199+00
322880	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:57.21079+00
322881	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:57.265719+00
322882	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:57.489823+00
322883	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:57.546379+00
322884	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:57.719174+00
322885	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:57.832516+00
322886	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:57.905977+00
322887	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:58.025038+00
322888	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:58.327137+00
322889	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:58.381656+00
322890	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:58.487451+00
322891	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:58.593527+00
322892	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:58.695503+00
322893	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:58.766902+00
322894	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:58.917475+00
322895	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:58.995434+00
322896	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:59.429741+00
322897	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:59.490192+00
322898	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:48:59.502019+00
322899	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:59.609069+00
322900	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:48:59.971681+00
322901	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:00.037786+00
322902	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:00.243248+00
322903	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:00.345478+00
322904	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:00.46273+00
322905	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:00.522246+00
322906	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:00.564863+00
322907	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:00.630834+00
322908	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:00.827446+00
322909	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:00.949767+00
322910	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:01.415309+00
322911	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:01.483883+00
322912	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:01.616514+00
322913	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:01.672122+00
322914	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:01.683326+00
322915	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:01.74429+00
322916	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:01.810639+00
322917	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:01.906617+00
322918	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:02.571971+00
322919	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:02.623583+00
322920	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:02.643833+00
322921	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:02.72509+00
322922	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:02.795752+00
322923	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:02.805435+00
322924	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:02.864274+00
322925	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:02.916978+00
322926	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:03.516191+00
322927	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:03.574837+00
322928	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:03.72097+00
322929	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:03.785561+00
322930	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:03.831508+00
322931	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:03.898664+00
322932	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:03.922246+00
322933	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:03.983625+00
322934	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:04.384213+00
322935	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:04.440707+00
322936	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:04.859529+00
322937	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:04.926382+00
322938	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:04.956565+00
322939	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:05.068761+00
322940	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:05.09997+00
322941	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:05.153228+00
322942	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:05.501679+00
322943	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:05.617942+00
322944	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:05.96084+00
322945	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:05.999557+00
322946	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:06.030351+00
322947	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:06.062639+00
322948	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:06.217202+00
322949	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:06.272034+00
322950	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:06.472994+00
322951	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:06.527114+00
322952	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:06.965549+00
322953	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:07.037953+00
322954	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:07.133938+00
322955	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:07.237585+00
322956	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:07.330356+00
322957	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:07.386633+00
322958	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:07.43462+00
322959	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:07.492289+00
322960	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:07.957657+00
322961	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:08.072171+00
322962	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:08.356973+00
322963	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:08.428859+00
322964	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:08.442709+00
322965	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:08.496896+00
322966	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:08.54139+00
322967	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:08.600771+00
322968	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:08.849529+00
322969	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:08.977571+00
322970	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:09.513862+00
322971	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:09.557876+00
322972	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:09.618468+00
322973	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:09.618812+00
322974	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:09.642152+00
322975	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:09.726459+00
322976	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:09.97103+00
322977	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:10.087413+00
322978	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:10.639344+00
322979	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:10.674338+00
322980	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:10.694394+00
322981	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:10.729385+00
322982	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:10.729035+00
322983	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:10.80039+00
322984	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:10.804688+00
322985	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:10.865615+00
322986	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:11.562019+00
322987	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:11.619806+00
322988	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:11.790336+00
322989	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:11.846028+00
322990	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:11.884198+00
322991	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:11.951184+00
322992	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:11.952373+00
322993	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:12.093746+00
322994	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:12.38021+00
322995	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:12.436094+00
322996	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:12.970122+00
322997	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:12.97329+00
322998	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:13.023293+00
322999	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:13.031206+00
323000	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:13.080701+00
323001	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:13.090826+00
323002	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:13.567173+00
323003	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:13.626092+00
323004	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:13.958455+00
323005	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:14.073314+00
323006	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:14.157876+00
323007	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:14.213591+00
323008	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:14.265707+00
323009	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:14.270646+00
323010	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:14.486431+00
323011	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:14.54337+00
323012	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:14.898362+00
323013	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:15.014812+00
323014	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:15.333354+00
323015	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:15.368173+00
323016	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:15.39417+00
323017	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:15.434975+00
323018	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:15.486259+00
323019	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:15.544585+00
323020	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:15.906418+00
323021	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:16.021794+00
323022	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:16.466477+00
323023	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:16.522131+00
323024	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:16.526356+00
323025	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:16.581836+00
323026	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:16.590392+00
323027	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:16.641823+00
323028	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:16.862738+00
323029	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:16.931932+00
323030	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:17.511641+00
323031	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:17.565666+00
323032	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:17.583677+00
323033	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:17.642509+00
323034	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:17.663157+00
323035	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:17.782094+00
323036	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:17.849796+00
323037	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:17.958161+00
323038	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:18.503621+00
323039	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:18.563816+00
323040	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:18.700142+00
323041	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:18.755579+00
323042	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:18.853564+00
323043	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:18.918167+00
323044	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:18.919485+00
323045	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:19.087854+00
323046	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:19.587971+00
323047	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:19.691871+00
323048	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:19.829137+00
323049	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:19.933868+00
323050	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:19.952527+00
323051	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:20.014274+00
323052	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:20.016176+00
323053	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:20.077578+00
323054	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:20.587173+00
323055	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:20.689551+00
323056	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:21.006239+00
323057	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:21.053962+00
323058	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:21.095358+00
323059	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:21.113656+00
323060	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:21.221522+00
323061	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:21.338575+00
323062	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:21.67327+00
323063	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:21.778757+00
323064	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:21.896354+00
323065	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:22.023645+00
323066	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:22.171358+00
323067	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:22.230436+00
323068	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:22.43206+00
323069	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:22.493165+00
323070	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:22.542758+00
323071	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:22.60067+00
323072	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:22.883758+00
323073	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:22.952495+00
323074	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:23.28775+00
323075	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:23.345434+00
323076	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:23.494064+00
323077	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:23.566688+00
323078	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:23.6013+00
323079	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:23.626527+00
323080	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:23.891274+00
323081	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:24.012892+00
323082	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:24.4136+00
323083	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:24.473987+00
323084	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:24.482176+00
323085	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:24.587322+00
323086	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:24.717163+00
323087	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:24.781915+00
323088	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:24.930182+00
323089	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:25.046488+00
323090	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:25.577559+00
323091	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:25.636601+00
323092	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:25.636795+00
323093	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:25.776671+00
323094	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:25.866119+00
323095	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:25.939581+00
323096	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:25.968365+00
323097	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:26.078069+00
323098	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:26.518787+00
323099	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:26.57433+00
323100	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:26.698438+00
323101	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:26.754639+00
323102	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:26.987815+00
323103	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:27.028488+00
323104	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:27.053941+00
323105	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:27.102965+00
323106	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:27.445506+00
323107	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:27.5005+00
323108	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:27.817791+00
323109	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:27.87506+00
323110	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:28.000607+00
323111	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:28.119929+00
323112	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:28.17723+00
323113	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:28.254207+00
323114	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:28.38542+00
323115	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:28.444627+00
323116	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:28.813345+00
323117	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:28.879706+00
323118	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:29.060156+00
323119	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:29.122008+00
323120	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:29.397743+00
323121	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:29.473339+00
323122	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:29.59159+00
323123	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:29.698059+00
323124	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:29.870465+00
323125	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:29.966453+00
323126	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:30.180249+00
323127	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:30.246256+00
323128	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:30.519456+00
323129	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:30.565982+00
323130	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:30.585185+00
323131	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:30.639286+00
323132	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:30.838921+00
323133	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:30.953441+00
323134	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:31.419747+00
323135	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:31.521739+00
323136	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:31.682333+00
323137	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:31.741891+00
323138	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:31.791553+00
323139	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:31.86053+00
323140	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:31.976177+00
323141	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:32.092708+00
323142	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:32.540931+00
323143	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:32.600075+00
323144	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:32.63143+00
323145	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:32.766751+00
323146	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:32.943918+00
323147	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:32.943731+00
323148	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:33.063803+00
323149	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:33.063973+00
323150	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:33.491542+00
323151	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:33.554011+00
323152	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:33.704297+00
323153	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:33.810682+00
323154	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:33.926323+00
323155	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:34.052733+00
323156	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:34.169347+00
323157	7d27d5d229bfc953	samsung SM-S911U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:34.263873+00
323158	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:34.689102+00
323159	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLoadingDoors OK — 6 doors	2026-03-01 17:49:34.78982+00
323160	54b7bb76efa5ef84	samsung SM-S938U	DEBUG	BadgerRepo	getLiveMovement OK — 33 trucks	2026-03-01 17:49:34.869783+00
\.


--
-- Data for Name: device_nicknames; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."device_nicknames" ("device_id", "nickname", "created_at", "updated_at") FROM stdin;
54b7bb76efa5ef84	Rob Personal	2026-03-01 17:46:24.17451+00	2026-03-01 17:46:22.283+00
7d27d5d229bfc953	Rob Work	2026-03-01 17:46:35.555532+00	2026-03-01 17:46:33.666+00
\.


--
-- Data for Name: dock_lock_status_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dock_lock_status_values" ("id", "status_name", "status_color", "sort_order", "is_active", "created_at") FROM stdin;
5	🔒Working	#22c55e	1	t	2026-02-27 12:06:56.783576+00
6	🔒Not Working	#ff0000	2	t	2026-02-27 12:07:11.162571+00
7	🔓 Unlocked	#22c55e	3	t	2026-02-27 12:11:48.452658+00
\.


--
-- Data for Name: door_status_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."door_status_values" ("id", "status_name", "status_color", "sort_order", "is_active", "created_at") FROM stdin;
1	Loading	#3b82f6	1	t	2026-02-26 00:10:13.679139+00
2	End Of Tote	#ff8000	2	t	2026-02-26 00:10:13.679139+00
3	EOT+1	#ff8000	3	t	2026-02-26 00:10:13.679139+00
4	Change Truck/Trailer	#8b5cf6	4	t	2026-02-26 00:10:13.679139+00
5	Waiting	#6b7280	5	t	2026-02-26 00:10:13.679139+00
6	Done for Night	#ff0000	6	t	2026-02-26 00:10:13.679139+00
7	100%	#ff8040	7	t	2026-02-26 00:10:13.679139+00
8	Move to Receiving	#ff8000	8	t	2026-02-27 05:57:30.566457+00
\.


--
-- Data for Name: global_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."global_messages" ("id", "message", "message_type", "created_by", "created_at", "expires_at", "visible_roles", "dismissed_by", "is_active") FROM stdin;
3	Open PrintRoom First Daily enter trucks/semi's leave route blank, navigate to the Route Sheet to Request Data, then return to the PrintRoom and select Sync Routes	info	640932d0-dc33-45b1-9dff-a3188191093a	2026-03-01 17:37:08.532915+00	\N	{admin,print_room}	{}	t
\.


--
-- Data for Name: live_movement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."live_movement" ("id", "truck_number", "current_location", "status_id", "in_front_of", "notes", "loading_door_id", "last_updated") FROM stdin;
399	223-1	\N	1	\N	\N	\N	2026-03-01 04:34:01.796+00
400	187-2	\N	25	\N	\N	\N	2026-02-28 11:03:47.984035+00
405	cpu	\N	23	\N	\N	\N	2026-02-28 11:04:15.8+00
406	gap	\N	24	\N	\N	\N	2026-02-28 11:04:30.011+00
407	231-2	\N	1	\N	\N	\N	2026-02-28 11:04:36.537035+00
413	231-1	\N	1	\N	\N	\N	2026-02-28 11:05:17.617644+00
419	188-1	\N	1	\N	\N	\N	2026-02-28 11:06:36.582607+00
420	223-2	\N	25	\N	\N	\N	2026-02-28 11:06:40.844833+00
425	187-1	\N	1	\N	\N	\N	2026-02-28 11:07:10.358226+00
426	224-1	\N	25	\N	\N	\N	2026-02-28 11:07:48.322592+00
430	243	\N	3	\N	\N	\N	2026-02-28 11:08:11.467772+00
431	189-1	\N	1	\N	\N	\N	2026-02-28 11:08:16.129524+00
432	224-2	\N	25	\N	\N	\N	2026-02-28 11:08:23.60425+00
\.


--
-- Data for Name: loading_doors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."loading_doors" ("id", "door_name", "door_status", "is_done_for_night", "sort_order", "dock_lock_status") FROM stdin;
1	13A	Loading	f	1	\N
2	13B	Loading	f	2	\N
4	14B	Loading	f	4	\N
5	15A	Loading	f	5	\N
6	15B	Loading	f	6	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."messages" ("id", "room_id", "sender_id", "content", "created_at") FROM stdin;
12	3	640932d0-dc33-45b1-9dff-a3188191093a	Add Features: Dock Lock Over Ride Per Door.	2026-02-26 23:42:31.745553+00
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."notification_preferences" ("id", "user_id", "notify_truck_status", "notify_door_status", "notify_chat_mention", "notify_preshift", "notify_system", "channel_app", "channel_sms", "created_at", "updated_at") FROM stdin;
1	640932d0-dc33-45b1-9dff-a3188191093a	t	t	t	t	t	t	t	2026-02-24 15:19:32.78716+00	2026-02-24 15:19:32.78716+00
2	ab7ead08-515b-49cd-9dc1-3b45005ae801	t	t	t	t	t	t	t	2026-02-24 15:19:32.78716+00	2026-02-24 15:19:32.78716+00
3	e1e0ee71-faf3-4719-a5b2-d14a6d4d2a39	t	t	t	t	t	t	t	2026-02-24 15:19:32.78716+00	2026-02-24 15:19:32.78716+00
4	b3bf6296-30d9-44d7-8ded-a54f3a7eb6e1	t	t	t	t	t	t	t	2026-02-24 15:19:32.78716+00	2026-02-24 15:19:32.78716+00
5	f0f6fef4-14b7-4121-aea7-fad8272e99df	t	t	t	t	t	t	t	2026-02-24 15:19:32.78716+00	2026-02-24 15:19:32.78716+00
6	27df9757-b7c8-4199-a0e5-aeb462fbfd72	t	t	t	t	t	t	t	2026-02-25 02:55:13.335325+00	2026-02-25 02:55:13.335325+00
7	7122b9b1-0809-4343-8325-6157ad2939c8	t	t	t	t	t	t	t	2026-02-25 08:50:54.962031+00	2026-02-25 08:50:54.962031+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."notifications" ("id", "user_id", "truck_number", "message", "type", "is_read", "sent_sms", "created_at") FROM stdin;
1	640932d0-dc33-45b1-9dff-a3188191093a	223-2	🚚 TR223-2 (trailer 2): In Door	status_change	t	f	2026-02-21 22:06:35.196831+00
2	640932d0-dc33-45b1-9dff-a3188191093a	223-2	🚚 TR223-2 (trailer 2): 8	status_change	t	f	2026-02-21 22:09:28.411337+00
20	640932d0-dc33-45b1-9dff-a3188191093a	241	🚚 Badger: TR241: Put Away	status_change	t	f	2026-02-27 12:43:20.796676+00
\.


--
-- Data for Name: printroom_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."printroom_entries" ("id", "loading_door_id", "batch_number", "row_order", "route_info", "truck_number", "pods", "pallets_trays", "notes", "is_end_marker", "created_at", "updated_at") FROM stdin;
486	1	1	1	4508	223-1	0	\N	\N	f	2026-02-28 11:03:25.389873+00	2026-02-28 11:03:25.389873+00
487	1	2	1	1518	241	0	\N	\N	f	2026-02-28 11:03:26.499007+00	2026-02-28 11:03:26.499007+00
488	1	1	2	4592	187-2	0	\N	\N	f	2026-02-28 11:03:27.670948+00	2026-02-28 11:03:27.670948+00
489	2	1	1	\N	gap	0	\N	\N	f	2026-02-28 11:03:28.701429+00	2026-02-28 11:03:28.701429+00
490	2	1	2	3591	231-2	0	\N	\N	f	2026-02-28 11:03:31.345234+00	2026-02-28 11:03:31.345234+00
491	3	1	1	5534	231-1	0	\N	\N	f	2026-02-28 11:03:33.938436+00	2026-02-28 11:03:33.938436+00
492	1	2	2	1591	141	0	\N	\N	f	2026-02-28 11:03:50.691096+00	2026-02-28 11:03:50.691096+00
493	1	2	3	1523	228	0	\N	\N	f	2026-02-28 11:03:51.837396+00	2026-02-28 11:03:51.837396+00
494	1	2	4	1555	148	0	\N	\N	f	2026-02-28 11:03:52.958293+00	2026-02-28 11:03:52.958293+00
495	1	2	5	\N	cpu	0	\N	\N	f	2026-02-28 11:04:11.953514+00	2026-02-28 11:04:11.953514+00
496	2	2	1	1505	160	0	\N	\N	f	2026-02-28 11:04:39.901327+00	2026-02-28 11:04:39.901327+00
497	2	2	2	1543	242	0	\N	\N	f	2026-02-28 11:04:42.408435+00	2026-02-28 11:04:42.408435+00
498	2	2	3	1504	199	0	\N	\N	f	2026-02-28 11:04:43.354347+00	2026-02-28 11:04:43.354347+00
499	2	2	4	1544	220	0	\N	\N	f	2026-02-28 11:04:44.135065+00	2026-02-28 11:04:44.135065+00
500	2	2	5	1508	213	0	\N	\N	f	2026-02-28 11:04:45.01783+00	2026-02-28 11:04:45.01783+00
506	4	1	1	5532	188-1	0	\N	\N	f	2026-02-28 11:05:43.696631+00	2026-02-28 11:05:43.696631+00
507	5	1	1	4516	187-1	0	\N	\N	f	2026-02-28 11:05:44.104042+00	2026-02-28 11:05:44.104042+00
508	6	1	1	5509	189-1	0	\N	\N	f	2026-02-28 11:05:44.547406+00	2026-02-28 11:05:44.547406+00
509	4	1	2	4518	223-2	0	\N	\N	f	2026-02-28 11:05:46.609249+00	2026-02-28 11:05:46.609249+00
510	5	1	2	2590	224-1	0	\N	\N	f	2026-02-28 11:05:46.988498+00	2026-02-28 11:05:46.988498+00
511	6	1	2	2502	224-2	0	\N	\N	f	2026-02-28 11:05:47.468431+00	2026-02-28 11:05:47.468431+00
513	5	2	1	1515	194	0	\N	\N	f	2026-02-28 11:05:52.851606+00	2026-02-28 11:05:52.851606+00
514	6	2	1	1545	246	0	\N	\N	f	2026-02-28 11:05:53.354053+00	2026-02-28 11:05:53.354053+00
515	4	2	2	1533	159	0	\N	\N	f	2026-02-28 11:05:54.953718+00	2026-02-28 11:05:54.953718+00
516	5	2	2	1527	192	0	\N	\N	f	2026-02-28 11:05:55.34394+00	2026-02-28 11:05:55.34394+00
517	6	2	2	1541	238	0	\N	\N	f	2026-02-28 11:05:55.796052+00	2026-02-28 11:05:55.796052+00
518	4	2	3	1528	230	0	\N	\N	f	2026-02-28 11:05:56.589484+00	2026-02-28 11:05:56.589484+00
519	5	2	3	1590	240	0	\N	\N	f	2026-02-28 11:05:57.051726+00	2026-02-28 11:05:57.051726+00
520	6	2	3	1525	244	0	\N	\N	f	2026-02-28 11:05:57.574+00	2026-02-28 11:05:57.574+00
521	4	2	4	1517	245	0	\N	\N	f	2026-02-28 11:05:58.508031+00	2026-02-28 11:05:58.508031+00
522	5	2	4	1526	243	0	\N	\N	f	2026-02-28 11:05:58.899633+00	2026-02-28 11:05:58.899633+00
523	6	2	4	1501	195	0	\N	\N	f	2026-02-28 11:05:59.420007+00	2026-02-28 11:05:59.420007+00
524	3	1	2	\N	end	0	\N	\N	t	2026-02-28 11:06:24.355797+00	2026-02-28 11:06:24.355797+00
525	6	2	5	1542	158	0	\N	\N	f	2026-02-28 11:08:38.864997+00	2026-02-28 11:08:38.864997+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "username", "display_name", "role", "phone", "carrier", "sms_enabled", "avatar_color", "avatar_url", "notify_email", "notify_email_address", "created_at", "updated_at") FROM stdin;
27df9757-b7c8-4199-a0e5-aeb462fbfd72	driver	driver	driver	\N	\N	f	#f59e0b	\N	f	\N	2026-02-25 02:55:13.335325+00	2026-02-25 02:55:13.429384+00
7122b9b1-0809-4343-8325-6157ad2939c8	joemiller	Joe Miller	admin	\N	\N	f	#f59e0b	\N	f	\N	2026-02-25 08:50:54.962031+00	2026-02-25 08:50:55.052409+00
ab7ead08-515b-49cd-9dc1-3b45005ae801	felipe	Felipe Vazquez	truck_mover	\N	\N	f	#0af50e	\N	f	\N	2026-02-24 00:40:39.049937+00	2026-02-24 15:35:00.236475+00
b3bf6296-30d9-44d7-8ded-a54f3a7eb6e1	truckmover	Truck Mover	truck_mover	\N	\N	f	#f59e0b	\N	f	\N	2026-02-23 23:28:07.247625+00	2026-02-24 09:49:18.261181+00
e1e0ee71-faf3-4719-a5b2-d14a6d4d2a39	jackpot	Jack Pot	admin	\N	\N	f	#f59e0b	\N	f	\N	2026-02-23 23:27:25.978858+00	2026-02-26 00:08:38.54991+00
f0f6fef4-14b7-4121-aea7-fad8272e99df	printroom	Print Room	print_room	\N	\N	f	#f59e0b	\N	f	\N	2026-02-23 23:26:51.711284+00	2026-02-24 15:35:17.250946+00
\.


--
-- Data for Name: reset_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."reset_log" ("id", "reset_type", "reset_by", "reset_at") FROM stdin;
1	all	manual	2026-02-17 12:15:08.218416+00
12	all	manual	2026-02-26 22:52:19.752998+00
13	all	manual	2026-02-28 11:01:08.615761+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."role_permissions" ("id", "role_name", "display_name", "color", "pages", "features", "is_system", "updated_at") FROM stdin;
1	admin	Admin	#f59e0b	{printroom,routesheet,cheatsheet,preshift,movement,fleet,drivers,drivers_live,drivers_semis,chat,admin,profile}	{printroom_edit,printroom_reset,routesheet_download,cheatsheet_download,movement_edit,movement_door_edit,movement_tts,printroom_tts,preshift_edit,fleet_edit,admin_roles,admin_users,admin_reset,ptt}	t	2026-02-24 14:05:48.785708+00
2	print_room	Print Room	#3b82f6	{printroom,routesheet,cheatsheet,preshift,movement,fleet,chat,profile,drivers,drivers_live,drivers_semis}	{printroom_edit,printroom_reset,routesheet_download,cheatsheet_download,movement_edit,movement_door_edit,movement_tts,printroom_tts,preshift_edit,fleet_edit}	t	2026-02-24 14:05:48.920514+00
3	truck_mover	Truck Mover	#10b981	{printroom,preshift,movement,chat,profile,fleet}	{printroom_edit,movement_edit,movement_door_edit,movement_tts,preshift_edit,ptt,fleet_edit}	t	2026-02-24 14:05:48.996766+00
4	trainee	Trainee	#8b5cf6	{movement,preshift,chat,profile}	{movement_tts,preshift_edit,movement_door_edit,movement_edit,fleet_edit}	t	2026-02-24 14:05:49.061433+00
5	driver	Driver	#6b7280	{chat,profile,drivers,drivers_live,drivers_semis}	{}	t	2026-02-24 14:05:49.154889+00
6	supervisor	Supervisor	#ff0000	{printroom,routesheet,cheatsheet,preshift,movement,fleet,drivers,drivers_live,drivers_semis,chat,admin,profile}	{printroom_edit,printroom_reset,routesheet_download,cheatsheet_download,printroom_tts,movement_edit,movement_door_edit,movement_tts,preshift_edit,fleet_edit,admin_roles,admin_users,admin_reset}	f	2026-02-27 12:54:17.450335+00
\.


--
-- Data for Name: route_imports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."route_imports" ("id", "status", "sent_at", "received_at", "csv_data", "updated_at") FROM stdin;
1	received	2026-02-28 17:03:48.904+00	2026-02-28 17:04:09.388+00	TruckNumber,Route,RouteStatus,ClosedTimestamp,EOTScanTimeAtSorter,MinutesEOT2Close,CasesExpected,CasesLoaded,CasesLeft\nTR999,1000,Closed,2/27/2026 2:00:58 AM,2/27/2026 1:33:27 AM,27,53,53,0\nTR195,1501,Closed,2/27/2026 1:24:52 AM,2/27/2026 1:10:50 AM,14,205,205,0\nTR199,1504,Closed,2/27/2026 1:11:06 AM,2/27/2026 12:57:34 AM,14,323,322,1\nTR160,1505,Closed,2/26/2026 11:56:56 PM,2/26/2026 11:50:57 PM,6,480,479,1\nTR213,1508,Closed,2/27/2026 1:58:10 AM,2/27/2026 1:42:55 AM,16,156,156,0\nTR194,1515,Closed,2/27/2026 12:32:12 AM,2/26/2026 11:54:55 PM,38,517,517,0\nTR245,1517,Closed,2/27/2026 1:39:37 AM,2/27/2026 1:33:10 AM,6,316,317,0\nTR241,1518,Closed,2/27/2026 12:33:13 AM,2/26/2026 11:57:07 PM,36,395,394,1\nTR228,1523,Closed,2/27/2026 1:24:00 AM,2/27/2026 12:57:08 AM,27,359,359,0\nTR244,1525,Closed,2/27/2026 1:02:59 AM,2/27/2026 12:55:06 AM,7,453,449,4\nTR243,1526,Closed,2/27/2026 1:49:37 AM,2/27/2026 1:38:33 AM,11,300,298,2\nTR192,1527,Closed,2/27/2026 12:33:51 AM,2/27/2026 12:24:22 AM,9,242,241,1\nTR230,1528,Closed,2/27/2026 1:02:38 AM,2/27/2026 12:57:33 AM,5,417,417,0\nTR159,1533,Closed,2/27/2026 12:12:45 AM,2/27/2026 12:04:36 AM,8,331,331,0\nTR238,1541,Closed,2/27/2026 12:12:32 AM,2/26/2026 11:58:27 PM,14,293,292,1\nTR158,1542,Closed,2/27/2026 1:49:23 AM,2/27/2026 1:40:16 AM,9,259,259,0\nTR242,1543,Closed,2/27/2026 12:32:47 AM,2/27/2026 12:15:41 AM,17,246,246,0\nTR220,1544,Closed,2/27/2026 1:39:05 AM,2/27/2026 1:26:47 AM,13,274,273,1\nTR246,1545,Closed,2/26/2026 10:55:03 PM,2/26/2026 10:47:07 PM,8,345,343,2\nTR148,1555,Closed,2/27/2026 1:58:13 AM,2/27/2026 1:27:17 AM,31,313,313,0\nTR240,1590,Closed,2/27/2026 1:24:33 AM,2/27/2026 1:01:45 AM,23,321,321,0\nTR141,1591,Closed,2/27/2026 12:43:38 AM,2/27/2026 12:10:32 AM,33,153,153,0\nTR224-2,2000,Closed,2/26/2026 10:11:17 PM,2/26/2026 9:57:26 PM,14,32,32,0\nTR224-2,2501,Closed,2/26/2026 9:55:59 PM,2/26/2026 9:14:34 PM,41,414,416,0\nTR224-2,2502,Closed,2/26/2026 10:11:11 PM,2/26/2026 9:51:13 PM,20,383,378,5\nTR224-1,2504,Closed,2/26/2026 9:55:43 PM,2/26/2026 9:05:24 PM,50,389,389,0\nTR224-1,2509,Closed,2/26/2026 10:57:42 PM,2/26/2026 9:35:35 PM,82,227,227,0\nTR224-1,2590,Closed,2/26/2026 10:32:07 PM,2/26/2026 10:16:35 PM,16,350,349,1\nTR231-2,3000,Closed,2/26/2026 10:23:23 PM,2/26/2026 10:19:18 PM,4,2,2,0\nTR231-1,3502,Closed,2/26/2026 6:55:38 PM,2/26/2026 6:05:40 PM,50,249,249,0\nTR231-1,3510,Closed,2/26/2026 6:55:53 PM,2/26/2026 6:29:27 PM,26,129,129,0\nTR231-1,3511,Closed,2/26/2026 7:03:50 PM,2/26/2026 6:58:15 PM,5,140,139,1\nTR231-1,3512,Closed,2/26/2026 7:46:18 PM,2/26/2026 7:26:48 PM,20,177,176,1\nTR231-2,3513,Closed,2/26/2026 9:19:10 PM,2/26/2026 9:05:24 PM,14,296,297,0\nTR231-2,3516,Closed,2/26/2026 9:32:42 PM,2/26/2026 9:23:40 PM,9,230,230,0\nTR231-2,3590,Closed,2/26/2026 10:07:27 PM,2/26/2026 9:49:03 PM,18,190,190,0\nTR231-2,3591,Closed,2/26/2026 10:06:55 PM,2/26/2026 9:58:45 PM,8,121,121,0\nTR187-1,4000,Closed,2/26/2026 8:11:51 PM,2/26/2026 8:07:57 PM,4,127,128,0\nTR223-1,4502,Closed,2/26/2026 9:18:45 PM,2/26/2026 8:45:28 PM,33,188,188,0\nTR223-1,4503,Closed,2/26/2026 8:46:16 PM,2/26/2026 8:08:36 PM,38,293,293,0\nTR223-1,4505,Closed,2/26/2026 8:00:47 PM,2/26/2026 7:32:56 PM,28,193,193,0\nTR223-1,4507,Closed,2/26/2026 7:20:02 PM,2/26/2026 7:01:17 PM,19,432,429,3\nTR223-1,4508,Closed,2/26/2026 6:53:22 PM,2/26/2026 6:16:09 PM,37,363,363,0\nTR187-1,4509,Closed,2/26/2026 7:59:52 PM,2/26/2026 7:48:31 PM,11,268,268,0\nTR187-1,4512,Closed,2/26/2026 7:22:13 PM,2/26/2026 7:18:22 PM,4,335,335,0\nTR187-1,4513,Closed,2/26/2026 6:54:52 PM,2/26/2026 6:44:48 PM,10,292,292,0\nTR223-2,4514,Closed,2/26/2026 11:50:24 PM,2/26/2026 10:40:06 PM,70,617,617,0\nTR187-1,4516,Closed,2/26/2026 6:54:35 PM,2/26/2026 6:06:54 PM,48,298,298,0\nTR223-2,4517,Closed,2/26/2026 10:12:49 PM,2/26/2026 9:50:13 PM,22,362,361,1\nTR223-2,4518,Closed,2/26/2026 9:53:42 PM,2/26/2026 9:12:11 PM,41,424,422,2\nTR187-2,4550,Closed,2/26/2026 10:56:48 PM,2/26/2026 10:25:05 PM,31,267,267,0\nTR187-2,4591,Closed,2/26/2026 10:31:40 PM,2/26/2026 9:50:53 PM,41,606,601,5\nTR187-2,4592,Closed,2/26/2026 11:49:12 PM,2/26/2026 9:05:43 PM,164,106,106,0\nTR189,5000,Closed,2/26/2026 8:29:40 PM,2/26/2026 8:22:56 PM,7,1,1,0\nTR189,5504,Closed,2/26/2026 6:54:13 PM,2/26/2026 6:10:52 PM,44,415,414,1\nTR189,5506,Closed,2/26/2026 7:45:42 PM,2/26/2026 6:59:14 PM,46,298,298,0\nTR189,5508,Closed,2/26/2026 8:28:57 PM,2/26/2026 7:35:06 PM,53,265,265,0\nTR189,5509,Closed,2/26/2026 8:29:20 PM,2/26/2026 8:18:45 PM,11,437,437,0\nTR188,5517,Closed,2/26/2026 6:55:17 PM,2/26/2026 6:11:04 PM,44,381,383,0\nTR188,5529,Closed,2/26/2026 7:19:26 PM,2/26/2026 7:05:53 PM,14,586,587,0\nTR188,5530,Closed,2/26/2026 8:10:54 PM,2/26/2026 7:42:41 PM,28,236,236,0\nTR188,5531,Closed,2/26/2026 8:11:00 PM,2/26/2026 8:05:19 PM,6,126,125,1\nTR188,5532,Closed,2/26/2026 8:23:37 PM,2/26/2026 8:19:55 PM,4,99,99,0\nTR231-1,5534,Closed,2/27/2026 12:44:17 AM,2/26/2026 8:09:04 PM,275,419,419,0\n	2026-02-28 17:04:09.388+00
\.


--
-- Data for Name: staging_doors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."staging_doors" ("id", "door_label", "door_number", "door_side", "in_front", "in_back", "updated_at") FROM stdin;
1	18A	18	A	119	118	2026-02-17 12:03:44.786632+00
2	18B	18	B	152	\N	2026-02-17 12:03:44.786632+00
3	19A	19	A	216	\N	2026-02-17 12:03:44.786632+00
4	19B	19	B	130	\N	2026-02-17 12:03:44.786632+00
5	20A	20	A	240	\N	2026-02-17 12:03:44.786632+00
6	20B	20	B	185	\N	2026-02-17 12:03:44.786632+00
7	21A	21	A	242	241	2026-02-17 12:03:44.786632+00
8	21B	21	B	230	220	2026-02-17 12:03:44.786632+00
9	22A	22	A	141	192	2026-02-17 12:03:44.786632+00
10	22B	22	B	228	195	2026-02-17 12:03:44.786632+00
11	23A	23	A	\N	213	2026-02-17 12:03:44.786632+00
12	23B	23	B	246	211	2026-02-17 12:03:44.786632+00
13	24A	24	A	238	194	2026-02-17 12:03:44.786632+00
14	24B	24	B	245	199	2026-02-17 12:03:44.786632+00
15	25A	25	A	159	160	2026-02-17 12:03:44.786632+00
16	25B	25	B	244	160	2026-02-17 12:03:44.786632+00
17	26A	26	A	\N	126	2026-02-17 12:03:44.786632+00
18	26B	26	B	148	158	2026-02-17 12:03:44.786632+00
19	27A	27	A	128	217	2026-02-17 12:03:44.786632+00
20	27B	27	B	167	147	2026-02-17 12:03:44.786632+00
21	28A	28	A	138	170	2026-02-17 12:03:44.786632+00
22	28B	28	B	666	157	2026-02-17 12:03:44.786632+00
\.


--
-- Data for Name: status_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."status_values" ("id", "status_name", "status_color", "sort_order", "is_active") FROM stdin;
1	In Door	#008000	1	t
2	Put Away	#ff0000	2	t
3	On Route	#ff0000	3	t
4	In Front	#8b5cf6	4	t
5	Ready	#06b6d4	5	t
6	In Back	#808000	6	t
7	The Rock	#6b7280	7	t
8	Trailer Area	#808000	8	t
9	Yard	#84cc16	9	t
10	Missing	#ef4444	10	t
11	8	#ff0000	11	t
12	9	#ff0000	12	t
13	10	#ff0000	13	t
14	11	#ff0000	14	t
15	12A	#ff8000	15	t
16	12B	#ff8000	16	t
17	13A	#ff8000	17	t
18	13B	#ff8000	18	t
19	14A	#ff8000	19	t
20	14B	#ff8000	20	t
21	15A	#ff8000	21	t
22	15B	#ff8000	22	t
23	Ignore	#808080	23	t
24	Gap	#808080	24	t
25	Transfer	#7c3aed	25	t
26	END	#dc2626	26	t
27	Move to Receiving	#ff8000	27	t
\.


--
-- Data for Name: tractors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tractors" ("id", "truck_number", "driver_name", "driver_cell", "trailer_1_id", "trailer_2_id", "trailer_3_id", "trailer_4_id", "notes", "is_active", "created_at", "updated_at") FROM stdin;
1	170	Robert	920-960-7257	\N	\N	\N	\N	\N	t	2026-02-18 10:45:08.447381+00	2026-02-18 10:45:08.447381+00
3	177	TJ	920-579-7047	\N	\N	\N	\N	205,203	t	2026-02-18 10:49:06.830854+00	2026-02-18 10:49:06.830854+00
8	186	Spare	\N	\N	\N	\N	\N	\N	t	2026-02-18 10:50:36.228328+00	2026-02-18 10:50:36.228328+00
10	138	Spare	\N	\N	\N	\N	\N	\N	t	2026-02-18 10:57:10.363659+00	2026-02-18 10:57:10.363659+00
11	151	Spare	\N	\N	\N	\N	\N	\N	t	2026-02-18 10:57:24.050641+00	2026-02-18 10:57:24.050641+00
\.


--
-- Data for Name: trailer_list; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."trailer_list" ("id", "trailer_number", "notes", "is_active", "created_at") FROM stdin;
1	123	\N	t	2026-02-18 10:45:54.346676+00
2	124	\N	t	2026-02-18 10:46:00.638733+00
3	125	\N	t	2026-02-18 10:46:06.032138+00
4	154	\N	t	2026-02-18 10:46:19.402626+00
5	155	\N	t	2026-02-18 10:46:22.679816+00
6	203	\N	t	2026-02-18 10:46:30.54869+00
7	205	\N	t	2026-02-18 10:46:34.840276+00
8	206	\N	t	2026-02-18 10:46:39.881983+00
9	200	\N	t	2026-02-18 10:46:47.413301+00
10	201	\N	t	2026-02-18 10:46:52.413584+00
11	179	\N	t	2026-02-18 10:46:58.659922+00
12	180	\N	t	2026-02-18 10:47:02.074182+00
13	181	\N	t	2026-02-18 10:47:05.3512+00
14	182	\N	t	2026-02-18 10:47:11.447897+00
15	202	\N	t	2026-02-18 10:47:17.051982+00
16	204	\N	t	2026-02-18 10:47:25.413063+00
\.


--
-- Data for Name: trucks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."trucks" ("id", "truck_number", "truck_type", "transmission", "is_active", "notes", "created_at") FROM stdin;
1	152	tandem	automatic	t	\N	2026-02-17 12:16:04.633535+00
2	119	tandem	automatic	t	\N	2026-02-17 12:16:18.045961+00
3	216	tandem	automatic	t	\N	2026-02-17 12:16:28.628546+00
4	130	tandem	automatic	t	\N	2026-02-17 12:16:37.616505+00
5	185	tandem	automatic	t	\N	2026-02-17 12:16:49.399274+00
6	240	box_truck	automatic	t	\N	2026-02-17 12:17:03.448021+00
7	220	box_truck	automatic	t	\N	2026-02-17 12:17:14.297476+00
8	242	box_truck	automatic	t	\N	2026-02-17 12:17:21.355854+00
9	241	box_truck	automatic	t	\N	2026-02-17 12:17:28.718852+00
10	230	box_truck	automatic	t	\N	2026-02-17 12:17:34.921333+00
11	192	box_truck	automatic	t	\N	2026-02-17 12:17:49.436317+00
12	141	box_truck	manual	t	\N	2026-02-17 12:17:56.690412+00
13	228	box_truck	automatic	t	\N	2026-02-17 12:18:04.030239+00
14	195	box_truck	automatic	t	\N	2026-02-17 12:18:27.032371+00
15	213	box_truck	automatic	t	Small Truck	2026-02-17 12:18:41.95694+00
16	211	box_truck	automatic	t	Small Truck	2026-02-17 12:18:49.137622+00
17	214	box_truck	automatic	t	Small Truck	2026-02-17 12:18:55.521036+00
18	210	box_truck	automatic	t	Small Truck	2026-02-17 12:19:01.303076+00
19	246	box_truck	automatic	t	\N	2026-02-17 12:19:12.508657+00
20	245	box_truck	automatic	t	\N	2026-02-17 12:19:21.999135+00
21	199	box_truck	automatic	t	\N	2026-02-17 12:19:28.452493+00
22	238	box_truck	automatic	t	\N	2026-02-17 12:19:35.865372+00
23	194	box_truck	automatic	t	\N	2026-02-17 12:19:41.369564+00
24	243	box_truck	automatic	t	\N	2026-02-17 12:19:48.218105+00
25	159	box_truck	manual	t	\N	2026-02-17 12:19:55.267624+00
26	244	box_truck	automatic	t	\N	2026-02-17 12:20:04.480628+00
27	160	box_truck	manual	t	\N	2026-02-17 12:20:11.836268+00
28	148	box_truck	manual	t	\N	2026-02-17 12:20:18.685139+00
29	158	box_truck	manual	t	\N	2026-02-17 12:20:28.025968+00
30	215	box_truck	automatic	t	Small Truck	2026-02-17 12:20:36.962899+00
31	126	box_truck	manual	t	\N	2026-02-17 12:20:54.61325+00
32	156	box_truck	manual	t	\N	2026-02-17 12:21:02.239155+00
33	143	box_truck	automatic	t	\N	2026-02-17 12:21:11.363077+00
35	167	box_truck	manual	t	\N	2026-02-17 12:21:32.143725+00
36	131	box_truck	manual	t	\N	2026-02-17 12:22:04.344667+00
37	128	box_truck	manual	t	\N	2026-02-17 12:22:17.69365+00
38	237	box_truck	automatic	t	\N	2026-02-17 12:22:24.613064+00
40	209	van	automatic	t	\N	2026-02-18 11:54:36.612972+00
\.


--
-- Data for Name: messages_2026_03_01; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2026_03_01" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2026_03_02; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2026_03_02" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2026_03_03; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2026_03_03" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2026_03_04; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2026_03_04" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2026_03_05; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2026_03_05" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."schema_migrations" ("version", "inserted_at") FROM stdin;
20211116024918	2026-03-02 03:36:45
20211116045059	2026-03-02 03:36:45
20211116050929	2026-03-02 03:36:45
20211116051442	2026-03-02 03:36:45
20211116212300	2026-03-02 03:36:45
20211116213355	2026-03-02 03:36:45
20211116213934	2026-03-02 03:36:45
20211116214523	2026-03-02 03:36:45
20211122062447	2026-03-02 03:36:45
20211124070109	2026-03-02 03:36:45
20211202204204	2026-03-02 03:36:45
20211202204605	2026-03-02 03:36:45
20211210212804	2026-03-02 03:36:45
20211228014915	2026-03-02 03:36:45
20220107221237	2026-03-02 03:36:45
20220228202821	2026-03-02 03:36:45
20220312004840	2026-03-02 03:36:45
20220603231003	2026-03-02 03:36:45
20220603232444	2026-03-02 03:36:45
20220615214548	2026-03-02 03:36:45
20220712093339	2026-03-02 03:36:45
20220908172859	2026-03-02 03:36:45
20220916233421	2026-03-02 03:36:45
20230119133233	2026-03-02 03:36:45
20230128025114	2026-03-02 03:36:45
20230128025212	2026-03-02 03:36:45
20230227211149	2026-03-02 03:36:45
20230228184745	2026-03-02 03:36:45
20230308225145	2026-03-02 03:36:45
20230328144023	2026-03-02 03:36:45
20231018144023	2026-03-02 03:36:45
20231204144023	2026-03-02 03:36:45
20231204144024	2026-03-02 03:36:45
20231204144025	2026-03-02 03:36:45
20240108234812	2026-03-02 03:36:45
20240109165339	2026-03-02 03:36:45
20240227174441	2026-03-02 03:36:45
20240311171622	2026-03-02 03:36:45
20240321100241	2026-03-02 03:36:45
20240401105812	2026-03-02 03:36:45
20240418121054	2026-03-02 03:36:45
20240523004032	2026-03-02 03:36:45
20240618124746	2026-03-02 03:36:45
20240801235015	2026-03-02 03:36:45
20240805133720	2026-03-02 03:36:45
20240827160934	2026-03-02 03:36:45
20240919163303	2026-03-02 03:36:45
20240919163305	2026-03-02 03:36:45
20241019105805	2026-03-02 03:36:45
20241030150047	2026-03-02 03:36:45
20241108114728	2026-03-02 03:36:45
20241121104152	2026-03-02 03:36:45
20241130184212	2026-03-02 03:36:45
20241220035512	2026-03-02 03:36:45
20241220123912	2026-03-02 03:36:45
20241224161212	2026-03-02 03:36:45
20250107150512	2026-03-02 03:36:45
20250110162412	2026-03-02 03:36:46
20250123174212	2026-03-02 03:36:46
20250128220012	2026-03-02 03:36:46
20250506224012	2026-03-02 03:36:46
20250523164012	2026-03-02 03:36:46
20250714121412	2026-03-02 03:36:46
20250905041441	2026-03-02 03:36:46
20251103001201	2026-03-02 03:36:46
20251120212548	2026-03-02 03:36:46
20251120215549	2026-03-02 03:36:46
20260218120000	2026-03-02 03:36:46
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."subscription" ("id", "subscription_id", "entity", "filters", "claims", "created_at", "action_filter") FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."iceberg_namespaces" ("id", "bucket_name", "name", "created_at", "updated_at", "metadata", "catalog_id") FROM stdin;
\.


--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."iceberg_tables" ("id", "namespace_id", "bucket_name", "name", "location", "created_at", "updated_at", "remote_table_id", "shard_key", "shard_id", "catalog_id") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."migrations" ("id", "name", "hash", "executed_at") FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-03-02 03:36:49.121591
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-03-02 03:36:49.123786
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-03-02 03:36:49.124893
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-03-02 03:36:49.132224
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-03-02 03:36:49.140134
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-03-02 03:36:49.141632
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-03-02 03:36:49.14379
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-03-02 03:36:49.145831
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-03-02 03:36:49.146965
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-03-02 03:36:49.148297
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-03-02 03:36:49.150482
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-03-02 03:36:49.152236
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-03-02 03:36:49.154384
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-03-02 03:36:49.155753
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-03-02 03:36:49.157027
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-03-02 03:36:49.170121
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-03-02 03:36:49.172444
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-03-02 03:36:49.173695
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-03-02 03:36:49.175291
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-03-02 03:36:49.178029
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-03-02 03:36:49.179915
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-03-02 03:36:49.18319
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-03-02 03:36:49.195649
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-03-02 03:36:49.204526
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-03-02 03:36:49.206558
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-03-02 03:36:49.208127
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-03-02 03:36:49.209314
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-03-02 03:36:49.211005
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-03-02 03:36:49.211908
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-03-02 03:36:49.212823
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-03-02 03:36:49.213718
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-03-02 03:36:49.214962
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-03-02 03:36:49.215819
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-03-02 03:36:49.217101
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-03-02 03:36:49.218052
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-03-02 03:36:49.218993
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-03-02 03:36:49.219919
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-03-02 03:36:49.22083
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-03-02 03:36:49.22321
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-03-02 03:36:49.238872
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-03-02 03:36:49.23996
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-03-02 03:36:49.240876
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-03-02 03:36:49.241735
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-03-02 03:36:49.242669
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-03-02 03:36:49.243586
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-03-02 03:36:49.244999
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-03-02 03:36:49.252201
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-03-02 03:36:49.253663
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-03-02 03:36:49.255279
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-03-02 03:36:49.278471
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-03-02 03:36:49.280065
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-03-02 03:36:49.289647
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-03-02 03:36:49.290045
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-03-02 03:36:49.299674
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-03-02 03:36:49.300328
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-03-02 03:36:49.300866
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-03-02 03:36:49.303255
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY "supabase_functions"."hooks" ("id", "hook_table_id", "hook_name", "created_at", "request_id") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY "supabase_functions"."migrations" ("version", "inserted_at") FROM stdin;
initial	2026-03-02 03:36:33.515577+00
20210809183423_update_grants	2026-03-02 03:36:33.515577+00
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY "supabase_migrations"."seed_files" ("path", "hash") FROM stdin;
supabase/seed.sql	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY "vault"."secrets" ("id", "name", "description", "secret", "key_id", "nonce", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('"realtime"."subscription_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."extensions"
    ADD CONSTRAINT "extensions_pkey" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."custom_oauth_providers"
    ADD CONSTRAINT "custom_oauth_providers_identifier_key" UNIQUE ("identifier");


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."custom_oauth_providers"
    ADD CONSTRAINT "custom_oauth_providers_pkey" PRIMARY KEY ("id");


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code");


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id");


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_pkey" PRIMARY KEY ("id");


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_client_states"
    ADD CONSTRAINT "oauth_client_states_pkey" PRIMARY KEY ("id");


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_clients"
    ADD CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id");


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id");


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id");


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY "realtime"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2026_03_01 messages_2026_03_01_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2026_03_01"
    ADD CONSTRAINT "messages_2026_03_01_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2026_03_02 messages_2026_03_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2026_03_02"
    ADD CONSTRAINT "messages_2026_03_02_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2026_03_03 messages_2026_03_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2026_03_03"
    ADD CONSTRAINT "messages_2026_03_03_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2026_03_04 messages_2026_03_04_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2026_03_04"
    ADD CONSTRAINT "messages_2026_03_04_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2026_03_05 messages_2026_03_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2026_03_05"
    ADD CONSTRAINT "messages_2026_03_05_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."subscription"
    ADD CONSTRAINT "pk_subscription" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."iceberg_namespaces"
    ADD CONSTRAINT "iceberg_namespaces_pkey" PRIMARY KEY ("id");


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_pkey" PRIMARY KEY ("id");


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY "supabase_functions"."hooks"
    ADD CONSTRAINT "hooks_pkey" PRIMARY KEY ("id");


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY "supabase_functions"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("version");


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY "supabase_migrations"."seed_files"
    ADD CONSTRAINT "seed_files_pkey" PRIMARY KEY ("path");


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE INDEX "extensions_tenant_external_id_index" ON "_realtime"."extensions" USING "btree" ("tenant_external_id");


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "extensions_tenant_external_id_type_index" ON "_realtime"."extensions" USING "btree" ("tenant_external_id", "type");


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "tenants_external_id_index" ON "_realtime"."tenants" USING "btree" ("external_id");


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "custom_oauth_providers_created_at_idx" ON "auth"."custom_oauth_providers" USING "btree" ("created_at");


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "custom_oauth_providers_enabled_idx" ON "auth"."custom_oauth_providers" USING "btree" ("enabled");


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "custom_oauth_providers_identifier_idx" ON "auth"."custom_oauth_providers" USING "btree" ("identifier");


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "custom_oauth_providers_provider_type_idx" ON "auth"."custom_oauth_providers" USING "btree" ("provider_type");


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");


--
-- Name: INDEX "identities_email_idx"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_oauth_client_states_created_at" ON "auth"."oauth_client_states" USING "btree" ("created_at");


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"auth"."oauth_authorization_status");


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" USING "btree" ("deleted_at");


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" USING "btree" ("client_id") WHERE ("revoked_at" IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "client_id") WHERE ("revoked_at" IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "granted_at" DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" USING "btree" ("oauth_client_id");


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" USING "btree" ("resource_id" "text_pattern_ops");


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);


--
-- Name: INDEX "users_email_partial_key"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "ix_realtime_subscription_entity" ON "realtime"."subscription" USING "btree" ("entity");


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX "messages_inserted_at_topic_index" ON ONLY "realtime"."messages" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));


--
-- Name: messages_2026_03_01_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "messages_2026_03_01_inserted_at_topic_idx" ON "realtime"."messages_2026_03_01" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));


--
-- Name: messages_2026_03_02_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "messages_2026_03_02_inserted_at_topic_idx" ON "realtime"."messages_2026_03_02" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));


--
-- Name: messages_2026_03_03_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "messages_2026_03_03_inserted_at_topic_idx" ON "realtime"."messages_2026_03_03" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));


--
-- Name: messages_2026_03_04_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "messages_2026_03_04_inserted_at_topic_idx" ON "realtime"."messages_2026_03_04" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));


--
-- Name: messages_2026_03_05_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "messages_2026_03_05_inserted_at_topic_idx" ON "realtime"."messages_2026_03_05" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "subscription_subscription_id_entity_filters_action_filter_key" ON "realtime"."subscription" USING "btree" ("subscription_id", "entity", "filters", "action_filter");


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "idx_iceberg_namespaces_bucket_id" ON "storage"."iceberg_namespaces" USING "btree" ("catalog_id", "name");


--
-- Name: idx_iceberg_tables_location; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "idx_iceberg_tables_location" ON "storage"."iceberg_tables" USING "btree" ("location");


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "idx_iceberg_tables_namespace_id" ON "storage"."iceberg_tables" USING "btree" ("catalog_id", "namespace_id", "name");


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_objects_bucket_id_name_lower" ON "storage"."objects" USING "btree" ("bucket_id", "lower"("name") COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE INDEX "supabase_functions_hooks_h_table_id_h_name_idx" ON "supabase_functions"."hooks" USING "btree" ("hook_table_id", "hook_name");


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE INDEX "supabase_functions_hooks_request_id_idx" ON "supabase_functions"."hooks" USING "btree" ("request_id");


--
-- Name: messages_2026_03_01_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2026_03_01_inserted_at_topic_idx";


--
-- Name: messages_2026_03_01_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2026_03_01_pkey";


--
-- Name: messages_2026_03_02_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2026_03_02_inserted_at_topic_idx";


--
-- Name: messages_2026_03_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2026_03_02_pkey";


--
-- Name: messages_2026_03_03_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2026_03_03_inserted_at_topic_idx";


--
-- Name: messages_2026_03_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2026_03_03_pkey";


--
-- Name: messages_2026_03_04_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2026_03_04_inserted_at_topic_idx";


--
-- Name: messages_2026_03_04_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2026_03_04_pkey";


--
-- Name: messages_2026_03_05_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2026_03_05_inserted_at_topic_idx";


--
-- Name: messages_2026_03_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2026_03_05_pkey";


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER "tr_check_filters" BEFORE INSERT OR UPDATE ON "realtime"."subscription" FOR EACH ROW EXECUTE FUNCTION "realtime"."subscription_check_filters"();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER "protect_buckets_delete" BEFORE DELETE ON "storage"."buckets" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER "protect_objects_delete" BEFORE DELETE ON "storage"."objects" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."extensions"
    ADD CONSTRAINT "extensions_tenant_external_id_fkey" FOREIGN KEY ("tenant_external_id") REFERENCES "_realtime"."tenants"("external_id") ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: iceberg_namespaces iceberg_namespaces_catalog_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."iceberg_namespaces"
    ADD CONSTRAINT "iceberg_namespaces_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "storage"."buckets_analytics"("id") ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_catalog_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "storage"."buckets_analytics"("id") ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_namespace_id_fkey" FOREIGN KEY ("namespace_id") REFERENCES "storage"."iceberg_namespaces"("id") ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE "realtime"."messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."iceberg_namespaces" ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."iceberg_tables" ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";

--
-- Name: supabase_realtime live_movement; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."live_movement";


--
-- Name: supabase_realtime loading_doors; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."loading_doors";


--
-- Name: supabase_realtime trucks; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."trucks";


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION "supabase_realtime_messages_publication" ADD TABLE ONLY "realtime"."messages";


--
-- Name: SCHEMA "auth"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT USAGE ON SCHEMA "auth" TO "postgres";


--
-- Name: SCHEMA "extensions"; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA "extensions" TO "anon";
GRANT USAGE ON SCHEMA "extensions" TO "authenticated";
GRANT USAGE ON SCHEMA "extensions" TO "service_role";
GRANT ALL ON SCHEMA "extensions" TO "dashboard_user";


--
-- Name: SCHEMA "net"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "net" TO "supabase_functions_admin";
GRANT USAGE ON SCHEMA "net" TO "postgres";
GRANT USAGE ON SCHEMA "net" TO "anon";
GRANT USAGE ON SCHEMA "net" TO "authenticated";
GRANT USAGE ON SCHEMA "net" TO "service_role";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: SCHEMA "realtime"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "realtime" TO "postgres";
GRANT USAGE ON SCHEMA "realtime" TO "anon";
GRANT USAGE ON SCHEMA "realtime" TO "authenticated";
GRANT USAGE ON SCHEMA "realtime" TO "service_role";
GRANT ALL ON SCHEMA "realtime" TO "supabase_realtime_admin";


--
-- Name: SCHEMA "storage"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "storage" TO "postgres";
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";


--
-- Name: SCHEMA "supabase_functions"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "supabase_functions" TO "postgres";
GRANT USAGE ON SCHEMA "supabase_functions" TO "anon";
GRANT USAGE ON SCHEMA "supabase_functions" TO "authenticated";
GRANT USAGE ON SCHEMA "supabase_functions" TO "service_role";
GRANT ALL ON SCHEMA "supabase_functions" TO "supabase_functions_admin";


--
-- Name: SCHEMA "vault"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "vault" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "vault" TO "service_role";


--
-- Name: FUNCTION "email"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";


--
-- Name: FUNCTION "jwt"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";


--
-- Name: FUNCTION "role"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";


--
-- Name: FUNCTION "uid"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";


--
-- Name: FUNCTION "algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "grant_pg_cron_access"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "extensions"."grant_pg_cron_access"() FROM "supabase_admin";
GRANT ALL ON FUNCTION "extensions"."grant_pg_cron_access"() TO "supabase_admin" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."grant_pg_cron_access"() TO "dashboard_user";


--
-- Name: FUNCTION "grant_pg_graphql_access"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."grant_pg_graphql_access"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "grant_pg_net_access"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "extensions"."grant_pg_net_access"() FROM "supabase_admin";
GRANT ALL ON FUNCTION "extensions"."grant_pg_net_access"() TO "supabase_admin" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."grant_pg_net_access"() TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "blk_read_time" double precision, OUT "blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "blk_read_time" double precision, OUT "blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgrst_ddl_watch"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgrst_ddl_watch"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgrst_drop_watch"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgrst_drop_watch"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "set_graphql_placeholder"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."set_graphql_placeholder"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "sign"("payload" "json", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."sign"("payload" "json", "secret" "text", "algorithm" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."sign"("payload" "json", "secret" "text", "algorithm" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "try_cast_double"("inp" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "url_decode"("data" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "url_encode"("data" "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "verify"("token" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer); Type: ACL; Schema: net; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "supabase_functions_admin";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "postgres";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "anon";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "service_role";


--
-- Name: FUNCTION "http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer); Type: ACL; Schema: net; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "supabase_functions_admin";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "postgres";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "anon";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "service_role";


--
-- Name: FUNCTION "get_auth"("p_usename" "text"); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "pgbouncer"."get_auth"("p_usename" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "pgbouncer"."get_auth"("p_usename" "text") TO "pgbouncer";
GRANT ALL ON FUNCTION "pgbouncer"."get_auth"("p_usename" "text") TO "postgres";


--
-- Name: FUNCTION "apply_rls"("wal" "jsonb", "max_record_bytes" integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "dashboard_user";


--
-- Name: FUNCTION "build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "cast"("val" "text", "type_" "regtype"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "anon";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "quote_wal2json"("entity" "regclass"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "anon";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "subscription_check_filters"(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "anon";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "service_role";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "supabase_realtime_admin";


--
-- Name: FUNCTION "to_regrole"("role_name" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "topic"(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION "realtime"."topic"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."topic"() TO "dashboard_user";


--
-- Name: FUNCTION "extension"("name" "text"); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "service_role";
GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "postgres";


--
-- Name: FUNCTION "filename"("name" "text"); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "service_role";
GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "postgres";


--
-- Name: FUNCTION "foldername"("name" "text"); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "service_role";
GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "postgres";


--
-- Name: FUNCTION "http_request"(); Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

REVOKE ALL ON FUNCTION "supabase_functions"."http_request"() FROM PUBLIC;
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "postgres";
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "anon";
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "authenticated";
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: TABLE "audit_log_entries"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "custom_oauth_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."custom_oauth_providers" TO "postgres";
GRANT ALL ON TABLE "auth"."custom_oauth_providers" TO "dashboard_user";


--
-- Name: TABLE "flow_state"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";


--
-- Name: TABLE "identities"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";


--
-- Name: TABLE "instances"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "mfa_amr_claims"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";


--
-- Name: TABLE "mfa_challenges"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";


--
-- Name: TABLE "mfa_factors"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";


--
-- Name: TABLE "oauth_authorizations"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "dashboard_user";


--
-- Name: TABLE "oauth_client_states"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."oauth_client_states" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_client_states" TO "dashboard_user";


--
-- Name: TABLE "oauth_clients"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."oauth_clients" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_clients" TO "dashboard_user";


--
-- Name: TABLE "oauth_consents"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."oauth_consents" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_consents" TO "dashboard_user";


--
-- Name: TABLE "one_time_tokens"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";


--
-- Name: TABLE "refresh_tokens"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;


--
-- Name: SEQUENCE "refresh_tokens_id_seq"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";


--
-- Name: TABLE "saml_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";


--
-- Name: TABLE "saml_relay_states"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";


--
-- Name: TABLE "schema_migrations"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "sessions"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";


--
-- Name: TABLE "sso_domains"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";


--
-- Name: TABLE "sso_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";


--
-- Name: TABLE "users"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "automation_rules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_rules" TO "service_role";


--
-- Name: TABLE "chat_rooms"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_rooms" TO "service_role";


--
-- Name: TABLE "debug_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."debug_logs" TO "anon";
GRANT ALL ON TABLE "public"."debug_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_logs" TO "service_role";


--
-- Name: TABLE "device_nicknames"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."device_nicknames" TO "anon";
GRANT ALL ON TABLE "public"."device_nicknames" TO "authenticated";
GRANT ALL ON TABLE "public"."device_nicknames" TO "service_role";


--
-- Name: TABLE "dock_lock_status_values"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dock_lock_status_values" TO "anon";
GRANT ALL ON TABLE "public"."dock_lock_status_values" TO "authenticated";
GRANT ALL ON TABLE "public"."dock_lock_status_values" TO "service_role";


--
-- Name: TABLE "door_status_values"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."door_status_values" TO "anon";
GRANT ALL ON TABLE "public"."door_status_values" TO "authenticated";
GRANT ALL ON TABLE "public"."door_status_values" TO "service_role";


--
-- Name: TABLE "global_messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."global_messages" TO "anon";
GRANT ALL ON TABLE "public"."global_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."global_messages" TO "service_role";


--
-- Name: TABLE "live_movement"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."live_movement" TO "anon";
GRANT ALL ON TABLE "public"."live_movement" TO "authenticated";
GRANT ALL ON TABLE "public"."live_movement" TO "service_role";


--
-- Name: TABLE "loading_doors"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."loading_doors" TO "anon";
GRANT ALL ON TABLE "public"."loading_doors" TO "authenticated";
GRANT ALL ON TABLE "public"."loading_doors" TO "service_role";


--
-- Name: TABLE "messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";


--
-- Name: TABLE "notification_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";


--
-- Name: TABLE "printroom_entries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."printroom_entries" TO "anon";
GRANT ALL ON TABLE "public"."printroom_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."printroom_entries" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "reset_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reset_log" TO "anon";
GRANT ALL ON TABLE "public"."reset_log" TO "authenticated";
GRANT ALL ON TABLE "public"."reset_log" TO "service_role";


--
-- Name: TABLE "role_permissions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";


--
-- Name: TABLE "route_imports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."route_imports" TO "anon";
GRANT ALL ON TABLE "public"."route_imports" TO "authenticated";
GRANT ALL ON TABLE "public"."route_imports" TO "service_role";


--
-- Name: TABLE "staging_doors"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."staging_doors" TO "anon";
GRANT ALL ON TABLE "public"."staging_doors" TO "authenticated";
GRANT ALL ON TABLE "public"."staging_doors" TO "service_role";


--
-- Name: TABLE "status_values"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."status_values" TO "anon";
GRANT ALL ON TABLE "public"."status_values" TO "authenticated";
GRANT ALL ON TABLE "public"."status_values" TO "service_role";


--
-- Name: TABLE "tractors"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tractors" TO "anon";
GRANT ALL ON TABLE "public"."tractors" TO "authenticated";
GRANT ALL ON TABLE "public"."tractors" TO "service_role";


--
-- Name: TABLE "trailer_list"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."trailer_list" TO "anon";
GRANT ALL ON TABLE "public"."trailer_list" TO "authenticated";
GRANT ALL ON TABLE "public"."trailer_list" TO "service_role";


--
-- Name: TABLE "trucks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."trucks" TO "anon";
GRANT ALL ON TABLE "public"."trucks" TO "authenticated";
GRANT ALL ON TABLE "public"."trucks" TO "service_role";


--
-- Name: TABLE "messages"; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE "realtime"."messages" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages" TO "dashboard_user";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "service_role";


--
-- Name: TABLE "messages_2026_03_01"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2026_03_01" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2026_03_01" TO "dashboard_user";


--
-- Name: TABLE "messages_2026_03_02"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2026_03_02" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2026_03_02" TO "dashboard_user";


--
-- Name: TABLE "messages_2026_03_03"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2026_03_03" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2026_03_03" TO "dashboard_user";


--
-- Name: TABLE "messages_2026_03_04"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2026_03_04" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2026_03_04" TO "dashboard_user";


--
-- Name: TABLE "messages_2026_03_05"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2026_03_05" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2026_03_05" TO "dashboard_user";


--
-- Name: TABLE "schema_migrations"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."schema_migrations" TO "postgres";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "anon";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "service_role";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "supabase_realtime_admin";


--
-- Name: TABLE "subscription"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."subscription" TO "postgres";
GRANT ALL ON TABLE "realtime"."subscription" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."subscription" TO "anon";
GRANT SELECT ON TABLE "realtime"."subscription" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."subscription" TO "service_role";
GRANT ALL ON TABLE "realtime"."subscription" TO "supabase_realtime_admin";


--
-- Name: SEQUENCE "subscription_id_seq"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "dashboard_user";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "supabase_realtime_admin";


--
-- Name: TABLE "buckets"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "buckets_analytics"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";


--
-- Name: TABLE "buckets_vectors"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";


--
-- Name: TABLE "iceberg_namespaces"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."iceberg_namespaces" TO "service_role";
GRANT SELECT ON TABLE "storage"."iceberg_namespaces" TO "authenticated";
GRANT SELECT ON TABLE "storage"."iceberg_namespaces" TO "anon";


--
-- Name: TABLE "iceberg_tables"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."iceberg_tables" TO "service_role";
GRANT SELECT ON TABLE "storage"."iceberg_tables" TO "authenticated";
GRANT SELECT ON TABLE "storage"."iceberg_tables" TO "anon";


--
-- Name: TABLE "objects"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "s3_multipart_uploads"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";


--
-- Name: TABLE "s3_multipart_uploads_parts"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";


--
-- Name: TABLE "vector_indexes"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";


--
-- Name: TABLE "hooks"; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON TABLE "supabase_functions"."hooks" TO "postgres";
GRANT ALL ON TABLE "supabase_functions"."hooks" TO "anon";
GRANT ALL ON TABLE "supabase_functions"."hooks" TO "authenticated";
GRANT ALL ON TABLE "supabase_functions"."hooks" TO "service_role";


--
-- Name: SEQUENCE "hooks_id_seq"; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "service_role";


--
-- Name: TABLE "migrations"; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON TABLE "supabase_functions"."migrations" TO "postgres";
GRANT ALL ON TABLE "supabase_functions"."migrations" TO "anon";
GRANT ALL ON TABLE "supabase_functions"."migrations" TO "authenticated";
GRANT ALL ON TABLE "supabase_functions"."migrations" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON SEQUENCES  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON FUNCTIONS  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON TABLES  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON SEQUENCES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON FUNCTIONS  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON TABLES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
   EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
   EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

