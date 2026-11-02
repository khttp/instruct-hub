-- DESTRUCTIVE, MANUAL OPERATION.
-- This deletes every tenant. Foreign-key cascades also delete tenant profiles,
-- courses, lectures, and enrollments. Auth users are not deleted.
-- Review the preview count, then run this script in Supabase SQL Editor only
-- if you intend to reset all existing academy data.

BEGIN;

LOCK TABLE public.tenants IN EXCLUSIVE MODE;

SELECT COUNT(*) AS tenants_to_delete
FROM public.tenants;

DELETE FROM public.tenants;

COMMIT;
