import React from 'react';
import { FileText, Eye, MessageCircle } from 'lucide-react';

interface DashboardOverviewProps {
    stats: any;
    articles: any[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, articles }) => {
    if (!stats) return null;

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-black text-gray-900">نظرة عامة</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <FileText className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">إجمالي الأخبار</p>
                        <p className="text-2xl font-black">{stats.totalArticles}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                        <Eye className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">إجمالي المشاهدات</p>
                        <p className="text-2xl font-black">{stats.totalViews}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                        <MessageCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">التعليقات</p>
                        <p className="text-2xl font-black">{stats.totalComments}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-50 text-primary-crimson rounded-2xl flex items-center justify-center">
                        <FileText className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">أخبار عاجلة</p>
                        <p className="text-2xl font-black">{stats.urgentNews}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black mb-6">توزيع الأخبار حسب التصنيف</h3>
                    <div className="space-y-4">
                        {stats.categoryStats.map((cat: any) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span>{cat.name}</span>
                                    <span>{cat.count} خبر</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-600 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${stats.totalArticles > 0 ? (cat.count / stats.totalArticles) * 100 : 0}%` }}
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
    );
};

export default DashboardOverview;
