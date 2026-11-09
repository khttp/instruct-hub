ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE OR REPLACE FUNCTION public.create_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email, 'Student'),
        NEW.email,
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET full_name = COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email, 'Student'),
        email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();

DROP TRIGGER IF EXISTS on_auth_user_updated_profile ON auth.users;
CREATE TRIGGER on_auth_user_updated_profile
    AFTER UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile();

INSERT INTO public.profiles (id, full_name, email, role)
SELECT
    users.id,
    COALESCE(NULLIF(users.raw_user_meta_data ->> 'full_name', ''), users.email, 'Student'),
    users.email,
    'student'
FROM auth.users AS users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

DROP POLICY IF EXISTS "Students create and view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers manage tenant enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students read own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students submit pending enrollments" ON enrollments;
DROP POLICY IF EXISTS "Tenant owners read enrollments" ON enrollments;

CREATE POLICY "Students read own enrollments" ON enrollments
    FOR SELECT TO authenticated
    USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Students submit pending enrollments" ON enrollments
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id = (SELECT auth.uid())
        AND payment_status = 'pending'
        AND payment_receipt_url IS NOT NULL
        AND payment_method IN ('manual_instapay', 'manual_vodafone_cash')
        AND EXISTS (
            SELECT 1
            FROM courses
            WHERE courses.id = enrollments.course_id
              AND courses.is_published = TRUE
        )
        AND EXISTS (
            SELECT 1
            FROM storage.objects
            WHERE storage.objects.bucket_id = 'payment-receipts'
              AND storage.objects.name = enrollments.payment_receipt_url
              AND (storage.foldername(storage.objects.name))[1] = (SELECT auth.uid())::text
              AND (storage.foldername(storage.objects.name))[2] = enrollments.course_id::text
        )
    );

CREATE POLICY "Tenant owners read enrollments" ON enrollments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM courses
            JOIN tenants ON tenants.id = courses.tenant_id
            WHERE courses.id = enrollments.course_id
              AND tenants.owner_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Students view own profile" ON profiles;
DROP POLICY IF EXISTS "Tenant owners view enrolled student profiles" ON profiles;

CREATE POLICY "Students view own profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = (SELECT auth.uid()));

CREATE POLICY "Tenant owners view enrolled student profiles" ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM enrollments
            JOIN courses ON courses.id = enrollments.course_id
            JOIN tenants ON tenants.id = courses.tenant_id
            WHERE enrollments.student_id = profiles.id
              AND tenants.owner_id = (SELECT auth.uid())
        )
    );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-receipts',
    'payment-receipts',
    FALSE,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Students upload their payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Students and tenant owners view payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Students delete unattached payment receipts" ON storage.objects;

CREATE POLICY "Students upload their payment receipts" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payment-receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND EXISTS (
            SELECT 1
            FROM courses
            WHERE courses.id::text = (storage.foldername(name))[2]
              AND courses.is_published = TRUE
        )
    );

CREATE POLICY "Students and tenant owners view payment receipts" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'payment-receipts'
        AND (
            (storage.foldername(name))[1] = (SELECT auth.uid())::text
            OR EXISTS (
                SELECT 1
                FROM enrollments
                JOIN courses ON courses.id = enrollments.course_id
                JOIN tenants ON tenants.id = courses.tenant_id
                WHERE enrollments.payment_receipt_url = storage.objects.name
                  AND tenants.owner_id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Students delete unattached payment receipts" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'payment-receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND NOT EXISTS (
            SELECT 1
            FROM public.enrollments
            WHERE payment_receipt_url = storage.objects.name
        )
    );

CREATE OR REPLACE FUNCTION public.submit_course_enrollment(
    p_course_id UUID,
    p_payment_method TEXT,
    p_receipt_path TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_student_id UUID := auth.uid();
    result_id UUID;
BEGIN
    IF current_student_id IS NULL THEN
        RAISE EXCEPTION 'Sign in before submitting a payment request.';
    END IF;

    IF p_payment_method IS NULL OR p_payment_method NOT IN ('manual_instapay', 'manual_vodafone_cash') THEN
        RAISE EXCEPTION 'Unsupported payment method.';
    END IF;

    IF p_receipt_path IS NULL OR p_receipt_path !~ (
        '^' || current_student_id::text || '/' || p_course_id::text || '/[^/]+$'
    ) THEN
        RAISE EXCEPTION 'Invalid payment receipt path.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.courses
        WHERE id = p_course_id AND is_published = TRUE
    ) THEN
        RAISE EXCEPTION 'This course is not available for enrollment.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'payment-receipts'
          AND name = p_receipt_path
          AND (storage.foldername(name))[1] = current_student_id::text
    ) THEN
        RAISE EXCEPTION 'Upload your payment receipt before submitting.';
    END IF;

    INSERT INTO public.enrollments (
        course_id,
        student_id,
        payment_status,
        payment_receipt_url,
        payment_method,
        reviewed_at
    )
    VALUES (
        p_course_id,
        current_student_id,
        'pending',
        p_receipt_path,
        p_payment_method,
        NULL
    )
    ON CONFLICT (course_id, student_id) DO UPDATE
    SET payment_status = 'pending',
        payment_receipt_url = EXCLUDED.payment_receipt_url,
        payment_method = EXCLUDED.payment_method,
        reviewed_at = NULL,
        created_at = NOW()
    WHERE public.enrollments.payment_status = 'rejected'
    RETURNING id INTO result_id;

    IF result_id IS NULL THEN
        RAISE EXCEPTION 'A request already exists for this course or access has already been approved.';
    END IF;

    RETURN result_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_course_enrollment(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_course_enrollment(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_course_enrollment(
    p_enrollment_id UUID,
    p_payment_status TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_owner_id UUID := auth.uid();
    result_id UUID;
BEGIN
    IF current_owner_id IS NULL THEN
        RAISE EXCEPTION 'Sign in before reviewing payment requests.';
    END IF;

    IF p_payment_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid review status.';
    END IF;

    UPDATE public.enrollments AS enrollment
    SET payment_status = p_payment_status,
        reviewed_at = NOW()
    WHERE enrollment.id = p_enrollment_id
      AND enrollment.payment_status = 'pending'
      AND EXISTS (
          SELECT 1
          FROM public.courses AS course
          JOIN public.tenants AS tenant ON tenant.id = course.tenant_id
          WHERE course.id = enrollment.course_id
            AND tenant.owner_id = current_owner_id
      )
    RETURNING enrollment.id INTO result_id;

    IF result_id IS NULL THEN
        RAISE EXCEPTION 'Payment request not found or already reviewed.';
    END IF;

    RETURN result_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_course_enrollment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_course_enrollment(UUID, TEXT) TO authenticated;
