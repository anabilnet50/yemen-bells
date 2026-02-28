import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, LayoutDashboard, FileText, Settings, LogOut, Eye,
  TrendingUp, AlertCircle, Search, Filter, MessageCircle, User, Globe,
  ExternalLink, DollarSign, Users, Trash, RotateCcw, BarChart2, Menu,
  Hash, Calendar, Clock, Youtube, Play, Image
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'news' | 'categories' | 'comments' | 'settings' | 'ads' | 'writers' | 'trash' | 'history' | 'users'>('dashboard');
  const [articles, setArticles] = useState<any[]>([]);
  const [trashArticles, setTrashArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [writers, setWriters] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTicker, setIsEditingTicker] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingWriter, setIsEditingWriter] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'verify' | 'reset'>('login');
  const [resetCode, setResetCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settings, setSettings] = useState<any>({
    contact_email: '',
    youtube_url: '',
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    telegram_url: '',
    youtube_section_title: 'أجراس اليمن',
    news_ball_image: 'https://tse1.mm.bing.net/th/id/OIP.dKbPF3sk4Qg2vDcgN6jjxAHaB2?rs=1&pid=ImgDetMain&o=7&rm=3',
    copyright_text: 'جميع الحقوق محفوظة لدى موقع أجراس اليمن',
    rights_title: 'حقوق وحريات',
    rights_bg: 'https://picsum.photos/seed/unicef-rights/600/800',
    tech_title: 'تـكنولوجيا',
    tech_bg: 'https://picsum.photos/seed/future-tech/600/800',
    economy_title: 'اقتصاد',
    economy_bg: 'https://picsum.photos/seed/economy-gold/600/400',
    society_title: 'مجتمع',
    society_bg: 'https://picsum.photos/seed/society/600/400',
    sports_title: 'رياضة',
    sports_bg: 'https://picsum.photos/seed/sports-action/600/400',
    research_title: 'أبحاث ودراسات ومقالات',
    research_bg: 'https://picsum.photos/seed/research/600/400',
  });
  const [currentArticle, setCurrentArticle] = useState<any>({
    title: '', content: '', category_id: 1, image_url: '', video_url: '', is_urgent: false, writer_id: '', tags: ''
  });
  const [currentCategory, setCurrentCategory] = useState<any>({ name: '', slug: '' });
  const [currentWriter, setCurrentWriter] = useState<any>({ name: '', bio: '', image_url: '' });
  const [currentAd, setCurrentAd] = useState<any>({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1, start_date: '', end_date: '' });
  const [currentUserData, setCurrentUserData] = useState<any>({ username: '', password: '', full_name: '', role: 'editor', permissions: [] });

  // History Filters
  const [historyFilterUser, setHistoryFilterUser] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (token) {
      // Fetch actual user data including role for RBAC
      authenticatedFetch('/api/auth/me')
        .then(user => {
          setCurrentUser(user);
          fetchAllData();
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          setToken(null);
          setCurrentUser(null);
        });
    }
  }, [token]);

  const fetchAllData = () => {
    fetchArticles();
    fetchTrashArticles();
    fetchCategories();
    fetchComments();
    fetchSubscribers();
    fetchStats();
    fetchSettings();
    fetchWriters();
    fetchAds();
    fetchHistory();
    fetchUsers();
  };

  const authenticatedFetch = (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers }).then(res => {
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        setToken(null);
        setCurrentUser(null);
        throw new Error('Unauthorized');
      }
      return res.json();
    });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showNotification(data.code ? `تم إرسال الرمز بنجاح. رمز التحقق هو: ${data.code}` : data.message);
          setAuthMode('verify');
        } else {
          showNotification(data.error || 'فشل في العملية', 'error');
        }
      });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, code: resetCode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showNotification('تم التحقق من الرمز بنجاح');
          setAuthMode('reset');
        } else {
          showNotification(data.error || 'رمز التحقق غير صحيح', 'error');
        }
      });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showNotification('تم تحديث كلمة المرور بنجاح');
          setAuthMode('login');
          window.history.replaceState({}, '', '/admin');
        } else {
          showNotification(data.error || 'الرمز غير صالح أو انتهى', 'error');
        }
      });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
          setToken(data.token);
          setCurrentUser(data.user);
          showNotification('تم تسجيل الدخول بنجاح');
        } else {
          setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.');
        }
      });
  };

  const fetchHistory = () => {
    let url = '/api/admin/audit-logs?';
    if (historyFilterUser) url += `user_id=${historyFilterUser}&`;
    if (historyStartDate) url += `startDate=${historyStartDate}&`;
    if (historyEndDate) url += `endDate=${historyEndDate}&`;

    authenticatedFetch(url).then(setHistory).catch(() => { });
  };

  const fetchUsers = () => {
    authenticatedFetch('/api/admin/users').then(setUsers).catch(() => { });
  };

  const fetchWriters = () => {
    authenticatedFetch('/api/writers').then(setWriters).catch(() => { });
  };

  const fetchAds = () => {
    authenticatedFetch('/api/ads').then(setAds).catch(() => { });
  };

  const fetchTrashArticles = () => {
    authenticatedFetch('/api/articles?includeDeleted=true')
      .then(data => setTrashArticles(data.filter((a: any) => a.is_deleted === 1)))
      .catch(() => { });
  };

  const fetchComments = () => {
    authenticatedFetch('/api/comments').then(setComments).catch(() => { });
  };

  const fetchSubscribers = () => {
    authenticatedFetch('/api/subscribers').then(setSubscribers).catch(() => { });
  };

  const fetchArticles = () => {
    authenticatedFetch('/api/articles').then(setArticles).catch(() => { });
  };

  const fetchCategories = () => {
    authenticatedFetch('/api/categories').then(setCategories).catch(() => { });
  };

  const fetchStats = () => {
    authenticatedFetch('/api/stats').then(setStats).catch(() => { });
  };

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setCurrentUser(null);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authenticatedFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then(() => {
        showNotification('تم تحديث الإعدادات بنجاح');
        fetchHistory();
      })
      .catch(() => showNotification('فشل تحديث الإعدادات', 'error'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentArticle.id ? 'PUT' : 'POST';
    const url = currentArticle.id ? `/api/articles/${currentArticle.id}` : '/api/articles';

    // If it's a YouTube category, ensure we have some content
    const articleToSave = { ...currentArticle };
    const isYouTube = categories.find(c => c.id === Number(articleToSave.category_id))?.slug.includes('youtube');

    if (isYouTube && !articleToSave.content) {
      articleToSave.content = 'شاهد الفيديو';
    }

    authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleToSave)
    })
      .then(() => {
        setIsEditing(false);
        setCurrentArticle({ title: '', content: '', category_id: 1, image_url: '', is_urgent: false, tags: '', writer_id: '' });
        fetchArticles();
        fetchStats();
        fetchHistory();
        showNotification(currentArticle.id ? 'تم تعديل الخبر بنجاح' : 'تم إضافة الخبر بنجاح');
      })
      .catch(() => showNotification('حدث خطأ أثناء حفظ الخبر', 'error'));
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentCategory.id ? 'PUT' : 'POST';
    const url = currentCategory.id ? `/api/categories/${currentCategory.id}` : '/api/categories';

    authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCategory)
    })
      .then(data => {
        if (data.error) {
          showNotification(data.error, 'error');
        } else {
          setIsEditingCategory(false);
          setCurrentCategory({ name: '', slug: '' });
          fetchCategories();
          fetchHistory();
          showNotification('تم حفظ القسم بنجاح');
        }
      })
      .catch((err) => showNotification(err.message || 'خطأ في العملية', 'error'));
  };

  const handleWriterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentWriter.id ? 'PUT' : 'POST';
    const url = currentWriter.id ? `/api/writers/${currentWriter.id}` : '/api/writers';

    authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentWriter)
    })
      .then(() => {
        setIsEditingWriter(false);
        setCurrentWriter({ name: '', bio: '', image_url: '' });
        fetchWriters();
        fetchHistory();
        showNotification('تم حفظ بيانات الكاتب');
      })
      .catch(() => showNotification('خطأ في حفظ الكاتب', 'error'));
  };

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentAd.id ? 'PUT' : 'POST';
    const url = currentAd.id ? `/api/ads/${currentAd.id}` : '/api/ads';

    authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentAd)
    })
      .then(() => {
        setIsEditingAd(false);
        setCurrentAd({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1, start_date: '', end_date: '' });
        fetchAds();
        fetchHistory();
        showNotification('تم حفظ الإعلان بنجاح');
      })
      .catch(() => showNotification('خطأ في حفظ الإعلان', 'error'));
  };

  const handleCategoryDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      authenticatedFetch(`/api/categories/${id}`, { method: 'DELETE' })
        .then(data => {
          if (data.success) {
            fetchCategories();
            fetchHistory();
            showNotification('تم حذف القسم بنجاح');
          } else {
            showNotification(data.error, 'error');
          }
        })
        .catch(err => showNotification(err.message || 'خطأ في الحذف', 'error'));
    }
  };

  const handleCommentDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      authenticatedFetch(`/api/comments/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchComments();
          fetchHistory();
          showNotification('تم حذف التعليق بنجاح');
        })
        .catch(err => showNotification(err.message || 'خطأ في الحذف', 'error'));
    }
  };

  const handleSubscriberDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المشترك؟')) {
      authenticatedFetch(`/api/subscribers/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchSubscribers();
          fetchHistory();
          showNotification('تم حذف المشترك');
        })
        .catch(() => showNotification('خطأ في حذف المشترك', 'error'));
    }
  };

  const handleBulkTrashAction = (action: 'restore' | 'delete') => {
    if (selectedTrashIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`هل أنت متأكد من حذف ${selectedTrashIds.length} أخبار نهائياً؟`)) return;

    authenticatedFetch(`/api/articles/bulk/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedTrashIds })
    })
      .then(() => {
        fetchTrashArticles();
        fetchArticles();
        fetchStats();
        fetchHistory();
        setSelectedTrashIds([]);
        showNotification(action === 'restore' ? 'تم استعادة الأخبار بنجاح' : 'تم حذف الأخبار نهائياً');
      })
      .catch(() => showNotification('فشل تنفيذ العملية', 'error'));
  };

  const handleEmptyTrash = () => {
    if (!window.confirm('هل أنت متأكد من تفريغ سلة المحذوفات نهائياً؟')) return;
    authenticatedFetch('/api/articles/trash/empty', { method: 'DELETE' })
      .then(() => {
        fetchTrashArticles();
        fetchHistory();
        setSelectedTrashIds([]);
        showNotification('تم تفريغ السلة بنجاح');
      })
      .catch(() => showNotification('فشل تفريغ السلة', 'error'));
  };

  const handleToggleArticleStatus = (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    authenticatedFetch(`/api/articles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newStatus })
    }).then(() => {
      fetchArticles();
      showNotification('تم تغيير حالة الخبر');
    });
  };

  const handleRestoreArticle = (id: number) => {
    authenticatedFetch(`/api/trash/restore/${id}`, { method: 'POST' })
      .then(() => {
        fetchTrashArticles();
        fetchArticles();
        fetchStats();
        fetchHistory();
        showNotification('تم استعادة الخبر بنجاح');
      })
      .catch(() => showNotification('خطأ في استعادة الخبر', 'error'));
  };

  const handlePermanentDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذه العملية.')) {
      authenticatedFetch(`/api/trash/delete/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchTrashArticles();
          fetchHistory();
          showNotification('تم حذف الخبر نهائياً');
        })
        .catch(() => showNotification('خطأ في الحذف النهائي', 'error'));
    }
  };

  const handleImageUpload = (file: File, target: string) => {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (target === 'article') {
          setCurrentArticle(prev => ({ ...prev, image_url: data.imageUrl }));
        } else if (target === 'writer') {
          setCurrentWriter(prev => ({ ...prev, image_url: data.imageUrl }));
        } else if (target === 'ad') {
          setCurrentAd(prev => ({ ...prev, image_url: data.imageUrl }));
        } else {
          setSettings(prev => ({ ...prev, [target]: data.imageUrl }));
        }
        showNotification('تم رفع الصورة بنجاح');
      })
      .catch(() => showNotification('فشل رفع الصورة', 'error'));
  };

  const filteredArticles = (articles || []).filter(a =>
    (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-primary-navy flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-crimson/5 rounded-full -mr-16 -mt-16"></div>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-primary-navy">أجراس اليمن</h1>
            <p className="text-gray-400 font-bold mt-2">
              {authMode === 'login' ? 'بوابة الإدارة ونشر المحتوى' :
                authMode === 'forgot' ? 'استعادة كلمة المرور' :
                  authMode === 'verify' ? 'إدخال رمز التحقق' : 'تعيين كلمة مرور جديدة'}
            </p>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold"
                  placeholder="أدخل اسم المستخدم..."
                  required
                />
              </div>
              {loginError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-bold border border-red-100 flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-crimson transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary-crimson text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/90 transition-all transform hover:-translate-y-1"
              >
                دخول النظام
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-gray-500 hover:text-primary-crimson text-sm font-bold"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary-crimson text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/90 transition-all transform hover:-translate-y-1"
              >
                إرسال رمز التحقق
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-gray-500 hover:text-primary-navy text-sm font-bold"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {authMode === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">رمز التحقق (6 أرقام)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold text-center tracking-[1em] text-2xl"
                  placeholder="------"
                  required
                />
                <p className="text-xs text-gray-400 font-bold mt-2 text-center">أدخل الرمز الذي تم إرساله إلى بريدك الإلكتروني</p>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary-crimson text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/90 transition-all transform hover:-translate-y-1"
              >
                تحقق من الرمز
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-gray-500 hover:text-primary-navy text-sm font-bold"
                >
                  العودة لمعلومات البريد
                </button>
              </div>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-crimson transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all transform hover:-translate-y-1"
              >
                تحديث كلمة المرور
              </button>
            </form>
          )}

          <p className="text-center mt-8 text-gray-400 text-xs font-bold leading-relaxed">
            محمي بنظام تشفير متطور<br />جميع المحاولات يتم تسجيلها آلياً
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-soft min-h-screen flex" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-primary-navy/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 w-80 bg-primary-navy text-white flex flex-col shadow-2xl z-50 transition-all duration-300 transform
        lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        shrink-0
      `}>
        <div className="p-8 text-3xl font-black border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-crimson rounded-lg flex items-center justify-center">أ</div>
            أجراس اليمن
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">✕</button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">القائمة الرئيسية</p>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', permission: null },
            { id: 'news', icon: FileText, label: 'إدارة الأخبار', permission: 'news' },
            { id: 'writers', icon: Users, label: 'الكتاب', permission: 'writers' },
            { id: 'categories', icon: Filter, label: 'إدارة الأقسام', permission: 'categories' },
            { id: 'ads', icon: DollarSign, label: 'إدارة الإعلانات', permission: 'ads' },
            { id: 'trash', icon: Trash, label: 'سلة المحذوفات', permission: 'trash' },
            { id: 'comments', icon: MessageCircle, label: 'التعليقات', permission: 'comments' },
          ].map(item => {
            const hasAccess = currentUser?.role === 'admin' || !item.permission || (Array.isArray(currentUser?.permissions) && currentUser.permissions.includes(item.permission));
            if (!hasAccess) return null;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id as any); setIsSidebarOpen(false); }}
                className={`flex items-center gap-4 w-full p-4 rounded-xl font-bold border transition-all ${activeSection === item.id ? 'bg-primary-crimson text-white border-primary-crimson shadow-lg shadow-primary-crimson/20' : 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'}`}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            )
          })}

          {currentUser?.role === 'admin' && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-8 mb-4">الإعدادات والرقابة</p>
              {[
                { id: 'history', icon: RotateCcw, label: 'سجل الأنشطة' },
                { id: 'users', icon: Users, label: 'إدارة المستخدمين' },
                { id: 'settings', icon: Settings, label: 'إعدادات الموقع' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id as any); setIsSidebarOpen(false); }}
                  className={`flex items-center gap-4 w-full p-4 rounded-xl font-bold border transition-all ${activeSection === item.id ? 'bg-primary-crimson text-white border-primary-crimson shadow-lg shadow-primary-crimson/20' : 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'}`}
                >
                  <item.icon className="w-5 h-5" /> {item.label}
                </button>
              ))}
            </>
          )}


          <div className="pt-4 mt-4 border-t border-white/5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full p-4 rounded-xl font-bold border border-white/10 hover:bg-primary-crimson hover:text-white transition-all text-gray-400"
            >
              <ExternalLink className="w-5 h-5" /> معاينة الموقع
            </a>
          </div>
        </nav>
        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-xl mb-4">
            <p className="text-xs text-gray-400 mb-1">المستخدم الحالي</p>
            <p className="font-bold">{currentUser?.full_name || 'مسؤول النظام'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full p-4 text-primary-crimson/80 hover:bg-primary-crimson/10 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-5 h-5" /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Header for Mobile */}
        <header className="lg:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-primary-navy hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <span className="font-black text-primary-navy">لوحة التحكّم</span>
            <div className="w-8 h-8 bg-primary-crimson rounded-lg flex items-center justify-center text-white font-black">أ</div>
          </div>
        </header>

        <div className="p-6 lg:p-10 pb-32">
          {notification && (
            <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-2xl shadow-2xl font-black text-white flex items-center gap-4 animate-in slide-in-from-top duration-500 ${notification.type === 'success' ? 'bg-green-600' : 'bg-primary-crimson'
              }`}>
              {notification.type === 'success' ? (
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
              {notification.message}
            </div>
          )}

          {currentUser?.role === 'editor' && activeSection !== 'news' && activeSection !== 'trash' ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white rounded-[2.5rem] shadow-sm border border-red-50 mt-10">
              <div className="w-24 h-24 bg-red-50 text-primary-crimson rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">عذراً، ليس لديك صلاحيات!</h2>
              <p className="text-gray-500 font-bold text-lg max-w-md mx-auto">هذا القسم مخصص لمدراء النظام فقط. يرجى مراجعة مدير الموقع للحصول على الصلاحيات المطلوبة.</p>
            </div>
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <div className="space-y-10">
                  <h1 className="text-3xl font-black text-gray-900">نظرة عامة</h1>
                  {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><FileText className="w-7 h-7" /></div>
                        <div>
                          <p className="text-sm text-gray-500 font-bold">إجمالي الأخبار</p>
                          <p className="text-2xl font-black">{stats.totalArticles}</p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><Eye className="w-7 h-7" /></div>
                        <div>
                          <p className="text-sm text-gray-500 font-bold">إجمالي المشاهدات</p>
                          <p className="text-2xl font-black">{stats.totalViews}</p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><MessageCircle className="w-7 h-7" /></div>
                        <div>
                          <p className="text-sm text-gray-500 font-bold">التعليقات</p>
                          <p className="text-2xl font-black">{stats.totalComments}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black mb-6">توزيع الأخبار حسب التصنيف</h3>
                      <div className="space-y-4">
                        {stats?.categoryStats.map((cat: any) => (
                          <div key={cat.name} className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                              <span>{cat.name}</span>
                              <span>{cat.count} خبر</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-red-600 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(cat.count / stats.totalArticles) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black mb-6">آخر الأخبار المضافة</h3>
                      <div className="space-y-4">
                        {articles.slice(0, 5).map(article => (
                          <div key={article.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              <img src={article.image_url || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">{article.title}</p>
                              <p className="text-xs text-gray-500">{new Date(article.created_at).toLocaleDateString('ar-YE')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'news' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-5xl font-black text-gray-900 mb-2">إدارة الأخبار</h1>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-gray-500 font-bold text-lg">تحكم في جميع أخبار ومقالات الموقع من هنا</p>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-primary-navy/5 rounded-2xl border border-primary-navy/10">
                          <div className="w-10 h-10 bg-primary-navy/10 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary-navy" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-400 uppercase leading-none mb-1">إجمالي المقالات</span>
                            <span className="text-xl font-black text-primary-navy leading-none">{articles.length} خبر مصنف</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => { setIsEditing(false); setIsEditingTicker(true); }}
                        className="bg-orange-500 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-3 shadow-md hover:bg-orange-600 transition-all transform hover:-translate-y-1"
                      >
                        <MessageCircle className="w-5 h-5" /> نص شريط الأخبار
                      </button>
                      <button
                        onClick={() => { setIsEditingTicker(false); setIsEditing(true); setCurrentArticle({ title: '', content: '', category_id: 1, image_url: '', is_urgent: false, tags: '', writer_id: '' }); }}
                        className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all transform hover:-translate-y-1"
                      >
                        <Plus className="w-6 h-6" /> إضافة خبر جديد
                      </button>
                    </div>
                  </div>

                  {isEditingTicker ? (
                    <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto mb-10">
                      <div className="flex justify-between items-center mb-8 border-b pb-6">
                        <h2 className="text-2xl font-black text-gray-900">إضافة نص لشريط الأخبار</h2>
                        <button onClick={() => setIsEditingTicker(false)} className="text-gray-400 hover:text-gray-600 font-bold">إغلاق</button>
                      </div>
                      <div className="space-y-6">
                        <p className="text-gray-500 font-bold text-sm">أدخل رسالة مخصصة للظهور كخبر عاجل في الشريط المتحرك أعلى الموقع. لإخفائه، اترك الحقل فارغاً.</p>
                        <input
                          type="text"
                          value={settings.custom_ticker_text || ''}
                          onChange={e => setSettings(prev => ({ ...prev, custom_ticker_text: e.target.value }))}
                          placeholder="مثال: عاجل - بدء الفعالية..."
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 transition-all outline-none font-bold text-lg"
                        />
                        <button
                          onClick={() => {
                            authenticatedFetch('/api/settings', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ custom_ticker_text: settings.custom_ticker_text })
                            })
                              .then(() => {
                                showNotification('تم تحديث الشريط بنجاح');
                                setIsEditingTicker(false);
                              })
                              .catch(() => showNotification('حدث خطأ', 'error'));
                          }}
                          className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl w-full hover:bg-orange-600 transition"
                        >
                          تحديث ونشر في الشريط
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-xl border border-gray-100 max-w-5xl mx-auto">
                      <div className="flex justify-between items-center mb-10 border-b pb-6">
                        <h2 className="text-2xl font-black text-gray-900">{currentArticle.id ? 'تعديل الخبر' : 'إنشاء خبر جديد'}</h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 font-bold">إغلاق</button>
                      </div>
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان الخبر</label>
                            <input
                              type="text"
                              value={currentArticle.title}
                              onChange={e => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                              placeholder="أدخل عنواناً جذاباً للخبر..."
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">التصنيف</label>
                            <select
                              value={currentArticle.category_id}
                              onChange={e => setCurrentArticle({ ...currentArticle, category_id: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold appearance-none"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name} {['local', 'intl', 'general'].includes(cat.slug) ? '(المنطقة الوسطى)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {/* Normal Fields for non-YouTube articles */}
                        {!categories.find(c => c.id === Number(currentArticle.category_id))?.slug.includes('youtube') && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">رابط الصورة</label>
                                <input
                                  type="text"
                                  value={currentArticle.image_url}
                                  onChange={e => setCurrentArticle({ ...currentArticle, image_url: e.target.value })}
                                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                                  placeholder="https://images.unsplash.com/..."
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'article')}
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">الوسوم (Tags)</label>
                                <input
                                  type="text"
                                  value={currentArticle.tags || ''}
                                  onChange={e => setCurrentArticle({ ...currentArticle, tags: e.target.value })}
                                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                                  placeholder="يمن، اقتصاد، عاجل..."
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Video URL remains visible for all, or we can make it prominent for YouTube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط الفيديو (يوتيوب)</label>
                            <input
                              type="text"
                              value={currentArticle.video_url || ''}
                              onChange={e => setCurrentArticle({ ...currentArticle, video_url: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                              placeholder="https://www.youtube.com/watch?v=..."
                              required={categories.find(c => c.id === Number(currentArticle.category_id))?.slug.includes('youtube')}
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">الكاتب (المؤلف)</label>
                            <select
                              value={currentArticle.writer_id || ''}
                              onChange={e => setCurrentArticle({ ...currentArticle, writer_id: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold appearance-none"
                            >
                              <option value="">أجراس اليمن (افتراضي)</option>
                              {writers.map(writer => <option key={writer.id} value={writer.id}>{writer.name}</option>)}
                            </select>
                          </div>
                        </div>

                        {!categories.find(c => c.id === Number(currentArticle.category_id))?.slug.includes('youtube') && (
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">محتوى الخبر التفصيلي</label>
                            <textarea
                              rows={12}
                              value={currentArticle.content}
                              onChange={e => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold leading-relaxed"
                              placeholder="اكتب تفاصيل الخبر هنا..."
                              required
                            ></textarea>
                          </div>
                        )}
                        <div className="flex items-center gap-6 bg-red-50 p-6 rounded-2xl border border-red-100">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              id="urgent"
                              checked={currentArticle.is_urgent}
                              onChange={e => setCurrentArticle({ ...currentArticle, is_urgent: e.target.checked })}
                              className="w-6 h-6 accent-red-600 cursor-pointer"
                            />
                            <label htmlFor="urgent" className="font-black text-red-700 cursor-pointer flex flex-col">
                              <span>تمييز كخبر عاجل</span>
                              <span className="text-[10px] font-bold text-red-500/70">(يظهر في الهيرو الكبير وشريط الأخبار)</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-4 pt-6">
                          <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ ونشر الخبر</button>
                          <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-premium overflow-hidden border border-gray-100">
                      <div className="p-8 border-b flex flex-col md:flex-row justify-between gap-6 bg-gray-50/30">
                        <div className="relative flex-1">
                          <Search className="absolute right-5 top-4 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="ابحث بمنتهى الدقة عن خبر معين..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pr-14 pl-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary-crimson focus:ring-0 outline-none font-bold transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-center border-collapse border border-[#cfdce9]">
                          <thead className="bg-[#5b9bd5] text-white">
                            <tr className="divide-x divide-x-reverse divide-[#ffffff]">
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">
                                <div className="flex items-center gap-2 justify-center"><Hash className="w-5 h-5" /> الرقم</div>
                              </th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">الوسائط</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap max-w-[200px]">عنوان الخبر</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">القسم</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">تاريخ النشر</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">وقت النشر</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">إجمالي الزيارات</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">المستخدم (الناشر)</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">الحالة</th>
                              <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#cfdce9]">
                            {filteredArticles.map(article => (
                              <tr key={article.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors divide-x divide-x-reverse divide-[#cfdce9] text-center">
                                <td className="p-6 font-mono text-sm text-gray-400 font-black text-center">#{article.id}</td>
                                <td className="p-6 text-center">
                                  <div className="w-24 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 mx-auto relative group/img">
                                    <img src={article.image_url || 'https://via.placeholder.com/150x100'} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                                  </div>
                                </td>
                                <td className="p-6 max-w-lg">
                                  <p className="font-black text-lg text-primary-navy leading-snug group-hover:text-primary-crimson transition-colors line-clamp-2">{article.title}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {article.is_urgent === 1 && <span className="text-[10px] bg-red-100 text-primary-crimson px-3 py-0.5 rounded-lg font-black flex items-center gap-1"><AlertCircle className="w-3 h-3" /> عاجل</span>}
                                    {article.video_url && <span className="text-[10px] bg-blue-100 text-blue-600 px-3 py-0.5 rounded-lg font-black">🎥 فيديو يوتيوب</span>}
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="bg-primary-navy/5 text-[11px] font-black text-primary-navy px-4 py-1.5 rounded-xl border border-primary-navy/10">{article.category_name}</span>
                                    <span className="text-[9px] text-gray-400 font-black">معارف: {article.category_id}</span>
                                  </div>
                                </td>
                                <td className="p-6 text-center">
                                  <div className="flex justify-center border border-gray-100 bg-gray-50/50 px-3 py-1.5 rounded-xl">
                                    <span className="text-xs font-black text-gray-600">{new Date(article.created_at).toLocaleDateString('ar-YE')}</span>
                                  </div>
                                </td>
                                <td className="p-6 text-center">
                                  <div className="flex justify-center border border-gray-100 bg-gray-50/50 px-3 py-1.5 rounded-xl">
                                    <span className="text-xs font-black text-gray-500">{new Date(article.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex justify-center">
                                    <div className="flex items-center gap-2 text-sm font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                      <Eye className="w-4 h-4" />
                                      <span>{article.views || 0}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2 justify-center bg-blue-50/30 p-2 rounded-2xl border border-blue-50">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                      <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black text-primary-navy/80">{article.writer_name || article.author || 'المسؤول الرئيسي'}</span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex flex-col items-center gap-2">
                                    <button
                                      onClick={() => handleToggleArticleStatus(article.id, article.is_active)}
                                      className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${article.is_active === 1 ? 'bg-green-500 shadow-green-600/20' : 'bg-gray-300'}`}
                                    >
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${article.is_active === 1 ? 'right-7' : 'right-1'}`}></div>
                                    </button>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${article.is_active === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                                      {article.is_active === 1 ? 'نشط' : 'معطل'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      onClick={() => { setCurrentArticle(article); setIsEditing(true); }}
                                      className="w-10 h-10 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center group/btn"
                                      title="تعديل"
                                    >
                                      <Edit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('🚨 حذف هذا الخبر نهائياً؟')) {
                                          authenticatedFetch(`/api/articles/${article.id}`, { method: 'DELETE' })
                                            .then(() => {
                                              fetchArticles();
                                              fetchStats();
                                              fetchHistory();
                                              showNotification('تم حذف الخبر بنجاح');
                                            });
                                        }
                                      }}
                                      className="w-10 h-10 bg-red-50 text-primary-crimson hover:bg-primary-crimson hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center group/btn"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {activeSection === 'categories' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-gray-900">إدارة الأقسام</h1>
                    <button
                      onClick={() => { setIsEditingCategory(true); setCurrentCategory({ name: '', slug: '' }); }}
                      className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all"
                    >
                      <Plus className="w-6 h-6" /> إضافة قسم جديد
                    </button>
                  </div>

                  {isEditingCategory ? (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                      <form onSubmit={handleCategorySubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">اسم القسم</label>
                            <input
                              type="text"
                              value={currentCategory.name}
                              onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">الرابط اللطيف (Slug)</label>
                            <input
                              type="text"
                              value={currentCategory.slug}
                              onChange={e => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                              placeholder="e.g., local-news"
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية (اختياري)</label>
                            <input
                              type="text"
                              value={currentCategory.background_url || ''}
                              onChange={e => setCurrentCategory({ ...currentCategory, background_url: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">أو رفع خلفية من الجهاز</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'category_bg')}
                              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-6">
                          <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ القسم</button>
                          <button type="button" onClick={() => setIsEditingCategory(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                      <table className="w-full text-center border-collapse">
                        <thead className="bg-[#5b9bd5] text-white">
                          <tr>
                            <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الاسم</th>
                            <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الرابط (Slug)</th>
                            <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cfdce9] border-b border-x border-[#cfdce9]">
                          {categories.map(cat => (
                            <tr key={cat.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors text-center border-b border-[#cfdce9]">
                              <td className="p-4 sm:p-6 font-bold border-l border-[#cfdce9] last:border-l-0">{cat.name}</td>
                              <td className="p-4 sm:p-6 font-mono text-sm text-gray-600 border-l border-[#cfdce9] last:border-l-0">{cat.slug}</td>
                              <td className="p-4 sm:p-6 border-l border-[#cfdce9] last:border-l-0">
                                <div className="flex justify-center gap-3">
                                  <button onClick={() => { setCurrentCategory(cat); setIsEditingCategory(true); }} className="p-3 text-blue-600 hover:bg-blue-100/50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                                  <button onClick={() => handleCategoryDelete(cat.id)} className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'comments' && (
                <div className="space-y-10">
                  <h1 className="text-3xl font-black text-gray-900">إدارة التعليقات</h1>
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-[#5b9bd5] text-white">
                        <tr>
                          <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">المعلق</th>
                          <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">التعليق</th>
                          <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الخبر</th>
                          <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cfdce9] border-b border-x border-[#cfdce9]">
                        {comments.map(comment => (
                          <tr key={comment.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors text-center border-b border-[#cfdce9]">
                            <td className="p-4 sm:p-6 font-bold border-l border-[#cfdce9] last:border-l-0">{comment.name}</td>
                            <td className="p-4 sm:p-6 text-sm text-gray-700 leading-relaxed border-l border-[#cfdce9] last:border-l-0">{comment.content}</td>
                            <td className="p-4 sm:p-6 font-bold text-blue-700 border-l border-[#cfdce9] last:border-l-0">{comment.article_title}</td>
                            <td className="p-4 sm:p-6 border-l border-[#cfdce9] last:border-l-0">
                              <div className="flex justify-center border-l border-[#cfdce9] last:border-l-0">
                                <button onClick={() => handleCommentDelete(comment.id)} className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'settings' && currentUser?.role === 'admin' && (
                <div className="space-y-10 max-w-4xl">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900">إعدادات الموقع</h1>
                    <p className="text-gray-500 font-medium">تخصيص المعلومات الأساسية والنصوص الثابتة في الموقع</p>
                  </div>

                  <form onSubmit={handleSettingsSubmit} className="bg-white p-8 lg:p-12 rounded-3xl shadow-xl border border-gray-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">اسم الموقع</label>
                        <input
                          type="text"
                          value={settings.site_name}
                          onChange={e => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">رئيس التحرير</label>
                        <input
                          type="text"
                          value={settings.chief_editor}
                          onChange={e => setSettings(prev => ({ ...prev, chief_editor: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">عنوان قسم اليوتيوب</label>
                        <input
                          type="text"
                          value={settings.youtube_section_title}
                          onChange={e => setSettings(prev => ({ ...prev, youtube_section_title: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">نص شريط الأخبار المخصص (عاجل)</label>
                        <input
                          type="text"
                          value={settings.custom_ticker_text || ''}
                          onChange={e => setSettings(prev => ({ ...prev, custom_ticker_text: e.target.value }))}
                          placeholder="أدخل رسالة مخصصة لتظهر في الشريط الإخباري..."
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">نص حقوق الطبع</label>
                        <input
                          type="text"
                          value={settings.copyright_text}
                          onChange={e => setSettings(prev => ({ ...prev, copyright_text: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">أيقونة كرة الأخبار (Ticker)</label>
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={settings.news_ball_image}
                            onChange={e => setSettings(prev => ({ ...prev, news_ball_image: e.target.value }))}
                            className="flex-1 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-xs"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'news_ball_image')}
                            className="hidden"
                            id="ball-upload"
                          />
                          <label htmlFor="ball-upload" className="bg-gray-100 p-4 rounded-2xl cursor-pointer hover:bg-gray-200 transition-all flex items-center justify-center">
                            <Play className="w-5 h-5 text-gray-500" />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">بريد التواصل</label>
                        <input
                          type="email"
                          value={settings.contact_email}
                          onChange={e => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="mt-8 border-t pt-8">
                      <h3 className="text-xl font-black mb-6 text-primary-crimson">روابط التواصل الاجتماعي</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500">فيسبوك</label>
                          <input
                            type="text"
                            value={settings.facebook_url}
                            onChange={e => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500">تويتر (X)</label>
                          <input
                            type="text"
                            value={settings.twitter_url}
                            onChange={e => setSettings(prev => ({ ...prev, twitter_url: e.target.value }))}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500">يوتيوب</label>
                          <input
                            type="text"
                            value={settings.youtube_url}
                            onChange={e => setSettings(prev => ({ ...prev, youtube_url: e.target.value }))}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500">لينكدإن</label>
                          <input
                            type="text"
                            value={settings.linkedin_url}
                            onChange={e => setSettings(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500">تليجرام</label>
                          <input
                            type="text"
                            value={settings.telegram_url}
                            onChange={e => setSettings(prev => ({ ...prev, telegram_url: e.target.value }))}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none font-bold text-sm"
                          />
                        </div>
                      </div>
                    </div>


                    {/* Dynamic Category Sections */}
                    <div className="border-t pt-8">
                      <h3 className="text-xl font-black mb-6 text-primary-crimson">واجهة الأقسام الديناميكية (الرئيسية)</h3>

                      {/* Rights Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم حقوق وحريات</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.rights_title} onChange={e => setSettings(prev => ({ ...prev, rights_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.rights_bg} onChange={e => setSettings(prev => ({ ...prev, rights_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'rights_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Tech Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم تكنولوجيا</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.tech_title} onChange={e => setSettings(prev => ({ ...prev, tech_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.tech_bg} onChange={e => setSettings(prev => ({ ...prev, tech_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'tech_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Economy Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم اقتصاد</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.economy_title} onChange={e => setSettings(prev => ({ ...prev, economy_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.economy_bg} onChange={e => setSettings(prev => ({ ...prev, economy_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'economy_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Society Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم مجتمع</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.society_title} onChange={e => setSettings(prev => ({ ...prev, society_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.society_bg} onChange={e => setSettings(prev => ({ ...prev, society_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'society_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Opinion Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم المقالات</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.opinion_title} onChange={e => setSettings(prev => ({ ...prev, opinion_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.opinion_bg} onChange={e => setSettings(prev => ({ ...prev, opinion_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'opinion_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Research Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم دراسات وأبحاث</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.research_title} onChange={e => setSettings(prev => ({ ...prev, research_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.research_bg} onChange={e => setSettings(prev => ({ ...prev, research_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'research_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>

                      {/* Sports Section */}
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                        <h4 className="font-black text-gray-900 mb-4">قسم رياضة</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                            <input type="text" value={settings.sports_title} onChange={e => setSettings(prev => ({ ...prev, sports_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                            <input type="text" value={settings.sports_bg} onChange={e => setSettings(prev => ({ ...prev, sports_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'sports_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex items-center gap-4">
                      <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ التغييرات</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من إلغاء كافة التعديلات غير المحفوظة؟')) {
                            fetchSettings();
                          }
                        }}
                        className="bg-gray-100 text-gray-500 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {activeSection === 'writers' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-gray-900">إدارة الكتاب</h1>
                    <button
                      onClick={() => { setIsEditingWriter(true); setCurrentWriter({ name: '', bio: '', image_url: '' }); }}
                      className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all"
                    >
                      <Plus className="w-6 h-6" /> إضافة كاتب جديد
                    </button>
                  </div>

                  {isEditingWriter ? (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                      <form onSubmit={handleWriterSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">اسم الكاتب</label>
                            <input type="text" value={currentWriter.name} onChange={e => setCurrentWriter({ ...currentWriter, name: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" required />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">رابط الصورة</label>
                            <input type="text" value={currentWriter.image_url} onChange={e => setCurrentWriter({ ...currentWriter, image_url: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" />
                            <div className="space-y-3">
                              <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                              <input type="file" accept="image/*" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'writer');
                              }} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-black text-gray-700">نبذة تعريفية</label>
                          <textarea value={currentWriter.bio} onChange={e => setCurrentWriter({ ...currentWriter, bio: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" rows={4}></textarea>
                        </div>
                        <div className="flex gap-4">
                          <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black">حفظ الكاتب</button>
                          <button type="button" onClick={() => setIsEditingWriter(false)} className="bg-gray-100 px-12 py-4 rounded-2xl font-black">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {writers.map(writer => (
                        <div key={writer.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                          <img src={writer.image_url || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-full object-cover" />
                          <div className="flex-1">
                            <p className="font-black text-lg">{writer.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">{writer.bio}</p>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => { setCurrentWriter(writer); setIsEditingWriter(true); }} className="text-blue-600 font-bold text-sm">تعديل</button>
                              <button onClick={() => { if (confirm('حذف الكاتب؟')) authenticatedFetch(`/api/writers/${writer.id}`, { method: 'DELETE' }).then(fetchWriters); }} className="text-red-600 font-bold text-sm">حذف</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'ads' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-gray-900">إدارة الإعلانات</h1>
                    <button
                      onClick={() => { setIsEditingAd(true); setCurrentAd({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1, start_date: '', end_date: '' }); }}
                      className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3"
                    >
                      <Plus className="w-6 h-6" /> إضافة إعلان
                    </button>
                  </div>

                  {isEditingAd ? (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                      <form onSubmit={handleAdSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <input type="text" placeholder="عنوان الإعلان" value={currentAd.title} onChange={e => setCurrentAd({ ...currentAd, title: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                          <input type="text" placeholder="رابط الصورة" value={currentAd.image_url} onChange={e => setCurrentAd({ ...currentAd, image_url: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                          <input type="text" placeholder="رابط التوجه (Link URL)" value={currentAd.link_url} onChange={e => setCurrentAd({ ...currentAd, link_url: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">أو رفع صورة من الجهاز</label>
                            <input type="file" accept="image/*" onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'ad');
                            }} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" />
                          </div>
                          <select value={currentAd.position} onChange={e => setCurrentAd({ ...currentAd, position: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold">
                            <option value="sidebar">جانبي | Sidebar</option>
                            <option value="top">بجانب الخبر الرئيسي | Hero Section</option>
                            <option value="inline">داخل المحتوى | Middle Section</option>
                          </select>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">تاريخ بدء العرض (اختياري)</label>
                            <input
                              type="datetime-local"
                              value={currentAd.start_date || ''}
                              onChange={e => setCurrentAd({ ...currentAd, start_date: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">تاريخ انتهاء العرض (اختياري)</label>
                            <input
                              type="datetime-local"
                              value={currentAd.end_date || ''}
                              onChange={e => setCurrentAd({ ...currentAd, end_date: e.target.value })}
                              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                            <input
                              type="checkbox"
                              id="ad_active"
                              checked={currentAd.is_active === 1}
                              onChange={e => setCurrentAd({ ...currentAd, is_active: e.target.checked ? 1 : 0 })}
                              className="w-5 h-5 accent-red-600"
                            />
                            <label htmlFor="ad_active" className="font-bold text-gray-700">تفعيل الإعلان</label>
                          </div>
                        </div>
                        <textarea placeholder="أو ضع كود AdSense هنا..." value={currentAd.adsense_code} onChange={e => setCurrentAd({ ...currentAd, adsense_code: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" rows={4}></textarea>
                        <div className="flex gap-4">
                          <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black">حفظ الإعلان</button>
                          <button type="button" onClick={() => setIsEditingAd(false)} className="bg-gray-100 px-12 py-4 rounded-2xl font-black">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {ads.map(ad => (
                        <div key={ad.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
                          <div className="w-32 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            <img src={ad.image_url || 'https://via.placeholder.com/150x100'} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-lg">{ad.title || 'إعلان بدون عنوان'}</p>
                            <p className="text-sm text-gray-500 truncate">{ad.link_url || 'لا يوجد رابط'}</p>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">
                              {ad.position === 'top' ? 'بجانب الخبر الرئيسي' : ad.position === 'sidebar' ? 'جانبي' : 'داخل المحتوى'}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => { setCurrentAd(ad); setIsEditingAd(true); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => { if (confirm('حذف الإعلان؟')) authenticatedFetch(`/api/ads/${ad.id}`, { method: 'DELETE' }).then(fetchAds); }} className="p-3 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'trash' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-gray-900">سلة المحذوفات</h1>
                    <div className="flex gap-4">
                      {selectedTrashIds.length > 0 && (
                        <>
                          <button
                            onClick={() => handleBulkTrashAction('restore')}
                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20"
                          >
                            <RotateCcw className="w-5 h-5" /> استعادة المحدد ({selectedTrashIds.length})
                          </button>
                          <button
                            onClick={() => handleBulkTrashAction('delete')}
                            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-crimson/20"
                          >
                            <Trash2 className="w-5 h-5" /> حذف المحدد ({selectedTrashIds.length})
                          </button>
                        </>
                      )}
                      {trashArticles.length > 0 && (
                        <button
                          onClick={handleEmptyTrash}
                          className="bg-primary-navy text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                        >
                          <Trash className="w-5 h-5" /> تفريغ السلة
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <table className="w-full text-center border-collapse border border-[#cfdce9]">
                      <thead className="bg-[#5b9bd5] text-white">
                        <tr className="divide-x divide-x-reverse divide-white">
                          <th className="p-4 sm:p-6 w-10 text-center">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-red-600"
                              checked={trashArticles.length > 0 && selectedTrashIds.length === trashArticles.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTrashIds(trashArticles.map(a => a.id));
                                else setSelectedTrashIds([]);
                              }}
                            />
                          </th>
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">الخبر</th>
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">تاريخ الحذف</th>
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cfdce9]">
                        {trashArticles.map(article => (
                          <tr key={article.id} className={`divide-x divide-x-reverse divide-[#cfdce9] text-center transition-colors ${selectedTrashIds.includes(article.id) ? 'bg-red-50/50' : 'even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50/50'}`}>
                            <td className="p-4 sm:p-6 align-middle">
                              <input
                                type="checkbox"
                                className="w-5 h-5 accent-red-600"
                                checked={selectedTrashIds.includes(article.id)}
                                onChange={() => {
                                  if (selectedTrashIds.includes(article.id)) {
                                    setSelectedTrashIds(selectedTrashIds.filter(idx => idx !== article.id));
                                  } else {
                                    setSelectedTrashIds([...selectedTrashIds, article.id]);
                                  }
                                }}
                              />
                            </td>
                            <td className="p-4 sm:p-6 font-bold align-middle">{article.title}</td>
                            <td className="p-4 sm:p-6 text-sm text-gray-700 align-middle">{new Date(article.created_at).toLocaleDateString('ar-YE')}</td>
                            <td className="p-4 sm:p-6 align-middle">
                              <div className="flex justify-center gap-3">
                                <button onClick={() => handleRestoreArticle(article.id)} className="p-3 text-green-600 hover:bg-green-100/50 rounded-xl transition-all">
                                  <RotateCcw className="w-5 h-5" />
                                </button>
                                <button onClick={() => handlePermanentDelete(article.id)} className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {trashArticles.length === 0 && (
                          <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-bold">سلة المحذوفات فارغة</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'history' && currentUser?.role === 'admin' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center print:hidden">
                    <h1 className="text-3xl font-black text-gray-900">سجل الأنشطة الرقابي</h1>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => window.print()}
                        className="p-3 text-primary-navy hover:bg-gray-100 rounded-xl flex items-center gap-2 font-bold"
                      >
                        <FileText className="w-5 h-5" /> طباعة التقرير
                      </button>
                      <button
                        onClick={fetchHistory}
                        className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl flex items-center gap-2 font-bold"
                      >
                        <RotateCcw className="w-5 h-5" /> تحديث السجل
                      </button>
                    </div>
                  </div>

                  {/* Filters Section - Hidden when printing unless we want to show applied filters */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 print:hidden">
                    <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-primary-crimson" /> فلترة التقرير
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">المسؤول</label>
                        <select
                          value={historyFilterUser}
                          onChange={e => setHistoryFilterUser(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold"
                        >
                          <option value="">الجميع</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.full_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">من تاريخ</label>
                        <input
                          type="date"
                          value={historyStartDate}
                          onChange={e => setHistoryStartDate(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">إلى تاريخ</label>
                        <input
                          type="date"
                          value={historyEndDate}
                          onChange={e => setHistoryEndDate(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <button
                          onClick={fetchHistory}
                          className="w-full p-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-primary-navy transition-colors flex justify-center items-center gap-2"
                        >
                          <Search className="w-5 h-5" /> تصفية
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Print Header - Only visible when printing */}
                  <div className="hidden print:block text-center mb-10 pb-6 border-b-2 border-gray-200">
                    <h1 className="text-3xl font-black text-gray-900 mb-4">تقرير سجل الأنشطة الرقابي</h1>
                    <div className="flex justify-center gap-10 text-sm font-bold text-gray-600">
                      <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-YE')}</span>
                      {historyFilterUser && <span>المسؤول: {users.find(u => u.id === Number(historyFilterUser))?.full_name}</span>}
                      {historyStartDate && <span>من: {historyStartDate}</span>}
                      {historyEndDate && <span>إلى: {historyEndDate}</span>}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
                    <table className="w-full text-center border-collapse border border-[#cfdce9]">
                      <thead className="bg-[#5b9bd5] text-white print:bg-gray-100 print:text-black">
                        <tr className="divide-x divide-x-reverse divide-[#ffffff]">
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-3">المسؤول</th>
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-3">الإجراء</th>
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-3">التفاصيل</th>
                          <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-3">التاريخ والوقت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cfdce9] print:divide-gray-300">
                        {history.map((log: any) => (
                          <tr key={log.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors divide-x divide-x-reverse divide-[#cfdce9] text-center">
                            <td className="p-4 sm:p-6 font-black text-primary-navy print:py-3 align-middle">{log.user_name || 'نظام آلي'}</td>
                            <td className="p-4 sm:p-6 print:py-3 align-middle">
                              <span className={`px-4 py-2 rounded-full text-xs font-black uppercase print:border print:border-gray-300 shadow-sm ${log.action.includes('حذف') ? 'bg-red-50 text-red-600 border border-red-100' :
                                log.action.includes('إضافة') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 sm:p-6 text-sm text-gray-700 font-bold print:py-3 print:text-gray-900 align-middle leading-relaxed max-w-sm">{log.details}</td>
                            <td className="p-4 sm:p-6 text-base md:text-lg text-gray-900 font-bold print:py-3 print:text-gray-900 align-middle" dir="rtl">
                              {new Date(log.created_at).toLocaleString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </td>
                          </tr>
                        ))}
                        {history.length === 0 && (
                          <tr><td colSpan={4} className="p-20 text-center text-gray-500 font-black text-lg">لا توجد سجلات تطابق الفلتر</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'users' && currentUser?.role === 'admin' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-black text-gray-900">إدارة المستخدمين</h1>
                      <p className="text-gray-500 font-bold">إدارة صلاحيات الوصول للوحة التحكم</p>
                    </div>
                    <button
                      onClick={() => { setIsEditingUser(true); setCurrentUserData({ username: '', password: '', full_name: '', role: 'editor', permissions: [] }); }}
                      className="bg-primary-crimson text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-primary-crimson/20"
                    >
                      <Plus className="w-6 h-6" /> إضافة مسؤول جديد
                    </button>
                  </div>

                  {isEditingUser ? (
                    <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-3xl">
                      <h2 className="text-2xl font-black mb-8">{currentUserData.id ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h2>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const method = currentUserData.id ? 'PUT' : 'POST';
                        const url = currentUserData.id ? `/api/admin/users/${currentUserData.id}` : '/api/admin/users';
                        authenticatedFetch(url, {
                          method,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(currentUserData)
                        }).then(() => {
                          setIsEditingUser(false);
                          fetchUsers();
                          fetchHistory();
                          showNotification(currentUserData.id ? 'تم تعديل المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');
                        }).catch(err => {
                          showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
                        });
                      }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700">الاسم الكامل</label>
                            <input type="text" value={currentUserData.full_name} onChange={e => setCurrentUserData({ ...currentUserData, full_name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary-crimson outline-none font-bold" required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700">اسم المستخدم</label>
                            <input type="text" value={currentUserData.username} onChange={e => setCurrentUserData({ ...currentUserData, username: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary-crimson outline-none font-bold" required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700">كلمة المرور {currentUserData.id && '(اتركها فارغة لعدم التغيير)'}</label>
                            <div className="relative">
                              <input type={showPassword ? "text" : "password"} value={currentUserData.password} onChange={e => setCurrentUserData({ ...currentUserData, password: e.target.value })} className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary-crimson outline-none font-bold" required={!currentUserData.id} />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-crimson transition-colors"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700">الصلاحية</label>
                            <select value={currentUserData.role} onChange={e => setCurrentUserData({ ...currentUserData, role: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary-crimson outline-none font-bold appearance-none">
                              <option value="editor">محرر (Editor)</option>
                              <option value="admin">مدير نظام (Admin)</option>
                            </select>
                          </div>
                        </div>

                        {currentUserData.role === 'editor' && (
                          <div className="mt-6 border-t pt-6 border-gray-100">
                            <h3 className="font-black text-lg mb-4 text-gray-900">صلاحيات المحرر المخصصة</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {[
                                { id: 'news', label: 'إدارة الأخبار' },
                                { id: 'categories', label: 'إدارة الأقسام' },
                                { id: 'writers', label: 'إدارة الكتاب' },
                                { id: 'comments', label: 'إدارة التعليقات' },
                                { id: 'ads', label: 'إدارة الإعلانات' },
                                { id: 'trash', label: 'سلة المحذوفات' }
                              ].map(perm => (
                                <label key={perm.id} className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-primary-crimson transition-colors">
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded text-primary-crimson focus:ring-primary-crimson border-gray-300"
                                    checked={(currentUserData.permissions || []).includes(perm.id)}
                                    onChange={e => {
                                      const perms = currentUserData.permissions || [];
                                      if (e.target.checked) {
                                        setCurrentUserData({ ...currentUserData, permissions: [...perms, perm.id] });
                                      } else {
                                        setCurrentUserData({ ...currentUserData, permissions: perms.filter((p: string) => p !== perm.id) });
                                      }
                                    }}
                                  />
                                  <span className="font-bold text-gray-700">{perm.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-4 pt-4">
                          <button type="submit" className="bg-primary-crimson text-white px-10 py-4 rounded-xl font-black">حفظ المستخدم</button>
                          <button type="button" onClick={() => setIsEditingUser(false)} className="bg-gray-100 text-gray-500 px-10 py-4 rounded-xl font-black">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.map((user: any) => (
                        <div key={user.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 group relative overflow-hidden">
                          <div className="absolute left-0 top-0 w-1 h-full bg-primary-crimson transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                          <div className="w-14 h-14 bg-primary-navy/5 rounded-2xl flex items-center justify-center text-primary-navy font-black text-xl">
                            {user.full_name?.[0]}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-gray-900">{user.full_name}</p>
                            <p className="text-xs text-gray-400 font-bold mb-1">@{user.username}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${user.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setCurrentUserData({ ...user, password: '' }); setIsEditingUser(true); }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                                  authenticatedFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
                                    .then(() => { fetchUsers(); fetchHistory(); showNotification('تم حذف المستخدم بنجاح'); })
                                    .catch(() => showNotification('لا يمكن حذف المستخدم الحالي', 'error'));
                                }
                              }}
                              className="p-2 bg-red-50 text-primary-crimson rounded-xl hover:bg-primary-crimson hover:text-white transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
