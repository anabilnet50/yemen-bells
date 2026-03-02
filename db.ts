import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize tables and demo data (PostgreSQL syntax)
export async function initDb() {
  console.log('Initializing PostgreSQL database...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        image_url TEXT,
        video_url TEXT,
        author TEXT DEFAULT 'صلاح حيدرة',
        writer_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_urgent INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        views INTEGER DEFAULT 0,
        tags TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS writers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        bio TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add foreign key and background_url if not exists
    try {
      await client.query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS writer_id INTEGER');
      try {
        await client.query('ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_writer_id_fkey');
        await client.query('ALTER TABLE articles ADD CONSTRAINT articles_writer_id_fkey FOREIGN KEY (writer_id) REFERENCES writers(id) ON DELETE SET NULL');
      } catch (e) { /* ignore constraint issues */ }
      await client.query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_deleted INTEGER DEFAULT 0');
      await client.query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1');
      await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS background_url TEXT');
      await client.query('ALTER TABLE ads ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ');
      await client.query('ALTER TABLE ads ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ');
    } catch (e) {
      console.log('Columns might already exist');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ads (
        id SERIAL PRIMARY KEY,
        title TEXT,
        image_url TEXT,
        link_url TEXT,
        adsense_code TEXT,
        position TEXT DEFAULT 'sidebar',
        is_active INTEGER DEFAULT 1,
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_comments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'editor',
        permissions TEXT DEFAULT '[]',
        email TEXT,
        reset_token TEXT,
        reset_token_expiry TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure permissions column exists for older dbs
    try {
      await client.query("ALTER TABLE system_users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]'");
    } catch (e) { /* ignore */ }

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES system_users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_storage (
        filename TEXT PRIMARY KEY,
        mimetype TEXT NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const ensureCategories = [
      { name: 'أخبار محلية', slug: 'local' },
      { name: 'أخبار دولية', slug: 'intl' },
      { name: 'عام', slug: 'general' },
      { name: 'اقتصاد', slug: 'economy' },
      { name: 'رياضة', slug: 'sports' },
      { name: 'تكنولوجيا', slug: 'tech' },
      { name: 'حقوق وحريات', slug: 'rights' },
      { name: 'مقالات', slug: 'opinion' },
      { name: 'أبحاث ودراسات', slug: 'studies' },
      { name: 'يوتيوب', slug: 'youtube' },
      { name: 'مجتمع', slug: 'society' },
    ];

    for (const cat of ensureCategories) {
      await client.query(
        "INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING",
        [cat.name, cat.slug]
      );
    }

    // Ensure 'hashtag' and 'tourism' are removed if they exist
    // First delete articles referencing these categories to satisfy foreign key constraints
    await client.query("DELETE FROM articles WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('hashtag', 'tourism'))");
    await client.query("DELETE FROM categories WHERE slug IN ('hashtag', 'tourism')");
    await client.query("DELETE FROM settings WHERE key = 'tourism_title'");

    // Initial Settings
    const defaultSettings = [
      { key: 'site_name', value: 'هـدس' },
      { key: 'chief_editor', value: 'صلاح حيدرة' },
      { key: 'wisdom_right', value: 'الحرية شمس يجب أن تشرق في كل نفس.' },
      { key: 'wisdom_left', value: 'العلم يبني بيوتاً لا عماد لها، والجهل يهدم بيت العز والكرم.' },
      { key: 'rights_title', value: 'حقوق وحريات' },
      { key: 'tech_title', value: 'تـكنولوجيا' },
      { key: 'economy_title', value: 'اقتصاد' },
      { key: 'sports_title', value: 'رياضة' },
      { key: 'facebook_url', value: 'https://facebook.com' },
      { key: 'twitter_url', value: 'https://twitter.com' },
      { key: 'youtube_url', value: 'https://youtube.com' },
      { key: 'linkedin_url', value: 'https://linkedin.com' },
      { key: 'telegram_url', value: 'https://t.me/hads_news' },
      { key: 'youtube_section_title', value: 'محتوى اليوتيوب' },
      { key: 'news_ball_image', value: '/logo.png' },
      { key: 'copyright_text', value: 'جميع الحقوق محفوظة © 2024 هـدس' },
      { key: 'site_tagline', value: 'الأقرب للأحدث - موقع إخباري شامل' },
    ];

    for (const s of defaultSettings) {
      await client.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", [s.key, s.value]);
    }

    // Default Admin User (Password: admin123)
    await client.query(`
      INSERT INTO system_users (username, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin123', 'صلاح حيدرة', 'admin']);

    // Demo Articles (individual check)
    const demoArticles = [
      {
        title: 'التحول الرقمي في اليمن: آفاق وتحديات',
        content: 'اليمن يخطو خطوات حثيثة نحو المستقبل الرقمي.',
        category_slug: 'tech',
        image_url: 'https://picsum.photos/seed/tech/800/600',
        is_urgent: 1,
        tags: 'تكنولوجيا، اليمن، ذكاء اصطناعي'
      },
      {
        title: 'تقرير حقوقي يستعرض حالة الحريات في العاصمة',
        content: 'منظمات حقوقية تستعرض حالة الحريات وجهود حماية الحقوق المدنية.',
        category_slug: 'rights',
        image_url: 'https://picsum.photos/seed/rights/800/600',
        is_urgent: 1,
        tags: 'حقوق، حريات، تقارير'
      },
      {
        title: 'استقرار أسعار الصرف وبوادر تعافي اقتصادي',
        content: 'توقعات متفائلة بتحسن القوة الشرائية بعد استقرار أسعار الصرف.',
        category_slug: 'economy',
        image_url: 'https://picsum.photos/seed/economy/800/600',
        is_urgent: 1,
        tags: 'اقتصاد، عملة، يمن'
      },
      {
        title: 'المنتخب الوطني في معسكر تدريبي مكثف',
        content: 'المنتخب الوطني يكثف استعداداته للبطولات القادمة بمعسكر خارجي.',
        category_slug: 'sports',
        image_url: 'https://picsum.photos/seed/sports/800/600',
        is_urgent: 1,
        tags: 'رياضة، كرة قدم، اليمن'
      },
      {
        title: 'دراسة حول مستقبل الطاقة الشمسية في المناطق الريفية',
        content: 'الطاقة المتجددة توفر حلولاً مستدامة لأزمة الكهرباء في الأرياف.',
        category_slug: 'studies',
        image_url: 'https://picsum.photos/seed/research/800/600',
        is_urgent: 1,
        tags: 'أبحاث، طاقة شمسية، تنمية'
      },
      {
        title: 'مقال: الحلم اليمني يتجدد في قلوب الشباب',
        content: 'شعلة الأمل تتجدد في قلوب الشباب اليمني الطامح للمستقبل.',
        category_slug: 'opinion',
        image_url: 'https://picsum.photos/seed/vision/800/600',
        is_urgent: 1,
        tags: 'مقالات، آراء، شباب'
      },
      {
        title: 'افتتاح أكبر محطة طاقة شمسية في اليمن بقدرة 100 ميجاوات في محافظة عدن',
        content: 'المحطة الجديدة ستمثل قفزة نوعية في تزويد السكان بالطاقة المتجددة وتقليل العجز الكهربائي.',
        category_slug: 'general',
        image_url: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder video
        is_urgent: 1,
        tags: 'طاقة، شمسية، عدن، تنمية'
      },
      {
        title: 'تطوير القطاع الزراعي: مبادرات لرفع الإنتاجية',
        content: 'مبادرات حديثة لتعزيز الإنتاج الزراعي في تهامة والوديان.',
        category_slug: 'economy',
        image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef',
        is_urgent: 0,
        tags: 'زراعة، اقتصاد، تنمية'
      },
      {
        title: 'مؤتمر دولي لدعم التعليم العالي والبحث العلمي في اليمن',
        content: 'جامعات دولية تبحث سبل دعم التعليم العالي والبحث العلمي.',
        category_slug: 'studies',
        image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
        is_urgent: 1,
        tags: 'تعليم، أبحاث، تطور'
      },
      {
        title: 'البنك المركزي يطلق حزمة إصلاحات نقدية شاملة لتعزيز استقرار العملة الوطنية',
        content: 'البنك المركزي يحدّث أنظمة الرقابة لضمان استقرار العملة.',
        category_slug: 'economy',
        image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f',
        is_urgent: 1,
        tags: 'اقتصاد، بنك مركزي، إصلاحات'
      },
      {
        title: 'إنجاز طبي: فريق جراحي يمني ينجح في إجراء عملية زراعة أطراف معقدة في عدن',
        content: 'فريق جراحي يتمكن من إنقاذ حياة شاب بعد حادث سير أليم.',
        category_slug: 'studies',
        image_url: 'https://images.unsplash.com/photo-1551076805-e1869033e561',
        is_urgent: 1,
        tags: 'صحة، إنجاز طبي، عدن'
      },
      {
        title: 'دراسة: أهمية الموقع الجيوسياسي لليمن في تأمين الملاحة الدولية',
        content: 'خبراء يؤكدون قدرة الموانئ على تحويل اليمن لمركز لوجستي.',
        category_slug: 'studies',
        image_url: 'https://images.unsplash.com/photo-1494412574742-97c039958253',
        is_urgent: 1,
        tags: 'دراسات، ملاح، اقتصاد'
      },
      {
        title: 'فوز المنتخب الوطني للناشئين في المباراة الافتتاحية للبطولة القارية وسط احتفالات شعبية',
        content: 'أداء بطولي للمنتخب الوطني للناشئين في افتتاح مشواره القاري.',
        category_slug: 'sports',
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
        is_urgent: 1,
        tags: 'رياضة، ناشئين، فوز'
      },
      {
        title: 'تحليل سياسي: آفاق السلام الدائم في اليمن وسط تحركات دولية وإقليمية مكثفة',
        content: 'حراك دبلوماسي مكثف لتقريب وجهات النظر وضمان حل مستدام.',
        category_slug: 'opinion',
        image_url: 'https://images.unsplash.com/photo-1541872703-74c5e443d1f0',
        is_urgent: 1,
        tags: 'سياسة، سلام، اليمن'
      },
      {
        title: 'تقرير: قطاع التعدين يمتلك فرصاً واعدة لرفد الخزينة وتوفير فرص عمل للشباب',
        content: 'احتياطيات هائلة من المعادن الصناعية توفر فرص واعدة للاقتصاد.',
        category_slug: 'economy',
        image_url: 'https://images.unsplash.com/photo-1518481612222-68bbe828ec1e',
        is_urgent: 1,
        tags: 'تعدين، اقتصاد، ثروات'
      },
      {
        title: 'منصة تعليمية ذكية لتدريب الطلاب على مهارات الذكاء الاصطناعي وبناء البرمجيات',
        content: 'منصة ذكية تسلح الشباب بمهارات العصر الرقمي والبرمجة.',
        category_slug: 'tech',
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
        is_urgent: 1,
        tags: 'تكنولوجيا، ذكاء اصطناعي، شباب'
      },
      {
        title: 'توقعات باستقرار أسعار السلع الغذائية مع وصول شحنات تجارية جديدة إلى الموانئ',
        content: 'تنسيق مستمر لتسهيل دخول السلع الأساسية وضمان ثبات الأسعار.',
        category_slug: 'economy',
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
        is_urgent: 1,
        tags: 'اقتصاد، أسعار، تموين'
      },
      {
        title: 'وزارة التربية تعلن خطة لتحديث المناهج لمواكبة التطور العلمي',
        content: 'دمج مفاهيم التكنولوجيا الحديثة في المناهج التعليمية الوطنية.',
        category_slug: 'studies',
        image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
        is_urgent: 1,
        tags: 'تعليم، تطوير، مناهج'
      },
    ];

    for (const art of demoArticles) {
      const exists = await client.query("SELECT id FROM articles WHERE title = $1", [art.title]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO articles (title, content, category_id, image_url, video_url, is_urgent, tags)
          VALUES ($1, $2, (SELECT id FROM categories WHERE slug = $3), $4, $5, $6, $7)
        `, [art.title, art.content, art.category_slug, art.image_url, art.video_url || null, art.is_urgent, art.tags]);
      }
    }

    await client.query('COMMIT');
    console.log('PostgreSQL database initialization complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
