import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Generate a random 4-char + 4-char user code like ABCD-1234
function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, I, 0, 1 to avoid confusion
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}`;
}

function generateDeviceCode(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function POST() {
  try {
    const deviceCode = generateDeviceCode();
    const userCode = generateUserCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await adminDb.collection('device_sessions').doc(deviceCode).set({
      deviceCode,
      userCode,
      status: 'pending',
      expiresAt,
      createdAt: Date.now(),
    });

    const verificationUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://build-in-live-mvp.vercel.app'}/activate`;

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: verificationUri,
      verification_uri_complete: `${verificationUri}?code=${userCode}`,
      expires_in: 900,
      interval: 5,
    });
  } catch (error) {
    console.error('Device code generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
