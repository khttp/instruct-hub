import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export function getUserClient(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!accessToken || !supabaseUrl || !supabaseKey) return null;

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  return { client, accessToken };
}

export async function getAuthenticatedUser(
  client: SupabaseClient,
  accessToken: string
): Promise<User | null> {
  const { data, error } = await client.auth.getUser(accessToken);
  return error ? null : data.user;
}

export async function getOwnedCourse(
  client: SupabaseClient,
  userId: string,
  courseId: string
) {
  const { data: course, error: courseError } = await client
    .from('courses')
    .select('id, tenant_id')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw new Error('Could not verify course ownership.');
  if (!course) return null;

  const { data: tenant, error: tenantError } = await client
    .from('tenants')
    .select('id')
    .eq('id', course.tenant_id)
    .eq('owner_id', userId)
    .maybeSingle();
  if (tenantError) throw new Error('Could not verify course ownership.');
  return tenant ? { ...course, tenant_id: tenant.id } : null;
}

export function getMuxCredentials() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  return tokenId && tokenSecret ? { tokenId, tokenSecret } : null;
}

export function muxAuthorization(credentials: { tokenId: string; tokenSecret: string }) {
  return `Basic ${Buffer.from(`${credentials.tokenId}:${credentials.tokenSecret}`).toString('base64')}`;
}
