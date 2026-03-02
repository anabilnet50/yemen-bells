import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Search, Globe, Facebook, Twitter, Youtube, Linkedin, ChevronLeft, ChevronRight, Calendar, User, Eye, TrendingUp, Play, Clock, Send, MessageCircle, ArrowLeft, MapPin, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ArticleDetail from './components/ArticleDetail';
import AdminDashboard from './components/AdminDashboard';
import CategoryArticles from './components/CategoryArticles';

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[2]}` : null;
};

const isAdActive = (ad: any) => {
  if (ad.is_active !== 1) return false;
  const now = new Date();
  if (ad.start_date && new Date(ad.start_date) > now) return false;
  if (ad.end_date && new Date(ad.end_date) < now) return false;
  return true;
};

function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    site_name: '𐩠𐩵𐩪 هـدس',
    site_tagline: 'الأقرب للأحدث - موقع إخباري شامل'
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pollVoted, setPollVoted] = useState(false);
  const [pollComment, setPollComment] = useState('');
  const [showPollComments, setShowPollComments] = useState(false);
  const [pollComments, setPollComments] = useState<any[]>([]);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 3;
  const smallArticlesPerPage = 3;
  const navigate = useNavigate();

  const urgentArticles = articles.filter(a => a.is_urgent == 1 || a.is_urgent === true || a.is_urgent === '1');
  const mainArticle = urgentArticles[0] || articles[0];

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Delay loading video to prioritize initial render
    const timer = setTimeout(() => setVideoLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, [mainArticle?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPollComments = () => {
    fetch('/api/poll/comments')
      .then(res => res.json())
      .then(data => setPollComments(data))
      .catch(err => console.error("Poll comments fetch error:", err));
  };

  useEffect(() => {
    fetch('/api/init')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles);
        setCategories(data.categories);
        setSettings(data.settings);
        setAds(data.ads);
      });

    fetchPollComments();
    const pollTimer = setInterval(fetchPollComments, 60000); // Refresh comments every minute
    return () => clearInterval(pollTimer);
  }, []);

  const handlePollCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollComment) return;

    fetch('/api/poll/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'زائر', content: pollComment })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPollComment('');
          fetchPollComments();
          setShowPollComments(true);
          setPollVoted(true);
        }
      });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 2) {
      setIsSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(value)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setIsSearching(false);
        });
    } else {
      setSearchResults([]);
    }
  };

  const centerCategories = ['local', 'intl', 'general'];
  const centerArticles = articles.filter(a => centerCategories.includes(a.category_slug));

  const filteredDisplayArticles = selectedCategory
    ? articles.filter(a => a.category_slug === selectedCategory)
    : centerArticles;

  const totalPages = Math.ceil(filteredDisplayArticles.length / articlesPerPage);
  const paginatedArticles = filteredDisplayArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  const opinionArticles = articles.filter(a => a.category_slug === 'opinion');
  const studiesArticles = articles.filter(a => a.category_slug === 'studies');

  return (
    <div className="font-sans bg-surface-soft min-h-screen text-primary-navy">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl shadow-premium relative z-10">
        {/* Header */}
        <header className="relative bg-black overflow-hidden">
          {/* Top Bar - Elite Thin Line */}
          <div className="bg-black/30 backdrop-blur-sm text-white py-2 px-8 border-b border-white/5 relative z-30">
            <div className="flex justify-between items-center text-xs md:text-sm font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-accent-gold transition-all hover:scale-105 cursor-default"><Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-5">
                {settings.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-400 hover:scale-110 transition-all duration-300"><Facebook className="w-3.5 h-3.5" /></a>}
                {settings.twitter_url && <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-sky-400 hover:scale-110 transition-all duration-300"><Twitter className="w-3.5 h-3.5" /></a>}
                {settings.youtube_url && <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary-crimson hover:scale-110 transition-all duration-300"><Youtube className="w-3.5 h-3.5" /></a>}
                {settings.telegram_url && <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-sky-400 hover:scale-110 transition-all duration-300"><Send className="w-3.5 h-3.5" /></a>}
                {settings.linkedin_url && <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-500 hover:scale-110 transition-all duration-300"><Linkedin className="w-3.5 h-3.5" /></a>}
              </div>
            </div>
          </div>

          {/* Luxury Header Content */}
          <div className="relative h-auto min-h-[280px] md:h-44 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center overflow-hidden py-8 md:py-0">
            {/* Artistic Background Overlay - News Globe Animation */}
            {/* Artistic Background Overlay - Premium Stone Texture */}
            <div className="absolute inset-0 z-0">
              <img
                src="/header_bg.jpg"
                alt="Header Background"
                className="w-full h-full object-cover object-center opacity-100 scale-100 pointer-events-none select-none"
              />

              {/* Restored News Globe Animation - Enhanced Visibility */}
              <div
                className="absolute top-1/2 -left-10 md:-left-12 -translate-y-1/2 w-[200px] md:w-[600px] h-[200px] md:h-[600px] opacity-60 select-none pointer-events-none mix-blend-lighten"
              >
                <img
                  src={settings.news_ball_image || "https://tse1.mm.bing.net/th/id/OIP.dKbPF3sk4Qg2vDcgN6jjxAHaB2?rs=1&pid=ImgDetMain&o=7&rm=3"}
                  alt="News Globe"
                  className="w-full h-full object-cover animate-[spin_60s_linear_infinite] rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="absolute inset-0 bg-black/5"></div>
              {/* Extra Dynamic Overlays for depth - Static Subtle Shift */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05),transparent)] pointer-events-none"></div>
            </div>

            {/* Left Side: Dynamic Logo - Eye-Catching Visual Identity */}
            <div className="relative z-20 flex flex-col items-end">
              <Link to="/" onClick={() => setSelectedCategory(null)} className="group flex flex-col items-center md:items-start ml-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  {/* Glow Aura Behind Logo */}
                  <div className="absolute inset-0 blur-3xl opacity-30 bg-primary-crimson rounded-full scale-150 group-hover:opacity-60 transition-opacity duration-700"></div>
                  <div className="flex flex-col items-center gap-4">
                    {/* Logo & Tagline Stack */}
                    <div className="flex flex-col items-center">
                      <h1 className="relative text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 whitespace-nowrap"
                        style={{
                          background: 'linear-gradient(to right, #fefce8, #f59e0b, #d97706, #f59e0b, #fefce8)',
                          backgroundSize: '200% auto',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          animation: 'logo-pulse 2.5s ease-in-out infinite, logo-gif-shimmer 3s linear infinite',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                        }}
                      >
                        <span>{settings.site_name || '𐩠𐩵𐩪 هدس'}</span>
                      </h1>
                      <div className="mt-1 text-white font-black text-sm md:text-base tracking-[0.2em] uppercase italic bg-black/40 px-4 py-1 rounded-full border border-white/10 backdrop-blur-md whitespace-nowrap shadow-lg">
                        {settings.site_tagline || 'الأقرب للأحدث - موقع إخباري شامل'}
                      </div>
                    </div>

                    {/* Integrated Chief Editor Info - Positioned Below */}
                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-2xl shadow-2xl group/editor hover:bg-black/60 transition-all duration-300">
                      <p className="text-accent-gold font-black text-[9px] uppercase tracking-[0.3em] opacity-90 mb-0.5 drop-shadow-sm">رئـيس التـحرير</p>
                      <div className="text-white font-serif italic text-lg md:text-xl font-black tracking-wider drop-shadow-md">
                        {settings.chief_editor || 'صلاح حيدرة'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>

            {/* Right Spacer to preserve layout balance */}
            {/* Right Spacer - visible only on desktop */}
            <div className="hidden lg:block w-1/4"></div>

            {/* Right Spacer to preserve layout balance */}
            {/* Right Spacer - visible only on desktop */}
            <div className="hidden lg:block w-1/4"></div>
          </div>
        </header>

        {/* Elite Navigation Bar - Glassmorphism Sticky */}
        <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-primary-navy/5 shadow-premium">
          <div className="px-4 md:px-8 flex flex-col md:flex-row justify-between items-center py-1.5 h-auto md:h-14 gap-2 md:gap-4">
            {/* Search - Modern Minimalist Focus */}
            <div className="relative w-full md:w-80 group order-2 md:order-2">
              <input
                type="text"
                placeholder="ابحث عن الحقيقة..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-6 pr-14 py-2.5 bg-surface-soft border-2 border-transparent focus:border-primary-crimson/30 focus:bg-white rounded-[1rem] outline-none font-bold text-sm transition-all duration-500 shadow-inner"
              />
              <div className="absolute right-1 top-1 bottom-1 w-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm text-gray-400 group-focus-within:text-primary-crimson transition-all duration-300">
                <Search className="w-5 h-5" />
              </div>

              {/* Advanced Results Dropdown */}
              <AnimatePresence>
                {searchTerm.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-white/98 backdrop-blur-2xl rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-primary-navy/5 overflow-hidden z-[110] max-h-[500px] custom-scrollbar overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-10 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary-crimson border-t-transparent rounded-full mx-auto mb-4 shadow-[0_0_10px_rgba(225,29,72,0.3)]"></div><p className="font-black text-gray-400">جاري الكشف عن النتائج...</p></div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-3 space-y-1">
                        {searchResults.map(result => (
                          <div
                            key={result.id}
                            onClick={() => { navigate(`/article/${result.id}`); setSearchTerm(''); }}
                            className="p-4 hover:bg-surface-soft cursor-pointer rounded-2xl flex gap-4 items-center group/item transition-all duration-300"
                          >
                            <img src={result.image_url || undefined} className="w-16 h-16 object-cover rounded-xl shadow-lg group-hover/item:scale-105 transition-transform duration-500" />
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-base group-hover/item:text-primary-crimson transition-colors truncate mb-1">{result.title}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-xs px-2.5 py-1 bg-primary-navy/5 text-primary-navy rounded-full font-black uppercase tracking-wider">{result.category_name}</span>
                                <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5"><Clock className="w-3 h-3" /> تم النشر مؤخراً</span>
                              </div>
                            </div>
                            <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-50 opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-[-5px]">
                              <ChevronLeft className="w-4 h-4 text-primary-crimson" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-16 text-center text-gray-400 font-black tracking-widest uppercase">لا توجد نتائج مطابقة</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Main Tabs - Prestigious Indicator Animations */}
            <ul className="flex items-center gap-2 font-black text-sm md:text-base order-1 md:order-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0 w-full md:w-auto">
              {[
                { label: 'الرئيسية', slug: null },
                { label: 'أخبار محلية', slug: 'local' },
                { label: 'أخبار دولية', slug: 'intl' },
                { label: 'راسلنا', slug: 'contact' }
              ].map((item) => (
                <li
                  key={item.label}
                  className={`cursor-pointer px-5 md:px-6 py-2.5 md:py-2 rounded-xl transition-all duration-500 relative group overflow-hidden shrink-0 ${selectedCategory === item.slug ? 'text-white bg-primary-crimson shadow-glow-sm' : 'text-primary-navy/70 bg-primary-navy/5 hover:text-primary-navy hover:bg-primary-navy/10 border border-primary-navy/5'}`}
                  onClick={() => {
                    if (item.slug === 'contact') {
                      window.location.href = `mailto:${settings.contact_email || 'info@hads-news.com'}`;
                    } else {
                      setSelectedCategory(item.slug);
                      setTimeout(() => {
                        document.getElementById('news-feed-top')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                >
                  <span className="relative z-10">{item.label}</span>
                  {selectedCategory === item.slug && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-crimson shadow-[0_0_20px_rgba(225,29,72,0.8)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>



        {/* Main Content */}
        <main className="px-4 py-6 space-y-6">

          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-0 md:p-6">
            {/* Main News Hero - Premium Large Format */}
            <div className="lg:col-span-3 flex flex-col group/hero">
              {mainArticle && (
                <div
                  onClick={() => navigate(`/article/${mainArticle.id}`)}
                  className="relative h-[250px] sm:h-[350px] md:h-[480px] bg-primary-navy rounded-none md:rounded-3xl overflow-hidden cursor-pointer shadow-none md:shadow-premium border-none md:border border-white/5 group"
                >
                  {/* Watermark Logo - Compact & Focused - Always visible over image or video */}
                  <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40 flex flex-col items-end pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <div className="bg-black/30 backdrop-blur-lg px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center">
                      <span className="text-white font-black text-xl md:text-3xl tracking-tighter flex items-center gap-1 drop-shadow-2xl">
                        <span className="text-primary-crimson">𐩠</span>𐩵𐩪 <span className="mr-1">هـدس</span>
                      </span>
                    </div>
                  </div>

                  {mainArticle.video_url && videoLoaded ? (
                    (() => {
                      const ytUrl = getYoutubeEmbedUrl(mainArticle.video_url);
                      return ytUrl ? (
                        <iframe
                          src={ytUrl}
                          className="w-full h-full pointer-events-none object-cover"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video
                          src={mainArticle.video_url}
                          autoPlay
                          muted
                          loop
                          className="w-full h-full object-cover"
                        />
                      );
                    })()
                  ) : (
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full relative"
                    >
                      {mainArticle.image_url && (
                        <img
                          src={mainArticle.image_url || undefined}
                          alt={mainArticle.title}
                          className="w-full h-full object-contain md:object-cover bg-black transition-transform duration-1000 scale-100 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {mainArticle.video_url && !videoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/30">
                            <Play className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Professional TV-Style News Ticker (Al Hadath/Al Jazeera Style) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-primary-crimson z-20 flex items-stretch h-10 md:h-12 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                    {/* Urgent Indicator - Right Side */}
                    <div className="bg-primary-crimson text-white px-3 md:px-8 flex items-center justify-center font-black text-xs md:text-sm uppercase tracking-widest relative group/urgent shrink-0 z-30 shadow-[5px_0_15px_rgba(225,29,72,0.3)]">
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      عاجل
                    </div>

                    {/* Scrolling Content - Center */}
                    <div className="flex-1 overflow-hidden flex items-center bg-white border-x border-gray-100 relative">
                      <div className="whitespace-nowrap text-primary-navy font-black text-sm md:text-base w-full" style={{ gap: 0 }}>
                        {/* Build the base content block first to avoid massive inline repetition */}
                        {(() => {
                          const TickerItemContent = (
                            <>
                              {settings?.custom_ticker_text && settings.custom_ticker_text.trim() !== '' && (
                                <span className="flex items-center gap-4 text-primary-navy drop-shadow-sm font-black text-sm md:text-base group/tickeritem shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-primary-crimson shadow-[0_0_10px_rgba(225,29,72,0.8)]"></span>
                                  {settings.custom_ticker_text}
                                </span>
                              )}
                              {urgentArticles.map(a => (
                                <Link key={`urgent-${a.id}`} to={`/article/${a.id}`} className="flex items-center gap-4 hover:text-primary-crimson transition-colors group/tickeritem shrink-0">
                                  <span className="w-1.5 h-1.5 bg-primary-crimson rotate-45 group-hover/tickeritem:scale-125 transition-transform"></span>
                                  {a.title}
                                  {['opinion', 'studies'].includes(a.category_slug) && a.writer_name && (
                                    <span className="text-primary-crimson/80 mr-2"> - {a.writer_name}</span>
                                  )}
                                </Link>
                              ))}
                            </>
                          );

                          const FallbackContent = (
                            <span className="text-gray-400 font-bold text-[10px] md:text-xs tracking-widest shrink-0 flex items-center gap-4">
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              هـدس .. تغطية حية ومستمرة لكل ما يدور في الساحة اليمنية والمنطقة
                            </span>
                          );

                          const hasCustomText = settings?.custom_ticker_text && settings.custom_ticker_text.trim() !== '';
                          const blocksToRender = (urgentArticles.length > 0 || hasCustomText) ? TickerItemContent : FallbackContent;

                          const itemsCount = Math.max(1, urgentArticles.length) + (hasCustomText ? 1 : 0);
                          const calculatedDuration = itemsCount * 8 * 15; // 15 seconds per distinct news item reading time

                          return (
                            <div className="flex animate-marquee hover:pause w-max" style={{ animationDuration: `${calculatedDuration}s` }}>
                              {/* Half 1 */}
                              <div className="flex items-center gap-12 px-6">
                                {[...Array(8)].map((_, i) => (
                                  <React.Fragment key={`h1-${i}`}>{blocksToRender}</React.Fragment>
                                ))}
                              </div>
                              {/* Half 2 */}
                              <div className="flex items-center gap-12 px-6" aria-hidden="true">
                                {[...Array(8)].map((_, i) => (
                                  <React.Fragment key={`h2-${i}`}>{blocksToRender}</React.Fragment>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Time Indicator - Left Side */}
                    <div className="bg-primary-crimson text-white px-2 md:px-4 flex items-center justify-center shrink-0 relative overflow-hidden group/clock z-20 shadow-[-10px_0_20px_white]">
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      <span className="font-sans font-black text-xs md:text-sm tracking-widest tabular-nums" style={{ direction: 'ltr' }}>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                  </div>

                  {/* High-End Overlay - Moved Up slightly to accommodate the ticker */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/90 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10 pb-16 md:pb-20">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-white/10 backdrop-blur-md text-white/90 border border-white/10 px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-full">
                        {mainArticle.category_name}
                      </span>
                    </div>

                    <h2 className="text-white text-xl md:text-2xl font-black leading-[1.2] mb-4 group-hover:text-accent-gold transition-colors duration-500 drop-shadow-2xl line-clamp-2">
                      {mainArticle.title}
                    </h2>

                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {/* Metadata removed as per user request */}
                    </div>
                  </div>

                  {/* Hero Navigation Buttons - Sleek Style */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button className="w-10 h-10 bg-white/10 backdrop-blur-xl text-white rounded-xl border border-white/10 flex items-center justify-center hover:bg-primary-crimson hover:scale-110 transition-all"><ChevronRight className="w-5 h-5" /></button>
                    <button className="w-10 h-10 bg-white/10 backdrop-blur-xl text-white rounded-xl border border-white/10 flex items-center justify-center hover:bg-primary-crimson hover:scale-110 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Ad Space - Dynamic Elite Promotion */}
            <div className="lg:col-span-1 glass-card bg-primary-navy text-white flex flex-col items-center justify-center p-0 text-center relative overflow-hidden h-[300px] lg:h-auto group shadow-2xl border border-white/5 rounded-[2rem]">
              {ads.filter(ad => isAdActive(ad) && ad.position === 'top').length > 0 ? (
                (() => {
                  const ad = ads.filter(ad => isAdActive(ad) && ad.position === 'top')[0];
                  return (
                    <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-full relative group">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      ) : ad.adsense_code ? (
                        <div className="w-full h-full p-4 flex items-center justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: ad.adsense_code }} />
                      ) : (
                        <div className="w-full h-full p-12 flex flex-col items-center justify-center bg-gradient-to-br from-primary-navy to-primary-crimson">
                          <h3 className="text-2xl font-black mb-4">{ad.title}</h3>
                          <DollarSign className="w-12 h-12 text-accent-gold" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all"></div>
                      <div className="absolute top-4 right-4 bg-accent-gold text-primary-navy text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase shadow-glow">Sponsored</div>
                    </a>
                  );
                })()
              ) : (
                <div className="relative z-10 p-10 flex flex-col justify-center items-center h-full bg-gradient-to-br from-primary-navy to-primary-crimson w-full">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="bg-accent-gold text-primary-navy px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-glow relative z-10"
                  >
                    مساحة إعلانية
                  </motion.div>
                  <div className="text-2xl md:text-3xl font-black mb-4 leading-tight drop-shadow-2xl font-serif italic text-white/90 relative z-10">
                    هـدس بريميوم
                  </div>
                  <p className="text-xl font-bold mb-3 text-accent-gold/90 relative z-10">صوتك الحر في كل مكان</p>
                  <div className="h-px w-12 bg-white/20 mb-4 relative z-10"></div>
                  <p className="text-sm text-white/60 font-bold leading-relaxed relative z-10">للتواصل والإعلان معنا عبر البريد الإلكتروني أو قنوات التواصل الاجتماعي</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle Section - Precision Journalism Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch px-4 md:px-6">
            {/* Right Column (Articles & Studies) - order-1 on mobile, order-1 on desktop */}
            <div className="lg:col-span-1 order-1 lg:order-1 flex flex-col gap-6">

              {/* Articles Section (Redesigned from Opinion) */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/5 relative group h-60">
                <div className="absolute inset-0">
                  <img src={settings?.opinion_bg || "https://picsum.photos/seed/opinions/600/800"} alt="Opinions" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-30" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-white/40"></div>
                </div>
                <Link to="/category/opinion" className="bg-primary-navy p-4 text-center font-black text-white text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-navy/90 transition-all shrink-0 relative z-10">
                  <div className="w-1 h-3 bg-primary-crimson rounded-full shadow-glow"></div>
                  {settings?.opinion_title || 'مقالات'}
                </Link>
                <div className="flex-1 overflow-hidden relative p-4 z-10">
                  <div className="animate-marquee-vertical flex flex-col space-y-4">
                    {opinionArticles.length > 0 ? (
                      [...opinionArticles.slice(0, 2), ...opinionArticles.slice(0, 2)].map((v, i) => (
                        <Link
                          key={`${v.id}-${i}`}
                          to={`/article/${v.id}`}
                          className="flex items-center gap-4 group/vitem bg-white/50 p-3 rounded-2xl hover:bg-white/80 transition-all border border-gray-100 shadow-sm"
                        >
                          <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 relative order-2">
                            <img src={v.image_url || undefined} alt={v.title} className="w-full h-full object-cover group-hover/vitem:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 text-right order-1">
                            <h4 className="text-primary-navy font-black text-xs line-clamp-2 leading-relaxed group-hover/vitem:text-primary-crimson transition-colors">{v.title}</h4>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center justify-end gap-1">
                              <span>{v.author || 'كاتب المقال'}</span>
                              <User className="w-3 h-3" />
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      [1, 2].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 opacity-50">
                          <div className="w-20 h-14 bg-gray-200 rounded-lg shrink-0 order-2"></div>
                          <div className="flex-1 text-right order-1">
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-2 bg-gray-100 rounded w-1/2 ml-auto"></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/5 relative group h-60">
                <div className="absolute inset-0">
                  <img src={settings?.research_bg || "https://picsum.photos/seed/research/600/800"} alt="Research" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-30" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-white/40"></div>
                </div>
                <Link to="/category/studies" className="bg-primary-navy p-4 text-center font-black text-white text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-navy/90 transition-all shrink-0 z-10 relative">
                  <div className="w-1 h-3 bg-accent-gold rounded-full shadow-glow"></div>
                  {settings?.research_title || 'أبحاث ودراسات'}
                </Link>
                <div className="flex-1 overflow-hidden relative p-4 z-10">
                  <div className="animate-marquee-vertical flex flex-col space-y-4">
                    {studiesArticles.length > 0 ? (
                      [...studiesArticles.slice(0, 2), ...studiesArticles.slice(0, 2)].map((v, i) => (
                        <Link
                          key={`${v.id}-${i}`}
                          to={`/article/${v.id}`}
                          className="flex items-center gap-4 group/vitem bg-white/50 p-3 rounded-2xl hover:bg-white/80 transition-all border border-gray-100 shadow-sm"
                        >
                          <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 relative order-1">
                            <img src={v.image_url || undefined} alt={v.title} className="w-full h-full object-cover group-hover/vitem:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 text-right order-2">
                            <h4 className="text-primary-navy font-black text-xs line-clamp-2 leading-relaxed group-hover/vitem:text-primary-crimson transition-colors">{v.title}</h4>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center justify-end gap-1">
                              <span>{v.author || 'الباحث'}</span>
                              <User className="w-3 h-3" />
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      [1, 2].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 opacity-50">
                          <div className="w-20 h-14 bg-gray-200 rounded-lg shrink-0 order-2"></div>
                          <div className="flex-1 text-right order-1">
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-2 bg-gray-100 rounded w-1/2 ml-auto"></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column (News Feed - Elite Curation) - order-2 on both */}
            <div id="news-feed-top" className="lg:col-span-2 order-2 flex flex-col glass-card bg-white shadow-2xl overflow-hidden border border-primary-navy/10 group/feed">
              <div className="bg-primary-navy p-6 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-crimson/5 skew-x-[-20deg] translate-x-[-50%] group-hover/feed:translate-x-[-40%] transition-transform duration-1000"></div>
                <h3 className="font-black text-xl text-white flex items-center gap-4 relative z-10">
                  <div className="p-2.5 bg-primary-crimson/20 rounded-xl shadow-inner"><TrendingUp className="w-5 h-5 text-primary-crimson" /></div>
                  <span className="tracking-widest uppercase text-base md:text-lg">تغطية خاصة | <span className="text-accent-gold">{selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : 'آخر المستجدات'}</span></span>
                </h3>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-primary-navy bg-gray-200 overflow-hidden"><img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="viewer" /></div>)}
                  </div>
                  <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em] hidden md:block">Active Readers</span>
                </div>
              </div>

              <div className="divide-y divide-gray-50 bg-white">
                {paginatedArticles.length > 0 ? paginatedArticles.map((article, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                    key={article.id}
                    className="group/item"
                  >
                    <div
                      className="p-4 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8 hover:bg-surface-soft/80 transition-all duration-700 cursor-pointer relative"
                      onClick={() => navigate(`/article/${article.id}`)}
                    >
                      {/* Left Interaction Stripe */}
                      <div className="absolute left-0 top-0 bottom-0 w-0 group-hover/item:w-1.5 bg-primary-crimson shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all duration-500 ease-out"></div>

                      {/* Image Content - Cinematic Frame */}
                      {article.image_url && (
                        <div className={`w-full md:w-56 lg:w-48 xl:w-64 h-48 shrink-0 overflow-hidden rounded-3xl shadow-xl relative group-hover/item:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-700 ${index === 0 ? 'sm:order-1' : (index % 2 !== 0 ? 'order-1 sm:order-2' : 'order-1')}`}>
                          <img
                            src={article.image_url || undefined}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover/item:scale-110 group-hover/item:rotate-1 transition-transform duration-1000"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-primary-navy/20 group-hover/item:bg-transparent transition-colors duration-700"></div>
                          {article.video_url && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 shadow-2xl group-hover/item:bg-primary-crimson group-hover/item:border-primary-crimson transition-all duration-500"
                              >
                                <Play className="w-8 h-8 fill-current" />
                              </motion.div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text Content - Refined Spacing */}
                      <div className={`flex-1 flex flex-col justify-center ${index % 2 !== 0 ? 'order-1 text-right' : 'order-1 sm:order-2 text-right'}`}>
                        <div className={`flex items-center gap-3 mb-4 ${index % 2 !== 0 ? 'justify-start' : 'justify-end'}`}>
                          <span className="text-sm font-black text-primary-crimson uppercase tracking-[0.25em] bg-primary-crimson/5 px-3 py-1 rounded-full">{article.category_name}</span>
                          <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                          <span className="text-sm text-gray-400 font-black uppercase tracking-widest">{new Date(article.created_at).toLocaleDateString('ar-YE', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <h5 className="text-primary-navy font-black text-lg md:text-xl mb-4 group-hover/item:text-primary-crimson premium-transition leading-[1.3] drop-shadow-sm">
                          {article.title}
                        </h5>
                        <p className="text-gray-500 font-bold leading-relaxed text-base line-clamp-2 mb-6 opacity-80 group-hover/item:opacity-100 transition-opacity">
                          {article.content}
                        </p>
                        <div className={`flex items-center justify-between text-sm font-black uppercase tracking-[0.2em] border-t border-gray-100/50 pt-6 mt-auto ${index % 2 !== 0 ? '' : 'flex-row-reverse'}`}>
                          <div className="flex items-center gap-6 text-gray-400">
                            <span className="flex items-center gap-2 group-hover/item:text-primary-navy transition-colors"><Eye className="w-4 h-4 text-primary-crimson/50" /> {article.views || 0}</span>
                            <span className="flex items-center gap-2 group-hover/item:text-primary-navy transition-colors"><MapPin className="w-4 h-4 text-primary-crimson/50" /> صنعاء</span>
                          </div>
                          <span className="text-primary-crimson flex items-center gap-2 group-hover/item:gap-4 transition-all duration-500 font-black">
                            {index % 2 !== 0 ? 'استمـر في القراءة' : 'قراءة المزيـد'}
                            <ArrowLeft className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-32 text-center text-gray-300 font-black tracking-widest uppercase flex flex-col items-center gap-8 bg-surface-soft/20">
                    <div className="p-12 bg-white rounded-[3rem] shadow-premium"><Search className="w-14 h-14 opacity-10" /></div>
                    <p className="text-xl">نحن بصدد تحديث هذا القسم .. ترقبوا جديدنا</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {
                totalPages > 1 && (
                  <div className="bg-surface-soft/30 p-6 flex items-center justify-center gap-2 border-t border-primary-navy/5">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                        const feedElement = document.getElementById('news-feed-top');
                        if (feedElement) feedElement.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary-navy/10 bg-white text-primary-navy hover:bg-primary-crimson hover:text-white hover:border-primary-crimson transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1 font-black text-primary-navy">
                      {[1, 2, 3].map((page) => {
                        if (page > totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page);
                              const feedElement = document.getElementById('news-feed-top');
                              if (feedElement) feedElement.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-10 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all text-base ${currentPage === page ? 'bg-primary-crimson text-white border-primary-crimson shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'bg-white border-primary-navy/10 hover:bg-surface-soft'}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      {totalPages > 3 && currentPage > 3 && (
                        <>
                          <span className="px-2 opacity-30">...</span>
                          <button
                            className="w-10 h-10 rounded-xl flex items-center justify-center border bg-primary-crimson text-white border-primary-crimson shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                          >
                            {currentPage}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        const feedElement = document.getElementById('news-feed-top');
                        if (feedElement) feedElement.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary-navy/10 bg-white text-primary-navy hover:bg-primary-crimson hover:text-white hover:border-primary-crimson transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )
              }
            </div>

            {/* Left Column (Images/Widgets - Multimedia Focus) - order-3 on mobile, order-4 on desktop */}
            <div className="lg:col-span-1 order-3 lg:order-4 flex flex-col gap-6">
              {/* Rights and Freedoms - Cinematic Style */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/10 relative group min-h-[350px]">
                <div className="absolute inset-0">
                  <img src={settings.rights_bg || "https://picsum.photos/seed/unicef-rights/600/800"} alt="Rights" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-primary-navy/60 to-transparent"></div>
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="h-48 overflow-hidden relative w-full mb-6">
                    <div className="animate-marquee-vertical flex flex-col space-y-6 text-white text-right font-black text-lg drop-shadow-lg">
                      {articles.filter(a => a.category_slug === 'rights').length > 0 ? (
                        <>
                          {[...articles.filter(a => a.category_slug === 'rights').slice(0, 4), ...articles.filter(a => a.category_slug === 'rights').slice(0, 4)].map((a, index) => (
                            <Link key={`${a.id}-${index}`} to={`/article/${a.id}`} className="text-white hover:text-accent-gold transition-all duration-300 leading-relaxed flex items-start gap-4 pr-4">
                              <div className="w-2.5 h-2.5 bg-white rounded-sm shadow-glow shrink-0 mt-2"></div>
                              <span className="line-clamp-2">{a.title}</span>
                            </Link>
                          ))}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <Link to="/category/rights" className="bg-primary-crimson/90 backdrop-blur-md text-center py-4 font-black text-white text-xl rounded-2xl border border-white/10 shadow-xl uppercase tracking-widest hover:bg-primary-crimson transition-all block">
                    {settings.rights_title || 'حقوق وحريات'}
                  </Link>
                </div>
              </div>

              {/* Sidebar Ad 1 */}
              {ads.filter(ad => isAdActive(ad) && ad.position === 'sidebar').length > 0 && (
                <div className="glass-card overflow-hidden border border-primary-navy/10 relative group h-[350px] rounded-[2rem]">
                  {(() => {
                    const ad = ads.filter(ad => isAdActive(ad) && ad.position === 'sidebar')[0];
                    return (
                      <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-full relative block">
                        {ad.image_url ? (
                          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        ) : ad.adsense_code ? (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white" dangerouslySetInnerHTML={{ __html: ad.adsense_code }} />
                        ) : (
                          <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary-navy to-primary-crimson text-white">
                            <h3 className="text-xl font-black mb-4">{ad.title}</h3>
                            <DollarSign className="w-10 h-10 text-accent-gold" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-accent-gold text-primary-navy text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase shadow-glow">Sponsored</div>
                      </a>
                    );
                  })()}
                </div>
              )}

              {/* Technology - Futuristic Space */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/10 relative group min-h-[350px]">
                <div className="absolute inset-0">
                  <img src={settings.tech_bg || "https://picsum.photos/seed/future-tech/600/800"} alt="Tech" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-primary-navy/60 to-transparent"></div>
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="h-48 overflow-hidden relative w-full mb-6">
                    <div className="animate-marquee-vertical flex flex-col space-y-6 text-white text-right font-black text-lg drop-shadow-lg">
                      {articles.filter(a => a.category_slug === 'tech').length > 0 ? (
                        <>
                          {[...articles.filter(a => a.category_slug === 'tech').slice(0, 4), ...articles.filter(a => a.category_slug === 'tech').slice(0, 4)].map((a, index) => (
                            <Link key={`${a.id}-${index}`} to={`/article/${a.id}`} className="text-white hover:text-primary-crimson transition-all duration-300 leading-relaxed flex items-start gap-4 pr-4">
                              <div className="w-2.5 h-2.5 bg-white rounded-sm shadow-glow shrink-0 mt-2"></div>
                              <span className="line-clamp-2">{a.title}</span>
                            </Link>
                          ))}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <Link to="/category/tech" className="bg-primary-crimson/90 backdrop-blur-md text-center py-4 font-black text-white text-xl rounded-2xl border border-white/10 shadow-xl uppercase tracking-widest hover:bg-primary-crimson transition-all block">
                    {settings.tech_title || 'تـكنولوجيا'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section (Elite Categories Showcase) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-6 pt-6 pb-12 order-5 lg:order-5">
            {
              [
                { label: settings.sports_title || 'رياضة', slug: 'sports', color: 'border-blue-600', accent: 'text-blue-400', img: settings.sports_bg || 'https://picsum.photos/seed/sports-action/600/400' },
                { label: settings.society_title || 'مجتمع', slug: 'society', color: 'border-purple-600', accent: 'text-purple-400', img: settings.society_bg || 'https://picsum.photos/seed/society/600/400' },
                { label: settings.economy_title || 'اقتصاد', slug: 'economy', color: 'border-green-600', accent: 'text-green-400', img: settings.economy_bg || 'https://picsum.photos/seed/economy-gold/600/400' }
              ].map((cat, i) => (
                <motion.div
                  whileHover={{ y: -10 }}
                  key={i}
                  className={`glass-card overflow-hidden h-72 relative group transition-all duration-500 flex flex-col border border-primary-navy/5`}
                >
                  <div className="absolute inset-0">
                    <img src={cat.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-primary-navy/40 group-hover:bg-primary-navy/20 transition-all duration-500 z-0"></div>
                  </div>
                  <div className="relative z-10 flex-1 p-6 flex flex-col items-center justify-end">
                    <div className="h-44 overflow-hidden relative w-full mb-2">
                      <div className="animate-marquee-vertical flex flex-col space-y-6 text-white text-right font-black text-lg">
                        {articles.filter(a => a.category_slug === cat.slug).length > 0 ? (
                          <>
                            {[...articles.filter(a => a.category_slug === cat.slug), ...articles.filter(a => a.category_slug === cat.slug)].slice(0, 3).map((a, index) => (
                              <Link key={`${a.id}-${index}`} to={`/article/${a.id}`} className="text-white hover:text-accent-gold transition-all duration-300 leading-relaxed flex items-start gap-4 pr-4">
                                <div className="w-2.5 h-2.5 bg-accent-gold rounded-sm shadow-glow shrink-0 mt-2"></div>
                                <span className="line-clamp-2">{a.title}</span>
                              </Link>
                            ))}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Link to={`/category/${cat.slug}`} className="w-full z-20 relative cursor-pointer bg-primary-crimson/90 backdrop-blur-md p-4 text-center font-black text-white text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-crimson transition-all shrink-0">
                    <div className="w-1 h-3 bg-white rounded-full shadow-glow"></div>
                    {cat.label}
                  </Link>
                </motion.div>
              ))
            }

            {/* YouTube Premium Card - Redesigned Showcase */}
            <div className="relative h-72 group overflow-hidden bg-primary-navy rounded-[2rem] shadow-premium flex flex-col cursor-default border-b-8 border-primary-crimson premium-transition">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>

              <div className="p-6 relative z-10 flex items-center justify-between border-b border-white/5 bg-primary-navy/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-crimson rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Youtube className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm tracking-widest uppercase">{settings.youtube_section_title || 'هـدس'}</h3>
                    <div className="text-accent-gold font-serif italic text-xs tracking-tighter">YouTube Showcase</div>
                  </div>
                </div>
                <a href={settings.youtube_url || "https://youtube.com"} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-white/5 hover:bg-primary-crimson text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-all">
                  Subscribe
                </a>
              </div>

              <div className="flex-1 overflow-hidden relative p-4">
                <div className="animate-marquee-vertical flex flex-col space-y-4">
                  {articles.filter(a => a.video_url && (a.video_url.includes('youtube.com') || a.video_url.includes('youtu.be'))).map((v, i) => {
                    const videoId = v.video_url ? v.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1] : null;
                    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : v.image_url;

                    return (
                      <a
                        key={`${v.id}-${i}`}
                        href={v.video_url || `https://youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 group/vitem bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                      >
                        <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 relative">
                          <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover/vitem:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vitem:bg-black/0 transition-all">
                            <Play className="w-5 h-5 text-white fill-current opacity-80" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-sm line-clamp-2 leading-snug group-hover/vitem:text-accent-gold transition-colors text-right">
                            {v.title}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                  {/* Repeat for seamless loop */}
                  {articles.filter(a => a.video_url && (a.video_url.includes('youtube.com') || a.video_url.includes('youtu.be'))).map((v, i) => {
                    const videoId = v.video_url ? v.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1] : null;
                    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : v.image_url;

                    return (
                      <a
                        key={`dup-${v.id}-${i}`}
                        href={v.video_url || `https://youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 group/vitem bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                      >
                        <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 relative">
                          <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover/vitem:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-sm line-clamp-2 leading-snug group-hover/vitem:text-accent-gold transition-colors text-right">
                            {v.title}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - Vertical Stacked Order */}
        <footer className="bg-primary-navy text-white relative overflow-hidden py-10">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-crimson to-transparent shadow-glow"></div>

          <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 flex flex-col items-center gap-10">

            {/* 1. TOP: Dynamic Poll with Comments */}
            <div className="w-full flex justify-center">
              <div className="bg-white rounded-[2rem] border border-gray-100 p-4 md:p-6 text-center shadow-premium relative overflow-hidden group w-full max-w-[500px]">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary-crimson" />
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">استطلاع الرأي العام</span>
                </div>

                {!pollVoted ? (
                  <div className="space-y-4">
                    <p className="text-gray-900 font-bold text-xs md:text-sm text-right leading-relaxed">
                      هل تعتقد أن التحولات السياسية الأخيرة ستؤدي إلى استقرار اقتصادي مستدام في المنطقة؟
                    </p>
                    <form onSubmit={handlePollCommentSubmit} className="space-y-2">
                      <textarea
                        placeholder="شاركنا رأيك..."
                        value={pollComment}
                        onChange={(e) => setPollComment(e.target.value)}
                        className="w-full bg-white border-2 border-cyan-400 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-cyan-500 transition-all resize-none h-20"
                        required
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-primary-crimson text-white py-2.5 rounded-xl font-black text-[10px] shadow-lg shadow-primary-crimson/20 hover:scale-[1.02] transition-all"
                        >
                          إرسال المشاركة
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPollComments(!showPollComments)}
                          className="bg-white text-gray-900 p-2.5 rounded-xl hover:bg-cyan-50 transition-all border-2 border-cyan-400 flex items-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-[8px] font-black uppercase tracking-wider">{pollComments.length}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-primary-navy font-black text-xs md:text-sm">شكراً لمشاركتك المتزنة!</p>
                    <button
                      onClick={() => setShowPollComments(!showPollComments)}
                      className="mt-4 bg-white text-gray-900 hover:bg-cyan-50 border-2 border-cyan-400 px-6 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mx-auto"
                    >
                      <MessageCircle className="w-4 h-4" /> عرض جميع تعليقات المشاركين ({pollComments.length})
                    </button>
                  </div>
                )}

                {/* Poll Comments List */}
                <AnimatePresence>
                  {showPollComments && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 border-t border-white/5 pt-4 overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {pollComments.length > 0 ? (
                          pollComments.map((comment, i) => (
                            <div key={i} className="text-right bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-gray-500">{new Date(comment.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-sm text-primary-navy font-black">{comment.name}</span>
                              </div>
                              <p className="text-xs text-gray-800 leading-relaxed font-bold">{comment.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-[10px] italic">لا توجد تعليقات بعد. كن أول المشاركين!</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. MIDDLE: Social Icons */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                {[
                  { icon: Facebook, color: 'hover:bg-blue-600', url: settings.facebook_url },
                  { icon: Twitter, color: 'hover:bg-sky-500', url: settings.twitter_url },
                  { icon: Youtube, color: 'hover:bg-primary-crimson', url: settings.youtube_url },
                  { icon: Send, color: 'hover:bg-[#0088cc]', url: settings.telegram_url || "#" },
                  { icon: Linkedin, color: 'hover:bg-blue-700', url: settings.linkedin_url }
                ].map((social, i) => (
                  <a key={i} href={social.url || "#"} target="_blank" rel="noopener noreferrer"
                    className={`w-11 h-11 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center ${social.color} transition-all duration-500 border border-white/5 hover:border-white/10 hover:shadow-glow-sm`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* 3. BOTTOM: Copyright */}
            <div className="w-full pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-6 opacity-30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/5"><Globe className="w-4 h-4 text-white/50" /></div>
                <span className="text-xs font-black uppercase tracking-wider font-serif">{settings.copyright_text || 'جميع الحقوق محفوظة لدى موقع هـدس'} &copy; {new Date().getFullYear()}</span>
              </div>
            </div>

          </div>
        </footer>
      </div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {
          showContactModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                <div className="bg-[#0a2342] p-8 text-white relative">
                  <button onClick={() => setShowContactModal(false)} className="absolute left-6 top-6 text-white/50 hover:text-white transition-colors">
                    <span className="text-3xl">×</span>
                  </button>
                  <h3 className="text-4xl font-black mb-2">تواصل معنا</h3>
                  <p className="text-blue-200 font-bold">نحن هنا للاستماع إلى آرائكم ومقترحاتكم</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 bg-primary-crimson/10 text-primary-crimson rounded-xl flex items-center justify-center"><Globe className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm text-gray-400 font-bold">البريد الإلكتروني</p>
                        <p className="font-black text-gray-900">{settings.contact_email || 'info@hads-news.com'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><User className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm text-gray-400 font-bold">رئيس التحرير</p>
                        <p className="font-black text-gray-900">{settings.chief_editor || 'صلاح حيدرة'}</p>
                      </div>
                    </div>
                  </div>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('تم إرسال رسالتك بنجاح'); setShowContactModal(false); }}>
                    <input type="text" placeholder="الاسم الكامل" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" required />
                    <textarea placeholder="رسالتك..." rows={4} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" required></textarea>
                    <button className="w-full bg-primary-crimson text-white py-4 rounded-xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">إرسال الرسالة</button>
                  </form>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setSelectedCategory(null);
            }}
            className="fixed bottom-10 right-10 z-[100] w-20 h-20 bg-primary-navy text-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center group border border-white/5 hover:bg-primary-crimson transition-all duration-700"
          >
            <ChevronRight className="w-8 h-8 -rotate-90 group-hover:-translate-y-2 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-1">البداية</span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold scale-x-0 group-hover:scale-x-75 transition-transform duration-700"></div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        <Route path="/category/:slug" element={<CategoryArticles />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
