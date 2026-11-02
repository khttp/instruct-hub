-- Authenticated instructors own the tenant records they create (baseline).
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tenants
    ADD CONSTRAINT tenants_subdomain_format
    CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$');

CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);

CREATE POLICY "Authenticated instructors create owned tenants" ON tenants
    FOR INSERT TO authenticated
    WITH CHECK (
        owner_id = auth.uid()
        AND tier = 'basic'
        AND organization_id IS NULL
        AND custom_domain IS NULL
        AND storage_used_bytes = 0
        AND active_students_count = 0
    );

CREATE POLICY "Instructors update owned tenants" ON tenants
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid() AND tier = 'basic');
