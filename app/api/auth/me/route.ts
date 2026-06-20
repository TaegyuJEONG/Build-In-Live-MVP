import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const tokenDoc = await adminDb.collection('cli_tokens').doc(token).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { userId } = tokenDoc.data()!;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Token exists but user doc doesn't? This shouldn't happen if properly initialized
      return NextResponse.json({ 
        status: 'authenticated', 
        userId,
        name: 'Unknown User'
      });
    }

    const userData = userDoc.data()!;
    return NextResponse.json({ 
      status: 'authenticated', 
      userId,
      name: userData.displayName || userData.name || 'User',
      email: userData.email || ''
    });

  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
