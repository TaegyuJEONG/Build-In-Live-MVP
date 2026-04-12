import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userCode, idToken } = body;

    if (!userCode || !idToken) {
      return NextResponse.json({ error: 'userCode and idToken are required' }, { status: 400 });
    }

    // 1. Verify the Firebase ID token (proves user is logged in)
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. Find the device session by userCode
    const sessionsQuery = await adminDb
      .collection('device_sessions')
      .where('userCode', '==', userCode.toUpperCase())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (sessionsQuery.empty) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    const sessionDoc = sessionsQuery.docs[0];
    const session = sessionDoc.data();

    if (Date.now() > session.expiresAt) {
      await sessionDoc.ref.delete();
      return NextResponse.json({ error: 'Code has expired' }, { status: 410 });
    }

    // 3. Generate an opaque access token for the CLI and persist it
    const accessToken = crypto.randomUUID();
    await adminDb.collection('cli_tokens').doc(accessToken).set({
      userId,
      createdAt: Date.now(),
    });

    // 4. Mark session as approved
    await sessionDoc.ref.update({
      status: 'approved',
      userId,
      accessToken,
      approvedAt: Date.now(),
    });

    return NextResponse.json({ success: true, message: 'Device authorized successfully.' });

  } catch (error) {
    console.error('Device approve error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
