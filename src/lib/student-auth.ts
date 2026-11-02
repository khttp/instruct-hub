'use client';

import { useSyncExternalStore } from 'react';

export interface StudentUser {
  phoneNumber: string;
  pin: string;
  fullName: string;
  enrolledCourseIds: string[];
}

const STORAGE_KEY = 'learnhub_student_session';
const SESSION_CHANGE_EVENT = 'learnhub-student-session-change';
let cachedSessionRaw: string | null | undefined;
let cachedSession: StudentUser | null = null;

// Demo initial students for instant testing
const DEFAULT_STUDENTS: StudentUser[] = [
  {
    phoneNumber: '01011223344',
    pin: '1234',
    fullName: 'يوسف محمد أحمد',
    enrolledCourseIds: ['course-phy-101'],
  },
  {
    phoneNumber: '01122334455',
    pin: '5678',
    fullName: 'نور خالد إبراهيم',
    enrolledCourseIds: ['course-phy-101'],
  },
];

export function getStoredStudents(): StudentUser[] {
  if (typeof window === 'undefined') return DEFAULT_STUDENTS;
  try {
    const data = localStorage.getItem('learnhub_registered_students');
    if (!data) {
      localStorage.setItem('learnhub_registered_students', JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export function saveStudentUser(student: StudentUser) {
  if (typeof window === 'undefined') return;
  const list = getStoredStudents();
  const existingIdx = list.findIndex((s) => s.phoneNumber === student.phoneNumber);
  if (existingIdx >= 0) {
    list[existingIdx] = student;
  } else {
    list.push(student);
  }
  localStorage.setItem('learnhub_registered_students', JSON.stringify(list));
}

export function getActiveStudentSession(): StudentUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedSessionRaw) {
    cachedSessionRaw = raw;
    cachedSession = raw ? (JSON.parse(raw) as StudentUser) : null;
  }
  return cachedSession;
}

export function setActiveStudentSession(student: StudentUser | null) {
  if (typeof window === 'undefined') return;
  if (!student) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
  }
  cachedSessionRaw = undefined;
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

function subscribeToStudentSession(onChange: () => void) {
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useStudentSession() {
  return useSyncExternalStore(
    subscribeToStudentSession,
    getActiveStudentSession,
    () => null
  );
}

export function validateEgyptianPhone(phone: string): boolean {
  // Accepts formats like 01012345678, 01112345678, 01212345678, 01512345678
  const clean = phone.trim().replace(/\s+/g, '');
  const regex = /^01[0125][0-9]{8}$/;
  return regex.test(clean);
}
