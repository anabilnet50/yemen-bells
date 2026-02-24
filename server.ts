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

  // --- API Routes ---

  // Upload Route
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // Articles
  app.get("/api/articles", async (req, res) => {
    const { category, limit } = req.query;
    let query = "SELECT articles.*, categories.name as category_name, categories.slug as category_slug FROM articles LEFT JOIN categories ON articles.category_id = categories.id";
    const params: any[] = [];

    if (category) {
      query += ` WHERE categories.slug = $${params.length + 1}`;
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
      SELECT articles.*, categories.name as category_name 
      FROM articles 
      LEFT JOIN categories ON articles.category_id = categories.id 
      WHERE articles.id = $1
    `, [req.params.id]);

    const article = rows[0];
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  });

  app.post("/api/articles", async (req, res) => {
    const { title, content, category_id, image_url, video_url, is_urgent, tags } = req.body;
    const res_db = await db.query(`
      INSERT INTO articles (title, content, category_id, image_url, video_url, is_urgent, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags]);
    res.json({ id: res_db.rows[0].id });
  });

  app.put("/api/articles/:id", async (req, res) => {
    const { title, content, category_id, image_url, video_url, is_urgent, tags } = req.body;
    await db.query(`
      UPDATE articles 
      SET title = $1, content = $2, category_id = $3, image_url = $4, video_url = $5, is_urgent = $6, tags = $7
      WHERE id = $8
    `, [title, content, category_id, image_url, video_url, is_urgent ? 1 : 0, tags, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/articles/:id", async (req, res) => {
    await db.query("DELETE FROM articles WHERE id = $1", [req.params.id]);
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

  app.delete("/api/comments/:id", async (req, res) => {
    await db.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM categories");
    res.json(rows);
  });

  app.post("/api/categories", async (req, res) => {
    const { name, slug } = req.body;
    try {
      const res_db = await db.query("INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id", [name, slug]);
      res.json({ id: res_db.rows[0].id });
    } catch (e) {
      res.status(400).json({ error: "Category slug or name already exists" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    const { name, slug } = req.body;
    await db.query("UPDATE categories SET name = $1, slug = $2 WHERE id = $3", [name, slug, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const count_res = await db.query("SELECT count(*) as count FROM articles WHERE category_id = $1", [req.params.id]);
    const count = Number(count_res.rows[0].count);
    if (count > 0) {
      return res.status(400).json({ error: "Cannot delete category with associated articles" });
    }
    await db.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
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

  app.delete("/api/subscribers/:id", async (req, res) => {
    await db.query("DELETE FROM subscribers WHERE id = $1", [req.params.id]);
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

  app.post("/api/settings", async (req, res) => {
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
