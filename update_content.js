import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function updateArticles() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@localhost:5432/agras"
    });

    try {
        await client.connect();
        console.log("Connected to database");

        const categories = [
            'local', 'intl', 'opinion', 'studies', 'rights', 'tech', 'sports', 'society', 'economy'
        ];

        const imagesPerCategory = {
            'local': ['local_1.png', 'local_2.png', 'local_3.png'],
            'intl': ['intl_1.png', 'intl_2.png', 'intl_3.png'],
            'economy': ['economy_1.png', 'economy_2.png', 'economy_3.png'],
            'sports': ['sports_1.png', 'sports_2.png'],
            'tech': ['tech_1.png', 'tech_2.png'],
            'society': ['society_1.png', 'society_2.png'],
            'opinion': ['opinion_1.png', 'opinion_2.png'],
            'studies': ['studies_1.png', 'studies_2.png'],
            'rights': ['rights_1.png', 'rights_2.png']
        };

        // Long placeholder Arabic content generators
        const generateLongContent = (title, cat) => {
            const intro = `في ظل التطورات المتسارعة التي تشهدها المنطقة، تأتي هذه التقارير لتسلط الضوء على أهم الجوانب المتعلقة بـ ${title}. حيث يشهد هذا الملف اهتماماً واسعاً من قبل المراقبين والمحللين الذين يتابعون عن كثب كل جديد في هذا السياق.`;
            const body = `لقد أكدت المصادر المطلعة لموقع "هدس" أن هناك تحركات لافتة تجري في الكواليس لضمان استمرارية العمل على هذا الملف الحيوي. ويأتي هذا في وقت حساس للغاية يتطلب الكثير من الدقة والموضوعية في نقل الحقائق للجمهور الكريم. إن الالتزام بالمهنية الصحفية يحتم علينا استقصاء الحقائق من مصادرها الأصلية وتقديمها بشكل مبسط وشامل يخدم المصلحة العامة وينير الرأي العام حول القضايا الجوهرية التي تمس حياة المواطنين بشكل مباشر أو غير مباشر.`;
            const conclusion = `وفي الختام، يظل موقع "هدس" ملتزماً بتقديم كل ما هو حصري ومفيد، مع الحرص التام على تنويع المحتوى وتقديم رؤى تحليلية معمقة تساعد القارئ على فهم الصورة الكاملة. نحن هنا لنكون الأقرب للحدث ولنقل الحقيقة كما هي، بعيداً عن أي تأويلات قد تضلل المسار الإخباري الصحيح.`;
            return `${intro}\n\n${body}\n\n${conclusion}`;
        };

        for (const cat of categories) {
            const res = await client.query('SELECT id, title FROM articles WHERE category_slug = $1 ORDER BY id ASC', [cat]);
            const rows = res.rows;
            const imgs = imagesPerCategory[cat] || ['local_1.png'];

            for (let i = 0; i < rows.length; i++) {
                const article = rows[i];
                const img = imgs[i % imgs.length];
                const longContent = generateLongContent(article.title, cat);

                await client.query(
                    'UPDATE articles SET content = $1, image_url = $2 WHERE id = $3',
                    [longContent, `/news/stories/${img}`, article.id]
                );
                console.log(`Updated article ${article.id} (${cat}) with image ${img}`);
            }
        }

        // Special update for short-urgent
        const urgentArticles = await client.query('SELECT id, title FROM articles WHERE category_slug = $1', ['short-urgent']);
        for (let i = 0; i < urgentArticles.rows.length; i++) {
            const art = urgentArticles.rows[i];
            const urgentImgs = ['iran_main.png', 'iran_ticker_1.png', 'iran_ticker_2.png', 'iran_ticker_3.png'];
            const img = urgentImgs[i % urgentImgs.length];
            const longContent = generateLongContent(art.title, 'عاجل');
            await client.query(
                'UPDATE articles SET content = $1, image_url = $2 WHERE id = $3',
                [longContent, `/news/stories/${img}`, art.id]
            );
            console.log(`Updated urgent article ${art.id} with image ${img}`);
        }

        console.log("Database update completed!");
    } catch (err) {
        console.error("Update error:", err);
    } finally {
        await client.end();
    }
}

updateArticles();
