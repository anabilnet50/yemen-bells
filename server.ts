import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import db, { initDb } from "./db.ts";

// Ensure uploads directory exists
const uploadDir = process.env.UPLOADS_PATH || path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
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
    // Simple demo auth: token is "userID:username" base64
    try {
      const token = Buffer.from(authHeader.split(" ")[1], 'base64').toString();
      const [userId, username] = token.split(":");
      req.user = { id: Number(userId), username };
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const { rows } = await db.query("SELECT id, username, full_name, role FROM system_users WHERE username = $1 AND password = $2", [username, password]);
    const user = rows[0];
    if (user) {
      const token = Buffer.from(`${user.id}:${user.username}`).toString('base64');
      res.json({ token, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json((req as any).user);
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const { rows } = await db.query("SELECT id, username FROM system_users WHERE email = $1", [email]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Email not found" });
      }

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await db.query(
        "UPDATE system_users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
        [token, expiry, rows[0].id]
      );

      // Simulated email sending
      console.log(`[EMAIL SIMULATION] Reset link for ${email}: http://localhost:5173/admin?reset_token=${token}`);

      res.json({ message: "Reset link sent to your email" });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const { rows } = await db.query(
        "SELECT id FROM system_users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
        [token]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const hashedPassword = newPassword; // Using plain text for now as requested/seen in current implementation, but should be hashed
      await db.query(
        "UPDATE system_users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
        [hashedPassword, rows[0].id]
      );

      res.json({ message: "Password updated successfully" });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Users
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const { rows } = await db.query("SELECT id, username, full_name, role, created_at FROM system_users ORDER BY id DESC");
    res.json(rows);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    const { username, password, full_name, role } = req.body;
    try {
      const { rows } = await db.query(
        "INSERT INTO system_users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id",
        [username, password, full_name, role || 'editor']
      );
      await logAction((req as any).user.id, 'إضافة مستخدم', `تم إضافة المستخدم: ${username}`);
      res.json({ id: rows[0].id });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", requireAuth, async (req, res) => {
    const { rows } = await db.query(`
      SELECT audit_logs.*, system_users.full_name as user_name 
      FROM audit_logs 
      LEFT JOIN system_users ON audit_logs.user_id = system_users.id 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    res.json(rows);
  });

  // Upload Route
  app.post("/api/upload", requireAuth, upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
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
      SELECT articles.*, categories.name as category_name, writers.name as writer_name, writers.bio as writer_bio, writers.image_url as writer_image
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
    const { title, content, category_id, image_url, video_url, is_urgent, tags } = req.body;
    const res_db = await db.query(`
      INSERT INTO articles (title, content, category_id, image_url, video_url, is_urgent, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags]);
    await logAction((req as any).user.id, 'إضافة خبر', `تم إضافة الخبر: ${title}`);
    res.json({ id: res_db.rows[0].id });
  });

  app.put("/api/articles/:id", requireAuth, async (req, res) => {
    const { title, content, category_id, image_url, video_url, is_urgent, tags } = req.body;
    await db.query(`
      UPDATE articles 
      SET title = $1, content = $2, category_id = $3, image_url = $4, video_url = $5, is_urgent = $6, tags = $7
      WHERE id = $8
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags, req.params.id]);
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

  // Bulk Trash Operations
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
    const { title, image_url, link_url, adsense_code, position, is_active } = req.body;
    const { rows } = await db.query(
      "INSERT INTO ads (title, image_url, link_url, adsense_code, position, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [title, image_url, link_url, adsense_code, position, is_active ? 1 : 0]
    );
    await logAction((req as any).user.id, 'إضافة إعلان', `تم إضافة الإعلان: ${title}`);
    res.json({ id: rows[0].id });
  });

  app.put("/api/ads/:id", requireAuth, async (req, res) => {
    const { title, image_url, link_url, adsense_code, position, is_active } = req.body;
    await db.query(
      "UPDATE ads SET title = $1, image_url = $2, link_url = $3, adsense_code = $4, position = $5, is_active = $6 WHERE id = $7",
      [title, image_url, link_url, adsense_code, position, is_active ? 1 : 0, req.params.id]
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

  // Categories
  app.get("/api/categories", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM categories");
    res.json(rows);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    const { name, slug } = req.body;
    try {
      const res_db = await db.query("INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id", [name, slug]);
      await logAction((req as any).user.id, 'إضافة قسم', `تم إضافة القسم: ${name}`);
      res.json({ id: res_db.rows[0].id });
    } catch (e) {
      res.status(400).json({ error: "Category slug or name already exists" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    const { name, slug } = req.body;
    await db.query("UPDATE categories SET name = $1, slug = $2 WHERE id = $3", [name, slug, req.params.id]);
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

  // Subscribers
  app.get("/api/subscribers", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM subscribers ORDER BY created_at DESC");
    res.json(rows);
  });

  app.post("/api/subscribe", async (req, res) => {
    const { email } = req.body;
    try {
      await db.query("INSERT INTO subscribers (email) VALUES ($1)", [email]);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Email already subscribed" });
    }
  });

  app.delete("/api/subscribers/:id", requireAuth, async (req, res) => {
    await db.query("DELETE FROM subscribers WHERE id = $1", [req.params.id]);
    await logAction((req as any).user.id, 'حذف مشترك', `تم حذف المشترك رقم: ${req.params.id}`);
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
    const totalArticles = await db.query("SELECT count(*) as count FROM articles");
    const urgentNews = await db.query("SELECT count(*) as count FROM articles WHERE is_urgent = 1");
    const totalViews = await db.query("SELECT sum(views) as count FROM articles");
    const totalComments = await db.query("SELECT count(*) as count FROM comments");
    const totalSubscribers = await db.query("SELECT count(*) as count FROM subscribers");
    const categoryStats = await db.query(`
      SELECT categories.name, count(articles.id) as count 
      FROM categories 
      LEFT JOIN articles ON categories.id = articles.category_id 
      GROUP BY categories.id, categories.name
    `);

    res.json({
      totalArticles: Number(totalArticles.rows[0].count),
      urgentNews: Number(urgentNews.rows[0].count),
      totalViews: Number(totalViews.rows[0].count) || 0,
      totalComments: Number(totalComments.rows[0].count),
      totalSubscribers: Number(totalSubscribers.rows[0].count),
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
