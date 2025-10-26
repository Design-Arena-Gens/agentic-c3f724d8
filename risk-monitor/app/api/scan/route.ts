import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/lib/newsService';
import { AIService } from '@/lib/aiService';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { NotificationService } from '@/lib/notificationService';
import { Report } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources, keywords, industries, alertConfig, reportType = 'realtime' } = body;

    // Validate environment variables
    const requiredEnvVars = ['OPENAI_API_KEY', 'NEWS_API_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        return NextResponse.json({ error: `Missing ${envVar}` }, { status: 500 });
      }
    }

    // Initialize services
    const newsService = new NewsService(process.env.NEWS_API_KEY!);
    const aiService = new AIService(process.env.OPENAI_API_KEY!);

    // Fetch news
    console.log('Fetching news articles...');
    const articles = await newsService.fetchNews(sources, keywords, industries);
    console.log(`Found ${articles.length} articles`);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles found',
        report: {
          id: Date.now().toString(),
          type: reportType,
          generatedAt: new Date().toISOString(),
          articles: [],
          summary: 'No relevant articles found during this scan.'
        }
      });
    }

    // Analyze articles with AI
    console.log('Analyzing articles with AI...');
    const riskArticles = await aiService.analyzeArticles(articles, keywords, industries);
    console.log(`Identified ${riskArticles.length} risk articles`);

    // Generate summary
    console.log('Generating report summary...');
    const summary = await aiService.generateReportSummary(riskArticles);

    // Create report
    const report: Report = {
      id: Date.now().toString(),
      type: reportType,
      generatedAt: new Date().toISOString(),
      articles: riskArticles,
      summary
    };

    // Save to Google Sheets if configured
    if (
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
    ) {
      try {
        console.log('Saving to Google Sheets...');
        const sheetsService = new GoogleSheetsService(
          process.env.GOOGLE_CLIENT_EMAIL,
          process.env.GOOGLE_PRIVATE_KEY,
          process.env.GOOGLE_SHEET_ID
        );
        await sheetsService.saveReport(report);
      } catch (error) {
        console.error('Error saving to Google Sheets:', error);
      }
    }

    // Send notifications if configured
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      alertConfig.email.length > 0
    ) {
      try {
        console.log('Sending email notifications...');
        const notificationService = new NotificationService(
          process.env.SMTP_HOST,
          parseInt(process.env.SMTP_PORT || '587'),
          process.env.SMTP_USER,
          process.env.SMTP_PASS,
          process.env.WHATSAPP_API_KEY || '',
          process.env.WHATSAPP_PHONE_ID || ''
        );

        // Send email for all report types
        await notificationService.sendEmailReport(alertConfig.email, report);

        // Send WhatsApp for real-time alerts only
        if (
          reportType === 'realtime' &&
          alertConfig.realTimeEnabled &&
          alertConfig.whatsapp.length > 0 &&
          process.env.WHATSAPP_API_KEY
        ) {
          await notificationService.sendWhatsAppAlert(alertConfig.whatsapp, riskArticles);
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error in scan API:', error);
    return NextResponse.json(
      { error: 'Failed to complete scan', details: (error as Error).message },
      { status: 500 }
    );
  }
}
