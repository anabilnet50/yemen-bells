import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Globe, Facebook, Twitter, Youtube, Linkedin, ChevronLeft, ChevronRight, Calendar, User, Eye, TrendingUp, Play, Flame, Clock, Send, MessageCircle, ArrowLeft, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
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
  if (Number(ad.is_active) !== 1) return false;
  const now = new Date();

  if (ad.start_date) {
    const start = new Date(ad.start_date);
    if (!isNaN(start.getTime()) && start.getTime() > 0) {
      // Comparison ignoring hours to handle UTC/Local mismatch for "today"
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

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-sans font-black text-[9px] md:text-xs tracking-tighter md:tracking-widest tabular-nums" style={{ direction: 'ltr' }}>
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
    </span>
  );
};

function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Initialize selectedCategory based on localStorage for rock-solid persistence across page navigation
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hads_selected_tab');
      return saved && saved !== 'null' ? saved : null;
    }
    return null;
  });

  // Save to localStorage whenever user clicks a tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedCategory) {
        localStorage.setItem('hads_selected_tab', selectedCategory);
      } else {
        localStorage.removeItem('hads_selected_tab');
      }
    }
  }, [selectedCategory]);

  // Read URL hash on very first load JUST IN CASE it was previously bookmarked from our old logic,
  // but rely primarily on localStorage moving forward.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'null') {
        setSelectedCategory(hash);
        // Clean up the URL so it's clean and doesn't interfere anymore
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pollResults, setPollResults] = useState<any>(null);
  const [pollVoted, setPollVoted] = useState(false);
  const [pollComment, setPollComment] = useState('');
  const [isPollSubmitting, setIsPollSubmitting] = useState(false);
  const [showPollComments, setShowPollComments] = useState(false);
  const [pollComments, setPollComments] = useState<any[]>([]);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextHero();
    }
    if (isRightSwipe) {
      handlePrevHero();
    }
  };

  const [showContactModal, setShowContactModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [heroIndex, setHeroIndex] = useState(0);
  const articlesPerPage = 3;
  const navigate = useNavigate();

  const urgentArticles = useMemo(() => articles.filter(a => (a.is_urgent == 1 || a.is_urgent === true || a.is_urgent === '1') && a.category_slug !== 'short-urgent'), [articles]);
  const shortUrgentArticles = useMemo(() => articles.filter(a => a.category_slug === 'short-urgent'), [articles]);
  const displayArticles = useMemo(() => articles.filter(a => !(a.is_urgent == 1 || a.is_urgent === true || a.is_urgent === '1') && a.category_slug !== 'short-urgent'), [articles]);

  // Force re-evaluation of time-based logic every minute globally in home
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if there is ANY recent urgent article (within last 5 hours) globally
  const hasRecentUrgent = useMemo(() => {
    return articles.some(art => {
      // General category is used for "Urgent" news block
      if (art.category_slug !== 'general') return false;
      const createdAt = new Date(art.created_at || new Date());
      const hoursDiff = (currentTime - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 5;
    });
  }, [articles, currentTime]);

  const mainArticle = useMemo(() => {
    // 1. Top priority: short-urgent (hero ONLY) - allow cycling via heroIndex
    if (shortUrgentArticles.length > 0) {
      const idx = heroIndex % shortUrgentArticles.length;
      return shortUrgentArticles[idx < 0 ? idx + shortUrgentArticles.length : idx];
    }
    
    // 1b. If no short-urgent articles, provide a placeholder to maintain the "Short Urgent" branding
    // as requested by the user to avoid duplication from below.
    return {
      id: 'placeholder-short-urgent',
      title: 'عاجل قصير',
      content: 'لا توجد أخبار عاجلة قصيرة حالياً',
      category_slug: 'short-urgent',
      category_name: 'عاجل قصير',
      // When there are no short urgent news items, show a fixed default breaking-news graphic.
      // This uses a local SVG so it always renders correctly and is easy to adjust.
      image_url: '/images/urgent-fallback.svg',
      created_at: new Date().toISOString()
    };
    
    // 3. Fallback: > 5 hours passed or no urgent news -> show latest local news
    const localNews = articles.filter(a => a.category_slug === 'local').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (localNews.length > 0) return localNews[0];

    // 4. Ultimate fallback: just return the latest display article
    return displayArticles[0];
  }, [shortUrgentArticles, articles, hasRecentUrgent, displayArticles, heroIndex]);

  const [videoLoaded, setVideoLoaded] = useState(false);



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

  const handleNextHero = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHeroIndex(prev => prev + 1);
  };

  const handlePrevHero = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHeroIndex(prev => prev - 1);
  };

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

  useEffect(() => {
    if (settings) {
      document.title = `${settings.site_name || '𐩠𐩵𐩪 هـدس'} - ${settings.site_tagline || 'الأقرب للأحدث'}`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', settings.site_tagline || 'موقع إخباري شامل');
      }
    }
  }, [settings]);

  const handlePollCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollComment || isPollSubmitting) return;

    // Link Protection
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|net|org|edu|gov|io|co|me|ai|app|xyz|info|biz|site|online|tech|website|store|shop|link|click|tk|ml|ga|cf|gq|pw|ws|fun|space|top|vip|icu|win|bid|loan|host|live|mobi|name|pro|tel|pub|news))/gi;
    if (urlPattern.test(pollComment)) {
      alert("عذراً، لأسباب أمنية لا يُسمح بإضافة روابط في المشاركات.");
      return;
    }

    setIsPollSubmitting(true);
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
        } else {
          alert(data.error || "حدث خطأ أثناء الإرسال");
        }
      })
      .catch(() => alert("حدث خطأ أثناء الإرسال"))
      .finally(() => setIsPollSubmitting(false));
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

  const filteredDisplayArticles = useMemo(() => articles.filter(a => {
    const isHeroOnly = a.category_slug === 'short-urgent';

    // Exclude only hero-only articles from the center feed
    if (isHeroOnly) return false;

    // If a category is selected via tabs (e.g., user clicked "أخبار دولية"), strictly show only that category
    if (selectedCategory) {
      return a.category_slug === selectedCategory;
    }

    // --- Default Home View Logic (No tab selected - Middle Feed under "تغطية خاصة") ---

    // 2. The User's Logic: 
    // - IF there is a recent urgent (< 5 hours), the feed shows ONLY Urgent (general).
    // - IF 5 hours pass (or none exist), the feed flips to ONLY Local (local).
    if (hasRecentUrgent) {
      return a.category_slug === 'general';
    } else {
      return a.category_slug === 'local';
    }

  }), [articles, selectedCategory, hasRecentUrgent]);

  const totalPages = useMemo(() => Math.ceil(filteredDisplayArticles.length / articlesPerPage), [filteredDisplayArticles.length, articlesPerPage]);
  const paginatedArticles = useMemo(() => filteredDisplayArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  ), [filteredDisplayArticles, currentPage, articlesPerPage]);

  const opinionArticles = useMemo(() => articles.filter(a => a.category_slug === 'opinion'), [articles]);
  const studiesArticles = useMemo(() => articles.filter(a => a.category_slug === 'studies'), [articles]);

  if (!settings) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-black">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
          يرجي الانتضار...
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-surface-soft min-h-screen text-primary-navy">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl shadow-premium relative z-10">
        {/* Mobile Top Ad - Fixed Premium Header Space - Increased Height */}
        <div className="lg:hidden bg-primary-navy overflow-hidden h-28 relative group border-b border-white/5">
          {ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('top')).length > 0 ? (
            (() => {
              const ad = ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('top'))[0];
              return (
                <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                  <div className="absolute top-2 right-2 z-20">
                    <span className="bg-accent-gold text-primary-navy px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg">
                      إعلان
                    </span>
                  </div>
                  {ad.image_url ? (
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain bg-black/40" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full p-4 flex items-center justify-center bg-gradient-to-r from-primary-navy to-primary-crimson">
                      <h3 className="text-white text-sm font-black truncate px-10">{ad.title}</h3>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10"></div>
                </a>
              );
            })()
          ) : (
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center bg-gradient-to-r from-primary-navy to-primary-crimson">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <div className="absolute top-2 right-2 z-20">
                <span className="bg-accent-gold text-primary-navy px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg">
                  مساحة إعلانية
                </span>
              </div>
              <div className="text-xl font-black tracking-[0.2em] font-serif italic text-white/50 relative z-10">
                هـدس بريميوم
              </div>
            </div>
          )}
        </div>

        {/* Header - V7 Mobile Match & Stable Desktop */}
        <header className="relative bg-black overflow-hidden h-auto min-h-[220px] md:min-h-[400px]">
          {/* Top Bar - Elite Thin Line */}
          <div className="bg-black/30 backdrop-blur-sm text-white py-2 px-8 border-b border-white/5 relative z-30">
            <div className="flex justify-between items-center text-xs md:text-sm font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-accent-gold transition-all hover:scale-105 cursor-default relative">
                  <Calendar className="w-3.5 h-3.5 animate-pulse" />
                  <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-sm scale-0 hover:scale-150 transition-transform duration-300"></div>
                  {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-5">
                {settings.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-400 hover:scale-110 transition-all duration-300 relative"><Facebook className="w-3.5 h-3.5 animate-pulse" /><div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm scale-0 hover:scale-150 transition-transform duration-300 pointer-events-none"></div></a>}
                {settings.twitter_url && <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-sky-400 hover:scale-110 transition-all duration-300 relative"><Twitter className="w-3.5 h-3.5 animate-pulse" /><div className="absolute inset-0 bg-sky-400/20 rounded-full blur-sm scale-0 hover:scale-150 transition-transform duration-300 pointer-events-none"></div></a>}
                {settings.youtube_url && <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary-crimson hover:scale-110 transition-all duration-300 relative"><Youtube className="w-3.5 h-3.5 animate-pulse" /><div className="absolute inset-0 bg-primary-crimson/20 rounded-full blur-sm scale-0 hover:scale-150 transition-transform duration-300 pointer-events-none"></div></a>}
                {settings.telegram_url && <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-sky-400 hover:scale-110 transition-all duration-300 relative"><Send className="w-3.5 h-3.5 animate-pulse" /><div className="absolute inset-0 bg-sky-400/20 rounded-full blur-sm scale-0 hover:scale-150 transition-transform duration-300 pointer-events-none"></div></a>}
                {settings.linkedin_url && <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-500 hover:scale-110 transition-all duration-300 relative"><Linkedin className="w-3.5 h-3.5 animate-pulse" /><div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm scale-0 hover:scale-150 transition-transform duration-300 pointer-events-none"></div></a>}
              </div>
            </div>
          </div>

          {/* Artistic Background Overlay - Original Clarity State */}
          <div className="absolute inset-0 z-0 bg-black">
            <img
              src={settings.header_background_url || "/header_bg.jpg"}
              alt="Header Background"
              className="w-full h-full object-cover object-center opacity-100"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* News Globe - Anchored on Left */}
          <div className="absolute top-1/2 -left-32 md:-left-20 -translate-y-1/2 w-[250px] md:w-[700px] h-[250px] md:h-[700px] pointer-events-none opacity-70 md:opacity-100 z-10 mix-blend-screen overflow-hidden">
            <img
              src={settings.news_ball_image || "https://tse1.mm.bing.net/th/id/OIP.dKbPF3sk4Qg2vDcgN6jjxAHaB2?rs=1&pid=ImgDetMain&o=7&rm=3"}
              alt="Globe Decor"
              className="w-full h-full object-cover animate-[spin_60s_linear_infinite] rounded-full brightness-150 shadow-[0_0_80px_rgba(59,130,246,0.5)]"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Central Identity Stack - Strict 2-Column Row Alignment */}
          <div className="relative z-20 w-full h-full flex flex-row items-center justify-between pt-24 md:pt-48 pb-2 md:pb-4 px-2 md:px-16 pointer-events-none">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-navy/5 via-transparent to-primary-crimson/5 rounded-2xl blur-3xl animate-pulse pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl animate-pulse delay-1000 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-primary-crimson/10 rounded-full blur-xl animate-pulse delay-500 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-primary-navy/5 to-accent-gold/5 rounded-full blur-3xl animate-pulse delay-1500 pointer-events-none"></div>
            <div className="absolute top-3/4 right-1/4 w-20 h-20 bg-primary-crimson/8 rounded-full blur-lg animate-pulse delay-2000 pointer-events-none"></div>

            {/* Right Side: Site Name & Tagline */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center justify-center w-[60%] md:w-5/12 md:-translate-x-12"
            >
              {/* Row 1: Top Label */}
              <div className="h-[40px] md:h-[60px] flex items-end justify-center mb-1 w-full">
                <h1 className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-black tracking-tighter leading-none select-none whitespace-nowrap relative">
                  <span className="absolute inset-0 bg-gradient-to-r from-accent-gold via-yellow-300 to-accent-gold bg-clip-text text-transparent animate-pulse opacity-75">
                    {settings?.site_name || '𐩠𐩵𐩪 هـدس'}
                  </span>
                  <span className="relative bg-gradient-to-br from-white via-yellow-50 to-accent-gold bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(202,138,4,0.8)] animate-pulse">
                    {settings?.site_name || '𐩠𐩵𐩪 هـدس'}
                  </span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent-gold/20 via-yellow-300/20 to-accent-gold/20 rounded-lg blur-lg animate-pulse"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-accent-gold/10 via-yellow-300/10 to-accent-gold/10 rounded-xl blur-2xl animate-pulse delay-300"></div>
                </h1>
              </div>

              {/* Enhanced Divider */}
              <div className="w-16 md:w-40 h-[3px] md:h-2 bg-gradient-to-r from-transparent via-accent-gold to-transparent rounded-full opacity-90 mb-2 drop-shadow-[0_0_15px_rgba(202,138,4,0.9)] mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/50 to-yellow-300/50 rounded-full blur-sm animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/20 to-yellow-300/20 rounded-full blur-md animate-pulse delay-500"></div>
              </div>

              {/* Row 2: Bottom Detail - Enhanced */}
              <div className="h-[40px] md:h-[60px] flex items-start justify-center text-center w-full">
                <h2 className="text-[9px] md:text-lg font-bold leading-none relative">
                  <span className="absolute inset-0 bg-gradient-to-r from-accent-gold via-yellow-300 to-accent-gold bg-clip-text text-transparent animate-pulse opacity-80">
                    {settings?.site_tagline || 'موقع اخباري متكامل'}
                  </span>
                  <span className="relative text-accent-gold drop-shadow-[0_2px_8px_rgba(202,138,4,0.8)] animate-pulse tracking-wider">
                    {settings?.site_tagline || 'موقع اخباري متكامل'}
                  </span>
                  <div className="absolute -inset-0.5 bg-accent-gold/20 rounded blur-sm animate-pulse delay-200"></div>
                </h2>
              </div>
            </motion.div>

            {/* Left Side: Editor-in-Chief */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="flex flex-col items-center justify-center w-[40%] md:w-1/3 z-20 translate-x-12 md:-translate-x-8 pr-4 md:pr-0"
            >
              {/* Row 1: Top Label */}
              <div className="h-[40px] md:h-[60px] flex items-end justify-center mb-1 w-full">
                <span className="text-accent-gold/90 text-[10px] md:text-2xl font-black tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,1)] uppercase leading-none relative -top-1 md:-top-3 animate-pulse">
                  رئيس التحرير
                </span>
                <div className="absolute inset-0 bg-accent-gold/10 rounded blur-sm animate-pulse delay-500 pointer-events-none"></div>
              </div>

              {/* Enhanced Divider */}
              <div className="w-12 md:w-24 h-[2px] md:h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent rounded-full opacity-80 mb-1 drop-shadow-[0_0_10px_rgba(202,138,4,0.8)] mx-auto animate-pulse relative">
                <div className="absolute inset-0 bg-accent-gold/30 rounded-full blur-sm animate-pulse delay-300"></div>
              </div>

              {/* Row 2: Bottom Detail - Enhanced */}
              <div className="h-[40px] md:h-[60px] flex items-start justify-center w-full">
                <span
                  className="text-lg md:text-5xl leading-none relative -top-2 md:-top-4 animate-pulse"
                  style={{
                    fontFamily: "'Aref Ruqaa', 'Amiri', 'Tajawal', cursive, serif",
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(202,138,4,0.5), 0 0 40px rgba(202,138,4,0.2)',
                    filter: 'drop-shadow(0 0 10px rgba(202,138,4,0.3))'
                  }}
                >
                  {settings?.chief_editor || 'موقع هدس'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-crimson/10 via-transparent to-accent-gold/10 rounded-lg blur-xl animate-pulse pointer-events-none opacity-50"></div>
              </div>
            </motion.div>

            {/* Left Column: Empty space to balance flex layout (Globe fills this space visually) */}
            <div className="hidden md:block w-full md:w-1/3"></div>

          </div>
        </header>

        {/* Navigation Bar - Stable Version */}
        <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-2 md:px-8 flex flex-col md:flex-row justify-between items-center py-2 md:h-16 gap-2 md:gap-4">
            {/* Search - Fixed Red Border */}
            <div className="relative w-full md:w-80 group order-2 md:order-2">
              <input
                type="text"
                placeholder="ابحث في الأخبار..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-6 pr-10 md:pr-12 py-2 md:py-2.5 bg-gray-50 border-2 border-primary-crimson/50 focus:border-primary-crimson focus:ring-2 focus:ring-primary-crimson/20 rounded-xl outline-none font-bold text-xs md:text-sm transition-all"
              />
              <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-primary-crimson transition-colors" />

              <AnimatePresence>
                {searchTerm.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] max-h-[400px] overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-8 text-center text-gray-400 font-bold">جاري البحث...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-2 space-y-1">
                        {searchResults.map(result => (
                          <div
                            key={result.id}
                            onClick={() => { navigate(`/article/${result.id}`); setSearchTerm(''); }}
                            className="p-3 hover:bg-gray-50 cursor-pointer rounded-xl flex gap-3 items-center group transition-colors"
                          >
                            <img src={result.image_url || undefined} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate group-hover:text-primary-crimson transition-colors">{result.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{result.category_name}</p>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-gray-300" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400 font-bold">لا توجد نتائج</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nav Tabs - Compressed for Mobile Fit */}
            <ul className="flex items-center justify-between w-full md:w-auto gap-1 md:gap-4 font-bold text-[10px] sm:text-xs md:text-base order-1 md:order-1 pb-1 md:pb-0">
              {[
                { label: 'عاجل', slug: 'general' },
                { label: 'أخبار محلية', slug: 'local' },
                { label: 'أخبار دولية', slug: 'intl' },
                { label: 'راسلنا', slug: 'contact' }
              ].map((item) => (
                <li
                  key={item.label}
                  className={`cursor-pointer px-2 sm:px-3 md:px-8 py-1.5 md:py-3 rounded-[15px] md:rounded-[20px] transition-all relative flex-1 md:flex-none text-center font-bold ${selectedCategory === item.slug ? 'text-white shadow-md' : 'text-primary-navy bg-gray-100 hover:bg-gray-200'}`}
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
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-primary-crimson flex items-center justify-center rounded-[15px] md:rounded-[20px] shadow-lg"
                      transition={{ duration: 0.2 }}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </motion.div>
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
            <div className="lg:col-span-3 flex flex-col group/hero order-1 lg:order-1"
                 onTouchStart={onTouchStart}
                 onTouchMove={onTouchMove}
                 onTouchEnd={onTouchEnd}>
              
              
              
              
              
              
              
              {mainArticle && (
                <div
                  onClick={mainArticle.category_slug === 'short-urgent' ? undefined : () => navigate(`/article/${mainArticle.id}`)}
                  className={`relative h-[250px] sm:h-[350px] md:h-[480px] bg-primary-navy rounded-none md:rounded-3xl overflow-hidden ${mainArticle.category_slug === 'short-urgent' ? '' : 'cursor-pointer shadow-none md:shadow-premium border-none md:border border-white/5'} group`}
                >
                  {/* Watermark Logo - Premium Corner Branding (Glass Style) */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 md:top-3 md:right-3 z-40 p-0.5 pointer-events-none group-hover:scale-105 transition-transform duration-1000"
                  >
                    <div className="bg-black/40 backdrop-blur-2xl px-4 md:px-5 py-1.5 md:py-2 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-3 relative">
                        <motion.span 
                          animate={{ 
                            textShadow: ["0 0 5px rgba(255,255,255,0.2)", "0 0 15px rgba(255,255,255,0.5)", "0 0 5px rgba(255,255,255,0.2)"]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-white font-black text-xl md:text-2xl tracking-[0.2em] relative z-20"
                        >
                          𐩠𐩵𐩪
                        </motion.span>
                        <div className="w-px h-5 md:h-7 bg-white/20"></div>
                        <div className="relative overflow-hidden pr-0.5">
                          <motion.span 
                            animate={{ 
                              x: ["100%", "0%", "0%", "100%"],
                              opacity: [0, 1, 1, 0]
                            }}
                            transition={{ 
                              duration: 5, 
                              repeat: Infinity,
                              times: [0, 0.2, 0.8, 1],
                              ease: "easeInOut"
                            }}
                            className="block text-white font-black text-xl md:text-3xl tracking-tighter"
                          >
                            هـدس
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

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
                      <div className="w-full h-full relative">
                        {(mainArticle.image_url && mainArticle.image_url !== 'null' && mainArticle.image_url !== 'undefined' && mainArticle.image_url.trim() !== '') ? (
                          <img
                            src={mainArticle.image_url}
                            alt={mainArticle.title || 'عاجل'}
                            className={`w-full h-full object-cover transition-transform duration-1000 scale-100 ${mainArticle.category_slug === 'short-urgent' ? '' : 'group-hover:scale-105'}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden relative ${['short-urgent', 'general'].includes(mainArticle.category_slug) ? 'bg-primary-crimson' : 'bg-primary-navy'}`}>
                            {/* Simple Solid Red for Short-Urgent Placeholder, ImageIcon for others */}
                            {mainArticle.category_slug !== 'short-urgent' && (
                              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                <ImageIcon className="w-12 h-12 text-white/40" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                    {(urgentArticles.length > 0 || (settings?.custom_ticker_text && settings.custom_ticker_text.trim() !== '')) && (
                      <div className="bg-primary-crimson text-white px-1.5 md:px-4 flex items-center justify-center font-black text-[9px] md:text-xs uppercase tracking-tighter md:tracking-widest relative group/urgent shrink-0 z-30 shadow-[5px_0_15px_rgba(225,29,72,0.3)]">
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>عاجل
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden flex items-center bg-white border-x border-gray-100 relative">
                      <div className="whitespace-nowrap text-primary-navy font-black text-sm md:text-base w-full" style={{ gap: 0 }}>
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
                                  {a.category_slug === 'opinion' && (
                                    <span className="text-primary-crimson/80 mr-2"> - {(() => {
                                      const da = settings?.default_author_name || "موقع هدس";
                                      if (a.writer_name) return a.writer_name;
                                      const fallbackName = a.author || da;
                                      return fallbackName === "صلاح حيدرة" ? da : fallbackName;
                                    })()}</span>
                                  )}
                                </Link>
                              ))}
                            </>
                          );
                          const FallbackContent = (
                            <span className="text-gray-400 font-bold text-[10px] md:text-xs tracking-widest shrink-0 flex items-center gap-4">
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>هـدس .. تغطية حية ومستمرة لكل ما يدور في الساحة اليمنية والمنطقة
                            </span>
                          );
                          const hasCustomText = settings?.custom_ticker_text && settings.custom_ticker_text.trim() !== '';
                          const blocksToRender = (urgentArticles.length > 0 || hasCustomText) ? TickerItemContent : FallbackContent;
                          const itemsCount = Math.max(1, urgentArticles.length) + (hasCustomText ? 1 : 0);
                          const calculatedDuration = itemsCount * 8 * 15;
                          return (
                            <div className="flex animate-marquee hover:pause w-max" style={{ animationDuration: `${calculatedDuration}s` }}>
                              <div className="flex items-center gap-12 px-6">
                                {[...Array(8)].map((_, i) => (
                                  <React.Fragment key={`h1-${i}`}>{blocksToRender}</React.Fragment>
                                ))}
                              </div>
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
                    <div className="bg-primary-crimson text-white px-1 md:px-2 flex items-center justify-center shrink-0 relative overflow-hidden group/clock z-20 shadow-[-10px_0_20px_white]">
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      <DigitalClock />
                    </div>
                  </div>

                  <div className={`absolute inset-0 flex flex-col justify-end ${mainArticle.image_url ? 'bg-gradient-to-t from-primary-navy/90 via-transparent to-transparent' : ''} p-8 md:p-10 pb-16 md:pb-20`}>
                    {/* Content Stack */}
                    <div className={`flex flex-col w-full max-w-4xl mx-auto ${mainArticle.category_slug === 'short-urgent' ? 'absolute inset-0 flex flex-col justify-end items-center px-4 sm:px-10 pb-12 md:pb-16 gap-0' : 'items-start text-right pr-6 sm:pr-16 md:items-end md:pr-0 gap-3'}`}>
                      
                      {/* Container for Short Urgent to lock badge and box together */}
                      {mainArticle.category_slug === 'short-urgent' ? (
                        <div className="relative flex flex-col items-start w-full max-w-2xl group/short mb-2">
                          {/* Urgent Badge - Tab style */}
                          {mainArticle.id !== 'placeholder-short-urgent' && (
                           <motion.div
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="z-30 -mb-3.5 mr-6"
                           >
                              <span className="bg-primary-crimson text-white px-4 py-1.5 text-xs md:text-sm font-black uppercase tracking-widest rounded-t-xl shadow-lg border-x border-t border-white/20 animate-pulse inline-block">
                                عاجل
                              </span>
                           </motion.div>
                          )}

                          {/* Main Title - Glassy Box */}
                          {mainArticle.id !== 'placeholder-short-urgent' && (
                            <h2 className={`text-white font-black leading-tight transition-all duration-500 line-clamp-3 bg-black/70 backdrop-blur-2xl px-5 pt-8 pb-4 rounded-2xl rounded-tr-none border border-white/10 w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-right ${
                              (mainArticle.short_title || mainArticle.title || '').length > 180 ? 'text-[10px] md:text-sm' :
                              (mainArticle.short_title || mainArticle.title || '').length > 150 ? 'text-xs md:text-base' :
                              (mainArticle.short_title || mainArticle.title || '').length > 120 ? 'text-sm md:text-lg' :
                              (mainArticle.short_title || mainArticle.title || '').length > 90 ? 'text-base md:text-xl' :
                              (mainArticle.short_title || mainArticle.title || '').length > 60 ? 'text-lg md:text-2xl' :
                              (mainArticle.short_title || mainArticle.title || '').length > 40 ? 'text-xl md:text-3xl' :
                              'text-2xl md:text-5xl'
                            }`}>
                              {mainArticle.short_title || mainArticle.title}
                            </h2>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Standard Layout for other categories */}
                          {mainArticle.id !== 'placeholder-short-urgent' && (
                           <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className="mb-2"
                           >
                              <span className="bg-primary-crimson text-white border border-primary-crimson px-5 py-2 text-sm md:text-xl font-black uppercase tracking-[0.1em] rounded-full shadow-[0_0_20px_rgba(225,29,72,0.5)] animate-pulse">
                                عاجل
                              </span>
                           </motion.div>
                          )}

                          {mainArticle.id !== 'placeholder-short-urgent' && (
                            <h2 className={`text-white font-black leading-[1.6] transition-all duration-500 line-clamp-4 mb-2 drop-shadow-2xl ${
                              (mainArticle.short_title || mainArticle.title || '').length > 180 ? 'text-[9px] md:text-xs' :
                              (mainArticle.short_title || mainArticle.title || '').length > 150 ? 'text-[10px] md:text-sm' :
                              (mainArticle.short_title || mainArticle.title || '').length > 120 ? 'text-xs md:text-base' :
                              (mainArticle.short_title || mainArticle.title || '').length > 90 ? 'text-sm md:text-lg' :
                              (mainArticle.short_title || mainArticle.title || '').length > 60 ? 'text-base md:text-xl' :
                              (mainArticle.short_title || mainArticle.title || '').length > 40 ? 'text-xl md:text-2xl' :
                              'text-2xl md:text-4xl'
                            }`}>
                              {mainArticle.short_title || mainArticle.title}
                            </h2>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hero Navigation Buttons - Shifted SLIGHTLY UPWARDS */}
                  <div className="absolute top-[40%] -translate-y-1/2 left-2 right-2 flex justify-between z-[60] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500">
                    <button onClick={handleNextHero} className="w-9 h-9 md:w-11 md:h-11 bg-black/40 backdrop-blur-xl text-white rounded-2xl border border-white/20 flex items-center justify-center hover:bg-primary-crimson hover:scale-110 active:scale-95 transition-all shadow-2xl"><ChevronRight className="w-5 h-5 md:w-6 md:h-6" /></button>
                    <button onClick={handlePrevHero} className="w-9 h-9 md:w-11 md:h-11 bg-black/40 backdrop-blur-xl text-white rounded-2xl border border-white/20 flex items-center justify-center hover:bg-primary-crimson hover:scale-110 active:scale-95 transition-all shadow-2xl"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
                  </div>
                </div>
              )}
            </div>
            {/* Ad Space - Visible only on Desktop */}
            <div className="hidden lg:flex lg:col-span-1 glass-card bg-primary-navy text-white flex flex-col items-center justify-center p-0 text-center relative overflow-hidden h-auto group shadow-2xl border border-white/5 rounded-[2rem] order-2 lg:order-2">
              {ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('top')).length > 0 ? (
                (() => {
                  const ad = ads.filter(ad => isAdActive(ad) && ad.position?.split(',').includes('top'))[0];
                  return (
                    <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-full relative group block overflow-hidden">
                      <div className="flex justify-end p-2 px-4 w-full">
                        <span className="bg-primary-crimson text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                          {ad.title}
                        </span>
                      </div>
                      {ad.image_url ? (
                        <div className="w-full h-full relative">
                          <img src={ad.image_url} alt={ad.title} className="w-full h-auto object-contain transition-transform duration-1000 group-hover:scale-105" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-full h-full p-12 flex flex-col items-center justify-center bg-gradient-to-br from-primary-navy to-primary-crimson">
                          <h3 className="text-2xl font-black mb-4">{ad.title}</h3>
                          <DollarSign className="w-12 h-12 text-accent-gold" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all z-20"></div>
                    </a>
                  );
                })()
              ) : (
                <div className="relative z-10 p-10 flex flex-col justify-center items-center h-full bg-gradient-to-br from-primary-navy to-primary-crimson w-full">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                  {/* Top-aligned placeholder label */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className="bg-accent-gold text-primary-navy px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                      مساحة إعلانية
                    </span>
                  </div>

                  <div className="text-2xl md:text-3xl font-black mb-4 mt-6 leading-tight drop-shadow-2xl font-serif italic text-white/90 relative z-10">
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
            <div className="lg:col-span-1 order-2 lg:order-1 flex flex-col gap-6">

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
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 z-10 custom-scrollbar-minimal" style={{ maxHeight: '350px' }}>
                  <div className="animate-marquee-vertical hover:pause flex flex-col space-y-4">
                    {opinionArticles.length > 0 ? (
                      [...opinionArticles, ...opinionArticles].map((v, i) => (
                        <Link
                          key={`${v.id}-${i}`}
                          to={`/article/${v.id}`}
                          className="flex items-center gap-4 group/vitem bg-white/60 p-3 rounded-2xl hover:bg-white/95 transition-all border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform duration-300"
                        >
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative order-2 border-2 border-white shadow-md ring-1 ring-black/5 group-hover/vitem:ring-primary-crimson/20 transition-all duration-500">
                            {((v.writer_image && v.writer_image !== 'null' && v.writer_image !== 'undefined' && v.writer_image.trim() !== '') || (v.image_url && v.image_url !== 'null' && v.image_url !== 'undefined' && v.image_url.trim() !== '')) ? (
                               <img
                                 src={v.writer_image || v.image_url}
                                 alt={v.writer_name}
                                 className="w-full h-full object-cover group-hover/vitem:scale-115 transition-transform duration-700"
                               />
                            ) : (
                               <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden group-hover/vitem:scale-115 transition-transform duration-700 border-b border-gray-100">
                                 <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                                 <User className="w-8 h-8 text-gray-300 relative z-10" />
                               </div>
                            )}
                          </div>
                          <div className="flex-1 text-right order-1">
                            <h4 className="text-primary-navy font-black text-xs line-clamp-2 leading-relaxed group-hover/vitem:text-primary-crimson transition-colors">{v.title}</h4>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center justify-end gap-1">
                              <span>{(() => { const da = settings?.default_author_name || 'موقع هدس'; if (v.category_slug === 'opinion' && v.writer_name) return v.writer_name; const fallback = v.author || da; return fallback === 'صلاح حيدرة' ? da : fallback; })()}</span>
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
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 z-10 custom-scrollbar-minimal" style={{ maxHeight: '350px' }}>
                  <div className="animate-marquee-vertical hover:pause flex flex-col space-y-4">
                    {studiesArticles.length > 0 ? (
                      [...studiesArticles, ...studiesArticles].map((v, i) => (
                        <Link
                          key={`${v.id}-${i}`}
                          to={`/article/${v.id}`}
                          className="flex items-center gap-4 group/vitem bg-white/50 p-3 rounded-2xl hover:bg-white/80 transition-all border border-gray-100 shadow-sm"
                        >
                          <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 relative order-1">
                            {(v.image_url && v.image_url !== 'null' && v.image_url !== 'undefined' && v.image_url.trim() !== '') ? (
                              <img src={v.image_url || undefined} alt={v.title} className="w-full h-full object-cover group-hover/vitem:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            ) : (['general', 'short-urgent'].includes(v.category_slug)) ? (
                              <div className="w-full h-full urgent-fallback"></div>
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <Search className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-right order-2">
                            <h4 className="text-primary-navy font-black text-xs line-clamp-2 leading-relaxed group-hover/vitem:text-primary-crimson transition-colors">{v.title}</h4>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center justify-end gap-1">
                              <span>{(() => { const da = settings?.default_author_name || 'موقع هدس'; if (v.category_slug === 'opinion' && v.writer_name) return v.writer_name; const fallback = v.writer_name || v.author || da; return fallback === 'صلاح حيدرة' ? da : fallback; })()}</span>
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
            <div id="news-feed-top" className="lg:col-span-2 order-1 lg:order-2 flex flex-col glass-card bg-white shadow-2xl overflow-hidden border border-primary-navy/10 group/feed">
              <div className="bg-primary-navy p-6 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-crimson/5 skew-x-[-20deg] translate-x-[-50%] group-hover/feed:translate-x-[-40%] transition-transform duration-1000"></div>
                <h3 className="font-black text-xl text-white flex items-center gap-4 relative z-10">
                  <div className="p-2.5 bg-primary-crimson/20 rounded-xl shadow-inner"><TrendingUp className="w-5 h-5 text-primary-crimson" /></div>
                  <span className="tracking-widest uppercase text-base md:text-lg">تغطية خاصة | <span className="text-accent-gold">{selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : (hasRecentUrgent ? 'عاجل' : 'أخبار محلية')}</span></span>
                </h3>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-primary-navy bg-gray-200 overflow-hidden"><img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="viewer" /></div>)}
                  </div>
                  <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em] hidden md:block">القراء النشطون</span>
                </div>
              </div>

              <div className="divide-y divide-gray-50 bg-white">
                {paginatedArticles.length > 0 ? paginatedArticles.map((article, index) => (
                  <React.Fragment key={article.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                      className="group/item"
                    >
                      <div
                        className={`p-5 md:px-6 md:py-8 flex flex-col ${index % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-center gap-6 md:gap-8 hover:bg-surface-soft/80 transition-all duration-700 cursor-pointer relative`}
                        onClick={() => navigate(`/article/${article.id}`)}
                      >
                        {/* Left Interaction Stripe */}
                        <div className="absolute left-0 top-0 bottom-0 w-0 group-hover/item:w-1.5 bg-primary-crimson shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all duration-500 ease-out"></div>

                        {/* Image Content - Cinematic Frame */}
                        <div className={`w-full md:w-56 lg:w-48 xl:w-64 shrink-0 overflow-hidden rounded-3xl shadow-xl relative group-hover/item:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-700 flex items-center justify-center bg-gray-50 h-48 md:h-auto`}>
                          {/* Category Badge on Image - Pulsing for urgent */}
                          <div className="absolute top-3 right-3 z-30">
                            <span className={`bg-primary-crimson/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-white/20 ${['general', 'short-urgent'].includes(article.category_slug) ? 'animate-pulse' : ''}`}>
                              {article.category_name}
                            </span>
                          </div>
                          
                          <div className="w-full h-full relative flex items-center justify-center">
                            {!( (article.image_url && article.image_url !== 'null' && article.image_url !== 'undefined' && article.image_url.trim() !== '') || (article.category_slug === 'opinion' && article.writer_image && article.writer_image !== 'null' && article.writer_image !== 'undefined' && article.writer_image.trim() !== '') ) ? (
                              ['general', 'short-urgent'].includes(article.category_slug) ? (
                                <div className="w-full h-full bg-primary-crimson flex flex-col items-center justify-center p-4 overflow-hidden relative transition-transform duration-1000 scale-100 group-hover/item:scale-105">
                                    {/* Solid Red Background for Urgent */}
                                    {/* Simple Solid Red for Short-Urgent list fallback, ImageIcon for others */}
                                    {article.category_slug !== 'short-urgent' && (
                                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-white/30" />
                                      </div>
                                    )}
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 transition-transform duration-1000 scale-100 group-hover/item:scale-105 border-b border-gray-100">
                                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                                  <ImageIcon className="w-10 h-10 text-primary-navy/10 mb-2" />
                                  <span className="text-[8px] font-black text-primary-navy/5 uppercase tracking-[0.4em]">هـدس</span>
                                </div>
                              )
                            ) : (
                              <img
                                src={article.category_slug === 'opinion' ? (article.writer_image || article.image_url) : article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover/item:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-primary-navy/20 group-hover/item:bg-transparent transition-colors duration-700"></div>
                          {article.video_url && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 shadow-2xl group-hover/item:bg-primary-crimson group-hover/item:border-primary-crimson transition-all duration-500"
                              >
                                <Play className="w-8 h-8 fill-current" />
                              </motion.div>
                            </div>
                          )}
                        </div>

                        {/* Text Content - Refined Spacing */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-right">
                          <div className="flex items-center gap-3 mb-4 justify-end">
                            <span className="text-sm text-gray-400 font-black uppercase tracking-widest">{new Date(article.created_at).toLocaleDateString('ar-YE', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <h5 className="text-primary-navy font-black text-base md:text-xl lg:text-2xl mb-4 group-hover/item:text-primary-crimson transition-colors duration-300 leading-[1.3] drop-shadow-sm">
                            {article.title}
                          </h5>
                          <p className="text-gray-500 font-bold leading-relaxed text-xs md:text-sm line-clamp-2 mb-6 opacity-80 group-hover/item:opacity-100 transition-opacity">
                            {article.content}
                          </p>
                          <div className={`flex items-center justify-between text-[10px] sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] border-t border-gray-100/50 pt-6 mt-auto ${index % 2 !== 0 ? '' : 'flex-row-reverse'}`}>
                            <div className="flex items-center gap-3 md:gap-6 text-gray-400 overflow-hidden">
                              <span className="flex items-center gap-1 sm:gap-2 group-hover/item:text-primary-navy transition-colors truncate max-w-[150px] sm:max-w-none">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary-crimson/50" /> 
                                {(() => {
                                  const defaultAuthor = settings?.default_author_name || "موقع هدس";
                                  const authorName = article.category_slug === 'opinion' 
                                    ? (article.writer_name || article.author || defaultAuthor)
                                    : defaultAuthor;
                                  
                                  if (authorName === "صلاح حيدرة") {
                                    return defaultAuthor;
                                  }
                                  return authorName;
                                })()}
                              </span>
                              <span className="flex items-center gap-1 sm:gap-2 group-hover/item:text-primary-navy transition-colors shrink-0"><Eye className="w-3 h-3 sm:w-4 sm:h-4 text-primary-crimson/50" /> {article.views || 0} قراءة</span>
                              <span className="hidden sm:flex items-center gap-2 group-hover/item:text-primary-navy transition-colors shrink-0"><MapPin className="w-4 h-4 text-primary-crimson/50" /> {settings?.site_location || "صنعاء"}</span>
                            </div>
                            <span className="text-primary-crimson flex items-center gap-2 group-hover/item:gap-4 transition-all duration-500 font-black whitespace-nowrap">
                              {index % 2 !== 0 ? 'استمـر' : 'قراءة'} <span className="hidden md:inline">{index % 2 !== 0 ? ' في القراءة' : ' المزيد'}</span>
                              <ArrowLeft className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Mobile Ad Injection removed as per user request to avoid duplication */}
                  </React.Fragment>
                )) : (
                  <div className="p-32 text-center text-gray-300 font-black tracking-widest uppercase flex flex-col items-center gap-8 bg-surface-soft/20">
                    <div className="p-12 bg-white rounded-[3rem] shadow-premium"><Search className="w-14 h-14 opacity-10" /></div>
                    <p className="text-xl">نحن بصدد تحديث هذا القسم .. ترقبوا جديدنا</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-surface-soft/30 p-6 flex items-center justify-between border-t border-primary-navy/5">
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      const feedElement = document.getElementById('news-feed-top');
                      if (feedElement) feedElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl bg-white text-primary-navy hover:bg-surface-soft disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm border border-primary-navy/5"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>

                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentPage(i + 1);
                          const feedElement = document.getElementById('news-feed-top');
                          if (feedElement) feedElement.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-10 h-10 rounded-xl font-black text-sm transition-all shadow-sm ${currentPage === i + 1
                          ? 'bg-primary-crimson text-white shadow-primary-crimson/20 scale-110'
                          : 'bg-white text-primary-navy hover:bg-surface-soft border border-primary-navy/5'
                          }`}
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
                    className="p-2.5 rounded-xl bg-white text-primary-navy hover:bg-surface-soft disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm border border-primary-navy/5"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
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
                  <div className="h-48 overflow-y-auto overflow-x-hidden relative w-full mb-6 custom-scrollbar-minimal">
                    <div className="animate-marquee-vertical hover:pause flex flex-col space-y-6 text-white text-right font-black text-lg drop-shadow-lg">
                      {articles.filter(a => a.category_slug === 'rights').length > 0 ? (
                        <>
                          {[...articles.filter(a => a.category_slug === 'rights'), ...articles.filter(a => a.category_slug === 'rights')].map((a, index) => (
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



              {/* Technology - Futuristic Space */}
              <div className="glass-card overflow-hidden flex-1 flex flex-col border border-primary-navy/10 relative group min-h-[350px]">
                <div className="absolute inset-0">
                  <img src={settings.tech_bg || "https://picsum.photos/seed/future-tech/600/800"} alt="Tech" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-primary-navy/60 to-transparent"></div>
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="h-48 overflow-y-auto overflow-x-hidden relative w-full mb-6 custom-scrollbar-minimal">
                    <div className="animate-marquee-vertical hover:pause flex flex-col space-y-6 text-white text-right font-black text-lg drop-shadow-lg">
                      {articles.filter(a => a.category_slug === 'tech').length > 0 ? (
                        <>
                          {[...articles.filter(a => a.category_slug === 'tech'), ...articles.filter(a => a.category_slug === 'tech')].map((a, index) => (
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
                    <img src={cat.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-primary-navy/40 group-hover:bg-primary-navy/20 transition-all duration-500 z-0"></div>
                  </div>
                  <div className="relative z-10 flex-1 p-6 flex flex-col items-center justify-end">
                    <div className="h-44 overflow-y-auto overflow-x-hidden relative w-full mb-2 custom-scrollbar-minimal">
                      <div className="animate-marquee-vertical hover:pause flex flex-col space-y-6 text-white text-right font-black text-lg">
                        {articles.filter(a => a.category_slug === cat.slug).length > 0 ? (
                          <>
                            {[...articles.filter(a => a.category_slug === cat.slug), ...articles.filter(a => a.category_slug === cat.slug)].map((a, index) => (
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
                    <div className="text-accent-gold font-serif italic text-xs tracking-tighter">معرض اليوتيوب</div>
                  </div>
                </div>
                <a href={settings.youtube_url || "https://youtube.com"} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-white/5 hover:bg-primary-crimson text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-all">
                  اشترك الآن
                </a>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 custom-scrollbar-minimal">
                <div className="animate-marquee-vertical hover:pause flex flex-col space-y-4">
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
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-white font-black text-sm line-clamp-2 leading-snug group-hover/vitem:text-accent-gold transition-colors">
                            {v.title}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                  {/* Duplicate for seamless loop */}
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
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vitem:bg-black/0 transition-all">
                            <Play className="w-5 h-5 text-white fill-current opacity-80" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-white font-black text-sm line-clamp-2 leading-snug group-hover/vitem:text-accent-gold transition-colors">
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
                      {settings.poll_question || 'هل تعتقد أن التحولات السياسية الأخيرة ستؤدي إلى استقرار اقتصادي مستدام في المنطقة؟'}
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
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-navy/5 to-primary-crimson/5 animate-pulse"></div>
                      <div className="absolute top-2 right-2 w-8 h-8 bg-accent-gold/10 rounded-full blur-lg animate-pulse delay-1000"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-navy to-primary-crimson text-white rounded-xl flex items-center justify-center shadow-lg animate-pulse relative z-10">
                        <Globe className="w-6 h-6 animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-navy/20 to-primary-crimson/20 rounded-xl blur-sm animate-pulse delay-200"></div>
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm text-gray-500 font-bold mb-1">البريد الإلكتروني</p>
                        <p className="font-black text-gray-900 text-lg">{settings.contact_email || 'info@hads-news.com'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-crimson/5 to-accent-gold/5 animate-pulse"></div>
                      <div className="absolute top-2 right-2 w-8 h-8 bg-primary-navy/10 rounded-full blur-lg animate-pulse delay-1000"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-crimson to-primary-navy text-white rounded-xl flex items-center justify-center shadow-lg animate-pulse relative z-10">
                        <User className="w-6 h-6 animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-crimson/20 to-primary-navy/20 rounded-xl blur-sm animate-pulse delay-200"></div>
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm text-gray-500 font-bold mb-1">رئيس التحرير</p>
                        <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-navy to-primary-crimson text-lg animate-pulse">
                          {settings?.chief_editor || 'موقع هدس'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('تم إرسال رسالتك بنجاح'); setShowContactModal(false); }}>
                    <input type="text" placeholder="الاسم الكامل" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" required />
                    <textarea placeholder="رسالتك..." rows={4} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" required></textarea>
                    <button className="w-full bg-gradient-to-r from-primary-crimson to-primary-navy text-white py-4 rounded-xl font-black shadow-xl shadow-primary-crimson/20 hover:shadow-2xl hover:shadow-primary-crimson/30 transition-all duration-300 relative overflow-hidden animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-crimson/20 to-accent-gold/20 animate-pulse"></div>
                      <span className="relative z-10">إرسال الرسالة</span>
                      <div className="absolute inset-0 bg-white/10 scale-x-0 hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    </button>
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
            className="fixed bottom-10 right-10 z-[100] w-20 h-20 bg-primary-navy text-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center group border border-white/5 hover:bg-primary-crimson transition-all duration-700 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-navy/20 to-primary-crimson/20 animate-pulse"></div>
            <ChevronRight className="w-8 h-8 -rotate-90 group-hover:-translate-y-2 transition-transform duration-500 relative z-10 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">البداية</span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold scale-x-0 group-hover:scale-x-75 transition-transform duration-700"></div>
            <div className="absolute inset-0 bg-accent-gold/10 rounded-[2rem] blur-lg scale-0 group-hover:scale-110 transition-transform duration-500"></div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ScrollToTop component to fix React Router scroll behavior
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const MaintenanceWrapper = () => {
  const [settings, setSettings] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    fetch('/api/init')
      .then(res => res.json())
      .then(data => setSettings(data.settings));
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen bg-primary-navy flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Intercept all routes except /admin and its subroutes if maintenance mode is true
  if (settings.maintenance_mode === 'true' && !location.pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-primary-navy flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] text-center relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-navy/80 via-primary-crimson/10 to-accent-gold/10 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-crimson/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-gold/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-navy/20 to-primary-crimson/20 rounded-full blur-3xl animate-pulse delay-1500"></div>
        <div className="max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-crimson/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-gold/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <h1 className="text-3xl md:text-4xl font-black text-center relative">
              <span className="absolute inset-0 bg-gradient-to-r from-primary-crimson via-accent-gold to-primary-navy bg-clip-text text-transparent animate-pulse opacity-75">
                {settings.site_name || '𐩠𐩵𐩪 هـدس'}
              </span>
              <span className="relative text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-pulse">
                {settings.site_name || '𐩠𐩵𐩪 هـدس'}
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-crimson/20 to-accent-gold/20 rounded-lg blur-lg animate-pulse"></div>
            </h1>
            <div className="w-32 h-2 bg-gradient-to-r from-transparent via-primary-crimson to-transparent mx-auto rounded-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-crimson/50 to-accent-gold/50 rounded-full blur-sm animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-crimson/20 to-accent-gold/20 rounded-full blur-md animate-pulse delay-300"></div>
            </div>
            
            <div className="space-y-4 my-8">
              <h2 className="text-2xl md:text-3xl font-black text-accent-gold relative">
                <span className="absolute inset-0 bg-gradient-to-r from-accent-gold to-yellow-300 bg-clip-text text-transparent animate-pulse opacity-80">
                  الموقع تحت الصيانة والتحديث
                </span>
                <span className="relative text-accent-gold drop-shadow-[0_2px_8px_rgba(202,138,4,0.8)] animate-pulse">
                  الموقع تحت الصيانة والتحديث
                </span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl font-bold leading-relaxed max-w-xl relative">
                <span className="absolute inset-0 bg-gradient-to-r from-gray-300/50 to-gray-400/50 bg-clip-text text-transparent animate-pulse opacity-60"></span>
                <span className="relative text-gray-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] animate-pulse">
                  نحن نعمل حالياً على تطوير وتحديث الموقع لتقديم تجربة أفضل لكم. سنعود للعمل قريباً جداً، شاكرين تفهمكم.
                </span>
              </p>
            </div>
            
            <div className="flex justify-center gap-6 mt-4">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary-crimson transition-colors border border-white/10 relative animate-pulse">
                  <Facebook className="w-5 h-5" />
                  <div className="absolute inset-0 bg-primary-crimson/20 rounded-full blur-lg scale-0 hover:scale-150 transition-transform duration-300"></div>
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-black transition-colors border border-white/10 relative animate-pulse">
                  <span className="font-black text-xl leading-none -mt-1">𝕏</span>
                  <div className="absolute inset-0 bg-black/20 rounded-full blur-lg scale-0 hover:scale-150 transition-transform duration-300"></div>
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-colors border border-white/10 relative animate-pulse">
                  <Youtube className="w-5 h-5" />
                  <div className="absolute inset-0 bg-red-600/20 rounded-full blur-lg scale-0 hover:scale-150 transition-transform duration-300"></div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/article/:id" element={<ArticleDetail />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/category/:slug" element={<CategoryArticles />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <MaintenanceWrapper />
    </Router>
  );
}

export default App;
