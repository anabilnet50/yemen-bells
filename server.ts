import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import db, { initDb } from "./db.ts";

// --- Security Helpers ---
const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return password === storedHash; // Fallback for old plain-text passwords
  const verifyHash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// --- Link Protection Helper ---
const containsLink = (text: string) => {
  if (!text) return false;
  // Regex to detect common URL patterns, including domains without protocols
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|net|org|edu|gov|io|co|me|ai|app|xyz|info|biz|site|online|tech|website|store|shop|link|click|tk|ml|ga|cf|gq|pw|ws|fun|space|top|vip|icu|win|bid|loan|host|live|mobi|name|pro|tel|pub|news|blog|xyz|icu|top))/gi;
  return urlPattern.test(text);
};

// Rate limiting for public actions (In-memory)
const publicRateLimits = new Map<string, { count: number, lastReset: number }>();
const checkRateLimit = (ip: string, limit: number = 5, windowMs: number = 60000) => {
  const now = Date.now();
  const limitData = publicRateLimits.get(ip) || { count: 0, lastReset: now };

  if (now - limitData.lastReset > windowMs) {
    limitData.count = 1;
    limitData.lastReset = now;
  } else {
    limitData.count++;
  }

  publicRateLimits.set(ip, limitData);
  return limitData.count <= limit;
};

// --- Auth Secret ---
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

const TOKEN_EXPIRY_SECONDS = Number(process.env.AUTH_TOKEN_EXPIRY_SEC || '3600'); // default 1 hour

const signToken = (payload: any) => {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  };
  const data = JSON.stringify(tokenPayload);
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  return Buffer.from(`${data}.${signature}`).toString('base64');
};

const verifyToken = (token: string) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [data, signature] = decoded.split('.');
    const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
    if (signature !== expectedSignature) return null;
    const parsed = JSON.parse(data);
    const now = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp === 'number' && parsed.exp < now) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

// Ensure uploads directory exists
const uploadDir = process.env.UPLOADS_PATH || path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration using memory storage for direct DB upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // max 5 MB per upload
  },
    fileFilter: (req, file, cb: any) => {
      // Allow images only (prevent arbitrary file uploads)
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image uploads are allowed'), false);
      }
    cb(null, true);
  }
});

