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
  Shield,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetch(`/api/articles/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching article:", err);
        setLoading(false);
      });
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !userName || isSubmitting) return;

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


  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-20 pt-10">
      {/* Floating Back Button */}
      <div className="fixed top-6 left-6 z-[100]">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-premium border border-gray-100 text-primary-navy hover:bg-primary-crimson hover:text-white transition-all group"
          title="العودة"
        >
          <ArrowRight className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-premium overflow-hidden border border-gray-100">
          {/* Article Image - Now Inside Card */}
          {article.image_url && (
            <div className="p-4 md:p-8 pb-0">
              <img
                src={article.image_url}
                className="w-full h-auto rounded-3xl shadow-sm border border-gray-100"
                alt={article.title}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          {/* Header Metadata */}
          <div className="p-8 md:p-12 border-b border-gray-50">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-primary-crimson text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest">
                {article.category_name}
              </span>
              {article.is_urgent === 1 && (
                <span className="bg-accent-gold text-primary-navy px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> عاجل
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-primary-navy mb-8 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-gray-500 font-bold text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-crimson" />
                {new Date(article.created_at).toLocaleDateString("ar-YE", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary-crimson" />
                {article.author || "هيئة التحرير"}
              </div>
              <div className="flex items-center gap-2 text-primary-navy">
                <Eye className="w-4 h-4 text-primary-crimson" />
                {article.views || 0} قراءة
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

          {/* Article Content */}
          <div className="p-8 md:p-12 lg:p-16">
            <div
              className="prose prose-lg md:prose-xl max-w-none 
                prose-p:text-primary-navy prose-p:leading-[1.8] prose-p:mb-8
                prose-headings:text-primary-navy prose-headings:font-black
                font-medium text-justify text-gray-900"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
            />
          </div>

          {/* Share Section */}
          <div className="p-8 md:p-12 bg-gray-50/50 border-t border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <Share2 className="w-6 h-6 text-primary-crimson" />
                <span className="font-black text-primary-navy">شارك الخبر</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleShare('facebook')} className="p-3 bg-[#1877f2] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all"><Facebook className="w-5 h-5" /></button>
                <button onClick={() => handleShare('twitter')} className="p-3 bg-black text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all"><Twitter className="w-5 h-5" /></button>
                <button onClick={() => handleShare('whatsapp')} className="p-3 bg-[#25d366] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all"><MessageCircle className="w-5 h-5" /></button>
                <button onClick={() => handleShare('telegram')} className="p-3 bg-[#0088cc] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Private Comment Form */}
        <div className="mt-12 bg-white rounded-[2rem] shadow-premium p-8 md:p-12 border border-gray-100">
          <h3 className="text-2xl font-black text-primary-navy mb-8 flex items-center gap-4">
            <MessageCircle className="w-7 h-7 text-primary-crimson" />
            أضف تعليقك
          </h3>
          <form onSubmit={handleCommentSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="الاسم"
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary-crimson rounded-xl outline-none font-bold transition-all text-primary-navy"
                required
              />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="رأيك يهمنا..."
              rows={4}
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary-crimson rounded-xl outline-none font-bold transition-all text-primary-navy"
              required
            ></textarea>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-navy text-white px-12 py-4 rounded-xl font-black shadow-xl hover:bg-primary-crimson transition-all"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال التعليق"}
            </button>
          </form>
          <div className="mt-8 flex items-center gap-3 text-gray-400 bg-gray-50 p-4 rounded-xl border border-gray-100 italic font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>التعليقات خاصة وتصل مباشرة لإدارة الموقع لضمان جودة المحتوى.</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-primary-navy font-black hover:text-primary-crimson transition-color">
            <ArrowRight className="w-5 h-5" />
            العودة للرئيسية
          </Link>
          <div className="opacity-20 font-black italic text-primary-navy tracking-tighter">AGRAS</div>
        </div>
      </div>
    </div>
  );
}
