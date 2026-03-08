import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const srcDir = "C:\\Users\\Almuhtarif-One\\.gemini\\antigravity\\brain\\dd6fde83-8a85-4d15-bc8c-c327c7c9aa5c";
const destDir = "c:\\Users\\Almuhtarif-One\\Desktop\\website Agras\\public\\news\\stories";

const mapping = {
    "yemen_local_news_batch_1772936475365.png": "local_1.png",
    "yemen_local_news_batch_1772936527429.png": "local_2.png",
    "iran_general_news_1772935283124.png": "local_3.png",
    "intl_politics_batch_1772936490163.png": "intl_1.png",
    "intl_politics_batch_1772936544269.png": "intl_2.png",
    "iran_israel_gulf_war_main_1772936630539.png": "intl_3.png",
    "economy_market_batch_1772936509247.png": "economy_1.png",
    "economy_market_batch_1772936560680.png": "economy_2.png",
    "sports_stadium_batch_1772936574228.png": "sports_1.png",
    "article_cards_1772492305268.png": "sports_2.png",
    "tech_innovation_batch_1772936596595.png": "tech_1.png",
    "society_community_batch_1772936613877.png": "society_1.png",
    "active_readers_check_1772668978460.png": "society_2.png",
    "opinion_articles_batch_1772937718307.png": "opinion_1.png",
    "studies_research_batch_1772937736200.png": "studies_1.png",
    "human_rights_batch_1772937750390.png": "rights_1.png"
};

async function runAll() {
    // 1. Copy Images
    console.log("Copying images...");
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    for (const [src, dest] of Object.entries(mapping)) {
        const srcPath = path.join(srcDir, src);
        const destPath = path.join(destDir, dest);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied ${src} to ${dest}`);
        } else {
            console.warn(`Source not found: ${srcPath}`);
        }
    }

    // 2. Update Database
    console.log("Updating database...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        const categories = [
            'local', 'intl', 'opinion', 'studies', 'rights', 'tech', 'sports', 'society', 'economy'
        ];

        const imagesPerCategory = {
            'local': ['local_1.png', 'local_2.png', 'local_3.png'],
            'intl': ['intl_1.png', 'intl_2.png', 'intl_3.png'],
            'economy': ['economy_1.png', 'economy_2.png', 'economy_1.png'],
            'sports': ['sports_1.png', 'sports_2.png'],
            'tech': ['tech_1.png', 'tech_1.png'],
            'society': ['society_1.png', 'society_2.png'],
            'opinion': ['opinion_1.png', 'opinion_1.png'],
            'studies': ['studies_1.png', 'studies_1.png'],
            'rights': ['rights_1.png', 'rights_1.png']
        };

        const generateLongContent = (title, cat) => {
            return `في ظل التطورات المتسارعة التي تشهدها المنطقة، تأتي هذه التقارير لتسلط الضوء على أهم الجوانب المتعلقة بـ ${title}. حيث يشهد هذا الملف اهتماماً واسعاً من قبل المراقبين والمحللين الذين يتابعون عن كثب كل جديد في هذا السياق.\n\nلقد أكدت المصادر المطلعة لموقع "هدس" أن هناك تحركات لافتة تجري في الكواليس لضمان استمرارية العمل على هذا الملف الحيوي. ويأتي هذا في وقت حساس للغاية يتطلب الكثير من الدقة والموضوعية في نقل الحقائق للجمهور الكريم. إن الالتزام بالمهنية الصحفية يحتم علينا استقصاء الحقائق من مصادرها الأصلية وتقديمها بشكل مبسط وشامل يخدم المصلحة العامة وينير الرأي العام حول القضايا الجوهرية التي تمس حياة المواطنين بشكل مباشر أو غير مباشر.\n\nإن التنوع في الطرح والعمق في التحليل هما الركيزتان الأساسيتان اللتان نعتمد عليهما في صياغة أخبارنا، لضمان حصول القارئ على تجربة إخبارية متكاملة تفوق مجرد نقل الخبر إلى فهم ما وراء الخبر وتداعياته المستقبلية على مختلف الأصعدة.\n\nوفي الختام، يظل موقع "هدس" ملتزماً بتقديم كل ما هو حصري ومفيد، مع الحرص التام على تنويع المحتوى وتقديم رؤى تحليلية معمقة تساعد القارئ على فهم الصورة الكاملة. نحن هنا لنكون الأقرب للحدث ولنقل الحقيقة كما هي، بعيداً عن أي تأويلات قد تضلل المسار الإخباري الصحيح.`;
        };

        for (const cat of categories) {
            console.log(`Processing category: ${cat}`);
            const res = await client.query(`
                SELECT a.id, a.title 
                FROM articles a
                JOIN categories c ON a.category_id = c.id
                WHERE c.slug = $1
                ORDER BY a.id ASC
            `, [cat]);
            const rows = res.rows;
            console.log(`Found ${rows.length} articles for ${cat}`);
            const imgs = imagesPerCategory[cat] || ['local_1.png'];

            for (let i = 0; i < rows.length; i++) {
                const article = rows[i];
                const img = imgs[i % imgs.length];
                const content = generateLongContent(article.title, cat);
                await client.query(
                    'UPDATE articles SET content = $1, image_url = $2 WHERE id = $3',
                    [content, `/news/stories/${img}`, article.id]
                );
                console.log(`   Updated article ID: ${article.id}`);
            }
        }

        // Update short-urgent specifically if needed
        const resUrgent = await client.query(`
            SELECT a.id, a.title 
            FROM articles a
            JOIN categories c ON a.category_id = c.id
            WHERE c.slug = 'short-urgent'
            ORDER BY a.id ASC
        `);
        const urgentImgs = ['iran_main.png', 'local_3.png'];
        for (let i = 0; i < resUrgent.rows.length; i++) {
            const art = resUrgent.rows[i];
            const img = urgentImgs[i % urgentImgs.length];
            const content = generateLongContent(art.title, 'عاجل');
            await client.query(
                'UPDATE articles SET content = $1, image_url = $2 WHERE id = $3',
                [content, `/news/stories/${img}`, art.id]
            );
        }
        console.log("Database updated successfully!");
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.end();
    }
}

runAll();
