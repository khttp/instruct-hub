-- MANUAL, IRREVERSIBLE PRODUCTION RESET.
-- Do not put this file in supabase/migrations: the migration workflow runs automatically.
-- Before running: take a database backup and review the dependent-data and external-file
-- warnings in README.md. Replace the confirmation value below, then run in Supabase SQL Editor.

BEGIN;

DO $$
DECLARE
    confirmation TEXT := 'REPLACE THIS WITH DELETE ALL LEARNHUB PRODUCTION ACCOUNTS';
    deleted_users BIGINT;
BEGIN
    IF confirmation <> 'DELETE ALL LEARNHUB PRODUCTION ACCOUNTS' THEN
        RAISE EXCEPTION
            'Reset cancelled. Edit the confirmation value only after verifying the production backup and deletion scope.';
    END IF;

    DELETE FROM auth.users;
    GET DIAGNOSTICS deleted_users = ROW_COUNT;

    -- Remove any academy data not reached by Auth-user foreign-key cascades.
    DELETE FROM public.tenants;
    DELETE FROM public.organizations;

    RAISE NOTICE 'Deleted % Auth users. Profiles, owned academies, courses, lessons, and enrollments were removed by cascades or cleanup.', deleted_users;
    RAISE NOTICE 'Private receipt files and Mux videos are external assets and are not deleted by this SQL script.';
END;
$$;

COMMIT;
