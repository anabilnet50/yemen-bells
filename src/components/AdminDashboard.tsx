import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, LayoutDashboard, FileText, Settings, LogOut, Eye,
  TrendingUp, AlertCircle, Search, Filter, MessageCircle, User, Globe,
  ExternalLink, DollarSign, Users, Trash, RotateCcw, BarChart2, Menu
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'news' | 'categories' | 'comments' | 'subscribers' | 'settings' | 'ads' | 'writers' | 'trash' | 'analytics' | 'history' | 'users'>('dashboard');
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
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingWriter, setIsEditingWriter] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settings, setSettings] = useState<any>({
    chief_editor: 'صلاح حيدرة',
    site_name: 'أجراس اليمن',
    contact_email: '',
    youtube_url: '',
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    rights_title: 'حقوق وحريات',
    rights_bg: 'https://picsum.photos/seed/unicef-rights/600/800',
    tech_title: 'تـكنولوجيا',
    tech_bg: 'https://picsum.photos/seed/future-tech/600/800',
    economy_title: 'اقتصاد',
    economy_bg: 'https://picsum.photos/seed/economy-gold/600/400',
    tourism_title: 'سياحة',
    tourism_bg: 'https://picsum.photos/seed/tourism-yemen/600/400',
    sports_title: 'رياضة',
    sports_bg: 'https://picsum.photos/seed/sports-action/600/400',
  });
  const [currentArticle, setCurrentArticle] = useState<any>({
    title: '', content: '', category_id: 1, image_url: '', video_url: '', is_urgent: false, writer_id: '', tags: ''
  });
  const [currentCategory, setCurrentCategory] = useState<any>({ name: '', slug: '' });
  const [currentWriter, setCurrentWriter] = useState<any>({ name: '', bio: '', image_url: '' });
  const [currentAd, setCurrentAd] = useState<any>({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1 });
  const [currentUserData, setCurrentUserData] = useState<any>({ username: '', password: '', full_name: '', role: 'editor' });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('reset_token');
    if (tokenParam) {
      setResetToken(tokenParam);
      setAuthMode('reset');
    }

    if (token) {
      // Basic check: we could fetch /api/auth/me here
      setCurrentUser({ id: 1, name: 'Admin' }); // Temporary until we have real user data from token
      fetchAllData();
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
          showNotification('تم إرسال رابط استعادة كلمة المرور لبريدك');
          setAuthMode('login');
        } else {
          showNotification(data.error || 'فشل في العملية', 'error');
        }
      });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showNotification('تم تحديث كلمة المرور بنجاح');
          setAuthMode('login');
          window.history.replaceState({}, '', '/admin');
        } else {
          showNotification(data.error || 'الرابط غير صالح أو انتهى', 'error');
        }
      });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
          showNotification('بيانات الدخول غير صحيحة', 'error');
        }
      });
  };

  const fetchHistory = () => {
    authenticatedFetch('/api/admin/audit-logs').then(setHistory).catch(() => { });
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

    authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentArticle)
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
        setCurrentAd({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1 });
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
            <div className="w-20 h-20 bg-primary-crimson rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary-crimson/30 mx-auto mb-6">أ</div>
            <h1 className="text-3xl font-black text-primary-navy">أجراس اليمن</h1>
            <p className="text-gray-400 font-bold mt-2">
              {authMode === 'login' ? 'بوابة الإدارة ونشر المحتوى' :
                authMode === 'forgot' ? 'استعادة كلمة المرور' : 'تعيين كلمة مرور جديدة'}
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
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">كلمة المرور</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
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
                إرسال رابط الاستعادة
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

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 block mr-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-crimson focus:bg-white transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
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
        fixed inset-y-0 right-0 w-72 bg-primary-navy text-white flex flex-col shadow-2xl z-50 transition-all duration-500 transform
        lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
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
            { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
            { id: 'news', icon: FileText, label: 'إدارة الأخبار' },
            { id: 'writers', icon: Users, label: 'الكتاب' },
            { id: 'categories', icon: Filter, label: 'إدارة الأقسام' },
            { id: 'ads', icon: DollarSign, label: 'إدارة الإعلانات' },
            { id: 'trash', icon: Trash, label: 'سلة المحذوفات' },
            { id: 'comments', icon: MessageCircle, label: 'التعليقات' },
            { id: 'subscribers', icon: User, label: 'المشتركون' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id as any); setIsSidebarOpen(false); }}
              className={`flex items-center gap-4 w-full p-4 rounded-xl font-bold border transition-all ${activeSection === item.id ? 'bg-primary-crimson text-white border-primary-crimson shadow-lg shadow-primary-crimson/20' : 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}

          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-8 mb-4">الإعدادات والرقابة</p>
          {[
            { id: 'analytics', icon: BarChart2, label: 'إحصائيات الزوار' },
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
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><User className="w-7 h-7" /></div>
                    <div>
                      <p className="text-sm text-gray-500 font-bold">المشتركون</p>
                      <p className="text-2xl font-black">{stats.totalSubscribers}</p>
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
                  <h1 className="text-3xl font-black text-gray-900">إدارة الأخبار</h1>
                  <p className="text-gray-500 font-medium">تحكم في جميع أخبار ومقالات الموقع من هنا</p>
                </div>
                <button
                  onClick={() => { setIsEditing(true); setCurrentArticle({ title: '', content: '', category_id: 1, image_url: '', is_urgent: false, tags: '' }); }}
                  className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all transform hover:-translate-y-1"
                >
                  <Plus className="w-6 h-6" /> إضافة خبر جديد
                </button>
              </div>

              {isEditing ? (
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
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                    </div>
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
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">رابط الفيديو (اختياري)</label>
                        <input
                          type="text"
                          value={currentArticle.video_url || ''}
                          onChange={e => setCurrentArticle({ ...currentArticle, video_url: e.target.value })}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                          placeholder="رابط يوتيوب أو فيديو مباشر..."
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
                    <div className="flex items-center gap-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={currentArticle.is_urgent}
                        onChange={e => setCurrentArticle({ ...currentArticle, is_urgent: e.target.checked })}
                        className="w-6 h-6 accent-red-600 cursor-pointer"
                      />
                      <label htmlFor="urgent" className="font-black text-red-700 cursor-pointer">تمييز كخبر عاجل (سيظهر في شريط الأخبار)</label>
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ ونشر الخبر</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">إلغاء</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="p-6 border-b flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative flex-1">
                      <Search className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="ابحث عن خبر بالاسم أو التصنيف..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-gray-50/50 border-b">
                        <tr>
                          <th className="p-6 font-black text-gray-600">الخبر</th>
                          <th className="p-6 font-black text-gray-600">التصنيف</th>
                          <th className="p-6 font-black text-gray-600">المشاهدات</th>
                          <th className="p-6 font-black text-gray-600">التاريخ</th>
                          <th className="p-6 font-black text-gray-600 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredArticles.map(article => (
                          <tr key={article.id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                  <img src={article.image_url || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="max-w-xs xl:max-w-md">
                                  <p className="font-black text-gray-900 truncate group-hover:text-primary-crimson transition-colors">{article.title}</p>
                                  {article.is_urgent === 1 && <span className="text-[10px] bg-red-100 text-primary-crimson px-2 py-0.5 rounded-full font-black uppercase">عاجل</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-6"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">{article.category_name}</span></td>
                            <td className="p-6">
                              <div className="flex items-center gap-2 font-bold text-gray-600">
                                <Eye className="w-4 h-4" /> {article.views || 0}
                              </div>
                            </td>
                            <td className="p-6 text-sm text-gray-500 font-bold">{new Date(article.created_at).toLocaleDateString('ar-YE')}</td>
                            <td className="p-6">
                              <div className="flex justify-center gap-3">
                                <button onClick={() => { setCurrentArticle(article); setIsEditing(true); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('هل أنت متأكد من حذف هذا الخبر نهائياً؟')) {
                                      fetch(`/api/articles/${article.id}`, { method: 'DELETE' })
                                        .then(() => {
                                          fetchArticles();
                                          fetchStats();
                                        });
                                    }
                                  }}
                                  className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
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
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ القسم</button>
                      <button type="button" onClick={() => setIsEditingCategory(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">إلغاء</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50/50 border-b">
                      <tr>
                        <th className="p-6 font-black text-gray-600">الاسم</th>
                        <th className="p-6 font-black text-gray-600">الرابط (Slug)</th>
                        <th className="p-6 font-black text-gray-600 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-6 font-bold">{cat.name}</td>
                          <td className="p-6 font-mono text-sm text-gray-500">{cat.slug}</td>
                          <td className="p-6">
                            <div className="flex justify-center gap-3">
                              <button onClick={() => { setCurrentCategory(cat); setIsEditingCategory(true); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
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
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="p-6 font-black text-gray-600">المعلق</th>
                      <th className="p-6 font-black text-gray-600">التعليق</th>
                      <th className="p-6 font-black text-gray-600">الخبر</th>
                      <th className="p-6 font-black text-gray-600 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comments.map(comment => (
                      <tr key={comment.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-6 font-bold">{comment.name}</td>
                        <td className="p-6 text-sm text-gray-600 leading-relaxed">{comment.content}</td>
                        <td className="p-6 font-bold text-blue-600">{comment.article_title}</td>
                        <td className="p-6">
                          <div className="flex justify-center">
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

          {activeSection === 'subscribers' && (
            <div className="space-y-10">
              <h1 className="text-3xl font-black text-gray-900">المشتركون في النشرة</h1>
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="p-6 font-black text-gray-600">البريد الإلكتروني</th>
                      <th className="p-6 font-black text-gray-600">تاريخ الاشتراك</th>
                      <th className="p-6 font-black text-gray-600 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-6 font-bold">{sub.email}</td>
                        <td className="p-6 text-gray-500 font-bold text-sm">{new Date(sub.created_at).toLocaleDateString('ar-YE')}</td>
                        <td className="p-6">
                          <div className="flex justify-center">
                            <button onClick={() => handleSubscriberDelete(sub.id)} className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
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
                    <label className="block text-sm font-black text-gray-700">بريد التواصل</label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={e => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-gray-700">رابط قناة اليوتيوب</label>
                    <input
                      type="text"
                      value={settings.youtube_url}
                      onChange={e => setSettings(prev => ({ ...prev, youtube_url: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-gray-700">رابط فيسبوك</label>
                    <input
                      type="text"
                      value={settings.facebook_url}
                      onChange={e => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-gray-700">رابط تويتر</label>
                    <input
                      type="text"
                      value={settings.twitter_url}
                      onChange={e => setSettings(prev => ({ ...prev, twitter_url: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-gray-700">رابط لينكد إن</label>
                    <input
                      type="text"
                      value={settings.linkedin_url}
                      onChange={e => setSettings(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                    />
                  </div>
                </div>


                {/* Dynamic Category Sections */}
                <div className="border-t pt-8">
                  <h3 className="text-xl font-black mb-6 text-primary-crimson">واجهة الأقسام الديناميكية</h3>

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

                  {/* Tourism Section */}
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-6">
                    <h4 className="font-black text-gray-900 mb-4">قسم سياحة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">عنوان القسم</label>
                        <input type="text" value={settings.tourism_title} onChange={e => setSettings(prev => ({ ...prev, tourism_title: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-black text-gray-700">رابط صورة الخلفية</label>
                        <input type="text" value={settings.tourism_bg} onChange={e => setSettings(prev => ({ ...prev, tourism_bg: e.target.value }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'tourism_bg')} className="w-full p-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 transition-all font-bold" />
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
                          <button onClick={() => { if (confirm('حذف الكاتب؟')) fetch(`/api/writers/${writer.id}`, { method: 'DELETE' }).then(fetchWriters); }} className="text-red-600 font-bold text-sm">حذف</button>
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
                  onClick={() => { setIsEditingAd(true); setCurrentAd({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1 }); }}
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
                        <option value="sidebar">جانبي (Sidebar)</option>
                        <option value="top">علوي (Top)</option>
                        <option value="inline">داخل المحتوى (Inline)</option>
                      </select>
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
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">{ad.position}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setCurrentAd(ad); setIsEditingAd(true); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => { if (confirm('حذف الإعلان؟')) fetch(`/api/ads/${ad.id}`, { method: 'DELETE' }).then(fetchAds); }} className="p-3 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
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
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="p-6 w-10">
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
                      <th className="p-6 font-black text-gray-600">الخبر</th>
                      <th className="p-6 font-black text-gray-600">تاريخ الحذف</th>
                      <th className="p-6 font-black text-gray-600 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trashArticles.map(article => (
                      <tr key={article.id} className={`hover:bg-gray-50/80 transition-colors ${selectedTrashIds.includes(article.id) ? 'bg-red-50/30' : ''}`}>
                        <td className="p-6">
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
                        <td className="p-6 font-bold">{article.title}</td>
                        <td className="p-6 text-sm text-gray-500">{new Date(article.created_at).toLocaleDateString('ar-YE')}</td>
                        <td className="p-6">
                          <div className="flex justify-center gap-3">
                            <button onClick={() => handleRestoreArticle(article.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all">
                              <RotateCcw className="w-5 h-5" />
                            </button>
                            <button onClick={() => handlePermanentDelete(article.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all">
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

          {activeSection === 'history' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-900">سجل الأنشطة الرقابي</h1>
                <button
                  onClick={fetchHistory}
                  className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl flex items-center gap-2 font-bold"
                >
                  <RotateCcw className="w-5 h-5" /> تحديث السجل
                </button>
              </div>
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="p-6 font-black text-gray-600">المسؤول</th>
                      <th className="p-6 font-black text-gray-600">الإجراء</th>
                      <th className="p-6 font-black text-gray-600">التفاصيل</th>
                      <th className="p-6 font-black text-gray-600">التاريخ والوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-6 font-black text-primary-navy">{log.user_name || 'نظام آلي'}</td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${log.action.includes('حذف') ? 'bg-red-50 text-red-600' :
                            log.action.includes('إضافة') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-6 text-sm text-gray-500 font-bold">{log.details}</td>
                        <td className="p-6 text-xs text-gray-400 font-mono">
                          {new Date(log.created_at).toLocaleString('ar-YE')}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-black">لا توجد سجلات حالياً</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-gray-900">إدارة المستخدمين</h1>
                  <p className="text-gray-500 font-bold">إدارة صلاحيات الوصول للوحة التحكم</p>
                </div>
                <button
                  onClick={() => { setIsEditingUser(true); setCurrentUserData({ username: '', password: '', full_name: '', role: 'editor' }); }}
                  className="bg-primary-crimson text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-primary-crimson/20"
                >
                  <Plus className="w-6 h-6" /> إضافة مسؤول جديد
                </button>
              </div>

              {isEditingUser ? (
                <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-3xl">
                  <h2 className="text-2xl font-black mb-8">إضافة مستخدم جديد</h2>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    authenticatedFetch('/api/admin/users', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(currentUserData)
                    }).then(() => {
                      setIsEditingUser(false);
                      fetchUsers();
                      fetchHistory();
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
                        <label className="text-sm font-black text-gray-700">كلمة المرور</label>
                        <input type="password" value={currentUserData.password} onChange={e => setCurrentUserData({ ...currentUserData, password: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary-crimson outline-none font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">الصلاحية</label>
                        <select value={currentUserData.role} onChange={e => setCurrentUserData({ ...currentUserData, role: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary-crimson outline-none font-bold appearance-none">
                          <option value="editor">محرر (Editor)</option>
                          <option value="admin">مدير نظام (Admin)</option>
                        </select>
                      </div>
                    </div>
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
                      <div>
                        <p className="font-black text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-400 font-bold mb-1">@{user.username}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${user.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
