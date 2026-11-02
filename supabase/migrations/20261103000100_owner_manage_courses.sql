DROP POLICY IF EXISTS "Tenant owners manage courses" ON courses;

CREATE POLICY "Tenant owners manage courses" ON courses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM tenants
            WHERE tenants.id = courses.tenant_id
              AND tenants.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM tenants
            WHERE tenants.id = courses.tenant_id
              AND tenants.owner_id = auth.uid()
        )
    );
