import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getMuxCredentials,
  getOwnedCourse,
  getUserClient,
  muxAuthorization,
} from '@/lib/mux/server';

export const runtime = 'nodejs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MUX_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export async function GET(request: NextRequest) {
  const userContext = getUserClient(request);
  if (!userContext) return NextResponse.json({ error: 'Sign in to check upload status.' }, { status: 401 });
  const user = await getAuthenticatedUser(userContext.client, userContext.accessToken);
  if (!user) return NextResponse.json({ error: 'Your session is invalid. Sign in again.' }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get('courseId') ?? '';
  const uploadId = request.nextUrl.searchParams.get('uploadId') ?? '';
  if (!UUID_PATTERN.test(courseId) || !MUX_ID_PATTERN.test(uploadId)) {
    return NextResponse.json({ error: 'Invalid upload status request.' }, { status: 400 });
  }

  let course;
  try {
    course = await getOwnedCourse(userContext.client, user.id, courseId);
    if (!course) return NextResponse.json({ error: 'Course not found or you do not have permission to edit it.' }, { status: 404 });
  } catch (error) {
    console.error('Could not verify Mux upload status request:', error);
    return NextResponse.json({ error: 'Could not check the upload status.' }, { status: 500 });
  }
  const credentials = getMuxCredentials();
  if (!credentials) return NextResponse.json({ error: 'Video uploads are not configured on LearnHub yet.' }, { status: 503 });

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(`https://api.mux.com/video/v1/uploads/${encodeURIComponent(uploadId)}`, {
      headers: { Authorization: muxAuthorization(credentials) },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Could not check Mux upload status:', error);
    return NextResponse.json({ error: 'Could not connect to Mux. Try again.' }, { status: 502 });
  }
  const uploadResult = await uploadResponse.json().catch(() => null) as {
    data?: { status?: string; asset_id?: string };
  } | null;
  if (!uploadResponse.ok || !uploadResult?.data) {
    console.error('Mux could not return upload status:', uploadResponse.status);
    return NextResponse.json({ error: 'Mux could not find this upload.' }, { status: 502 });
  }

  const upload = uploadResult.data;
  if (upload.status === 'errored' || upload.status === 'timed_out' || upload.status === 'cancelled') {
    return NextResponse.json({ status: upload.status });
  }
  if (upload.status !== 'asset_created' || !upload.asset_id) {
    return NextResponse.json({ status: 'processing' });
  }

  let assetResponse: Response;
  try {
    assetResponse = await fetch(`https://api.mux.com/video/v1/assets/${encodeURIComponent(upload.asset_id)}`, {
      headers: { Authorization: muxAuthorization(credentials) },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Could not check Mux asset readiness:', error);
    return NextResponse.json({ error: 'Could not connect to Mux. Try again.' }, { status: 502 });
  }
  const assetResult = await assetResponse.json().catch(() => null) as {
    data?: { status?: string; playback_ids?: Array<{ id?: string }> };
  } | null;
  if (!assetResponse.ok || !assetResult?.data) {
    console.error('Mux could not return asset status:', assetResponse.status);
    return NextResponse.json({ error: 'Mux could not check the uploaded video.' }, { status: 502 });
  }
  if (assetResult.data.status === 'errored') {
    return NextResponse.json({ status: 'errored' });
  }
  const playbackId = assetResult.data.playback_ids?.[0]?.id;
  if (assetResult.data.status !== 'ready' || !playbackId) {
    return NextResponse.json({ status: 'processing' });
  }
  return NextResponse.json({ status: 'ready', playbackId });
}
