import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import db, { initDb } from "./db.ts";

// --- Security Helpers ---
const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return password === storedHash; // Fallback for old plain-text passwords
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// --- Auth Secret ---
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

const signToken = (payload: any) => {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  return Buffer.from(`${data}.${signature}`).toString('base64');
};

const verifyToken = (token: string) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [data, signature] = decoded.split('.');
    const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
    if (signature !== expectedSignature) return null;
    return JSON.parse(data);
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
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB
  await initDb();

  app.use(express.json());
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
    // Secure token verification
    try {
      const token = authHeader.split(" ")[1];
      const decodedUser = verifyToken(token);
      if (!decodedUser) return res.status(401).json({ error: "Invalid token" });
      req.user = decodedUser;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const normalizePermissions = (perms: any): string[] => {
    if (!perms) return [];
    if (Array.isArray(perms)) return perms;
    if (typeof perms === 'string') {
      try {
        const parsed = JSON.parse(perms);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // Fallback for comma-separated strings
        if (perms.includes(',')) {
          return perms.split(',').map(p => p.trim()).filter(Boolean);
        }
        return perms.trim() ? [perms.trim()] : [];
      }
    }
    return [];
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const { rows } = await db.query("SELECT id, username, password, full_name, role, permissions FROM system_users WHERE username = $1", [username]);
    const user = rows[0];
    if (user && verifyPassword(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      userWithoutPassword.permissions = normalizePermissions(userWithoutPassword.permissions);
      const token = signToken({ id: user.id, username: user.username });
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const { rows } = await db.query("SELECT id, username, full_name, role, permissions FROM system_users WHERE id = $1", [(req as any).user.id]);
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
    const { email } = req.body;
    try {
      const { rows } = await db.query("SELECT id, username FROM system_users WHERE email = $1", [email]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "البريد الإلكتروني غير موجود" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await db.query(
        "UPDATE system_users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
        [code, expiry, rows[0].id]
      );

      // Simulated email sending - returning the code to the frontend for practical testing/usage
      console.log(`[EMAIL SIMULATION] Verification Code for ${email}: ${code}`);

      res.json({ message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني", code });
    } catch (e) {
      res.status(500).json({ error: "حدث خطأ داخلي" });
    }
  });

  // Verify Code
  app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;
    try {
      const { rows } = await db.query(
        "SELECT id FROM system_users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()",
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
    const { email, code, newPassword } = req.body;
    try {
      const { rows } = await db.query(
        "SELECT id FROM system_users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()",
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
    const { rows } = await db.query("SELECT id, username, full_name, role, permissions, created_at FROM system_users ORDER BY id DESC");
    const users = rows.map(u => {
      u.permissions = normalizePermissions(u.permissions);
      return u;
    });
    res.json(users);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    const { username, password, full_name, role, permissions } = req.body;
    try {
      const permsString = Array.isArray(permissions) ? JSON.stringify(permissions) : '[]';
      const hashedPassword = hashPassword(password);
      const { rows } = await db.query(
        "INSERT INTO system_users (username, password, full_name, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [username, hashedPassword, full_name, role || 'editor', permsString]
      );
      await logAction((req as any).user.id, 'إضافة مستخدم', `تم إضافة المستخدم: ${username}`);
      res.json({ id: rows[0].id });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, async (req, res) => {
    const { username, password, full_name, role, permissions } = req.body;
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
          "UPDATE system_users SET username = $1, password = $2, full_name = $3, role = $4, permissions = $5 WHERE id = $6",
          [username, hashedPassword, full_name, role, permsString, id]
        );
      } else {
        await db.query(
          "UPDATE system_users SET username = $1, full_name = $2, role = $3, permissions = $4 WHERE id = $5",
          [username, full_name, role, permsString, id]
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

    const { rows } = await db.query(`
      SELECT articles.*, categories.name as category_name, categories.slug as category_slug, writers.name as writer_name, writers.bio as writer_bio, writers.image_url as writer_image
      FROM articles 
      LEFT JOIN categories ON articles.category_id = categories.id 
      LEFT JOIN writers ON articles.writer_id = writers.id
      WHERE articles.id = $1
    `, [req.params.id]);

    const article = rows[0];
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
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
    await db.query(`
      UPDATE articles 
      SET title = $1, content = $2, category_id = $3, image_url = $4, video_url = $5, is_urgent = $6, tags = $7, writer_id = $8, is_active = $9
      WHERE id = $10
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags, writer_id || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]);
    await logAction((req as any).user.id, 'تعديل خبر', `تم تعديل الخبر رقم: ${req.params.id}`);
    res.json({ success: true });
  });

  app.delete("/api/articles/:id", requireAuth, async (req, res) => {
    const { permanent } = req.query;
    if (permanent === 'true') {
      await db.query("DELETE FROM articles WHERE id = $1", [req.params.id]);
      await logAction((req as any).user.id, 'حذف نهائي للخبر', `تم حذف الخبر رقم: ${req.params.id} نهائياً`);
    } else {
      await db.query("UPDATE articles SET is_deleted = 1 WHERE id = $1", [req.params.id]);
      await logAction((req as any).user.id, 'حذف خبر', `تم نقل الخبر رقم: ${req.params.id} للمحذوفات`);
    }
    res.json({ success: true });
  });

  app.post("/api/articles/:id/restore", requireAuth, async (req, res) => {
    await db.query("UPDATE articles SET is_deleted = 0 WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'استعادة خبر', `تم استعادة الخبر رقم: ${req.params.id}`);
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

  app.post("/api/articles/:id/comments", async (req, res) => {
    const { name, content } = req.body;
    await db.query("INSERT INTO comments (article_id, name, content) VALUES ($1, $2, $3)", [req.params.id, name, content]);
    res.json({ success: true });
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    await db.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'حذف تعليق', `تم حذف التعليق رقم: ${req.params.id}`);
    res.json({ success: true });
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

  app.post("/api/poll/comments", async (req, res) => {
    const { name, content } = req.body;
    const finalName = name || 'زائر';
    if (!content) return res.status(400).json({ error: "Content is required" });

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
    const totalArticles = await db.query("SELECT count(*) as count FROM articles WHERE is_deleted = 0");
    const urgentNews = await db.query("SELECT count(*) as count FROM articles WHERE is_urgent = 1 AND is_deleted = 0");
    const totalViews = await db.query("SELECT sum(views) as count FROM articles WHERE is_deleted = 0");
    const totalComments = await db.query(`
      SELECT count(comments.id) as count 
      FROM comments 
      JOIN articles ON comments.article_id = articles.id 
      WHERE articles.is_deleted = 0
    `);
    const categoryStats = await db.query(`
      SELECT categories.name, count(articles.id) as count 
      FROM categories 
      LEFT JOIN articles ON categories.id = articles.category_id AND articles.is_deleted = 0
      GROUP BY categories.id, categories.name
    `);

    res.json({
      totalArticles: Number(totalArticles.rows[0].count),
      urgentNews: Number(urgentNews.rows[0].count),
      totalViews: Number(totalViews.rows[0].count) || 0,
      totalComments: Number(totalComments.rows[0].count),
      categoryStats: categoryStats.rows
    });
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
