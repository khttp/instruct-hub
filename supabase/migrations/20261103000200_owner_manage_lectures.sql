DROP POLICY IF EXISTS "Tenant owners manage lectures" ON lectures;

CREATE POLICY "Tenant owners manage lectures" ON lectures
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM courses
            JOIN tenants ON tenants.id = courses.tenant_id
            WHERE courses.id = lectures.course_id
              AND tenants.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM courses
            JOIN tenants ON tenants.id = courses.tenant_id
            WHERE courses.id = lectures.course_id
              AND tenants.owner_id = auth.uid()
        )
    );
