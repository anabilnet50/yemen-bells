import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  ArrowRight,
  Share2,
  MessageCircle,
  Eye,
  Send,
  Clock,
  Twitter,
  Facebook,
  Linkedin,
  ChevronLeft,
  TrendingUp,
  Bookmark,
  ArrowLeft,
  DollarSign,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const isAdActive = (ad: any) => {
    if (Number(ad.is_active) !== 1) return false;
    const now = new Date();

    if (ad.start_date) {
      const start = new Date(ad.start_date);
      if (!isNaN(start.getTime()) && start.getTime() > 0) {
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (startDay > today) return false;
      }
    }

    if (ad.end_date) {
      const end = new Date(ad.end_date);
      if (!isNaN(end.getTime()) && end.getTime() > 0) {
        if (end < now) return false;
      }
    }

    return true;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const updateScroll = () => {
      const currentScroll = window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight) setScrollProgress(Number((currentScroll / scrollHeight).toFixed(3)));
    };
    window.addEventListener("scroll", updateScroll);

    fetch(`/api/articles/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Handle both {article, ads} and old flat article format
        if (data.article) {
          setArticle(data.article);
          setAds(data.ads || []);
          setSettings(data.settings);
        } else if (data.id) {
          // Fallback for old format
          setArticle(data);
          setAds([]);
        } else {
          console.error("Unexpected data format:", data);
          setArticle(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching article:", err);
        setArticle(null);
        setLoading(false);
      });

  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !userName || isSubmitting) return;

    // Link Protection
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|net|org|edu|gov|io|co|me|ai|app|xyz|info|biz|site|online|tech|website|store|shop|link|click|tk|ml|ga|cf|gq|pw|ws|fun|space|top|vip|icu|win|bid|loan|host|live|mobi|name|pro|tel|pub|news))/gi;
    if (urlPattern.test(userName) || urlPattern.test(comment)) {
      alert("عذراً، لأسباب أمنية لا يُسمح بإضافة روابط في التعليقات أو الأسماء.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, content: comment }),
      });

      if (res.ok) {
        setComment("");
        setUserName("");
        alert("تم إرسال تعليقك بنجاح. سيتم مراجعته من قبل الإدارة.");
      } else {
        const data = await res.json();
        alert(data.error || "حدث خطأ أثناء إرسال التعليق");
      }
    } catch (err) {
      alert("حدث خطأ أثناء إرسال التعليق");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article?.title;
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }

    if (shareUrl) window.open(shareUrl, "_blank");
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-primary-navy">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
          جاري التحميل...
        </p>
      </div>
    );

  if (!article)
    return (
      <div className="text-center py-40 bg-surface-soft min-h-screen flex flex-col items-center justify-center gap-8">
        <Eye className="w-16 h-16 opacity-10" />
        <h2 className="text-2xl font-black text-primary-navy">المحتوى غير متوفر</h2>
        <Link
          to="/"
          className="bg-primary-crimson text-white px-8 py-3 rounded-xl font-bold"
        >
          العودة للرئيسية
        </Link>
      </div>
    );


  const inlineAds = ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('inline'));
  const sidebarAds = ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('sidebar'));

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-20">
        {/* Top Navigation - Back to Category */}
        <div className="mb-6 flex justify-start">
          <button
            onClick={() => navigate(`/category/${article.category_slug}`)}
            className="flex items-center gap-2 text-[#005c97] font-black text-sm hover:text-primary-crimson transition-all"
            dir="rtl"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لقسم {article.category_name}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] shadow-premium overflow-hidden border border-gray-100">
              {/* Article Image - Now Inside Card */}
              {(article.image_url || (article.category_slug === 'opinion' && article.writer_image)) && (
                <div className="p-4 md:p-8 pb-0 relative group">
                  <img
                    src={article.category_slug === 'opinion' ? (article.writer_image || article.image_url) : article.image_url}
                    className={article.category_slug === 'opinion'
                      ? "w-48 h-48 md:w-64 md:h-64 rounded-full mx-auto object-cover shadow-2xl border-4 border-white transform hover:scale-105 transition-transform duration-700"
                      : "w-full h-auto rounded-3xl shadow-sm border border-gray-100"}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-8 right-8 md:top-12 md:right-12 z-10">
                    <span className="bg-[#e11d48] text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">
                      {article.category_name}
                    </span>
                  </div>
                </div>
              )}
              {/* Header Metadata */}
              <div className="p-8 md:p-12 border-b border-gray-50">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {article.is_urgent === 1 && (
                    <div className="flex justify-end mb-4">
                      <span className="bg-[#f59e0b] text-white px-3 py-1 rounded-md text-[10px] font-black flex items-center gap-2 shadow-sm">
                        عاجل
                      </span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl md:text-4xl font-black text-[#004a80] mb-8 leading-tight">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-gray-500 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-crimson" />
                    {new Date(article.created_at).toLocaleDateString("ar-YE", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100/50">
                    {article.category_slug === 'opinion' && article.writer_image ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-primary-crimson/10">
                        <img src={article.writer_image} className="w-full h-full object-cover" alt={article.writer_name} />
                      </div>
                    ) : (
                      <User className="w-5 h-5 text-primary-crimson" />
                    )}
                    <span className="font-black text-primary-navy">{article.writer_name || article.author || "هدس"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-navy bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100/50">
                    <Eye className="w-4 h-4 text-primary-crimson" />
                    <span className="font-bold">{article.views || 0} قراءة</span>
                  </div>
                </div>
              </div>

              {/* Video Section */}
              {article.video_url && (
                <div className="bg-black aspect-video w-full">
                  {article.video_url.includes("youtube.com") || article.video_url.includes("youtu.be") ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${article.video_url.split("v=")[1]?.split("&")[0] || article.video_url.split("/").pop()}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video src={article.video_url} className="w-full h-full object-contain" controls />
                  )}
                </div>
              )}

              {/* Reading Progress Bar */}
              <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-primary-crimson z-[110] origin-right"
                style={{ scaleX: scrollProgress }}
              />

              {/* Article Content with Inline Ad */}
              <div className="p-8 md:p-12 lg:p-16 text-right">
                {(() => {
                  const contentParts = article.content.split(/\n\n/);
                  const firstPart = contentParts[0];
                  const remainingParts = contentParts.slice(1);

                  return (
                    <div className="prose prose-lg md:prose-xl max-w-none 
                        prose-p:text-primary-navy prose-p:leading-[1.9] prose-p:mb-10
                        prose-headings:text-primary-navy prose-headings:font-black
                        font-medium text-justify text-gray-900 overflow-visible">

                      <div dangerouslySetInnerHTML={{ __html: firstPart.replace(/\n/g, "<br/>") }} />

                      {inlineAds.length > 0 && (
                        <div className="my-16 p-3 bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-premium group">
                          {(() => {
                            const ad = inlineAds[0];
                            return (
                              <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full relative">
                                {ad.image_url ? (
                                  <div className="relative">
                                    <div className="flex justify-end p-2 px-4">
                                      <span className="bg-primary-crimson text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        {ad.title}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-primary-navy/5 rounded-3xl blur-xl transition-opacity group-hover:opacity-20 opacity-0"></div>
                                      <img src={ad.image_url} alt={ad.title} className="relative w-full h-auto rounded-3xl object-cover transition-transform duration-1000 group-hover:scale-[1.03] z-10" referrerPolicy="no-referrer" />
                                    </div>
                                  </div>
                                ) : ad.adsense_code ? (
                                  <div className="w-full py-10 flex items-center justify-center overflow-hidden bg-white rounded-3xl" dangerouslySetInnerHTML={{ __html: ad.adsense_code }} />
                                ) : (
                                  <div className="w-full p-16 bg-gradient-to-br from-primary-navy to-primary-crimson text-white text-center rounded-[2rem] flex flex-col items-center justify-center">
                                    <h4 className="text-3xl font-black mb-6">{ad.title}</h4>
                                    <DollarSign className="w-16 h-16 text-accent-gold mx-auto" />
                                  </div>
                                )}
                                <div className="absolute bottom-6 left-6 bg-accent-gold text-primary-navy text-[10px] font-black px-4 py-1.5 rounded-lg tracking-[0.2em] uppercase shadow-glow z-20">إعلان مدفوع</div>
                              </a>
                            );
                          })()}
                        </div>
                      )}

                      {remainingParts.length > 0 && (
                        <div dangerouslySetInnerHTML={{ __html: remainingParts.join("\n\n").replace(/\n/g, "<br/>") }} />
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Share Section - Resized to match screenshot */}
            <div className="p-4 md:p-4 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex gap-2">
                  <button onClick={() => handleShare('telegram')} className="p-2 bg-[#0088cc] text-white rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"><Send className="w-4 h-4 rotate-[-45deg]" /></button>
                  <button onClick={() => handleShare('whatsapp')} className="p-2 bg-[#25d366] text-white rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"><MessageCircle className="w-4 h-4" /></button>
                  <button onClick={() => handleShare('twitter')} className="p-2 bg-black text-white rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"><Twitter className="w-4 h-4" /></button>
                  <button onClick={() => handleShare('facebook')} className="p-2 bg-[#1877f2] text-white rounded-lg shadow-sm hover:-translate-y-0.5 transition-all"><Facebook className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-black">شاهد الخبر</span>
                  <Share2 className="w-4 h-4 text-primary-crimson" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Ads Column - Now after Main Content for Mobile Order */}
          <div className="lg:col-span-4 space-y-8">
            {sidebarAds.length > 0 ? (
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
                        <img src={ad.image_url} alt={ad.title} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                        <img src={ad.image_url} alt={ad.title} className="relative w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105 z-10" referrerPolicy="no-referrer" />
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

                {/* Placeholder Label - Relative to avoid overlap */}
                <div className="flex justify-end p-2 px-4 w-full">
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
            )}
          </div>

          {/* Bottom Content Area (Comments & Nav) - lg:col-span-8 to align with article */}
          <div className="lg:col-span-8 space-y-8">
            {/* Separate Comment card */}
            <div className="bg-white rounded-[1.5rem] shadow-premium p-8 border border-gray-100">
              <h3 className="text-xl font-black text-primary-navy mb-6 flex items-center justify-start gap-3">
                أضف تعليقك
                <MessageCircle className="w-6 h-6 text-primary-crimson opacity-40" />
              </h3>

              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full p-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#005c97] rounded-xl outline-none font-bold transition-all text-sm text-primary-navy text-right"
                  required
                />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="رأيك يهمنا..."
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#005c97] rounded-xl outline-none font-bold transition-all text-sm text-primary-navy resize-none text-right"
                  required
                ></textarea>

                <div className="flex justify-start">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#005c97] text-white px-10 py-2.5 rounded-lg font-black text-sm shadow-lg hover:bg-primary-crimson transition-all"
                  >
                    {isSubmitting ? "جاري الإرسال..." : "إرسال التعليق"}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex items-center justify-start gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-100 text-[10px] text-gray-400 font-bold">
                <span>المعلومات المسجلة تصل مباشرة إلينا لضمان خصوصية المحتوى</span>
                <Shield className="w-3 h-3" />
              </div>
            </div>

            {/* Bottom Navigation & Branding */}
            <div className="mt-4 flex items-center justify-between px-4 pb-12">
              <div className="text-[10px] font-black text-primary-navy/20 uppercase tracking-widest">هدس</div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-[#005c97] font-black text-sm hover:text-primary-crimson transition-all"
                dir="rtl"
              >
                العودة للرئيسية
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
