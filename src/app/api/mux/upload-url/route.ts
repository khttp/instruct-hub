import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  getMuxCredentials,
  getOwnedCourse,
  getUserClient,
  muxAuthorization,
} from '@/lib/mux/server';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const userContext = getUserClient(request);
  if (!userContext) return NextResponse.json({ error: 'Sign in as the course owner to upload a video.' }, { status: 401 });
  const user = await getAuthenticatedUser(userContext.client, userContext.accessToken);
  if (!user) return NextResponse.json({ error: 'Your session is invalid. Sign in again.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }
  const { courseId, fileSize, fileType } = body as {
    courseId?: unknown;
    fileSize?: unknown;
    fileType?: unknown;
  };
  if (
    typeof courseId !== 'string'
    || !UUID_PATTERN.test(courseId)
    || typeof fileType !== 'string'
    || !fileType.startsWith('video/')
    || typeof fileSize !== 'number'
    || !Number.isSafeInteger(fileSize)
    || fileSize <= 0
    || fileSize > MAX_UPLOAD_BYTES
  ) {
    return NextResponse.json({ error: 'Choose a valid video file no larger than 30 GB.' }, { status: 400 });
  }

  let course;
  try {
    course = await getOwnedCourse(userContext.client, user.id, courseId);
    if (!course) return NextResponse.json({ error: 'Course not found or you do not have permission to edit it.' }, { status: 404 });
  } catch (error) {
    console.error('Could not prepare Mux upload:', error);
    return NextResponse.json({ error: 'Could not prepare the video upload.' }, { status: 500 });
  }
  const credentials = getMuxCredentials();
  if (!credentials) {
    return NextResponse.json({ error: 'Video uploads are not configured on LearnHub yet.' }, { status: 503 });
  }

  let muxResponse: Response;
  try {
    muxResponse = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        Authorization: muxAuthorization(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cors_origin: request.nextUrl.origin,
        timeout: 3600,
        new_asset_settings: {
          passthrough: courseId,
          playback_policies: ['signed'],
          video_quality: 'basic',
        },
      }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Could not create Mux direct upload:', error);
    return NextResponse.json({ error: 'Could not connect to Mux. Try again.' }, { status: 502 });
  }

  const result = await muxResponse.json().catch(() => null) as {
    data?: { id?: string; url?: string };
  } | null;
  if (!muxResponse.ok || !result?.data?.id || !result.data.url) {
    console.error('Mux did not create a direct upload:', muxResponse.status);
    return NextResponse.json({ error: 'Mux could not prepare this upload. Check your account permissions.' }, { status: 502 });
  }
  return NextResponse.json({ uploadId: result.data.id, uploadUrl: result.data.url });
}
