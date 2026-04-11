import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { device_code } = body;

    if (!device_code) {
      return NextResponse.json({ error: 'device_code is required' }, { status: 400 });
    }

    const sessionRef = adminDb.collection('device_sessions').doc(device_code);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: 'invalid_device_code' }, { status: 404 });
    }

    const session = sessionSnap.data()!;

    // Check expiry
    if (Date.now() > session.expiresAt) {
      await sessionRef.delete();
      return NextResponse.json({ error: 'expired_token' }, { status: 410 });
    }

    if (session.status === 'pending') {
      return NextResponse.json({ status: 'pending' }, { status: 202 });
    }

    if (session.status === 'approved') {
      // Clean up the session document after issuing token
      await sessionRef.delete();
      return NextResponse.json({
        status: 'approved',
        access_token: session.accessToken,
        user_id: session.userId,
      });
    }

    return NextResponse.json({ error: 'unknown_status' }, { status: 500 });

  } catch (error) {
    console.error('Device token polling error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