async function startServer() {
  const app = express();
  app.set('trust proxy', true); // Trust reverse proxy headers like Cloudflare or Nginx X-Forwarded-For
  const PORT = Number(process.env.PORT) || 3000;

  // Helper to reliably extract real IP
  const getClientIp = (req: any): string => {
      let ipAddress = '127.0.0.1';
      
      const forwardedIpsStr = req.headers['x-forwarded-for'];
      if (forwardedIpsStr) {
         // 'x-forwarded-for' can be a comma-separated list, the first is the original client
         ipAddress = forwardedIpsStr.split(',')[0].trim();
      } else if (req.headers['x-real-ip']) {
         ipAddress = req.headers['x-real-ip'];
      } else {
         ipAddress = String(req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1');
      }

      // Clean IPv6 mapped IPv4 (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
      if (ipAddress.startsWith('::ffff:')) {
          ipAddress = ipAddress.substring(7);
      }
      return ipAddress;
  };

  // Initialize DB
  await initDb();

  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: false, limit: '512kb' }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
  });

  // --- Email Helper (Gmail API / Brevo / MailerSend / Resend / SendGrid HTTP + NodeMailer Fallback) ---
  const sendSystemEmail = async (to: string, subject: string, html: string, username: string = '') => {
      console.log(`Attempting to send email to ${to} for user ${username}`);

      const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
      const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
      const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
      const GMAIL_USER = process.env.GMAIL_SENDER_EMAIL || process.env.SMTP_USER;

      // Log available email providers
      const availableProviders = [];
      if (GMAIL_CLIENT_ID) availableProviders.push('Gmail');
      if (process.env.SMTP_HOST) availableProviders.push('SMTP');

      console.log(`Available email providers: ${availableProviders.join(', ') || 'None'}`);
      
      let lastError = '';

      // 0. Try Gmail API (Ultimate fix for Render + Gmail)
      if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
          try {
              // 0a. Get Access Token
              const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      client_id: GMAIL_CLIENT_ID,
                      client_secret: GMAIL_CLIENT_SECRET,
                      refresh_token: GMAIL_REFRESH_TOKEN,
                      grant_type: 'refresh_token'
                  })
              });
              const tokenData = await tokenResponse.json();
              if (!tokenResponse.ok) throw new Error(`Token Error: ${tokenData.error_description || tokenData.error}`);
              
              const accessToken = tokenData.access_token;
              
              // 0b. Construct Email
              const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
              const utf8FromName = `=?utf-8?B?${Buffer.from('موقع هـدس').toString('base64')}?=`;
              const messageParts = [
                  `From: "${utf8FromName}" <${GMAIL_USER}>`,
                  `To: ${to}`,
                  `Content-Type: text/html; charset=utf-8`,
                  `MIME-Version: 1.0`,
                  `Subject: ${utf8Subject}`,
                  '',
                  html
              ];
              const message = messageParts.join('\n');
              const encodedMessage = Buffer.from(message)
                  .toString('base64')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_')
                  .replace(/=+$/, '');

              // 0c. Send
              const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ raw: encodedMessage })
              });

              if (sendResponse.ok) {
                  const msg = `Email sent via Gmail API to ${to} for user ${username}`;
                  console.log(msg);
                  await logAction(null, 'نظام البريد', `نجح الإرسال عبر Gmail API إلى ${to}`);
                  return true;
              } else {
                  const sendData = await sendResponse.json();
                  lastError = `Gmail API Error: ${JSON.stringify(sendData)}`;
                  console.warn(lastError, 'Trying next method...');
              }
          } catch (gmailErr: any) {
              lastError = `Gmail API failed: ${gmailErr.message}`;
              console.warn(lastError, 'Trying next method...');
          }
      }
      
      // Note: Other providers (Brevo, MailerSend, Resend, SendGrid) removed for clean focus on Gmail API.

      // 5. Fallback to SMTP
      try {
          const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 10000,
            socketTimeout: 15000,
            family: 4
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || '"نظام هـدس" <no-reply@hadas.com>',
            to: to,
            subject: subject,
            html: html
          });
          const msg = `Email sent via SMTP to ${to} for user ${username}`;
          console.log(msg);
          await logAction(null, 'نظام البريد', `نجح الإرسال عبر SMTP إلى ${to}`);
          return true;
      } catch (smtpErr: any) {
          let diagnostic = '';
          if (!GMAIL_CLIENT_ID) 
              diagnostic = 'GMAIL_CLIENT_ID not found in environment. ';
          
          const fullError = `${diagnostic}${lastError ? lastError + ' | ' : ''}SMTP Error: ${smtpErr.message}`;
          console.error(`CRITICAL: All email methods failed for ${to}:`, fullError);
          await logAction(null, 'خطأ بريد', `فشل إرسال البريد لـ ${to}: ${fullError}`);
          return false;
      }
  };

  app.use("/uploads", express.static(uploadDir));

  // --- Auth & Audit Helpers ---
  const logAction = async (userId: number | null, action: string, details: string) => {
    try {
      await db.query("INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)", [userId, action, details]);
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const token = authHeader.split(" ")[1];
      const decodedUser = verifyToken(token);
      if (!decodedUser) return res.status(401).json({ error: "Invalid or expired token" });
      req.user = decodedUser;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const normalizePermissions = (perms: any): string[] => {
    try {
      if (Array.isArray(perms)) return perms;
      if (typeof perms === 'string') return JSON.parse(perms);
      return [];
    } catch (e) {
      return [];
    }
  };

  const checkBlockedIp = async (req: any, res: any, next: any) => {
    const ipStr = getClientIp(req);
    const { rows } = await db.query("SELECT * FROM blocked_ips WHERE ip_address = $1", [ipStr]);
    if (rows.length > 0) {
      return res.status(403).json({ error: "تم حظر عنوان الـ IP الخاص بك لأسباب أمنية. يرجى التواصل مع الإدارة." });
    }
    next();
  };

  // --- API Routes ---

  // --- Failed Login Tracker (In-memory) ---
  const failedAttempts = new Map<string, number>();

  // Auth
  app.post("/api/auth/login", checkBlockedIp, async (req, res) => {
    const ipStr = getClientIp(req);

    // Basic brute-force protection
    if (!checkRateLimit(ipStr, 10, 60_000)) {
      return res.status(429).json({ error: "Too many login attempts. Please wait a minute." });
    }

    let { username, password } = req.body;
    if (username) username = username.trim().toLowerCase();

    const { rows } = await db.query("SELECT id, username, password, full_name, role, permissions, requires_password_change FROM system_users WHERE username = $1", [username]);
    const user = rows[0];

    if (user && verifyPassword(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      userWithoutPassword.permissions = normalizePermissions(userWithoutPassword.permissions);
      const token = signToken({ id: user.id, username: user.username });

      // Reset failed attempts on success
      failedAttempts.delete(ipStr);

      await logAction(user.id, 'تسجيل دخول', `تم تسجيل الدخول بنجاح من IP: ${ipStr}`);
      res.json({ token, user: userWithoutPassword, requiresPasswordChange: user.requires_password_change });
    } else {
      // Increment failed attempts
      const attempts = (failedAttempts.get(ipStr) || 0) + 1;
      failedAttempts.set(ipStr, attempts);

      await logAction(null, 'محاولة دخول فاشلة', `محاولة دخول باسم المستخدم: ${username} من IP: ${ipStr}`);

      // Raise a high-priority security alert if threshold reached
      if (attempts >= 5) {
        await logAction(null, 'تنبيه أمني', `⚠️ محاولات دخول متكررة فاشلة (${attempts}) من عنوان IP: ${ipStr}. يرجى التحقق من الأمان.`);
      }

      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
  });

  // --- API Routes ---

  // Request to change password with active session
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." });
    
    try {
      const hashedPassword = hashPassword(newPassword);
      await db.query("UPDATE system_users SET password = $1, requires_password_change = false WHERE id = $2", [hashedPassword, (req as any).user.id]);
      await logAction((req as any).user.id, 'تغيير كلمة المرور', 'تم تغيير كلمة المرور الإجبارية أو الطوعية بنجاح.');
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // --- IP Banning Management ---
  app.get("/api/admin/blocked-ips", requireAuth, async (req, res) => {
    const { rows } = await db.query("SELECT * FROM blocked_ips ORDER BY created_at DESC");
    res.json(rows);
  });

  app.post("/api/admin/blocked-ips", requireAuth, async (req, res) => {
    const { ip_address, reason } = req.body;
    try {
      await db.query("INSERT INTO blocked_ips (ip_address, reason) VALUES ($1, $2)", [ip_address, reason]);
      await logAction((req as any).user.id, 'حظر IP', `تم حظر العنوان: ${ip_address} | السبب: ${reason}`);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "IP address already blocked or invalid" });
    }
  });

  app.delete("/api/admin/blocked-ips/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { rows: existing } = await db.query("SELECT ip_address FROM blocked_ips WHERE id = $1", [id]);
    if (existing.length > 0) {
      await db.query("DELETE FROM blocked_ips WHERE id = $1", [id]);
      await logAction((req as any).user.id, 'إلغاء حظر IP', `تم إلغاء حظر العنوان: ${existing[0].ip_address}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "IP not found" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const { rows } = await db.query("SELECT id, username, full_name, role, permissions, requires_password_change FROM system_users WHERE id = $1", [(req as any).user.id]);
      if (rows.length > 0) {
        const user = rows[0];
        user.permissions = normalizePermissions(user.permissions);
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Forgot Password
  // ... (rest of forgot password routes)
  app.post("/api/auth/forgot-password", async (req, res) => {
    let { email } = req.body;
    if (email) email = email.trim().toLowerCase();
    try {
      const { rows } = await db.query("SELECT id, username, email FROM system_users WHERE email = $1 OR username = $1", [email]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await db.query(
        "UPDATE system_users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
        [code, expiry, rows[0].id]
      );

      // Simulated sending - returning the code to the frontend for practical testing/usage
      // Log action for verification (Production clean)
      // Verification Code for ${email}/${rows[0].username} generated

      const mailHtml = `
            <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2>مرحباً ${rows[0].username}،</h2>
              <p>لقد طلبنا إعادة تعيين كلمة المرور لحسابك في <b>نظام هـدس</b>.</p>
              <div style="background: #f4f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>رمز التحقق الخاص بك هو:</strong></p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; text-align: center; margin: 20px 0;">
                  ${code}
                </div>
                <p style="font-size: 14px; color: #666;">رمز التحقق هذا صالح لمدة ساعة واحدة فقط.</p>
              </div>
              <p style="color: #666; font-size: 14px;">إذا لم تقم بطلب هذا، يرجى تجاهل هذه الرسالة أو التواصل مع الإدارة.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
              <p style="color: #999; font-size: 12px;">رسالة تلقائية مقدّمة من نظام هـدس الإخباري.</p>
            </div>
          `;

      await sendSystemEmail(rows[0].email, 'رمز التحقق لاستعادة كلمة المرور - نظام هـدس', mailHtml, rows[0].username);

      res.json({ message: "تم إصدار رمز التحقق بنجاح وإرساله إلى البريد الإلكتروني" });
    } catch (e) {
      console.error('Error in forgot password:', e);
      res.status(500).json({ error: "حدث خطأ داخلي" });
    }
  });

  // Verify Code
  app.post("/api/auth/verify-code", async (req, res) => {
    let { email, code } = req.body;
    if (email) email = email.trim().toLowerCase();
    if (code) code = code.trim();
    try {
      const { rows } = await db.query(
        "SELECT id FROM system_users WHERE (email = $1 OR username = $1) AND reset_token = $2 AND reset_token_expiry > NOW()",
        [email, code]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: "رمز التحقق غير صحيح أو انتهت صلاحيته" });
      }

      res.json({ message: "تم التحقق بنجاح" });
    } catch (e) {
      res.status(500).json({ error: "حدث خطأ داخلي" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    let { email, code, newPassword } = req.body;
    if (email) email = email.trim().toLowerCase();
    if (code) code = code.trim();
    try {
      const { rows } = await db.query(
        "SELECT id FROM system_users WHERE (email = $1 OR username = $1) AND reset_token = $2 AND reset_token_expiry > NOW()",
        [email, code]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: "رمز التحقق غير صحيح أو انتهت صلاحيته" });
      }

      const hashedPassword = hashPassword(newPassword);
      await db.query(
        "UPDATE system_users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
        [hashedPassword, rows[0].id]
      );

      res.json({ message: "تم تحديث كلمة المرور بنجاح" });
    } catch (e) {
      res.status(500).json({ error: "حدث خطأ داخلي" });
    }
  });

  // Admin Users
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const { rows } = await db.query("SELECT id, username, full_name, email, role, permissions, created_at FROM system_users ORDER BY id DESC");
    const users = rows.map(u => {
      u.permissions = normalizePermissions(u.permissions);
      return u;
    });
    res.json(users);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    let { username, password, full_name, email, role, permissions } = req.body;
    if (username) username = username.trim().toLowerCase();
    if (email) email = email.trim().toLowerCase();
    try {
      let isAutoGenerated = false;
      if (!password) {
        // Generate a 6-digit random numeric code
        password = Math.floor(100000 + Math.random() * 900000).toString();
        isAutoGenerated = true;
      }

      const permsString = Array.isArray(permissions) ? JSON.stringify(permissions) : '[]';
      const hashedPassword = hashPassword(password);
      const { rows } = await db.query(
        "INSERT INTO system_users (username, password, full_name, email, role, permissions, requires_password_change) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [username, hashedPassword, full_name, email, role || 'editor', permsString, isAutoGenerated]
      );

      if (email) {
          const userMailHtml = `
            <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2>مرحباً ${full_name}،</h2>
              <p>تم إنشاء حساب جديد لك في لوحة تحكم موقع <b>هـدس</b>.</p>
              <div style="background: #f4f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>الرابط:</strong> <a href="${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin">${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin</a></p>
                <p><strong>اسم المستخدم:</strong> ${username}</p>
                <p><strong>رمز التحقق (للدخول لأول مرة):</strong> <code style="background:#e2e8f0;padding:2px 10px;border-radius:4px;font-size:24px;color:#2563eb;font-weight:bold;">${password}</code></p>
              </div>
              <p style="color: #666; font-size: 14px;">يرجى استخدام هذا الرمز لتسجيل الدخول، وسيُطلب منك تعيين كلمة مرور خاصة بك فور الدخول.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
              <p style="color: #999; font-size: 12px;">رسالة تلقائية مقدّمة من نظام هـدس الإخباري.</p>
            </div>
          `;
          await sendSystemEmail(email, 'رمز التحقق للدخول لأول مرة - نظام هـدس', userMailHtml, username);
      }
      await logAction((req as any).user.id, 'إضافة مستخدم', `تم إضافة المستخدم: ${username}`);
      res.json({ id: rows[0].id });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, async (req, res) => {
    const { username, password, full_name, email, role, permissions } = req.body;
    const { id } = req.params;

    // Only admins can update users
    const currentUser = await db.query("SELECT role FROM system_users WHERE id = $1", [(req as any).user.id]);
    if (currentUser.rows[0].role !== 'admin') {
      return res.status(403).json({ error: "Permission denied" });
    }

    try {
      const permsString = Array.isArray(permissions) ? JSON.stringify(permissions) : '[]';
      if (password) {
        const hashedPassword = hashPassword(password);
        await db.query(
          "UPDATE system_users SET username = $1, password = $2, full_name = $3, email = $4, role = $5, permissions = $6 WHERE id = $7",
          [username, hashedPassword, full_name, email, role, permsString, id]
        );
      } else {
        await db.query(
          "UPDATE system_users SET username = $1, full_name = $2, email = $3, role = $4, permissions = $5 WHERE id = $6",
          [username, full_name, email, role, permsString, id]
        );
      }
      await logAction((req as any).user.id, 'تعديل مستخدم', `تم تعديل المستخدم رقم: ${id}`);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Error updating user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    // Only admins can delete users
    const currentUser = await db.query("SELECT role FROM system_users WHERE id = $1", [(req as any).user.id]);
    if (currentUser.rows[0].role !== 'admin') {
      return res.status(403).json({ error: "Permission denied" });
    }

    // Prevent self-deletion
    if (Number(id) === (req as any).user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    await db.query("DELETE FROM system_users WHERE id = $1", [id]);
    await logAction((req as any).user.id, 'حذف مستخدم', `تم حذف المستخدم رقم: ${id}`);
    res.json({ success: true });
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", requireAuth, async (req, res) => {
    const { user_id, startDate, endDate } = req.query;

    let query = `
      SELECT audit_logs.*, system_users.full_name as user_name 
      FROM audit_logs 
      LEFT JOIN system_users ON audit_logs.user_id = system_users.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND audit_logs.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND audit_logs.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      // Add 1 day to end date to include the whole day
      query += ` AND audit_logs.created_at <= (cast($${paramIndex} as timestamp) + interval '1 day')`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    // Only limit if no filters are applied to prevent massive data load, otherwise show full report
    if (!user_id && !startDate && !endDate) {
      query += ` LIMIT 100`;
    }

    try {
      const { rows } = await db.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching audit logs", error);
      res.status(500).json({ error: "Error fetching audit logs" });
    }
  });

  // Upload Route (Database Storage)
  app.post("/api/upload", requireAuth, upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(req.file.originalname);

    try {
      await db.query(
        "INSERT INTO media_storage (filename, mimetype, data) VALUES ($1, $2, $3)",
        [filename, req.file.mimetype, req.file.buffer]
      );

      const imageUrl = `/api/media/${filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error storing image:", error);
      res.status(500).json({ error: "Failed to store image in database" });
    }
  });

  // Serve Media from Database
  app.get("/api/media/:filename", async (req, res) => {
    try {
      const { rows } = await db.query(
        "SELECT mimetype, data FROM media_storage WHERE filename = $1",
        [req.params.filename]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader('Content-Type', rows[0].mimetype);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(rows[0].data);
    } catch (error) {
      console.error("Error retrieving media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Combined initialization endpoint for performance
  app.get("/api/init", async (req, res) => {
    try {
      const [articles, categories, settings, ads] = await Promise.all([
        db.query(`
          SELECT articles.*, categories.name as category_name, categories.slug as category_slug, writers.name as writer_name, writers.image_url as writer_image
          FROM articles 
          LEFT JOIN categories ON articles.category_id = categories.id
          LEFT JOIN writers ON articles.writer_id = writers.id
          WHERE articles.is_deleted = 0
          ORDER BY created_at DESC
          LIMIT 100
        `),
        db.query("SELECT * FROM categories"),
        db.query("SELECT * FROM settings"),
        db.query("SELECT * FROM ads WHERE is_active = 1")
      ]);

      const settingsMap = settings.rows.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      res.json({
        articles: articles.rows,
        categories: categories.rows,
        settings: settingsMap,
        ads: ads.rows
      });
    } catch (error) {
      console.error("Initialization error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Articles
  app.get("/api/articles", async (req, res) => {
    const { category, limit, includeDeleted } = req.query;
    let query = `
      SELECT articles.*, categories.name as category_name, categories.slug as category_slug, writers.name as writer_name, writers.image_url as writer_image
      FROM articles 
      LEFT JOIN categories ON articles.category_id = categories.id
      LEFT JOIN writers ON articles.writer_id = writers.id
    `;
    const params: any[] = [];

    // Filter by deletion status (default: only show non-deleted)
    query += ` WHERE (articles.is_deleted = $${params.length + 1})`;
    params.push(includeDeleted === 'true' ? 1 : 0);

    if (category) {
      query += ` AND categories.slug = $${params.length + 1}`;
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(Number(limit));
    }

    const { rows } = await db.query(query, params);
    res.json(rows);
  });

  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { rows } = await db.query(`
      SELECT articles.*, categories.name as category_name, categories.slug as category_slug 
      FROM articles 
      LEFT JOIN categories ON articles.category_id = categories.id
      WHERE articles.title ILIKE $1 OR articles.content ILIKE $2
      ORDER BY created_at DESC
    `, [`%${q}%`, `%${q}%`]);
    res.json(rows);
  });

  app.get("/api/articles/:id", async (req, res) => {
    await db.query("UPDATE articles SET views = views + 1 WHERE id = $1", [req.params.id]);

    const [articleRes, adsRes, settingsRes] = await Promise.all([
      db.query(`
        SELECT articles.*, categories.name as category_name, categories.slug as category_slug, writers.name as writer_name, writers.bio as writer_bio, writers.image_url as writer_image
        FROM articles 
        LEFT JOIN categories ON articles.category_id = categories.id 
        LEFT JOIN writers ON articles.writer_id = writers.id
        WHERE articles.id = $1
      `, [req.params.id]),
      db.query("SELECT * FROM ads WHERE is_active = 1"),
      db.query("SELECT * FROM settings")
    ]);

    const article = articleRes.rows[0];
    if (!article) return res.status(404).json({ error: "Article not found" });

    const settingsMap = settingsRes.rows.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json({
      article,
      ads: adsRes.rows,
      settings: settingsMap
    });
  });

  app.post("/api/articles", requireAuth, async (req, res) => {
    const { title, content, category_id, image_url, video_url, is_urgent, tags, writer_id, is_active } = req.body;
    const res_db = await db.query(`
      INSERT INTO articles (title, content, category_id, image_url, video_url, is_urgent, tags, writer_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags, writer_id || null, is_active !== undefined ? (is_active ? 1 : 0) : 1]);
    await logAction((req as any).user.id, 'إضافة خبر', `تم إضافة الخبر: ${title}`);
    res.json({ id: res_db.rows[0].id });
  });

  app.put("/api/articles/:id", requireAuth, async (req, res) => {
    const { title, content, category_id, image_url, video_url, is_urgent, tags, writer_id, is_active } = req.body;

    // Fetch old title for logging if needed or just use the new one
    await db.query(`
      UPDATE articles 
      SET title = $1, content = $2, category_id = $3, image_url = $4, video_url = $5, is_urgent = $6, tags = $7, writer_id = $8, is_active = $9
      WHERE id = $10
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags, writer_id || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]);

    await logAction((req as any).user.id, 'تعديل خبر', `تم تعديل الخبر: ${title} (رقم: ${req.params.id})`);
    res.json({ success: true });
  });

  app.delete("/api/articles/:id", requireAuth, async (req, res) => {
    const { permanent } = req.query;
    const { rows } = await db.query("SELECT title FROM articles WHERE id = $1", [req.params.id]);
    const articleTitle = rows[0]?.title || "غير معروف";

    if (permanent === 'true') {
      await db.query("DELETE FROM articles WHERE id = $1", [req.params.id]);
      await logAction((req as any).user.id, 'حذف نهائي للخبر', `تم حذف الخبر نهائياً: ${articleTitle} (رقم: ${req.params.id})`);
    } else {
      await db.query("UPDATE articles SET is_deleted = 1 WHERE id = $1", [req.params.id]);
      await logAction((req as any).user.id, 'حذف خبر', `تم نقل الخبر للمحذوفات: ${articleTitle} (رقم: ${req.params.id})`);
    }
    res.json({ success: true });
  });

  app.post("/api/articles/:id/restore", requireAuth, async (req, res) => {
    const { rows } = await db.query("SELECT title FROM articles WHERE id = $1", [req.params.id]);
    const articleTitle = rows[0]?.title || "غير معروف";

    await db.query("UPDATE articles SET is_deleted = 0 WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'استعادة خبر', `تم استعادة الخبر: ${articleTitle} (رقم: ${req.params.id})`);
    res.json({ success: true });
  });

  app.patch("/api/articles/:id/status", requireAuth, async (req, res) => {
    const { is_active } = req.body;
    await db.query("UPDATE articles SET is_active = $1 WHERE id = $2", [is_active ? 1 : 0, req.params.id]);
    await logAction((req as any).user.id, 'تغيير حالة الخبر', `تم تغيير حالة الخبر رقم: ${req.params.id} إلى ${is_active ? 'مفعل' : 'معطل'}`);
    res.json({ success: true });
  });

  // Bulk Trash Operations
  app.post("/api/articles/bulk/trash", requireAuth, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

    await db.query("UPDATE articles SET is_deleted = 1 WHERE id = ANY($1)", [ids]);
    await logAction((req as any).user.id, 'نقل مجموعة أخبار للمحذوفات', `تم نقل عدد ${ids.length} أخبار إلى سلة المحذوفات`);
    res.json({ success: true });
  });

  app.post("/api/articles/bulk/restore", requireAuth, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

    await db.query("UPDATE articles SET is_deleted = 0 WHERE id = ANY($1)", [ids]);
    await logAction((req as any).user.id, 'استعادة مجموعة أخبار', `تم استعادة عدد ${ids.length} أخبار من المحذوفات`);
    res.json({ success: true });
  });

  app.post("/api/articles/bulk/delete", requireAuth, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

    await db.query("DELETE FROM articles WHERE id = ANY($1)", [ids]);
    await logAction((req as any).user.id, 'حذف نهائي لمجموعة أخبار', `تم حذف عدد ${ids.length} أخبار نهائياً`);
    res.json({ success: true });
  });

  app.delete("/api/articles/trash/empty", requireAuth, async (req, res) => {
    const { rows } = await db.query("SELECT COUNT(*) FROM articles WHERE is_deleted = 1");
    const count = rows[0].count;
    await db.query("DELETE FROM articles WHERE is_deleted = 1");
    await logAction((req as any).user.id, 'تفريغ سلة المحذوفات', `تم تفريغ السلة وحذف ${count} خبر نهائياً`);
    res.json({ success: true });
  });

  // Writers
  app.get("/api/writers", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM writers ORDER BY name ASC");
    res.json(rows);
  });

  app.post("/api/writers", requireAuth, async (req, res) => {
    const { name, bio, image_url } = req.body;
    const { rows } = await db.query("INSERT INTO writers (name, bio, image_url) VALUES ($1, $2, $3) RETURNING id", [name, bio, image_url]);
    await logAction((req as any).user.id, 'إضافة كاتب', `تم إضافة الكاتب: ${name}`);
    res.json({ id: rows[0].id });
  });

  app.put("/api/writers/:id", requireAuth, async (req, res) => {
    const { name, bio, image_url } = req.body;
    await db.query("UPDATE writers SET name = $1, bio = $2, image_url = $3 WHERE id = $4", [name, bio, image_url, req.params.id]);
    await logAction((req as any).user.id, 'تعديل كاتب', `تم تعديل الكاتب رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  app.delete("/api/writers/:id", requireAuth, async (req, res) => {
    await db.query("DELETE FROM writers WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'حذف كاتب', `تم حذف الكاتب رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  // Ads
  app.get("/api/ads", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM ads ORDER BY id DESC");
    res.json(rows);
  });

  app.post("/api/ads", requireAuth, async (req, res) => {
    const { title, image_url, link_url, adsense_code, position, is_active, start_date, end_date } = req.body;
    const { rows } = await db.query(
      "INSERT INTO ads (title, image_url, link_url, adsense_code, position, is_active, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [title, image_url, link_url, adsense_code, position, is_active ? 1 : 0, start_date || null, end_date || null]
    );
    await logAction((req as any).user.id, 'إضافة إعلان', `تم إضافة الإعلان: ${title}`);
    res.json({ id: rows[0].id });
  });

  app.put("/api/ads/:id", requireAuth, async (req, res) => {
    const { title, image_url, link_url, adsense_code, position, is_active, start_date, end_date } = req.body;
    await db.query(
      "UPDATE ads SET title = $1, image_url = $2, link_url = $3, adsense_code = $4, position = $5, is_active = $6, start_date = $7, end_date = $8 WHERE id = $9",
      [title, image_url, link_url, adsense_code, position, is_active ? 1 : 0, start_date || null, end_date || null, req.params.id]
    );
    await logAction((req as any).user.id, 'تعديل إعلان', `تم تعديل الإعلان رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  app.delete("/api/ads/:id", requireAuth, async (req, res) => {
    await db.query("DELETE FROM ads WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'حذف إعلان', `تم حذف الإعلان رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  // Comments
  app.get("/api/articles/:id/comments", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  });

  app.get("/api/comments", async (req, res) => {
    const { rows } = await db.query(`
      SELECT comments.*, articles.title as article_title 
      FROM comments 
      JOIN articles ON comments.article_id = articles.id 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  });

  app.post("/api/admin/history", async (req, res) => {
    const { action, details } = req.body;
    const ipStr = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await logAction((req as any).user.id, action, `${details} (IP: ${ipStr}, Browser: ${userAgent})`);
    res.json({ success: true });
  });

  app.post("/api/articles/:id/comments", async (req, res) => {
    const { name, content } = req.body;
    const clientIp = getClientIp(req);

    // Rate Limiting
    if (!checkRateLimit(clientIp, 3, 60000)) {
      return res.status(429).json({ error: "لقد تجاوزت الحد المسموح من التعليقات. يرجى الانتظار دقيقة." });
    }

    // Link Protection
    if (containsLink(name) || containsLink(content)) {
      await logAction(null, 'محاولة تعليق مشبوهة', `تم حظر تعليق يحتوي على روابط من IP: ${clientIp}`);
      return res.status(400).json({ error: "عذراً، لا يُسمح بإضافة روابط في التعليقات أو الأسماء." });
    }

    await db.query("INSERT INTO comments (article_id, name, content) VALUES ($1, $2, $3)", [req.params.id, name, content]);
    res.json({ success: true });
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    await db.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'حذف تعليق', `تم حذف التعليق رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  // Email Configuration Status (for debugging)
  app.get("/api/admin/email-status", requireAuth, async (req, res) => {
    const status = {
      gmail: {
        configured: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN),
        sender: process.env.GMAIL_SENDER_EMAIL || process.env.SMTP_USER
      },
      smtp: {
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.SMTP_FROM
      }
    };

    const configuredCount = Object.values(status).filter((s: any) => s.configured).length;
    (status as any).totalConfigured = configuredCount;

    res.json(status);
  });
  app.post("/api/admin/test-email", requireAuth, async (req, res) => {
    const { testEmail } = req.body;
    if (!testEmail) return res.status(400).json({ error: "Test email address required" });

    try {
      const testHtml = `
        <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>اختبار إرسال البريد</h2>
          <p>هذه رسالة اختبار من موقع هـدس.</p>
          <p>إذا وصلتك هذه الرسالة، فإن إعدادات البريد تعمل بشكل صحيح.</p>
          <p>الوقت: ${new Date().toLocaleString('ar-SA')}</p>
        </div>
      `;

      const success = await sendSystemEmail(testEmail, 'اختبار إرسال البريد - نظام هـدس', testHtml, 'اختبار');
      if (success) {
        res.json({ message: "تم إرسال رسالة الاختبار بنجاح" });
      } else {
        res.status(500).json({ error: "فشل في إرسال رسالة الاختبار - تحقق من السجلات للتفاصيل" });
      }
    } catch (e) {
      console.error('Test email error:', e);
      res.status(500).json({ error: "خطأ في اختبار البريد" });
    }
  });

  // Poll Comments with 48h Auto-Cleanup
  app.get("/api/poll/comments", async (req, res) => {
    try {
      // Auto-cleanup: delete comments older than 48 hours
      await db.query("DELETE FROM poll_comments WHERE created_at < NOW() - INTERVAL '48 hours'");

      const { rows } = await db.query("SELECT * FROM poll_comments ORDER BY created_at DESC");
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: "Error fetching poll comments" });
    }
  });

  app.delete("/api/admin/poll/comments", requireAuth, async (req, res) => {
    try {
      await db.query("DELETE FROM poll_comments");
      await logAction((req as any).user.id, 'مسح استطلاع الرأي', 'تم مسح كافة تعليقات استطلاع الرأي لبدء استطلاع جديد');
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Error clearing poll comments" });
    }
  });

  app.post("/api/poll/comments", async (req, res) => {
    const { name, content } = req.body;
    const finalName = name || 'زائر';
    const clientIp = String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress);

    if (!content) return res.status(400).json({ error: "Content is required" });

    // Rate Limiting
    if (!checkRateLimit(clientIp, 5, 60000)) {
      return res.status(429).json({ error: "يرجى الانتظار قليلاً قبل إرسال مشاركة أخرى." });
    }

    // Link Protection
    if (containsLink(finalName) || containsLink(content)) {
      await logAction(null, 'محاولة مشاركة مشبوهة في الاستطلاع', `تم حظر مشاركة تحتوي على روابط من IP: ${clientIp}`);
      return res.status(400).json({ error: "عذراً، لا يُسمح بإضافة روابط في المشاركات." });
    }

    try {
      await db.query("INSERT INTO poll_comments (name, content) VALUES ($1, $2)", [finalName, content]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Error posting poll comment" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM categories");
    res.json(rows);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    const { name, slug, background_url } = req.body;
    try {
      const res_db = await db.query("INSERT INTO categories (name, slug, background_url) VALUES ($1, $2, $3) RETURNING id", [name, slug, background_url]);
      await logAction((req as any).user.id, 'إضافة قسم', `تم إضافة القسم: ${name}`);
      res.json({ id: res_db.rows[0].id });
    } catch (e) {
      res.status(400).json({ error: "Category slug or name already exists" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    const { name, slug, background_url } = req.body;
    await db.query("UPDATE categories SET name = $1, slug = $2, background_url = $3 WHERE id = $4", [name, slug, background_url, req.params.id]);
    await logAction((req as any).user.id, 'تعديل قسم', `تم تعديل القسم رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    const count_res = await db.query("SELECT count(*) as count FROM articles WHERE category_id = $1", [req.params.id]);
    const count = Number(count_res.rows[0].count);
    if (count > 0) {
      return res.status(400).json({ error: "Cannot delete category with associated articles" });
    }
    await db.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'حذف قسم', `تم حذف القسم رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM settings");
    const settingsObj = rows.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    const settings = req.body;
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(settings)) {
        await client.query(`
          INSERT INTO settings (key, value) VALUES ($1, $2)
          ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
        `, [key, value]);
      }
      await client.query('COMMIT');
      await logAction((req as any).user.id, 'تعديل الإعدادات', 'تم تحديث إعدادات الموقع');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: "Error updating settings" });
    } finally {
      client.release();
    }
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      // Consolidate main counts into a single efficient query
      const statsQuery = await db.query(`
        SELECT 
          (SELECT count(*) FROM articles WHERE is_deleted = 0) as total_articles,
          (SELECT count(*) FROM articles WHERE is_urgent = 1 AND is_deleted = 0) as urgent_news,
          (SELECT sum(views) FROM articles WHERE is_deleted = 0) as total_views,
          (SELECT count(c.id) FROM comments c JOIN articles a ON c.article_id = a.id WHERE a.is_deleted = 0) as total_comments
      `);

      const categoryStats = await db.query(`
        SELECT c.name, count(a.id) as count 
        FROM categories c
        LEFT JOIN articles a ON c.id = a.category_id AND a.is_deleted = 0
        GROUP BY c.id, c.name
      `);

      const s = statsQuery.rows[0];
      res.json({
        totalArticles: Number(s.total_articles),
        urgentNews: Number(s.urgent_news),
        totalViews: Number(s.total_views) || 0,
        totalComments: Number(s.total_comments),
        categoryStats: categoryStats.rows
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Vite/Static
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    const clientDistPath = path.join(distPath, "client");

    // Check if client dist exists first, otherwise use dist directly
    const staticPath = fs.existsSync(clientDistPath) ? clientDistPath : distPath;

    app.use(express.static(staticPath));

    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
