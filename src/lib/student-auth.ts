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
let profileLookupId = 0;

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

async function setCachedUser(user: User | null) {
  const lookupId = ++profileLookupId;
  if (!user) {
    cachedUser = null;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
    return;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (lookupId !== profileLookupId) return;
  if (error) {
    console.error('Could not verify student account:', error.message);
    cachedUser = null;
  } else {
    cachedUser = profile?.role === 'student' ? toStudentUser(user) : null;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

function initializeAuth() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      void setCachedUser(session?.user ?? null);
    }, 0);
  });
  void supabase.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      console.error('Could not restore student session:', error.message);
      await setCachedUser(null);
      return;
    }
    await setCachedUser(data.session?.user ?? null);
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
