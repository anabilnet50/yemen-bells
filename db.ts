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
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_urgent INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        tags TEXT
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

    // Ensure Categories
    const ensureCategories = [
      { name: 'عام', slug: 'general' },
      { name: 'اقتصاد', slug: 'economy' },
      { name: 'سياحة', slug: 'tourism' },
      { name: 'رياضة', slug: 'sports' },
      { name: 'تكنولوجيا', slug: 'tech' },
      { name: 'حقوق وحريات', slug: 'rights' },
      { name: 'مقالات', slug: 'opinion' },
      { name: 'أبحاث ودراسات', slug: 'studies' },
      { name: 'هاشتاج', slug: 'hashtag' },
    ];

    for (const cat of ensureCategories) {
      await client.query(
        "INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING",
        [cat.name, cat.slug]
      );
    }

    // Initial Settings
    const defaultSettings = [
      { key: 'site_name', value: 'أجراس اليمن' },
      { key: 'chief_editor', value: 'صلاح حيدرة' },
      { key: 'wisdom_right', value: 'الحرية شمس يجب أن تشرق في كل نفس.' },
      { key: 'wisdom_left', value: 'العلم يبني بيوتاً لا عماد لها، والجهل يهدم بيت العز والكرم.' },
      { key: 'rights_title', value: 'حقوق وحريات' },
      { key: 'tech_title', value: 'تـكنولوجيا' },
      { key: 'economy_title', value: 'اقتصاد' },
      { key: 'tourism_title', value: 'سياحة' },
      { key: 'sports_title', value: 'رياضة' },
    ];

    for (const s of defaultSettings) {
      await client.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", [s.key, s.value]);
    }

    // Demo Articles (individual check)
    const demoArticles = [
      {
        title: 'التحول الرقمي في اليمن: آفاق وتحديات',
        content: 'يشهد قطاع التكنولوجيا في اليمن محاولات جادة لمواكبة التطورات العالمية رغم الظروف الصعبة، حيث تبرز مبادرات شبابية في البرمجة والذكاء الاصطناعي تعيد رسم خارطة المستقبل الرقمي للبلاد.',
        category_slug: 'tech',
        image_url: 'https://picsum.photos/seed/tech/800/600',
        is_urgent: 1,
        tags: 'تكنولوجيا، اليمن، ذكاء اصطناعي'
      },
      {
        title: 'تقرير حقوقي يستعرض حالة الحريات في العاصمة',
        content: 'أصدرت منظمات حقوقية تقريراً جديداً يسلط الضوء على الجهود المبذولة لحماية الحقوق المدنية والتحديات القانونية التي تواجه العمل الإنساني في المناطق المختلفة.',
        category_slug: 'rights',
        image_url: 'https://picsum.photos/seed/rights/800/600',
        is_urgent: 1,
        tags: 'حقوق، حريات، تقارير'
      },
      {
        title: 'استقرار أسعار الصرف وبوادر تعافي اقتصادي',
        content: 'سجلت الأسواق المحلية حالة من الاستقرار النسبي في أسعار الصرف، وسط تفاؤل حذر بين التجارة والمحللين الاقتصاديين بإمكانية تحسن القوة الشرائية للمواطنين.',
        category_slug: 'economy',
        image_url: 'https://picsum.photos/seed/economy/800/600',
        is_urgent: 1,
        tags: 'اقتصاد، عملة، يمن'
      },
      {
        title: 'السياحة في سقطرى: لؤلؤة المحيط التي لا تنام',
        content: 'تستقبل جزيرة سقطرى هذا الموسم أعداداً متزايدة من الزوار وعشاق الطبيعة البكر، استكشف معنا التنوع الحيوي الفريد والمناظر الخلابة التي تجعلها وجهة عالمية.',
        category_slug: 'tourism',
        image_url: 'https://picsum.photos/seed/tourism/800/600',
        is_urgent: 1,
        tags: 'سياحة، سقطرى، طبيعة'
      },
      {
        title: 'المنتخب الوطني في معسكر تدريبي مكثف',
        content: 'بدأ المنتخب الوطني لكرة القدم تدريباته الاستعدادية في معسكره الخارجي، استعداداً للاستحقاقات القادمة ووسط آمال جماهيرية كبيرة بتحقيق نتائج إيجابية.',
        category_slug: 'sports',
        image_url: 'https://picsum.photos/seed/sports/800/600',
        is_urgent: 1,
        tags: 'رياضة، كرة قدم، اليمن'
      },
      {
        title: 'دراسة حول مستقبل الطاقة الشمسية في المناطق الريفية',
        content: 'كشفت دراسة بحثية حديثة عن قدرة الطاقة المتجددة على سد الفجوة الكبيرة في استهلاك الكهرباء بالمناطق الريفية، مقدمةً حلولاً عملية واقتصادية مستدامة.',
        category_slug: 'studies',
        image_url: 'https://picsum.photos/seed/research/800/600',
        is_urgent: 1,
        tags: 'أبحاث، طاقة شمسية، تنمية'
      },
      {
        title: 'مقال: الحلم اليمني يتجدد في قلوب الشباب',
        content: 'الشباب اليمني اليوم يحمل شعلة الأمل رغم الصعاب، ويبني بوعيه وفكره جداراً من المعرفة يحمي مستقبله ومستقبل الأجيال القادمة. الحلم لا يموت أبداً.',
        category_slug: 'opinion',
        image_url: 'https://picsum.photos/seed/vision/800/600',
        is_urgent: 1,
        tags: 'مقالات، آراء، شباب'
      }
    ];

    for (const art of demoArticles) {
      const exists = await client.query("SELECT id FROM articles WHERE title = $1", [art.title]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO articles (title, content, category_id, image_url, is_urgent, tags)
          VALUES ($1, $2, (SELECT id FROM categories WHERE slug = $3), $4, $5, $6)
        `, [art.title, art.content, art.category_slug, art.image_url, art.is_urgent, art.tags]);
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
