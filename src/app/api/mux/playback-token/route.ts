import { createSign } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function createPlaybackToken(playbackId: string) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const encodedPrivateKey = process.env.MUX_SIGNING_KEY_PRIVATE_KEY;
  if (!keyId || !encodedPrivateKey) return null;

  const privateKey = encodedPrivateKey.includes('-----BEGIN')
    ? encodedPrivateKey.replace(/\\n/g, '\n')
    : Buffer.from(encodedPrivateKey, 'base64').toString('utf8');
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId }));
  const payload = encodeBase64Url(JSON.stringify({
    aud: 'v',
    sub: playbackId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256')
    .update(unsignedToken)
    .end()
    .sign(privateKey)
    .toString('base64url');
  return `${unsignedToken}.${signature}`;
}

export async function GET(request: NextRequest) {
  const lectureId = request.nextUrl.searchParams.get('lectureId') ?? '';
  if (!UUID_PATTERN.test(lectureId)) {
    return NextResponse.json({ error: 'Invalid playback request.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Video playback is not configured.' }, { status: 503 });
  }

  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });

  let userId: string | null = null;
  if (accessToken) {
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Your session is invalid. Sign in again.' }, { status: 401 });
    }
    userId = data.user.id;
  }

  const { data: lecture, error: lectureError } = await client
    .from('lectures')
    .select('course_id, mux_playback_id, is_free_preview')
    .eq('id', lectureId)
    .maybeSingle();
  if (lectureError) {
    console.error('Could not verify requested video lecture:', lectureError.message);
    return NextResponse.json({ error: 'Could not verify video access.' }, { status: 500 });
  }
  if (!lecture?.mux_playback_id) {
    return NextResponse.json({ error: 'This video is unavailable for secure playback.' }, { status: 404 });
  }

  const { data: course, error: courseError } = await client
    .from('courses')
    .select('is_published')
    .eq('id', lecture.course_id)
    .maybeSingle();
  if (courseError) {
    console.error('Could not verify video course:', courseError.message);
    return NextResponse.json({ error: 'Could not verify video access.' }, { status: 500 });
  }
  if (!course?.is_published) {
    return NextResponse.json({ error: 'This course is not available.' }, { status: 404 });
  }

  if (!lecture.is_free_preview) {
    if (!userId) return NextResponse.json({ error: 'Approved enrollment is required.' }, { status: 403 });
    const { data: enrollment, error: enrollmentError } = await client
      .from('enrollments')
      .select('id')
      .eq('course_id', lecture.course_id)
      .eq('student_id', userId)
      .eq('payment_status', 'approved')
      .maybeSingle();
    if (enrollmentError) {
      console.error('Could not verify student enrollment:', enrollmentError.message);
      return NextResponse.json({ error: 'Could not verify video access.' }, { status: 500 });
    }
    if (!enrollment) return NextResponse.json({ error: 'Approved enrollment is required.' }, { status: 403 });
  }

  try {
    const token = createPlaybackToken(lecture.mux_playback_id);
    if (!token) {
      return NextResponse.json({ error: 'Secure video playback is not configured.' }, { status: 503 });
    }
    return NextResponse.json(
      { token },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Could not sign Mux playback token:', error);
    return NextResponse.json({ error: 'Could not prepare secure video playback.' }, { status: 500 });
  }
}
