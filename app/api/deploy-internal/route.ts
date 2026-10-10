import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { appendFile } from 'fs/promises';

const execAsync = promisify(exec);

const WEBHOOK_SECRET = 'c7fitness_deploy_secret_2026';
const DEPLOY_SCRIPT = '/home/c7personalfitness.com/deploy.sh';
const DEPLOY_LOG = '/home/c7personalfitness.com/deploy.log';

export async function POST(request: NextRequest) {
  try {
    // Verify internal secret
    const secret = request.headers.get('x-internal-secret');

    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const timestamp = body.timestamp || new Date().toISOString();

    // Execute deployment script
    const { stdout, stderr } = await execAsync(DEPLOY_SCRIPT);
    const output = stdout + (stderr ? '\nStderr:\n' + stderr : '');

    // Log deployment
    await appendFile(
      DEPLOY_LOG,
      `${timestamp}\nDeployment triggered by ${body.event}\nRef: ${body.ref}\n${output}\n\n`
    );

    return NextResponse.json({
      success: true,
      timestamp,
      output: output.substring(0, 500) // Limit output size
    });

  } catch (error) {
    console.error('Deploy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Deployment execution failed', details: errorMessage },
      { status: 500 }
    );
  }
}
