import { NextRequest, NextResponse } from 'next/server';

let serverConfig: any = null;

export async function GET() {
  return NextResponse.json(serverConfig || {});
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    serverConfig = config;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
