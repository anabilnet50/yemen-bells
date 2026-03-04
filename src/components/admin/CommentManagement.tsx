import React from 'react';
import { Trash2 } from 'lucide-react';

interface CommentManagementProps {
    comments: any[];
    handleCommentDelete: (id: number) => void;
}

const CommentManagement: React.FC<CommentManagementProps> = ({ comments, handleCommentDelete }) => {
    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-black text-gray-900">إدارة التعليقات</h1>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full overflow-hidden">
                <div className="overflow-x-auto w-full print:overflow-visible">
                    <table className="w-full text-center border-collapse table-auto">
                        <thead className="bg-[#5b9bd5] text-white">
                            <tr>
                                <th className="p-3 sm:p-6 font-black border-l border-white last:border-l-0 text-center text-xs sm:text-base">المعلق</th>
                                <th className="p-3 sm:p-6 font-black border-l border-white last:border-l-0 text-center text-xs sm:text-base">التعليق</th>
                                <th className="p-3 sm:p-6 font-black border-l border-white last:border-l-0 text-center text-xs sm:text-base hidden sm:table-cell">الخبر</th>
                                <th className="p-3 sm:p-6 font-black border-l border-white last:border-l-0 text-center text-xs sm:text-base">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cfdce9] border-b border-x border-[#cfdce9]">
                            {comments.map(comment => (
                                <tr key={comment.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors text-center border-b border-[#cfdce9]">
                                    <td className="p-3 sm:p-6 font-bold border-l border-[#cfdce9] last:border-l-0 text-xs sm:text-sm">{comment.name}</td>
                                    <td className="p-3 sm:p-6 text-xs sm:text-sm text-gray-700 leading-relaxed border-l border-[#cfdce9] last:border-l-0 text-right">
                                        <div className="line-clamp-2">{comment.content}</div>
                                        <div className="sm:hidden text-[9px] text-blue-700 mt-1 font-bold truncate max-w-[150px]">{comment.article_title}</div>
                                    </td>
                                    <td className="p-3 sm:p-6 font-bold text-blue-700 border-l border-[#cfdce9] last:border-l-0 text-xs sm:text-sm hidden sm:table-cell">{comment.article_title}</td>
                                    <td className="p-3 sm:p-6 border-l border-[#cfdce9] last:border-l-0">
                                        <div className="flex justify-center">
                                            <button onClick={() => handleCommentDelete(comment.id)} className="p-2 sm:p-3 text-primary-crimson hover:bg-red-50 rounded-lg sm:rounded-xl transition-all"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommentManagement;
