const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fillMissingContent() {
    const client = await pool.connect();
    try {
        const { rows: categories } = await client.query("SELECT id, slug FROM categories");
        const getCatId = (slug) => categories.find(c => c.slug === slug)?.id;

        const newsData = [
            {
                slug: 'opinion',
                image: '/news/stories/opinion.png',
                articles: [
                    { title: 'مقال: استثمر في عقلك قبل جيبك.. طريق النهضة يبدأ من الوعي', content: 'في هذا المقال نستعرض كيف أن التعليم الذاتي وتطوير المهارات هو الاستثمار الحقيقي في عصر التكنولوجيا المتسارع.' },
                    { title: 'رأي: اليمن بين إرث الماضي وطموح المستقبل الرقمي', content: 'تحليل معمق للفرص التي يوفرها التحول الرقمي للشباب اليمني في ظل الظروف الراهنة.' },
                    { title: 'نحو إستراتيجية وطنية لتعزيز الاقتصاد المحلي المستدام', content: 'كيف يمكن للمبادرات الصغيرة والمنشآت المتوسطة أن تكون قاطرة التنمية في الفترة القادمة.' },
                    { title: 'الثقافة كقوة ناعمة: كيف نحافظ على هويتنا في عالم معولم؟', content: 'تسليط الضوء على أهمية الفنون والتراث في حماية النسيج الاجتماعي والوطني.' },
                    { title: 'الصحافة الاستقصائية: مرآة المجتمع وعلينا حمايتها', content: 'دور الإعلام الحر في كشف الحقائق وتقديم المعلومة الصادقة للمواطن اليمني.' }
                ]
            },
            {
                slug: 'studies',
                image: '/news/stories/studies.png',
                articles: [
                    { title: 'دراسة: تأثير التغير المناخي على الموارد المائية في المناطق الريفية', content: 'بحث يستعرض التحديات المائية وكيفية مواجهتها من خلال تقنيات الري الحديثة وحصاد مياه الأمطار.' },
                    { title: 'أبحاث: سبل تطوير التعليم العالي لمواكبة متطلبات سوق العمل العالمي', content: 'دراسة تحليلية للمناهج الجامعية الحالية واقتراحات لتطوير التخصصات التقنية والعلمية.' },
                    { title: 'تقرير: الأمن الغذائي في اليمن.. الحلول الممكنة والفرص الضائعة', content: 'دراسة شاملة لواقع الزراعة والتموين وكيفية تحقيق الاكتفاء الذاتي من السلع الأساسية.' },
                    { title: 'أثر استخدام الذكاء الاصطناعي في تحسين الخدمات الصحية العامة', content: 'بحث في إمكانيات دمج الأدوات الذكية في تشخيص الأمراض وإدارة المستشفيات بكفاءة.' },
                    { title: 'دراسة اقتصادية: قطاع السياحة البيئية كبديل تنموي في اليمن', content: 'تحليل للمناطق الطبيعية الفريدة وكيفية استثمارها سياحياً بشكل يحافظ على البيئة.' }
                ]
            },
            {
                slug: 'rights',
                image: '/news/stories/rights.png',
                articles: [
                    { title: 'حقوق وحريات: ندوة حول حماية حقوق الطفل وضمان التعليم للجميع', content: 'فعالية تناقش آليات الحد من تسرب الأطفال من المدارس وتوفير بيئة تعليمية آمنة.' },
                    { title: 'تقرير سنوي يستعرض جهود مكافحة التمييز وتعزيز قيم المساواة', content: 'منظمات مدنية تنشر إحصاءات حول التقدم المحرز في حماية الحقوق الأساسية للمواطنين.' },
                    { title: 'إطلاق مبادرة "صوتك مسموع" لدعم حقوق ذوي الاحتياجات الخاصة', content: 'حملة تهدف إلى دمج هذه الفئة بشكل فعال في سوق العمل والحياة العامة.' },
                    { title: 'ندوة قانونية بالتعاون مع نقابة المحامين لنشر الثقافة العدلية', content: 'توعية المجتمع بحقوقهم القانونية وكيفية الوصول إلى القضاء بشكل ميسر.' },
                    { title: 'دفاعاً عن الكلمة: يوم مفتوح للتأكيد على حرية التعبير وحقوق الصحفيين', content: 'لقاء يجمع النشطاء والحقوقيين للتأكيد على أهمية حماية الكلمة الصادقة والحرية الصحفية.' }
                ]
            },
            {
                slug: 'youtube',
                image: '/news/stories/intl.png',
                articles: [
                    { title: 'شاهد: جولة سياحية في مدينة صنعاء القديمة ومعالمها التاريخية', content: 'فيديو يوثق جمال العمارة الطينية والحياة اليومية في أزقة المدينة العريقة.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { title: 'وثائقي: رحلة الكفاح والنجاح للمزارع اليمني في مدرجات جبال ريمة', content: 'قصة ملهمة عن المثابرة والإبداع في زراعة البن وتصديره للعالم.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { title: 'تغطية خاصة: حوار مع مخترع شاب يمني طور نظاماً لتنقية المياه', content: 'لقاء يستعرض تفاصيل الابتكار وكيف يمكن أن يحل أزمة المياه في القرى البعيدة.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { title: 'برنامج رياضي: كواليس فوز المنتخب الوطني في البطولة الأخيرة', content: 'لقطات حصرية وفرحة الجماهير اليمنية بالانتصار الرياضي الكبير.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                    { title: 'تكنولوجيا: مراجعة لأحدث التقنيات المستخدمة في التعليم عن بعد ببريطانيا', content: 'فيديو تعليمي يشرح كيفية استخدام المنصات الحديثة وتسهيل عملية التعلم.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
                ]
            }
        ];

        console.log('--- Filling Remaining Content ---');
        for (const group of newsData) {
            const catId = getCatId(group.slug);
            if (!catId) {
                console.log(`Skipping slug ${group.slug} - not found.`);
                continue;
            }
            for (const art of group.articles) {
                await client.query(
                    "INSERT INTO articles (title, content, category_id, image_url, video_url, is_urgent, is_active) VALUES ($1, $2, $3, $4, $5, 0, 1)",
                    [art.title, art.content, catId, group.image, art.video_url || null]
                );
            }
        }
        console.log('--- Database Populated Successfully (20 extra articles) ---');
    } catch (err) {
        console.error('Failure during filling:', err);
    } finally {
        client.release();
        pool.end();
    }
}

fillMissingContent().catch(console.error);
