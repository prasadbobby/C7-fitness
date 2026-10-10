import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { appendFile } from 'fs/promises';

const execAsync = promisify(exec);

const WEBHOOK_SECRET = 'c7fitness_deploy_secret_2026';
const DEPLOY_SCRIPT = '/home/c7personalfitness.com/deploy.sh';
const DEPLOY_LOG = '/home/c7personalfitness.com/deploy.log';

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

    // Get raw body
    const body = await request.text();

    // Verify signature
    const hash = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Parse payload to check event
    const payload = JSON.parse(body);
    const ref = payload.ref;

    // Only deploy on push to main branch
    if (ref !== 'refs/heads/main') {
      return NextResponse.json({
        message: `Ignored push to ${ref}`
      });
    }

    // Execute deployment script
    const timestamp = new Date().toISOString();
    const { stdout, stderr } = await execAsync(DEPLOY_SCRIPT);
    const output = stdout + (stderr ? '\nErrors:\n' + stderr : '');

    // Log deployment
    await appendFile(
      DEPLOY_LOG,
      `${timestamp}\nDeployment triggered by webhook\n${output}\n\n`
    );

    return NextResponse.json({
      message: 'Deployment triggered',
      timestamp
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
