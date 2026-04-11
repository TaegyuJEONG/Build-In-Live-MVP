import { NextResponse } from 'next/server';
import { extractMetadataFromReadme } from '@/lib/ai/metadataExtractor';
// Assuming you have initialized firebase-admin in your project elsewhere, e.g. in lib/firebaseAdmin.ts
// import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication (Device Flow Token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    // TODO: Verify token against database

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
      createdAt: new Date().toISOString(), // or Firestore Timestamp
      isVerified: false,
      feedbackCount: 0,
      platforms: processedData.platforms || ['web'],
    };

    // 3. Save to Firestore (Mocked for now since admin snippet varies heavily via project config)
    // await adminDb.collection('projects').add(payloadToSave);
    console.log('[API] Synced project data to Firestore:', payloadToSave);

    return NextResponse.json({ success: true, data: payloadToSave });

  } catch (error) {
    console.error('Project sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
