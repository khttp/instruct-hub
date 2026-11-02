-- Refuse the constraint if existing owners already have multiple tenant sites.
DO $$
BEGIN
    IF EXISTS (
        SELECT owner_id
        FROM tenants
        WHERE owner_id IS NOT NULL
        GROUP BY owner_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Multiple tenants already exist for an owner; resolve duplicates before applying this migration';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_one_site_per_owner
    ON tenants(owner_id)
    WHERE owner_id IS NOT NULL;
