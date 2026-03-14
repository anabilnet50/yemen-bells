#!/usr/bin/env node

// Enhanced email test script
// Usage: node test_email.js [your-email@example.com]

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testEmail = process.argv[2] || process.env.SMTP_USER;
if (!testEmail) {
  console.log('Usage: node test_email.js your-email@example.com');
  console.log('Or set SMTP_USER in your .env file');
  process.exit(1);
}

async function testSMTP() {
  console.log('🔍 Testing SMTP configuration...');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  SMTP not configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASS)');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    socketTimeout: 15000
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: 'اختبار إرسال البريد - SMTP',
      html: '<h1>اختبار ناجح!</h1><p>تم إرسال هذه الرسالة عبر SMTP بنجاح.</p>'
    });
    console.log('✅ SMTP test successful!');
    return true;
  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
    return false;
  }
}

async function testResend() {
  console.log('🔍 Testing Resend API...');

  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not configured, skipping...');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `نظام هـدس <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: testEmail,
        subject: 'اختبار إرسال البريد - Resend',
        html: '<h1>اختبار ناجح!</h1><p>تم إرسال هذه الرسالة عبر Resend API بنجاح.</p>'
      })
    });

    if (response.ok) {
      console.log('✅ Resend test successful!');
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Resend test failed:', error.message || JSON.stringify(error));
      return false;
    }
  } catch (error) {
    console.error('❌ Resend test failed:', error.message);
    return false;
  }
}

async function testBrevo() {
  console.log('🔍 Testing Brevo API...');

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.log('⚠️  BREVO_API_KEY or BREVO_SENDER_EMAIL not configured, skipping...');
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'نظام هـدس', email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: testEmail }],
        subject: 'اختبار إرسال البريد - Brevo',
        htmlContent: '<h1>اختبار ناجح!</h1><p>تم إرسال هذه الرسالة عبر Brevo API بنجاح.</p>'
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('✅ Brevo test successful!');
      return true;
    } else {
      console.error('❌ Brevo test failed:', result.message || JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error('❌ Brevo test failed:', error.message);
    return false;
  }
}

async function testSendGrid() {
  console.log('🔍 Testing SendGrid API...');

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_SENDER_EMAIL) {
    console.log('⚠️  SENDGRID_API_KEY or SENDGRID_SENDER_EMAIL not configured, skipping...');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SENDGRID_API_KEY
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: testEmail }] }],
        from: { email: process.env.SENDGRID_SENDER_EMAIL, name: 'نظام هـدس' },
        subject: 'اختبار إرسال البريد - SendGrid',
        content: [{ type: 'text/html', value: '<h1>اختبار ناجح!</h1><p>تم إرسال هذه الرسالة عبر SendGrid API بنجاح.</p>' }]
      })
    });

    if (response.ok) {
      console.log('✅ SendGrid test successful!');
      return true;
    } else {
      const result = await response.json();
      console.error('❌ SendGrid test failed:', result.errors || result.message || JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error('❌ SendGrid test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log(`📧 Testing email delivery to: ${testEmail}\n`);

  const results = await Promise.all([
    testResend(),
    testBrevo(),
    testSendGrid(),
    testSMTP()
  ]);

  const successful = results.filter(Boolean).length;

  console.log(`\n📊 Results: ${successful}/${results.length} email providers working`);

  if (successful === 0) {
    console.log('\n❌ No email providers are working!');
    console.log('🔧 Check your .env configuration and try again.');
    console.log('📖 See EMAIL_SETUP.md for detailed instructions.');
  } else {
    console.log('\n✅ At least one email provider is working!');
    console.log('📬 Check your inbox (and spam folder) for test emails.');
  }
}

main().catch(console.error);
