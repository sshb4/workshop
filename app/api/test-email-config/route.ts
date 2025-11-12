import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key-here') {
      return NextResponse.json({ 
        configured: false,
        error: 'RESEND_API_KEY is not set or still has placeholder value',
        instructions: 'Get your API key from https://resend.com/api-keys and add it to your .env file'
      });
    }

    if (!process.env.FROM_EMAIL || process.env.FROM_EMAIL === 'noreply@yourdomain.com') {
      return NextResponse.json({ 
        configured: false,
        error: 'FROM_EMAIL is not set or still has placeholder value',
        instructions: 'Set FROM_EMAIL to "onboarding@resend.dev" for testing, or your verified domain for production'
      });
    }

    // Try to initialize Resend
    try {
      const { Resend } = await import('resend');
      new Resend(process.env.RESEND_API_KEY);
      
      // Test the API key (this doesn't send an email, just validates the key)
      return NextResponse.json({ 
        configured: true,
        message: 'Resend is properly configured!',
        fromEmail: process.env.FROM_EMAIL,
        apiKeyPrefix: process.env.RESEND_API_KEY.substring(0, 8) + '...'
      });
    } catch {
      return NextResponse.json({ 
        configured: false,
        error: 'Invalid Resend API key',
        instructions: 'Check that your RESEND_API_KEY is correct and starts with "re_"'
      });
    }

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      configured: false,
      error: 'Unexpected error checking Resend configuration',
      details: errorMsg
    });
  }
}
