
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

dotenv.config();

const to = 'abdullahnabilhail@gmail.com';
const subject = 'اختبار تقني شامل لنظام البريد - هدس';
const html = `<h1>اختبار الموثوقية</h1><p>هذه رسالة لاختبار كافة مزودي الخدمة المتاحين.</p><p>الوقت: ${new Date().toISOString()}</p>`;

async function testEmail() {
    console.log('--- بدء اختبار أنظمة البريد ---');
    
    // 1. Check SendGrid
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_SENDER_EMAIL) {
        console.log('Testing SendGrid...');
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: process.env.SENDGRID_SENDER_EMAIL, name: 'نظام هـدس' },
                    subject: subject,
                    content: [{ type: 'text/html', value: html }]
                })
            });
            const text = await response.text();
            console.log(`SendGrid Status: ${response.status} ${response.statusText}`);
            console.log(`SendGrid Response: ${text || '(empty)'}`);
        } catch (e) {
            console.error('SendGrid Error:', e.message);
        }
    } else {
        console.log('SendGrid not configured.');
    }

    // 2. Check SMTP (Nodemailer)
    if (process.env.SMTP_HOST) {
        console.log('Testing SMTP...');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        try {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to,
                subject,
                html
            });
            console.log('SMTP Sent:', info.messageId);
        } catch (e) {
            console.error('SMTP Error:', e.message);
        }
    } else {
        console.log('SMTP not configured.');
    }
}

testEmail();
