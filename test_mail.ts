import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testMail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
  });

  try {
    console.log('Attempting to send test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"نظام إدارة هـدس" <no-reply@hadas.com>',
      to: 'anabilnet50@gmail.com', // Sending to self as test
      subject: 'إختبار إرسال البريد - نظام هـدس',
      html: '<b>هذه رسالة اختبار للتأكد من عمل نظام الإشعارات.</b>'
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testMail();
