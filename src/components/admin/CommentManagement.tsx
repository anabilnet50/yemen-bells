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
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-center border-collapse min-w-[800px]">
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
        </div>
    );
};

export default CommentManagement;
