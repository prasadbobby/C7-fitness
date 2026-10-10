import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

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

    // Use timing-safe comparison
    const signatureBuffer = Buffer.from(signature);
    const hashBuffer = Buffer.from(hash);

    if (signatureBuffer.length !== hashBuffer.length ||
        !timingSafeEqual(signatureBuffer, hashBuffer)) {
      return NextResponse.json(
        { error: 'Invalid signature', expected: hash.substring(0, 20) + '...', received: signature.substring(0, 20) + '...' },
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

    // Trigger deployment via internal endpoint
    const deployResponse = await fetch('http://localhost:3001/api/deploy-internal', {
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
    });

    if (!deployResponse.ok) {
      throw new Error(`Deploy trigger failed: ${deployResponse.statusText}`);
    }

    const result = await deployResponse.json();

    return NextResponse.json({
      message: 'Deployment triggered',
      timestamp: new Date().toISOString(),
      details: result
    });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Deployment failed', details: errorMessage },
      { status: 500 }
    );
  }
}
