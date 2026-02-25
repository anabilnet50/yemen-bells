import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Search, Globe, Facebook, Twitter, Youtube, Linkedin, ChevronLeft, ChevronRight, Calendar, User, Eye, TrendingUp, Play, Clock, Send, MessageCircle, ArrowLeft, MapPin, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ArticleDetail from './components/ArticleDetail';
import AdminDashboard from './components/AdminDashboard';

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[2]}` : null;
};

function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [urgentArticles, setUrgentArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pollVoted, setPollVoted] = useState(false);
  const [pollComment, setPollComment] = useState('');
  const [showPollComments, setShowPollComments] = useState(false);
  const [pollComments, setPollComments] = useState([
    { name: 'أحمد علي', content: 'أعتقد أن التحالف سيستمر إذا وجدت المصالح المشتركة.', date: '2024-02-20' },
    { name: 'سارة محمد', content: 'الخلافات العميقة قد تؤدي إلى الانهيار في أي لحظة.', date: '2024-02-19' },
    { name: 'محمد ناصر', content: 'الواقع السياسي معقد جداً والتوقعات صعبة.', date: '2024-02-18' }
  ]);

  const handlePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollComment) return;
    setPollComments([{ name: 'زائر', content: pollComment, date: new Date().toISOString().split('T')[0] }, ...pollComments]);
    setPollComment('');
    setPollVoted(true);
  };

  const [showContactModal, setShowContactModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [opinionPage, setOpinionPage] = useState(1);
  const [studiesPage, setStudiesPage] = useState(1);
  const articlesPerPage = 3;
  const smallArticlesPerPage = 3;
  const navigate = useNavigate();

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

  useEffect(() => {
    fetch('/api/init')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles);
        setUrgentArticles(data.articles.filter((a: any) => a.is_urgent === 1));
        setCategories(data.categories);
        setSettings(data.settings);
        setAds(data.ads);
      });
  }, []);

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

  const filteredDisplayArticles = selectedCategory
    ? articles.filter(a => a.category_slug === selectedCategory)
    : articles;

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
        <header className="relative bg-primary-navy overflow-hidden">
          {/* Top Bar - Elite Thin Line */}
          <div className="bg-primary-navy/50 backdrop-blur-sm text-white py-3 px-8 border-b border-white/5 relative z-30">
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
          <div className="relative h-auto min-h-[400px] md:h-60 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center overflow-hidden py-12 md:py-0">
            {/* Artistic Background Overlay - News Globe Animation */}
            <div className="absolute inset-0 z-0 bg-primary-navy">
              {/* Spinning Globe Image - Fully Visible & Flush Left */}
              <div
                className="absolute top-1/2 -left-20 md:-left-12 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] opacity-100 select-none pointer-events-none"
              >
                <img
                  src="https://tse1.mm.bing.net/th/id/OIP.dKbPF3sk4Qg2vDcgN6jjxAHaB2?rs=1&pid=ImgDetMain&o=7&rm=3"
                  alt="News Globe"
                  className="w-full h-full object-cover animate-[spin_60s_linear_infinite] rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-transparent to-primary-navy/80"></div>
              {/* Extra Dynamic Overlays */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(225,29,72,0.12),transparent)] animate-pulse"></div>
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-navy to-transparent opacity-60"></div>
              <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-primary-navy to-transparent opacity-60"></div>
            </div>

            {/* Left Side: Dynamic Logo - Eye-Catching Visual Identity */}
            <div className="relative z-20 flex flex-col items-end">
              <Link to="/" onClick={() => setSelectedCategory(null)} className="group flex flex-col items-end">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  {/* Glow Aura Behind Logo */}
                  <div className="absolute inset-0 blur-3xl opacity-30 bg-primary-crimson rounded-full scale-150 group-hover:opacity-60 transition-opacity duration-700"></div>
                  <h1 className="relative text-6xl md:text-7xl font-black font-serif tracking-tighter leading-tight"
                    style={{
                      background: 'linear-gradient(to right, #ffffff, #fbbf24, #e11d48, #fbbf24, #ffffff)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'logo-pulse 2.5s ease-in-out infinite, logo-gif-shimmer 3s linear infinite'
                    }}
                  >
                    أجراس
                  </h1>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 flex items-center gap-3"
                >
                  <div className="h-[2px] w-8 bg-primary-crimson shadow-[0_0_8px_rgba(225,29,72,1)]"></div>
                  <span className="text-xl md:text-2xl font-black text-accent-gold/80 tracking-[0.15em] uppercase italic drop-shadow-md">
                    مستقل - شامل
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* Center: Prestige Editorial Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative z-20 flex flex-col items-center mt-6 md:mt-0"
            >
              <div className="glass-card bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-accent-gold font-black text-xs md:text-sm uppercase tracking-[0.5em] mb-4 opacity-80">رئـيس التـحرير</p>
                <div className="text-white font-serif italic text-3xl md:text-4xl font-black drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] tracking-widest mb-4">
                  {settings.chief_editor || 'صلاح حيدرة'}
                </div>
                <div className="h-1.5 w-24 bg-primary-crimson mx-auto rounded-full shadow-[0_0_20px_rgba(225,29,72,0.8)]"></div>
              </div>
            </motion.div>

            {/* Right Spacer to preserve layout balance */}
            {/* Right Spacer - visible only on desktop */}
            <div className="hidden lg:block w-1/4"></div>
          </div>
        </header>

        {/* Elite Navigation Bar - Glassmorphism Sticky */}
        <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-primary-navy/5 shadow-premium">
          <div className="px-4 md:px-8 flex flex-col md:flex-row justify-between items-center py-2 h-auto md:h-20 gap-4">
            {/* Search - Modern Minimalist Focus */}
            <div className="relative w-full md:w-80 group order-2 md:order-2">
              <input
                type="text"
                placeholder="ابحث عن الحقيقة..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-6 pr-14 py-3.5 bg-surface-soft border-2 border-transparent focus:border-primary-crimson/30 focus:bg-white rounded-[1.25rem] outline-none font-bold text-base transition-all duration-500 shadow-inner"
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
                { label: 'متابعات', slug: 'general' },
                { label: 'مقالات', slug: 'opinion' },
                { label: 'هاشتاج', slug: 'hashtag' }
              ].map((item) => (
                <li
                  key={item.label}
                  className={`cursor-pointer px-6 md:px-8 py-3 md:py-3.5 rounded-2xl transition-all duration-500 relative group overflow-hidden shrink-0 ${selectedCategory === item.slug ? 'text-primary-crimson bg-primary-crimson/5' : 'text-primary-navy/70 hover:text-primary-navy hover:bg-surface-soft'}`}
                  onClick={() => setSelectedCategory(item.slug)}
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
              <div className="w-[1px] h-8 bg-gray-100 mx-2 hidden md:block"></div>
              <li
                className="bg-primary-navy text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl flex items-center gap-3 hover:bg-primary-crimson hover:shadow-[0_20px_40px_rgba(225,29,72,0.3)] premium-transition cursor-pointer shadow-xl ml-2 group relative overflow-hidden shrink-0"
                onClick={() => setShowContactModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                تواصل معنا
                <Send className="w-4 h-4 group-hover:translate-x-[-5px] group-hover:translate-y-[-5px] transition-all duration-500" />
              </li>
            </ul>
          </div>
        </nav>



        {/* Main Content */}
        <main className="px-4 py-6 space-y-6">

          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
            {/* Main News Hero - Premium Large Format */}
            <div className="lg:col-span-3 flex flex-col group/hero">
              {mainArticle && (
                <div
                  onClick={() => navigate(`/article/${mainArticle.id}`)}
                  className="relative h-[350px] md:h-[480px] bg-primary-navy rounded-3xl overflow-hidden cursor-pointer shadow-premium border border-white/5 group"
                >
                  {mainArticle.video_url && videoLoaded ? (
                    (() => {
                      const ytUrl = getYoutubeEmbedUrl(mainArticle.video_url);
                      return ytUrl ? (
                        <iframe
                          src={ytUrl}
                          className="w-full h-full pointer-events-none"
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
                          className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {mainArticle.video_url && !videoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/30">
                            <Play className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Broadcast Style In-Vision Ticker (Al Hadath Style) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-navy/95 backdrop-blur-3xl border-t border-white/20 z-20 flex items-stretch h-10 md:h-12 overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
                    {/* Urgent Tag - Right Side */}
                    <div className="bg-primary-crimson text-white px-4 md:px-6 flex items-center justify-center font-black text-[10px] md:text-xs uppercase tracking-[0.2em] relative group/urgent shrink-0 shadow-[10px_0_20px_rgba(225,29,72,0.4)] z-30">
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/urgent:translate-x-[100%] transition-transform duration-1000"></div>
                      عـــاجل
                    </div>

                    {/* Scrolling Content - Center */}
                    <div className="flex-1 overflow-hidden flex items-center bg-transparent px-4">
                      <div className="animate-marquee whitespace-nowrap flex items-center gap-16 text-white font-black text-xs md:text-sm tracking-wide">
                        {urgentArticles.length > 0 ? (
                          <>
                            {[...Array(10)].map((_, i) => (
                              <React.Fragment key={`inv-rep-${i}`}>
                                {urgentArticles.map(a => (
                                  <Link key={`inv-${i}-${a.id}`} to={`/article/${a.id}`} className="flex items-center gap-4 hover:text-accent-gold transition-colors">
                                    <span className="w-2 h-2 bg-accent-gold rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                                    {a.title}
                                  </Link>
                                ))}
                              </React.Fragment>
                            ))}
                          </>
                        ) : (
                          <>
                            {[...Array(6)].map((_, i) => (
                              <span key={`placeholder-${i}`} className="opacity-50 italic text-[10px] md:text-xs uppercase tracking-[0.3em] flex-shrink-0">
                                أجراس اليمن .. تغطية حية ومستمرة لكل ما يدور في الساحة اليمنية والمنطقة &nbsp;&nbsp; | &nbsp;&nbsp;
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Live Clock - Left Side */}
                    <div className="bg-primary-navy/80 backdrop-blur-md text-white px-4 md:px-6 flex items-center justify-center border-r border-white/10 shrink-0 z-30">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] md:text-[9px] text-accent-gold font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">KSA</span>
                        <span className="text-xs md:text-base font-black tracking-tighter tabular-nums text-white">
                          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High-End Overlay - Moved Up slightly to accommodate the ticker */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/90 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10 pb-16 md:pb-20">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-white/10 backdrop-blur-md text-white/90 border border-white/10 px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-full">
                        {mainArticle.category_name}
                      </span>
                    </div>

                    <h2 className="text-white text-2xl md:text-3xl font-black leading-[1.15] mb-4 group-hover:text-accent-gold transition-colors duration-500 drop-shadow-2xl line-clamp-2">
                      {mainArticle.title}
                    </h2>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-white/60">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">المصدر</p>
                          <p className="text-xs md:text-sm text-white font-black">{mainArticle.author || 'أجراس اليمن'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-white/40 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {mainArticle.views || 1024}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(mainArticle.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
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
              {ads.filter(ad => ad.is_active === 1 && ad.position === 'top').length > 0 ? (
                (() => {
                  const ad = ads.filter(ad => ad.is_active === 1 && ad.position === 'top')[0];
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
                    أجراس اليمن بريميوم
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

              {/* Opinion Articles */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/5 bg-white/40">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-primary-navy/5 p-5 text-center font-black text-primary-crimson text-base uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                >
                  <div className="w-1 h-4 bg-primary-crimson rounded-full"></div>
                  مقالات الرأي
                </motion.div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="h-32 overflow-hidden relative mb-6">
                    <div className="animate-marquee-vertical flex flex-col space-y-4 text-base font-black text-center">
                      {opinionArticles.length > 0 ? (
                        <>
                          {opinionArticles.map((a, index) => (
                            <Link key={a.id} to={`/article/${a.id}`} className="text-primary-crimson underline underline-offset-4 decoration-primary-crimson/40 hover:decoration-primary-crimson transition-all duration-300 leading-relaxed block hover:translate-x-[-4px] group/lnk flex items-center justify-center gap-2">
                              {a.title}
                            </Link>
                          ))}
                          {/* Repeat for seamless loop */}
                          {opinionArticles.map((a, index) => (
                            <Link key={`dup-${a.id}`} to={`/article/${a.id}`} className="text-primary-crimson underline underline-offset-4 decoration-primary-crimson/40 hover:decoration-primary-crimson transition-all duration-300 leading-relaxed block hover:translate-x-[-4px] group/lnk flex items-center justify-center gap-2">
                              {a.title}
                            </Link>
                          ))}
                        </>
                      ) : (
                        <>
                          <span className="text-primary-crimson/60 underline underline-offset-4 decoration-primary-crimson/20 leading-relaxed block">تحليل رصين للتحولات الجيوسياسية في اليمن والمنطقة</span>
                          <span className="text-primary-crimson/60 underline underline-offset-4 decoration-primary-crimson/20 leading-relaxed block">أبعاد التنمية المستدامة في ظل التحديات الحالية</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research and Studies */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/5 bg-white/40">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-primary-navy/5 p-5 text-center font-black text-primary-crimson text-base uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                >
                  <div className="w-1 h-4 bg-accent-gold rounded-full"></div>
                  دراسات وأبحاث
                </motion.div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="h-32 overflow-hidden relative mb-6">
                    <div className="animate-marquee-vertical flex flex-col space-y-4 text-base font-black text-center">
                      {studiesArticles.length > 0 ? (
                        <>
                          {studiesArticles.map((a, index) => (
                            <Link key={a.id} to={`/article/${a.id}`} className="text-accent-gold underline underline-offset-4 decoration-accent-gold/40 hover:decoration-accent-gold transition-all duration-300 leading-relaxed block hover:translate-x-[-4px] group/lnk2 flex items-center justify-center gap-2">
                              {a.title}
                            </Link>
                          ))}
                          {/* Repeat for seamless loop */}
                          {studiesArticles.map((a, index) => (
                            <Link key={`dup-${a.id}`} to={`/article/${a.id}`} className="text-accent-gold underline underline-offset-4 decoration-accent-gold/40 hover:decoration-accent-gold transition-all duration-300 leading-relaxed block hover:translate-x-[-4px] group/lnk2 flex items-center justify-center gap-2">
                              {a.title}
                            </Link>
                          ))}
                        </>
                      ) : (
                        <>
                          <span className="text-accent-gold/60 underline underline-offset-4 decoration-accent-gold/20 leading-relaxed block">دراسة استشرافية حول مستقبل الاقتصاد الرقمي اليمني</span>
                          <span className="text-accent-gold/60 underline underline-offset-4 decoration-accent-gold/20 leading-relaxed block">توثيق التراث الثقافي: رؤية أكاديمية للحفاظ على الهوية</span>
                        </>
                      )}
                    </div>
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
                      {article.image_url && index !== 0 && (
                        <div className={`w-full md:w-56 lg:w-48 xl:w-64 h-48 shrink-0 overflow-hidden rounded-3xl shadow-xl relative group-hover/item:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-700 ${index % 2 !== 0 ? 'order-1 sm:order-2' : 'order-1'}`}>
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
                        <h5 className="text-primary-navy font-black text-xl md:text-2xl mb-5 group-hover/item:text-primary-crimson premium-transition leading-[1.2] drop-shadow-sm">
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
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setCurrentPage(i + 1);
                            const feedElement = document.getElementById('news-feed-top');
                            if (feedElement) feedElement.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-10 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all text-base ${currentPage === i + 1 ? 'bg-primary-crimson text-white border-primary-crimson shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'bg-white border-primary-navy/10 hover:bg-surface-soft'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
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
                  <div className="h-24 overflow-hidden relative w-full mb-6">
                    <div className="animate-marquee-vertical flex flex-col space-y-6 text-white/90 text-center font-black text-base drop-shadow-lg">
                      {articles.filter(a => a.category_slug === 'rights').slice(0, 3).map(a => (
                        <Link key={a.id} to={`/article/${a.id}`} className="text-white underline underline-offset-4 decoration-white/40 hover:text-accent-gold hover:decoration-accent-gold transition-all duration-300 leading-relaxed block">{a.title}</Link>
                      ))}
                      {articles.filter(a => a.category_slug === 'rights').length === 0 && (
                        <>
                          <span className="text-white/70 underline underline-offset-4 decoration-white/20 leading-relaxed block">رصد شامل للانتهاكات وحماية الحريات المدنية في اليمن</span>
                          <span className="text-white/70 underline underline-offset-4 decoration-white/20 leading-relaxed block">حقوق المواطنة: مراجعات حقوقية لأهم القوانين والأنظمة</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-primary-crimson/90 backdrop-blur-md text-center py-4 font-black text-white text-xl rounded-2xl border border-white/10 shadow-xl uppercase tracking-widest">
                    {settings.rights_title || 'حقوق وحريات'}
                  </div>
                </div>
              </div>

              {/* Technology - Futuristic Space */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/10 relative group min-h-[350px]">
                <div className="absolute inset-0">
                  <img src={settings.tech_bg || "https://picsum.photos/seed/future-tech/600/800"} alt="Tech" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-primary-navy/60 to-transparent"></div>
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="h-24 overflow-hidden relative w-full mb-6">
                    <div className="animate-marquee-vertical flex flex-col space-y-6 text-white/90 text-center font-black text-base drop-shadow-lg">
                      {articles.filter(a => a.category_slug === 'tech').slice(0, 3).map(a => (
                        <Link key={`${a.id}`} to={`/article/${a.id}`} className="text-primary-crimson underline underline-offset-4 decoration-primary-crimson/40 hover:decoration-primary-crimson transition-all duration-300 leading-relaxed block hover:translate-x-[-4px] group/lnk flex items-center justify-center gap-2">
                          <span className="opacity-0 group-hover/lnk:opacity-100 transition-opacity text-sm">←</span>{a.title}
                        </Link>
                      ))}
                      {/* Repeat for seamless loop */}
                      {articles.filter(a => a.category_slug === 'tech').slice(0, 3).map(a => (
                        <Link key={`dup-${a.id}`} to={`/article/${a.id}`} className="text-primary-crimson underline underline-offset-4 decoration-primary-crimson/40 hover:decoration-primary-crimson transition-all duration-300 leading-relaxed block hover:translate-x-[-4px] group/lnk flex items-center justify-center gap-2">
                          <span className="opacity-0 group-hover/lnk:opacity-100 transition-opacity text-sm">←</span>{a.title}
                        </Link>
                      ))}
                      {articles.filter(a => a.category_slug === 'tech').length === 0 && (
                        <>
                          <span className="text-primary-crimson/60 underline underline-offset-4 decoration-primary-crimson/20 leading-relaxed block">عالم الذكاء الاصطناعي: كيف سيغير وجه اليمن الرقمي؟</span>
                          <span className="text-primary-crimson/60 underline underline-offset-4 decoration-primary-crimson/20 leading-relaxed block">دليل الأمان الرقمي: تكنولوجيا تشفير البيانات الحديثة</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-primary-navy/90 backdrop-blur-md text-center py-4 font-black text-white text-xl rounded-2xl border border-white/10 shadow-xl uppercase tracking-widest">
                    {settings.tech_title || 'تـكنولوجيا'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section (Elite Categories Showcase) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 pt-6 pb-12 order-5 lg:order-5">
            {
              [
                { label: settings.sports_title || 'رياضة', slug: 'sports', color: 'border-blue-600', accent: 'text-blue-400', img: settings.sports_bg || 'https://picsum.photos/seed/sports-action/600/400' },
                { label: settings.tourism_title || 'سياحة', slug: 'tourism', color: 'border-purple-600', accent: 'text-purple-400', img: settings.tourism_bg || 'https://picsum.photos/seed/tourism-yemen/600/400' },
                { label: settings.economy_title || 'اقتصاد', slug: 'economy', color: 'border-green-600', accent: 'text-green-400', img: settings.economy_bg || 'https://picsum.photos/seed/economy-gold/600/400' }
              ].map((cat, i) => (
                <motion.div
                  whileHover={{ y: -10 }}
                  key={cat.label}
                  className={`relative h-60 group overflow-hidden rounded-[2rem] shadow-premium ${cat.color} border-b-8`}
                >
                  <img src={(cat.img.startsWith('http') || cat.img.startsWith('/')) ? cat.img : `https://picsum.photos/seed/${cat.img}/600/400`} alt={cat.label} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-primary-navy/60 to-transparent flex flex-col justify-end p-6">
                    <div className="h-20 overflow-hidden relative mb-4">
                      <div className="animate-marquee-vertical flex flex-col space-y-3 text-white text-center font-black text-sm drop-shadow-md" style={{ animationDelay: `-${i * 2}s` }}>
                        {articles.filter(a => a.category_slug === cat.slug).slice(0, 3).map(a => (
                          <Link key={a.id} to={`/article/${a.id}`} className="text-white underline underline-offset-4 decoration-white/50 hover:text-accent-gold hover:decoration-accent-gold transition-all duration-300 block">{a.title}</Link>
                        ))}
                        {/* Repeat for seamless loop */}
                        {articles.filter(a => a.category_slug === cat.slug).slice(0, 3).map(a => (
                          <Link key={`dup-${a.id}`} to={`/article/${a.id}`} className="text-white underline underline-offset-4 decoration-white/50 hover:text-accent-gold hover:decoration-accent-gold transition-all duration-300 block">{a.title}</Link>
                        ))}
                        {articles.filter(a => a.category_slug === cat.slug).length === 0 && (
                          <span className="text-white/70 underline underline-offset-4 decoration-white/30 block">تغطية شاملة وحصرية لأهم مستجدات الـ {cat.label}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-white font-serif italic font-black text-3xl text-center drop-shadow-2xl group-hover:text-accent-gold transition-colors py-2 w-full uppercase tracking-widest leading-none">
                      {cat.label}
                    </h3>
                  </div>
                </motion.div>
              ))
            }

            {/* YouTube Premium Card */}
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
              className="relative h-60 group overflow-hidden bg-primary-navy rounded-[2rem] shadow-premium flex items-center justify-center flex-col cursor-pointer border-b-8 border-primary-crimson premium-transition"
            >
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] group-hover:scale-125 transition-transform duration-1000"></div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex items-center justify-center w-20 h-20 bg-primary-crimson rounded-[2rem] mb-4 text-white shadow-2xl relative z-10"
              >
                <Youtube className="w-10 h-10" />
              </motion.div>
              <h3 className="text-white font-black text-xl mb-1 relative z-10 tracking-widest uppercase">أجراس اليمن</h3>
              <div className="text-accent-gold font-serif italic text-2xl relative z-10 tracking-tighter drop-shadow-glow">YouTube Channel</div>
            </a>
          </div>
        </main>

        {/* Footer - Prestigious Archive */}
        <footer className="bg-primary-navy text-white pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-crimson to-transparent shadow-glow"></div>

          <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
              {/* Brand Column */}
              <div className="space-y-8">
                <div className="flex flex-col gap-2">
                  <div className="text-3xl font-black text-primary-crimson font-serif tracking-tighter leading-none">{settings.site_name || 'أجراس اليمـن'}</div>
                  <div className="text-xs font-black text-accent-gold/40 uppercase tracking-[0.4em]">Elite Independent Media</div>
                </div>
                <p className="text-white/40 text-base font-bold leading-relaxed text-justify">
                  تأسست "أجراس اليمن" كصوت مستقل ينبض بقلب الوطن، ملتزمون بالحقيقة، ومهنتنا نقل الخبر بدقة وصياغة التحليل بموضوعية. نحن هنا لنكون بوصلتكم في عالم متسارع الأحداث.
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: Facebook, color: 'hover:bg-blue-600', url: settings.facebook_url },
                    { icon: Twitter, color: 'hover:bg-sky-500', url: settings.twitter_url },
                    { icon: Youtube, color: 'hover:bg-primary-crimson', url: settings.youtube_url },
                    { icon: Send, color: 'hover:bg-[#0088cc]', url: settings.telegram_url || "#" },
                    { icon: Linkedin, color: 'hover:bg-blue-700', url: settings.linkedin_url }
                  ].map((social, i) => (
                    <a key={i} href={social.url || "#"} target="_blank" rel="noopener noreferrer"
                      className={`w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center ${social.color} transition-all duration-500 border border-white/5 hover:border-white/20`}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Links Column */}
              <div>
                <h4 className="text-xl font-black mb-10 text-accent-gold uppercase tracking-widest flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-primary-crimson rounded-full"></div>
                  أقسـام المنصة
                </h4>
                <ul className="space-y-5 text-white/40 font-bold text-base">
                  {[
                    { label: 'الصفحة الرئيسية', slug: null },
                    { label: 'متابعات وتحقيقات', slug: 'general' },
                    { label: 'حقوق وحريات', slug: 'rights' },
                    { label: 'شؤون اقتصادية', slug: 'economy' },
                    { label: 'الساحة الرياضية', slug: 'sports' },
                    { label: 'آفاق تكنولوجية', slug: 'tech' }
                  ].map((link, i) => (
                    <li key={i} className="hover:text-white transition-all cursor-pointer flex items-center gap-3 group/link" onClick={() => setSelectedCategory(link.slug)}>
                      <div className="w-0 group-hover/link:w-2 h-[1px] bg-primary-crimson transition-all"></div>
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Poll Column - Professional Integration */}
              <div className="lg:col-span-2">
                <div className="space-y-8">
                  <h4 className="text-white font-black text-2xl mb-10 flex items-center gap-6">
                    <div className="p-3 bg-white/5 rounded-[1.5rem]"><TrendingUp className="w-6 h-6 text-primary-crimson" /></div>
                    منصة استطلاع الرأي العام
                  </h4>

                  <div className="glass-card bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-crimson/5 blur-3xl rounded-full"></div>
                    <p className="font-black text-2xl mb-8 text-white relative z-10 leading-relaxed border-r-4 border-primary-crimson pr-6">
                      هل تعتقد أن التحولات السياسية الأخيرة ستؤدي إلى استقرار اقتصادي مستدام في المنطقـة؟
                    </p>

                    <form onSubmit={handlePollSubmit} className="space-y-6 relative z-10">
                      <textarea
                        value={pollComment}
                        onChange={e => setPollComment(e.target.value)}
                        className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:border-primary-crimson focus:bg-white/10 transition-all outline-none font-bold text-white custom-scrollbar"
                        placeholder="شاركنا رؤيتك التحليلية هنا..."
                        rows={3}
                        required
                      ></textarea>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <button
                          type="submit"
                          className="flex-1 bg-primary-crimson text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-primary-crimson/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                          <Send className="w-5 h-5 shadow-glow" /> تسجيـل الموقف
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPollComments(!showPollComments)}
                          className="flex-1 bg-white/5 text-white/60 py-5 rounded-[2rem] font-black border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-4"
                        >
                          <MessageCircle className="w-5 h-5" /> {showPollComments ? 'إغلاق الأرشيف' : 'سجل التفارير'}
                        </button>
                      </div>
                    </form>

                    <AnimatePresence>
                      {showPollComments && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-10 pt-10 border-t border-white/5 space-y-5 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                            {pollComments.map((c, i) => (
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="bg-white/5 p-6 rounded-[1.5rem] border border-white/5"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-black text-base text-primary-crimson tracking-widest uppercase">{c.name}</span>
                                  <span className="text-xs text-white/20 font-bold uppercase">{c.date}</span>
                                </div>
                                <p className="text-sm font-bold text-white/50 leading-relaxed italic">"{c.content}"</p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center"><Globe className="w-5 h-5 text-white/30" /></div>
                <p className="text-xs text-white/20 font-black uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} {settings.site_name || 'Ajras Yemen'} | All Rights Reserved</p>
              </div>
              <div className="flex gap-10 text-xs font-black text-white/20 uppercase tracking-[0.5em]">
                <span className="hover:text-primary-crimson cursor-pointer transition-colors" onClick={() => setShowContactModal(true)}>Contact</span>
                <span className="hover:text-primary-crimson cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-primary-crimson cursor-pointer transition-colors">Compliance</span>
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
                        <p className="font-black text-gray-900">{settings.contact_email || 'info@ajras-yemen.com'}</p>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary-crimson text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-primary-crimson/80 transition-colors"
          >
            <ChevronRight className="-rotate-90" />
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
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
