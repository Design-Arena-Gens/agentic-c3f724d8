import { NextRequest, NextResponse } from 'next/server';
import { configService } from '@/lib/configService';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = configService.getConfig();

    if (!config.alertConfig.dailyEnabled) {
      return NextResponse.json({ message: 'Daily reports disabled' });
    }

    // Trigger scan
    const scanResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sources: config.sources.filter(s => s.enabled),
        keywords: config.keywords.filter(k => k.enabled),
        industries: config.industries.filter(i => i.enabled),
        alertConfig: config.alertConfig,
        reportType: 'daily'
      })
    });

    const result = await scanResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Daily scan completed',
      result
    });
  } catch (error) {
    console.error('Error in daily cron:', error);
    return NextResponse.json(
      { error: 'Failed to run daily scan', details: (error as Error).message },
      { status: 500 }
    );
  }
}
