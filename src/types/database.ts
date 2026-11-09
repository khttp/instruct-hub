export type SubscriptionTier = 'basic' | 'pro' | 'academy';
export type UserRole = 'student' | 'teacher' | 'organization_admin';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'manual_instapay' | 'manual_vodafone_cash' | 'paymob';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface TenantThemeSettings {
  template: 'default' | 'modern' | 'minimal' | 'academy';
  primary_color: string;
  accent_color?: string;
  school_name: string;
  logo_url?: string;
  banner_headline?: string;
  bio?: string;
  instructor_vodafone_cash?: string;
  instructor_instapay_id?: string;
}

export interface Tenant {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  subdomain: string;
  custom_domain?: string | null;
  tier: SubscriptionTier;
  theme_settings: TenantThemeSettings;
  storage_used_bytes: number;
  active_students_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string;
  email?: string | null;
  role: UserRole;
  phone_number?: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  price_egp: number;
  is_published: boolean;
  created_at: string;
}

export interface Lecture {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  cloudflare_stream_id: string | null;
  mux_playback_id?: string | null;
  file_size_bytes: number;
  sort_order: number;
  is_free_preview: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  payment_status: PaymentStatus;
  payment_receipt_url?: string | null;
  payment_method: PaymentMethod;
  reviewed_at?: string | null;
  created_at: string;
}

export interface PlanQuotaLimit {
  maxStorageBytes: number;
  maxStorageGB: number;
  maxActiveStudents: number;
  monthlyFeeEGP: number;
  transactionFeePct: number;
  name: string;
}

export const QUOTA_TIER_LIMITS: Record<SubscriptionTier, PlanQuotaLimit> = {
  basic: {
    maxStorageBytes: 3 * 1024 * 1024 * 1024, // 3 GB
    maxStorageGB: 3,
    maxActiveStudents: 50,
    monthlyFeeEGP: 0,
    transactionFeePct: 0.05,
    name: 'Basic (Free / 5% Fee)',
  },
  pro: {
    maxStorageBytes: 15 * 1024 * 1024 * 1024, // 15 GB
    maxStorageGB: 15,
    maxActiveStudents: 500,
    monthlyFeeEGP: 250,
    transactionFeePct: 0.02,
    name: 'Pro (250 EGP/mo)',
  },
  academy: {
    maxStorageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    maxStorageGB: 100,
    maxActiveStudents: Infinity,
    monthlyFeeEGP: 750,
    transactionFeePct: 0.0,
    name: 'Academy (750 EGP/mo)',
  },
};
