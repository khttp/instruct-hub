CREATE OR REPLACE FUNCTION public.create_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    account_role public.user_role;
BEGIN
    account_role := CASE
        WHEN NEW.raw_user_meta_data ->> 'account_type' = 'instructor'
            THEN 'teacher'::public.user_role
        ELSE 'student'::public.user_role
    END;

    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email, 'User'),
        NEW.email,
        account_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

UPDATE public.profiles AS profile
SET role = 'teacher'
WHERE EXISTS (
    SELECT 1
    FROM public.tenants AS tenant
    WHERE tenant.owner_id = profile.id
);

CREATE OR REPLACE FUNCTION public.is_current_user_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'student'
    );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_student() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_student() TO authenticated;

DROP POLICY IF EXISTS "Students read own enrollments" ON public.enrollments;
CREATE POLICY "Students read own enrollments" ON public.enrollments
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        AND (SELECT public.is_current_user_student())
    );

DROP POLICY IF EXISTS "Students submit pending enrollments" ON public.enrollments;
CREATE POLICY "Students submit pending enrollments" ON public.enrollments
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id = (SELECT auth.uid())
        AND (SELECT public.is_current_user_student())
        AND payment_status = 'pending'
        AND payment_receipt_url IS NOT NULL
        AND payment_method IN ('manual_instapay', 'manual_vodafone_cash')
        AND EXISTS (
            SELECT 1
            FROM public.courses
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

DROP POLICY IF EXISTS "Students upload their payment receipts" ON storage.objects;
CREATE POLICY "Students upload their payment receipts" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payment-receipts'
        AND (SELECT public.is_current_user_student())
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
        AND EXISTS (
            SELECT 1
            FROM public.courses
            WHERE courses.id::text = (storage.foldername(name))[2]
              AND courses.is_published = TRUE
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

    IF NOT public.is_current_user_student() THEN
        RAISE EXCEPTION 'Use a student account to submit a payment request.';
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
