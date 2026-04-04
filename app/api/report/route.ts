import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, url } = await request.json();

    if (!email || !url) {
      return NextResponse.json(
        { error: 'Email and URL are required' },
        { status: 400 }
      );
    }

    // Config from Genkle.ai
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.spacemail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, 
      auth: {
        user: process.env.SMTP_USER || 'taegyu@genkle.com',
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"BuildInLive Reporter" <${process.env.SMTP_USER || 'taegyu@genkle.com'}>`,
      to: 'taegyujeong@gmail.com',
      subject: 'New Feedback System Report',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #F95A56;">User Issue Report</h2>
          <p>A user has reported an issue with the feedback terminal integration.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p><strong>User Email:</strong> ${email}</p>
            <p><strong>Project URL:</strong> <a href="${url}">${url}</a></p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This report was sent automatically via BuildInLive Onboarding.
          </p>
        </div>
      `,
    });

    console.log('✅ Report email sent successfully to: taegyujeong@gmail.com');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
