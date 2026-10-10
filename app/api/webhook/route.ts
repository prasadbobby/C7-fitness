import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = 'c7fitness_deploy_secret_2026';

export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-hub-signature-256');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 403 }
      );
    }

    // Get raw body as buffer for signature verification
    const bodyBuffer = await request.arrayBuffer();
    const body = Buffer.from(bodyBuffer);

    // Verify signature
    const hash = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== hash) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload to check event
    const payload = JSON.parse(body.toString('utf-8'));
    const ref = payload.ref;

    // Only deploy on push to main branch
    if (ref !== 'refs/heads/main') {
      return NextResponse.json({
        message: `Ignored push to ${ref}`
      });
    }

    // Trigger deployment in background (don't wait for response)
    fetch('http://localhost:3001/api/deploy-internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': WEBHOOK_SECRET
      },
      body: JSON.stringify({
        event: 'github_webhook',
        ref: ref,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.error('Background deploy error:', err));

    // Return immediately to avoid GitHub timeout
    return NextResponse.json({
      message: 'Deployment triggered in background',
      timestamp: new Date().toISOString(),
      ref: ref
    });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    );
  }
}
