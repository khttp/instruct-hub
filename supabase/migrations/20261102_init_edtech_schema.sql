-- LearnHub Multi-Tenant LMS & Dynamic Website Builder
-- Schema generated in compliance with edtech_platform_srad.pdf

-- 1. Setup Enums for Quota Matrix & Permissions
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('basic', 'pro', 'academy');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'organization_admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Top Level Groupings for Schools/Academies
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Core Tenant Mapping with Quota Fields
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE NULL,
    tier subscription_tier DEFAULT 'basic',
    theme_settings JSONB DEFAULT '{"template": "default", "primary_color": "#0ea5e9", "accent_color": "#6366f1", "school_name": "LearnHub Academy"}'::jsonb,
    storage_used_bytes BIGINT DEFAULT 0,
    active_students_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Profiles Table Associated with Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    phone_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Course Structure Metadata
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price_egp NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Lecture Assets Managed via Cloudflare Identifiers
CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cloudflare_stream_id VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_free_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Manual and Gateway Enrollment Processing
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    payment_receipt_url TEXT NULL,
    payment_method VARCHAR(50) DEFAULT 'manual_instapay', -- 'manual_instapay', 'manual_vodafone_cash', 'paymob'
    reviewed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- Indexes for performance & multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Public can view tenants by subdomain or custom domain
CREATE POLICY "Public read tenants" ON tenants
    FOR SELECT USING (true);

-- Public can view published courses
CREATE POLICY "Public read published courses" ON courses
    FOR SELECT USING (is_published = true);

-- Public can view free preview lectures
CREATE POLICY "Public read free preview lectures" ON lectures
    FOR SELECT USING (is_free_preview = true);

-- Students can read lectures of enrolled & approved courses
CREATE POLICY "Enrolled students read lectures" ON lectures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.course_id = lectures.course_id
              AND enrollments.student_id = auth.uid()
              AND enrollments.payment_status = 'approved'
        )
    );

-- Teachers/Admins have full access to their tenant courses and lectures
CREATE POLICY "Tenant teachers manage courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.tenant_id = courses.tenant_id
              AND profiles.role IN ('teacher', 'organization_admin')
        )
    );

CREATE POLICY "Tenant teachers manage lectures" ON lectures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            JOIN profiles ON profiles.tenant_id = courses.tenant_id
            WHERE courses.id = lectures.course_id
              AND profiles.id = auth.uid()
              AND profiles.role IN ('teacher', 'organization_admin')
        )
    );

-- Students can view and create their own enrollments
CREATE POLICY "Students create and view own enrollments" ON enrollments
    FOR ALL USING (student_id = auth.uid());

-- Teachers can view and update enrollments for their tenant courses
CREATE POLICY "Teachers manage tenant enrollments" ON enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            JOIN profiles ON profiles.tenant_id = courses.tenant_id
            WHERE courses.id = enrollments.course_id
              AND profiles.id = auth.uid()
              AND profiles.role IN ('teacher', 'organization_admin')
        )
    );
