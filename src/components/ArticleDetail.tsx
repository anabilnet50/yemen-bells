import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight, Share2, MessageCircle, Eye, Tag, Send, Clock, Twitter, Facebook, Linkedin, ChevronLeft, MapPin, TrendingUp, Play, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  const [comments, setComments] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch(`/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data);
        setLoading(false);
      });

    fetch(`/api/articles/${id}/comments`)
      .then(res => res.json())
      .then(setComments);

  }, [id]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !userName) return;

    fetch(`/api/articles/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName, content: comment })
    })
      .then(res => res.json())
      .then(() => {
        // setComments([{ name: userName, content: comment, created_at: new Date().toISOString() }, ...comments]);
        setComment('');
        setUserName('');
        alert('تم إضافة تعليقك بنجاح');
      });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);
    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(data => {
        setIsSubscribing(false);
        if (data.success) {
          alert('تم الاشتراك في النشرة الإخبارية بنجاح');
          setEmail('');
        } else {
          alert(data.error || 'حدث خطأ ما');
        }
      });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article.title;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }

    if (shareUrl) window.open(shareUrl, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-primary-navy">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-crimson border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white/20 font-black text-[10px] uppercase tracking-widest">Agras</div>
      </div>
      <p className="mt-8 font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">Loading Excellence...</p>
    </div>
  );

  if (!article) return <div className="text-center py-40 font-black text-2xl text-primary-navy bg-surface-soft min-h-screen flex flex-col items-center gap-8 justify-center">
    <div className="p-10 bg-white rounded-full shadow-premium"><Eye className="w-16 h-16 opacity-10" /></div>
    المحتوى المطلوب غير متوفر حالياً
    <Link to="/" className="text-sm bg-primary-crimson text-white px-8 py-3 rounded-full shadow-glow">العودة للرئيسية</Link>
  </div>;

  const readingTime = Math.ceil(article.content.split(' ').length / 200);

  return (
    <div className="bg-[#fcfdfe] min-h-screen pb-32">
      {/* Cinematic Article Hero */}
      <div className="h-[500px] md:h-[650px] bg-primary-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcfdfe] via-primary-navy/40 to-transparent"></div>

        {/* Animated Background Element */}
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-primary-crimson/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-[400px] h-[400px] bg-accent-gold/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto px-0 md:px-6 -mt-[150px] md:-mt-[350px] relative z-20">
        <div className="flex flex-col gap-12">

          {/* Main Content Area */}
          <div className="w-full flex flex-col">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center bg-white border border-primary-navy/5 text-primary-navy px-8 py-4 rounded-2xl font-black mb-12 hover:bg-primary-navy hover:text-white transition-all shadow-premium group cursor-pointer"
            >
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              العودة بالسابق
            </button>

            <motion.article
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-t-[2rem] md:rounded-[3rem] shadow-none md:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden border-none md:border border-gray-50 flex flex-col"
            >
              {/* Premium Media Shell */}
              <div className="relative group overflow-hidden bg-primary-navy">
                {article.video_url ? (
                  <div className="aspect-video w-full bg-black">
                    {article.video_url.includes('youtube.com') || article.video_url.includes('youtu.be') ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${article.video_url.split('v=')[1]?.split('&')[0] || article.video_url.split('/').pop()}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video src={article.video_url || undefined} className="w-full h-full object-contain" controls></video>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={article.image_url || 'https://picsum.photos/seed/editorial/1600/1000'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                {/* Category Badge - Elite Style */}
                <div className="absolute top-4 right-4 md:top-8 md:right-8">
                  <span className="bg-primary-crimson text-white px-4 md:px-8 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-glow border border-white/10 backdrop-blur-md">
                    {article.category_name}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-20">
                <header className="mb-8 md:mb-12">
                  <div className="flex flex-wrap items-center gap-6 md:gap-8 text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] mb-10 border-b border-gray-100 pb-10">
                    <span className="flex items-center gap-2 transition-colors hover:text-primary-crimson cursor-default"><Calendar className="w-4 h-4 text-primary-crimson" /> {new Date(article.created_at).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="flex items-center gap-2 transition-colors hover:text-primary-crimson cursor-default">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-primary-navy/10 bg-gray-50">
                        <img src={article.writer_image || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" />
                      </div>
                      {article.writer_name || 'هيئة التحرير'}
                    </span>
                    <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary-crimson" /> {article.views || 0} قراءة</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary-crimson" /> {readingTime} د قراءة</span>
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-black text-primary-navy leading-[1.3] mb-8 md:mb-10 drop-shadow-sm">
                    {article.title}
                  </h1>
                  <div className="w-32 h-2 bg-primary-crimson rounded-full shadow-glow"></div>
                </header>

                <div className="max-w-4xl mx-auto">
                  <div className="prose prose-xl md:prose-2xl max-w-none text-primary-navy/90 leading-[2] font-bold text-right font-sans">
                    {article.content.split('\n').map((p: string, i: number) => (
                      <p key={i} className="mb-8">{p}</p>
                    ))}
                  </div>


                  {/* Share Panel - Sophisticated Design */}
                  <div className="mt-20 p-12 glass-card bg-surface-soft/50 rounded-[3rem] border border-primary-navy/5 text-center relative overflow-hidden">
                    <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-primary-crimson/5 blur-[80px] rounded-full"></div>
                    <h3 className="text-xl font-black text-primary-navy mb-10 flex items-center justify-center gap-4 uppercase tracking-[0.3em] relative z-10">
                      <Share2 className="w-5 h-5 text-primary-crimson" /> ثقافة المشـاركة
                    </h3>
                    <div className="flex justify-center flex-wrap gap-8 relative z-10">
                      {[
                        { icon: Facebook, color: 'bg-[#1877f2]', platform: 'facebook', label: 'Facebook' },
                        { icon: Twitter, color: 'bg-black', platform: 'twitter', label: 'X' },
                        { icon: MessageCircle, color: 'bg-[#25d366]', platform: 'whatsapp', label: 'Whatsapp' },
                        { icon: Send, color: 'bg-[#0088cc]', platform: 'telegram', label: 'Telegram' }
                      ].map((social, i) => (
                        <button
                          key={i}
                          onClick={() => handleShare(social.platform)}
                          className={`flex items-center gap-4 px-8 py-4 ${social.color} text-white rounded-2xl shadow-xl hover:-translate-y-2 transition-all duration-500 font-bold`}
                        >
                          <social.icon className="w-5 h-5" />
                          <span className="text-xs tracking-widest uppercase">{social.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comments Thread - Elite Conversation */}
                  <div className="mt-24">
                    <h3 className="text-2xl font-black text-primary-navy mb-12 flex items-center gap-6">
                      <div className="p-3 bg-primary-navy text-white rounded-2xl shadow-xl"><MessageCircle className="w-6 h-6" /></div>
                      نـبض الـقارئ
                    </h3>

                    <div className="space-y-12">
                      {/* Comment Form */}
                      <form onSubmit={handleCommentSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-gray-50 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input
                            type="text"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            placeholder="الاسم المستعار"
                            className="w-full p-5 bg-white border-2 border-primary-crimson focus:border-red-600 focus:bg-red-50/10 transition-all rounded-2xl outline-none font-black text-sm text-black"
                          />
                        </div>
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          placeholder="ما هو انطباعك حول هذا الخبر؟"
                          rows={4}
                          className="w-full p-6 bg-white border-2 border-primary-crimson focus:border-red-600 focus:bg-red-50/10 transition-all rounded-2xl outline-none font-bold text-base text-black"
                        ></textarea>
                        <button className="bg-primary-navy text-white py-5 rounded-2xl font-black shadow-2xl shadow-primary-navy/20 hover:bg-primary-crimson transition-all flex items-center justify-center gap-4 group">
                          <Send className="w-5 h-5 group-hover:translate-x-[-10px] transition-transform" /> إرسال التعليق
                        </button>
                      </form>

                      <div className="space-y-6">
                        {comments.map((c, i) => (
                          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 hover:border-primary-crimson/20 transition-all">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-black text-primary-navy text-sm">{c.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString('ar-YE')}</span>
                            </div>
                            <p className="text-black font-bold text-base leading-relaxed">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </div>
      </div>
    </div>
  );
}
