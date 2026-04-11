import { NextResponse } from 'next/server';
import { extractMetadataFromReadme } from '@/lib/ai/metadataExtractor';
// Assuming you have initialized firebase-admin in your project elsewhere, e.g. in lib/firebaseAdmin.ts
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication (Device Flow Token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    // TODO: Actually verify the token from device_sessions
    // For now, we trust the flow, but in production, we should lookup the userId.

    // 2. Parse Request Payload
    const body = await req.json();
    
    let processedData;

    if (body.readmeText !== undefined) {
      // AI Auto Generation Flow
      const extracted = await extractMetadataFromReadme(body.readmeText);
      if (!extracted) {
        return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
      }
      processedData = extracted;
    } else {
      // Manual Input Flow
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

    const payloadToSave = {
      ...processedData,
      createdAt: new Date().toISOString(),
      isVerified: false,
      feedbackCount: 0,
    };

    // 3. Save to Firestore (REAL)
    const docRef = await adminDb.collection('projects').add(payloadToSave);
    console.log('[API] Saved project to Firestore with ID:', docRef.id);

    return NextResponse.json({ success: true, data: { ...payloadToSave, id: docRef.id } });

  } catch (error) {
    console.error('Project sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
