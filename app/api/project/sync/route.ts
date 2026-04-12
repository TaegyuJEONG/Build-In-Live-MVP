import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { extractMetadataFromReadme } from '@/lib/ai/metadataExtractor';

export async function POST(req: Request) {
  try {
    // 1. Verify CLI access token
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

    // 2. Parse request payload
    const body = await req.json();

    let processedData: Record<string, any>;

    if (body.readmeText !== undefined) {
      // AI auto-generation flow
      const extracted = await extractMetadataFromReadme(body.readmeText);
      if (!extracted) {
        return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
      }
      processedData = extracted;
    } else {
      // Manual input flow
      processedData = {
        name: body.name || 'Untitled Project',
        about: body.about || '',
        techStacks: body.techStacks || [],
        categories: body.categories || [],
        platforms: body.platforms || ['web'],
        targetAudience: body.targetAudience || [],
        useCases: body.useCases || [],
      };
    }

    // 3. Save to Firestore
    const payloadToSave = {
      ...processedData,
      name: body.name || processedData.name || 'Untitled Project',
      url: body.url || '',
      ownerId: userId,
      feedbackCount: 0,
      isVerified: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('projects').add(payloadToSave);
    console.log('[API] Project saved to Firestore:', docRef.id);

    return NextResponse.json({ success: true, projectId: docRef.id });

  } catch (error) {
    console.error('Project sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
