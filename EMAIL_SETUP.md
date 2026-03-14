# إعداد البريد الإلكتروني للموقع

## المشكلة
إذا كنت تواجه مشكلة في عدم وصول رسائل البريد (مثل نسيت كلمة المرور أو إضافة مستخدم جديد)، فهذا يعني أن إعدادات البريد غير مكتملة.

## الحل السريع
الموقع يدعم عدة خدمات بريد مختلفة. اختر **واحدة فقط** من الخيارات أدناه واتبع الخطوات.

### الخطوة 1: اختر خدمة البريد
1. **Gmail API** (الأفضل للاستخدام الشخصي)
2. **Brevo** (الأفضل إذا لم يكن لديك دومين)
3. **SendGrid** (قوي وموثوق)
4. **MailerSend** (يتطلب دومين)
5. **Resend** (بسيط وسريع)
6. **SMTP** (الخيار الأخير)

### الخطوة 2: إعداد المتغيرات
انسخ `.env.example` إلى `.env` وأضف المتغيرات المطلوبة:

```bash
cp .env.example .env
```

### الخطوة 3: اختبار الإعداد
1. شغّل الموقع: `npm run dev`
2. اذهب إلى لوحة التحكم → إعدادات البريد
3. استخدم `/api/admin/email-status` لرؤية الحالة
4. استخدم `/api/admin/test-email` لإرسال رسالة اختبار

## تفاصيل كل خدمة

### Gmail API (موصى به)
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد
3. فعّل Gmail API
4. أنشئ OAuth 2.0 Client ID
5. احصل على Refresh Token
6. أضف إلى `.env`:
```
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_SENDER_EMAIL=your-email@gmail.com
```

### Brevo (سهل الإعداد)
1. سجّل في [Brevo](https://brevo.com)
2. احصل على API Key v3
3. أضف إلى `.env`:
```
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=your-verified-email@gmail.com
```

### SendGrid
1. سجّل في [SendGrid](https://sendgrid.com)
2. احصل على API Key
3. أضف إلى `.env`:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
SENDGRID_SENDER_EMAIL=your-verified-email@gmail.com
```

### Resend
1. سجّل في [Resend](https://resend.com)
2. احصل على API Key
3. أضف إلى `.env`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### MailerSend
1. سجّل في [MailerSend](https://mailersend.com)
2. احصل على API Key
3. أضف إلى `.env`:
```
MAILERSEND_API_KEY=mlsn.xxxxxxxxxxxxxxxxxxxx
MAILERSEND_SENDER_EMAIL=noreply@yourdomain.com
```

### SMTP (إذا فشل كل شيء)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

## استكشاف الأخطاء

### الرسائل لا تصل
1. تحقق من مجلد السبام
2. تأكد من صحة عنوان البريد المستلم
3. راجع السجلات (console logs) للأخطاء

### خطأ في API
- تأكد من صحة المفاتيح
- تحقق من حدود الإرسال اليومية
- راجع وثائق الخدمة

### مشاكل أخرى
استخدم endpoints التشخيص:
- `GET /api/admin/email-status` - لرؤية الإعدادات
- `POST /api/admin/test-email` - لاختبار الإرسال

## ملاحظات مهمة
- **لا تستخدم أكثر من خدمة واحدة** في نفس الوقت
- **احفظ المفاتيح بأمان** ولا تشاركها
- **اختبر دائماً** بعد التغيير
- **راجع حدود الإرسال** لكل خدمة (معظمها مجاني لعدد محدود)