import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Eye, Clock, ArrowLeft, ChevronRight, ChevronLeft, Search, MapPin, Play, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export default function CategoryArticles() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [ads, setAds] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const articlesPerPage = 6;

    const isAdActive = (ad: any) => {
        if (Number(ad.is_active) !== 1) return false;
        const now = new Date();
        if (ad.start_date && new Date(ad.start_date) > now) return false;
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        return true;
    };

    const category = categories.find(c => c.slug === slug);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(true);

        // Fetch articles for this category
        fetch(`/api/articles?category=${slug}`)
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            });

        // Fetch categories and ads
        fetch('/api/init')
            .then(res => res.json())
            .then(data => {
                setCategories(data.categories);
                setAds(data.ads || []);
                setSettings(data.settings);
            });
    }, [slug]);

    const totalPages = Math.ceil(articles.length / articlesPerPage);
    const paginatedArticles = articles.slice(
        (currentPage - 1) * articlesPerPage,
        currentPage * articlesPerPage
    );

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen bg-primary-navy">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-crimson border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-8 font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">جاري التحميل...</p>
        </div>
    );

    return (
        <div className="bg-[#fcfdfe] min-h-screen pb-32">
            {/* Category Hero */}
            <div className={`py-20 relative overflow-hidden ${category?.background_url ? '' : 'bg-primary-navy'}`}>
                {category?.background_url ? (
                    <div className="absolute inset-0 z-0">
                        <img src={category.background_url} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-primary-navy/70 backdrop-blur-sm"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                )}
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
                            <span className="text-accent-gold">{category?.name || 'الأخبار'}</span>
                        </h1>
                        <div className="h-1.5 w-24 bg-primary-crimson mx-auto rounded-full shadow-glow"></div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12">
                <Link to="/" className="inline-flex items-center text-primary-navy font-black mb-8 hover:text-primary-crimson transition-colors group">
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" /> العودة للرئيسية
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Articles List */}
                    <div className="lg:col-span-8">
                        {articles.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {paginatedArticles.map((article, index) => (
                                        <React.Fragment key={article.id}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                onClick={() => navigate(`/article/${article.id}`)}
                                                className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-50 shadow-premium cursor-pointer flex flex-col h-full"
                                            >
                                                <div className="h-auto overflow-hidden relative">
                                                    <img
                                                        src={article.category_slug === 'opinion' ? (article.writer_image || article.image_url) : (article.image_url || `https://picsum.photos/seed/${article.id}/600/400`)}
                                                        className={`w-full h-full object-cover transition-all duration-1000 ${article.category_slug === 'opinion' ? 'group-hover:scale-105 group-hover:brightness-110' : 'group-hover:scale-110'}`}
                                                        alt={article.title}
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div className="absolute inset-0 bg-primary-navy/20 group-hover:bg-transparent transition-colors"></div>
                                                    {article.video_url && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30">
                                                                <Play className="w-6 h-6 fill-current" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-8 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(article.created_at).toLocaleDateString('ar-YE')}</span>
                                                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {article.views || 0}</span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-primary-navy group-hover:text-primary-crimson transition-colors line-clamp-2 leading-tight mb-6 flex-1">
                                                        {article.title}
                                                    </h3>
                                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                                        <span className="text-xs font-black text-primary-navy/60 group-hover:text-primary-navy transition-colors">بواسطة: {article.writer_name || article.author || "هدس"}</span>
                                                        <ArrowLeft className="w-4 h-4 text-primary-crimson group-hover:translate-x-[-5px] transition-transform" />
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Mobile Ad Injection removed as per user request */}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-20 flex justify-center items-center gap-4">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-lg hover:bg-primary-crimson hover:text-white transition-all disabled:opacity-50"
                                        >
                                            <ChevronRight />
                                        </button>
                                        <span className="font-black text-lg">صفحة {currentPage} من {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-lg hover:bg-primary-crimson hover:text-white transition-all disabled:opacity-50"
                                        >
                                            <ChevronLeft />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="p-12 bg-white rounded-[3rem] shadow-premium inline-block mb-8">
                                    <Search className="w-14 h-14 opacity-10 mx-auto" />
                                </div>
                                <p className="text-xl font-black text-gray-400">لا توجد أخبار حالياً في هذا القسم</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Ads Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {(() => {
                            const sidebarAds = ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('sidebar'));
                            return sidebarAds.length > 0 ? (
                                sidebarAds.map(ad => (
                                    <div key={ad.id} className="glass-card bg-white p-2 rounded-[2rem] shadow-premium border border-gray-100 sticky top-24 overflow-hidden group">
                                        <div className="flex justify-end p-2 px-3">
                                            <span className="bg-accent-gold text-primary-navy px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {ad.title}
                                            </span>
                                        </div>
                                        <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full relative group h-[400px]">
                                            {ad.image_url ? (
                                                <div className="w-full h-full relative">
                                                    <img src={ad.image_url} alt={ad.title} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 transition-transform duration-1000 group-hover:scale-110" />
                                                    <img src={ad.image_url} alt={ad.title} className="relative w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105 z-10" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full p-12 bg-gradient-to-br from-primary-navy to-primary-crimson text-white text-center rounded-[1.5rem] flex flex-col items-center justify-center">
                                                    <h4 className="text-2xl font-black mb-4">{ad.title}</h4>
                                                    <DollarSign className="w-12 h-12 text-accent-gold mx-auto" />
                                                </div>
                                            )}
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="glass-card bg-primary-navy text-white p-10 text-center rounded-[2rem] shadow-premium border border-white/10 sticky top-24 overflow-hidden group">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                                    {/* Top-aligned placeholder label */}
                                    <div className="flex justify-end p-2 px-4 w-full relative z-20">
                                        <span className="bg-accent-gold text-primary-navy px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            مساحة إعلانية
                                        </span>
                                    </div>

                                    <div className="relative z-10">
                                        <p className="text-xl font-black mb-4 mt-4">أعلن معنا في هـدس</p>
                                        <p className="text-sm text-white/60 font-medium">نصل لآلاف القراء يومياً في مختلف المجالات</p>
                                        <div className="mt-8 pt-8 border-t border-white/10">
                                            <p className="text-xs text-accent-gold font-bold">للتواصل: {settings?.contact_email || 'info@hads-news.com'}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
