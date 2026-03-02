import React from 'react';
import { Play } from 'lucide-react';

interface SettingsManagementProps {
    settings: any;
    setSettings: (settings: any) => void;
    handleSettingsSubmit: (e: React.FormEvent) => void;
    handleImageUpload: (file: File, target: string) => void;
    fetchSettings: () => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({
    settings,
    setSettings,
    handleSettingsSubmit,
    handleImageUpload,
    fetchSettings
}) => {
    return (
        <div className="space-y-10 max-w-4xl">
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-3xl font-black text-gray-900">إعدادات الموقع</h1>
                <p className="text-gray-500 font-bold mt-2">تخصيص المعلومات الأساسية وتجربة المستخدم العامة</p>
            </div>

            <form onSubmit={handleSettingsSubmit} className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-premium border border-gray-100 space-y-12 animate-in fade-in zoom-in duration-700">
                <div className="space-y-8">
                    <h3 className="text-xl font-black text-primary-navy flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-crimson rounded-full"></div>
                        المعلومات الأساسية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">اسم الموقع</label>
                            <input
                                type="text"
                                value={settings.site_name}
                                onChange={e => setSettings((prev: any) => ({ ...prev, site_name: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black"
                                placeholder="هـدس"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">وصف الموقع (Tagline)</label>
                            <input
                                type="text"
                                value={settings.site_tagline}
                                onChange={e => setSettings((prev: any) => ({ ...prev, site_tagline: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black"
                                placeholder="الأقرب للأحدث - موقع إخباري متكامل"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">رئيس التحرير</label>
                            <input
                                type="text"
                                value={settings.chief_editor}
                                onChange={e => setSettings((prev: any) => ({ ...prev, chief_editor: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">عنوان قسم اليوتيوب</label>
                            <input
                                type="text"
                                value={settings.youtube_section_title}
                                onChange={e => setSettings((prev: any) => ({ ...prev, youtube_section_title: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">بريد التواصل</label>
                            <input
                                type="email"
                                value={settings.contact_email}
                                onChange={e => setSettings((prev: any) => ({ ...prev, contact_email: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-gray-100">
                    <h3 className="text-xl font-black text-primary-navy flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        الهوية البصرية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">صورة الكرة الإخبارية المائية</label>
                            <div className="flex gap-4 items-center">
                                {settings.news_ball_image && (
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-white">
                                        <img src={settings.news_ball_image} alt="Ticker Icon" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                                <input
                                    type="text"
                                    value={settings.news_ball_image || ''}
                                    onChange={e => setSettings((prev: any) => ({ ...prev, news_ball_image: e.target.value }))}
                                    className="flex-1 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-xs"
                                    placeholder="رابط الأيقونة..."
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'news_ball_image')}
                                    className="hidden"
                                    id="ball-upload"
                                />
                                <label htmlFor="ball-upload" className="bg-gray-100 p-4 rounded-2xl cursor-pointer hover:bg-gray-200 transition-all flex items-center justify-center border-2 border-transparent w-14 h-14 shrink-0">
                                    <Play className="w-5 h-5 text-gray-500" />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">خلفية الهيدر (Header Background)</label>
                            <div className="flex gap-4 items-center">
                                {settings.header_background_url && (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-white">
                                        <img src={settings.header_background_url} alt="Header BG" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                                <input
                                    type="text"
                                    value={settings.header_background_url || ''}
                                    onChange={e => setSettings((prev: any) => ({ ...prev, header_background_url: e.target.value }))}
                                    className="flex-1 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-xs"
                                    placeholder="رابط خلفية الهيدر..."
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'header_background_url')}
                                    className="hidden"
                                    id="header-bg-upload"
                                />
                                <label htmlFor="header-bg-upload" className="bg-gray-100 p-4 rounded-2xl cursor-pointer hover:bg-gray-200 transition-all flex items-center justify-center border-2 border-transparent w-14 h-14 shrink-0">
                                    <Play className="w-5 h-5 text-gray-500" />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700 mr-1">نص حقوق الطبع</label>
                            <input
                                type="text"
                                value={settings.copyright_text}
                                onChange={e => setSettings((prev: any) => ({ ...prev, copyright_text: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-gray-100">
                    <h3 className="text-xl font-black text-primary-navy flex items-center gap-3">
                        <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                        روابط التواصل الاجتماعي
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-tighter mr-1">فيسبوك</label>
                            <input
                                type="text"
                                value={settings.facebook_url}
                                onChange={e => setSettings((prev: any) => ({ ...prev, facebook_url: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-tighter mr-1">تويتر (X)</label>
                            <input
                                type="text"
                                value={settings.twitter_url}
                                onChange={e => setSettings((prev: any) => ({ ...prev, twitter_url: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-tighter mr-1">تليجرام</label>
                            <input
                                type="text"
                                value={settings.telegram_url}
                                onChange={e => setSettings((prev: any) => ({ ...prev, telegram_url: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-tighter mr-1">واتساب</label>
                            <input
                                type="text"
                                value={settings.whatsapp_url}
                                onChange={e => setSettings((prev: any) => ({ ...prev, whatsapp_url: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-green-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-tighter mr-1">يوتيوب</label>
                            <input
                                type="text"
                                value={settings.youtube_url}
                                onChange={e => setSettings((prev: any) => ({ ...prev, youtube_url: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-red-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-tighter mr-1">LinkedIn</label>
                            <input
                                type="text"
                                value={settings.linkedin_url}
                                onChange={e => setSettings((prev: any) => ({ ...prev, linkedin_url: e.target.value }))}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-gray-100">
                    <h3 className="text-xl font-black text-primary-navy flex items-center gap-3">
                        <div className="w-2 h-8 bg-red-600 rounded-full"></div>
                        إعدادات أقسام الصفحة الرئيسية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                        {/* Rights Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم الحقوق والحريات</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.rights_title} onChange={e => setSettings((prev: any) => ({ ...prev, rights_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.rights_bg} onChange={e => setSettings((prev: any) => ({ ...prev, rights_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'rights_bg')} className="hidden" id="rights-bg-upload" />
                                    <label htmlFor="rights-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>

                        {/* Tech Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم التكنولوجيا</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.tech_title} onChange={e => setSettings((prev: any) => ({ ...prev, tech_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.tech_bg} onChange={e => setSettings((prev: any) => ({ ...prev, tech_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'tech_bg')} className="hidden" id="tech-bg-upload" />
                                    <label htmlFor="tech-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>

                        {/* Economy Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم الاقتصاد</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.economy_title} onChange={e => setSettings((prev: any) => ({ ...prev, economy_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.economy_bg} onChange={e => setSettings((prev: any) => ({ ...prev, economy_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'economy_bg')} className="hidden" id="economy-bg-upload" />
                                    <label htmlFor="economy-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>

                        {/* Society Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم المجتمع</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.society_title} onChange={e => setSettings((prev: any) => ({ ...prev, society_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.society_bg} onChange={e => setSettings((prev: any) => ({ ...prev, society_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'society_bg')} className="hidden" id="society-bg-upload" />
                                    <label htmlFor="society-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>

                        {/* Sports Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم الرياضة</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.sports_title} onChange={e => setSettings((prev: any) => ({ ...prev, sports_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.sports_bg} onChange={e => setSettings((prev: any) => ({ ...prev, sports_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'sports_bg')} className="hidden" id="sports-bg-upload" />
                                    <label htmlFor="sports-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>

                        {/* Research Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم الأبحاث والدراسات</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.research_title} onChange={e => setSettings((prev: any) => ({ ...prev, research_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.research_bg} onChange={e => setSettings((prev: any) => ({ ...prev, research_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'research_bg')} className="hidden" id="research-bg-upload" />
                                    <label htmlFor="research-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>

                        {/* Opinion Section */}
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <h4 className="font-black text-sm text-gray-400 uppercase">قسم المقالات</h4>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">عنوان القسم</label>
                                <input type="text" value={settings.opinion_title} onChange={e => setSettings((prev: any) => ({ ...prev, opinion_title: e.target.value }))} className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-700">رابط الخلفية</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings.opinion_bg} onChange={e => setSettings((prev: any) => ({ ...prev, opinion_bg: e.target.value }))} className="flex-1 p-3 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-bold text-xs" />
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'opinion_bg')} className="hidden" id="opinion-bg-upload" />
                                    <label htmlFor="opinion-bg-upload" className="bg-white p-3 rounded-xl cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><Play className="w-4 h-4 text-gray-400 rotate-90" /></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-10 border-t border-gray-100">
                    <button type="button" onClick={fetchSettings} className="bg-gray-100 text-gray-600 px-6 py-3 md:px-12 md:py-5 rounded-xl md:rounded-[2rem] font-black text-sm md:text-lg hover:bg-gray-200 transition-all">
                        إلغاء
                    </button>
                    <button type="submit" className="bg-primary-navy text-white px-6 py-3 md:px-16 md:py-5 rounded-xl md:rounded-[2rem] font-black text-sm md:text-xl shadow-2xl shadow-primary-navy/20 hover:scale-105 active:scale-95 transition-all">
                        حفظ الإعدادات بالكامل
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsManagement;
