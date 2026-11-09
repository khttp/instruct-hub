'use client';

import { useSyncExternalStore } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface StudentUser {
  id: string;
  email: string;
  fullName: string;
}

const SESSION_CHANGE_EVENT = 'learnhub-student-session-change';
let cachedUser: StudentUser | null = null;
let initialized = false;

function toStudentUser(user: User | null): StudentUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : user.email ?? 'Student',
  };
}

function setCachedUser(user: User | null) {
  cachedUser = toStudentUser(user);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

function initializeAuth() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    setCachedUser(session?.user ?? null);
  });
  void supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Could not restore student session:', error.message);
      setCachedUser(null);
      return;
    }
    setCachedUser(data.session?.user ?? null);
  });
}

function subscribe(onChange: () => void) {
  initializeAuth();
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
}

export function useStudentSession() {
  return useSyncExternalStore(subscribe, () => cachedUser, () => null);
}

export async function signOutStudent() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
