import React, { useState, useEffect } from 'react';
import {
  Menu, LogOut, ExternalLink, Plus, Edit2, Trash2, Trash,
  RotateCcw, FileText, Filter, Search, Eye, Play,
  LayoutDashboard, DollarSign, MessageCircle, AlertCircle,
  EyeOff, ChevronRight, ChevronLeft, Calendar,
  Bell, Settings, Users, Database, Shield, Activity
} from 'lucide-react';
import AdminSidebar from './admin/AdminSidebar.tsx';
import DashboardOverview from './admin/DashboardOverview.tsx';
import ArticleManagement from './admin/ArticleManagement.tsx';
import CategoryManagement from './admin/CategoryManagement.tsx';
import WriterManagement from './admin/WriterManagement.tsx';
import CommentManagement from './admin/CommentManagement.tsx';
import AdManagement from './admin/AdManagement.tsx';
import TrashManagement from './admin/TrashManagement.tsx';
import AuditLog from './admin/AuditLog.tsx';
import SettingsManagement from './admin/SettingsManagement.tsx';
import UserManagement from './admin/UserManagement.tsx';
import IPManagement from './admin/IPManagement.tsx';


// --- Rest of imports and component logic ---

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'news' | 'categories' | 'comments' | 'settings' | 'ads' | 'writers' | 'trash' | 'history' | 'users' | 'security'>('dashboard');

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
  const [settings, setSettings] = useState<any>(null);
  const [currentArticle, setCurrentArticle] = useState<any>({
    title: '', content: '', category_id: 1, image_url: '', video_url: '', is_urgent: false, writer_id: ''
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

  function authenticatedFetch(url: string, options: any = {}) {
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
  }

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

  useEffect(() => {
    fetch('/api/init')
      .then(res => res.json())
      .then(data => setSettings(data.settings));
  }, []);

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

  if (!settings) {
    return (
      <div className="min-h-screen bg-primary-navy flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
          جاري التحميل...
        </p>
      </div>
    );
  }



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
        setCurrentArticle({ title: '', content: '', category_id: 1, image_url: '', is_urgent: false, writer_id: '' });
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

  const handleArticleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من نقل هذا الخبر إلى سلة المحذوفات؟')) {
      authenticatedFetch(`/api/articles/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchArticles();
          fetchStats();
          fetchHistory();
          showNotification('تم نقل الخبر إلى سلة المحذوفات');
        })
        .catch(err => showNotification(err.message || 'خطأ في حذف الخبر', 'error'));
    }
  };

  const handleWriterDelete = (id: number) => {
    if (window.confirm('🚨 هل أنت متأكد من حذف هذا الكاتب؟')) {
      authenticatedFetch(`/api/writers/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchWriters();
          fetchHistory();
          showNotification('تم حذف الكاتب بنجاح');
        })
        .catch(err => showNotification(err.message || 'خطأ في حذف الكاتب', 'error'));
    }
  };

  const handleAdDelete = (id: number) => {
    if (window.confirm('🚨 حذف الإعلان نهائياً؟')) {
      authenticatedFetch(`/api/ads/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchAds();
          fetchHistory();
          showNotification('تم حذف الإعلان بنجاح');
        })
        .catch(err => showNotification(err.message || 'خطأ في حذف الإعلان', 'error'));
    }
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
            showNotification(data.error || 'خطأ في الحذف', 'error');
          }
        })
        .catch(err => {
          // Check if it's the specific "associated articles" error
          if (err.message && err.message.includes('associated articles')) {
            showNotification('لا يمكن حذف القسم لوجود أخبار مرتبطة به. يرجى حذف الأخبار أو نقلها أولاً.', 'error');
          } else {
            showNotification(err.message || 'خطأ في الحذف', 'error');
          }
        });
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentUserData.id ? 'PUT' : 'POST';
    const url = currentUserData.id ? `/api/admin/users/${currentUserData.id}` : '/api/admin/users';

    authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentUserData)
    })
      .then(() => {
        setIsEditingUser(false);
        setCurrentUserData({ username: '', password: '', full_name: '', role: 'editor', permissions: [] });
        fetchUsers();
        fetchHistory();
        showNotification(currentUserData.id ? 'تم تعديل المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');
      })
      .catch(err => showNotification(err.message || 'خطأ في حفظ المستخدم', 'error'));
  };

  const handleUserDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      authenticatedFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
        .then(data => {
          if (data.success) {
            fetchUsers();
            fetchHistory();
            showNotification('تم حذف المستخدم بنجاح');
          } else {
            showNotification(data.error || 'خطأ في حذف المستخدم', 'error');
          }
        })
        .catch(err => showNotification(err.message || 'خطأ في حذف المستخدم', 'error'));
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
    authenticatedFetch(`/api/articles/${id}/restore`, { method: 'POST' })
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
      authenticatedFetch(`/api/articles/${id}?permanent=true`, { method: 'DELETE' })
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
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-primary-navy flex flex-col items-center gap-2">
                <span>{(settings && settings.site_name) || '𐩠𐩵𐩪 هـدس'}</span>
              </h1>
              <p className="text-primary-crimson font-black text-sm mt-2 uppercase tracking-widest">{(settings && settings.site_tagline) || 'الأقرب للأحدث - موقع إخباري شامل'}</p>
            </div>
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
            <div className="w-10 h-10 bg-primary-crimson rounded-lg flex items-center justify-center font-black text-xl text-white shadow-lg">هـ</div>
            <span className="tracking-tighter">هـدس</span>
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
                { id: 'security', icon: Shield, label: 'الأمان والحظر' },
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

          {(() => {
            const sectionToPermission: Record<string, string> = {
              'news': 'news',
              'categories': 'categories',
              'writers': 'writers',
              'comments': 'comments',
              'ads': 'ads',
              'trash': 'trash',
              'users': 'users',
              'settings': 'settings',
              'history': 'history'
            };

            const requiredPermission = sectionToPermission[activeSection];
            const hasAccess = currentUser?.role === 'admin' ||
              activeSection === 'dashboard' ||
              (requiredPermission && Array.isArray(currentUser?.permissions) && currentUser.permissions.includes(requiredPermission));

            if (!hasAccess) {
              return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white rounded-[2.5rem] shadow-sm border border-red-50 mt-10">
                  <div className="w-24 h-24 bg-red-50 text-primary-crimson rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">عذراً، ليس لديك صلاحيات!</h2>
                  <p className="text-gray-500 font-bold text-lg max-w-md mx-auto">هذا القسم مخصص للمصرح لهم فقط. يرجى مراجعة مدير الموقع للحصول على الصلاحيات المطلوبة.</p>
                </div>
              );
            }

            return (
              <>
                {activeSection === 'dashboard' && (
                  <DashboardOverview stats={stats} articles={articles} />
                )}

                {activeSection === 'news' && (
                  <ArticleManagement
                    articles={articles}
                    filteredArticles={filteredArticles}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    currentArticle={currentArticle}
                    setCurrentArticle={setCurrentArticle}
                    handleSubmit={handleSubmit}
                    handleImageUpload={handleImageUpload}
                    handleToggleArticleStatus={handleToggleArticleStatus}
                    handleArticleDelete={handleArticleDelete}
                    fetchArticles={fetchArticles}
                    fetchStats={fetchStats}
                    fetchHistory={fetchHistory}
                    showNotification={showNotification}
                    authenticatedFetch={authenticatedFetch}
                    categories={categories}
                    writers={writers}
                    setIsEditingTicker={setIsEditingTicker}
                  />
                )}

                {activeSection === 'categories' && (
                  <CategoryManagement
                    categories={categories}
                    isEditingCategory={isEditingCategory}
                    setIsEditingCategory={setIsEditingCategory}
                    currentCategory={currentCategory}
                    setCurrentCategory={setCurrentCategory}
                    handleCategorySubmit={handleCategorySubmit}
                    handleCategoryDelete={handleCategoryDelete}
                    handleImageUpload={handleImageUpload}
                  />
                )}

                {activeSection === 'comments' && (
                  <CommentManagement
                    comments={comments}
                    handleCommentDelete={handleCommentDelete}
                  />
                )}

                {activeSection === 'settings' && currentUser?.role === 'admin' && (
                  <SettingsManagement
                    settings={settings}
                    setSettings={setSettings}
                    handleSettingsSubmit={handleSettingsSubmit}
                    handleImageUpload={handleImageUpload}
                    fetchSettings={fetchSettings}
                  />
                )}

                {activeSection === 'writers' && (
                  <WriterManagement
                    writers={writers}
                    isEditingWriter={isEditingWriter}
                    setIsEditingWriter={setIsEditingWriter}
                    currentWriter={currentWriter}
                    setCurrentWriter={setCurrentWriter}
                    handleWriterSubmit={handleWriterSubmit}
                    handleWriterDelete={handleWriterDelete}
                    handleImageUpload={handleImageUpload}
                    authenticatedFetch={authenticatedFetch}
                    fetchWriters={fetchWriters}
                  />
                )}

                {activeSection === 'ads' && (
                  <AdManagement
                    ads={ads}
                    isEditingAd={isEditingAd}
                    setIsEditingAd={setIsEditingAd}
                    currentAd={currentAd}
                    setCurrentAd={setCurrentAd}
                    handleAdSubmit={handleAdSubmit}
                    handleAdDelete={handleAdDelete}
                    handleImageUpload={handleImageUpload}
                    authenticatedFetch={authenticatedFetch}
                    fetchAds={fetchAds}
                  />
                )}

                {activeSection === 'trash' && (
                  <TrashManagement
                    trashArticles={trashArticles}
                    selectedTrashIds={selectedTrashIds}
                    setSelectedTrashIds={setSelectedTrashIds}
                    handleBulkTrashAction={handleBulkTrashAction}
                    handleEmptyTrash={handleEmptyTrash}
                    handleRestoreArticle={handleRestoreArticle}
                    handlePermanentDelete={handlePermanentDelete}
                  />
                )}

                {activeSection === 'history' && currentUser?.role === 'admin' && (
                  <AuditLog
                    history={history}
                    users={users}
                    fetchHistory={fetchHistory}
                    historyFilterUser={historyFilterUser}
                    setHistoryFilterUser={setHistoryFilterUser}
                    historyStartDate={historyStartDate}
                    setHistoryStartDate={setHistoryStartDate}
                    historyEndDate={historyEndDate}
                    setHistoryEndDate={setHistoryEndDate}
                  />
                )}

                {activeSection === 'users' && currentUser?.role === 'admin' && (
                  <UserManagement
                    users={users}
                    isEditingUser={isEditingUser}
                    setIsEditingUser={setIsEditingUser}
                    currentUserData={currentUserData}
                    setCurrentUserData={setCurrentUserData}
                    handleUserSubmit={handleUserSubmit}
                    handleUserDelete={handleUserDelete}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    fetchUsers={fetchUsers}
                    fetchHistory={fetchHistory}
                    authenticatedFetch={authenticatedFetch}
                    showNotification={showNotification}
                  />
                )}


                {activeSection === 'security' && currentUser?.role === 'admin' && (
                  <IPManagement authenticatedFetch={authenticatedFetch} showNotification={showNotification} />
                )}
              </>
            );
          })()}
        </div>
      </main >
    </div >
  );
}
