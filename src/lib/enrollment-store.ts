'use client';

import { useSyncExternalStore } from 'react';
import { initialEnrollments } from '@/lib/data-store';
import { Enrollment, PaymentMethod } from '@/types/database';

const STORAGE_KEY = 'learnhub_enrollments';
const ENROLLMENTS_CHANGE_EVENT = 'learnhub-enrollments-change';
let cachedRaw: string | null | undefined;
let cachedEnrollments: Enrollment[] = initialEnrollments;

function isEnrollment(value: unknown): value is Enrollment {
  if (!value || typeof value !== 'object') return false;
  const enrollment = value as Record<string, unknown>;
  return (
    typeof enrollment.id === 'string' &&
    typeof enrollment.course_id === 'string' &&
    typeof enrollment.student_id === 'string' &&
    ['pending', 'approved', 'rejected'].includes(String(enrollment.payment_status)) &&
    ['manual_instapay', 'manual_vodafone_cash', 'paymob'].includes(String(enrollment.payment_method)) &&
    (typeof enrollment.payment_receipt_url === 'string' || enrollment.payment_receipt_url === null) &&
    (typeof enrollment.reviewed_at === 'string' || enrollment.reviewed_at === null) &&
    typeof enrollment.created_at === 'string'
  );
}

function getEnrollmentsSnapshot(): Enrollment[] {
  if (typeof window === 'undefined') return initialEnrollments;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    if (raw === null) {
      cachedEnrollments = initialEnrollments;
    } else {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(isEnrollment)) {
        throw new Error('Saved enrollment data is invalid. Clear the learnhub_enrollments browser storage to continue.');
      }
      cachedEnrollments = parsed;
    }
  }
  return cachedEnrollments;
}

function subscribeToEnrollments(onChange: () => void) {
  window.addEventListener(ENROLLMENTS_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(ENROLLMENTS_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function saveEnrollments(enrollments: Enrollment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollments));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(ENROLLMENTS_CHANGE_EVENT));
}

export function useEnrollments() {
  return useSyncExternalStore(
    subscribeToEnrollments,
    getEnrollmentsSnapshot,
    () => initialEnrollments
  );
}

export function submitEnrollment(input: {
  courseId: string;
  studentId: string;
  paymentMethod: PaymentMethod;
  receiptUrl: string;
}): Enrollment | null {
  const enrollments = getEnrollmentsSnapshot();
  const existing = enrollments.find(
    (enrollment) => enrollment.course_id === input.courseId && enrollment.student_id === input.studentId
  );

  if (existing?.payment_status === 'approved') return null;

  const updated: Enrollment = {
    id: existing?.id ?? `enr-${crypto.randomUUID()}`,
    course_id: input.courseId,
    student_id: input.studentId,
    payment_status: 'pending',
    payment_receipt_url: input.receiptUrl,
    payment_method: input.paymentMethod,
    reviewed_at: null,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };

  saveEnrollments(
    existing
      ? enrollments.map((enrollment) => enrollment.id === existing.id ? updated : enrollment)
      : [...enrollments, updated]
  );
  return updated;
}

export function updateEnrollmentStatus(enrollmentId: string, status: Enrollment['payment_status']) {
  const enrollments = getEnrollmentsSnapshot();
  if (!enrollments.some((enrollment) => enrollment.id === enrollmentId)) {
    throw new Error(`Enrollment ${enrollmentId} was not found.`);
  }
  saveEnrollments(
    enrollments.map((enrollment) =>
      enrollment.id === enrollmentId
        ? { ...enrollment, payment_status: status, reviewed_at: new Date().toISOString() }
        : enrollment
    )
  );
}
