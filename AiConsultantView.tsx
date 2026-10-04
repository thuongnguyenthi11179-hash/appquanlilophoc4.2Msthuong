import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Check,
  Copy,
  BookOpen,
  FileCode,
  Layers,
  HelpCircle,
  Lightbulb,
  Database,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { StorageService } from '../../services/storage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiConsultantViewProps {
  selectedClassId: string;
  selectedSemester: 1 | 2;
}

export const AiConsultantView: React.FC<AiConsultantViewProps> = ({
  selectedClassId,
  selectedSemester,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: `Xin chào Quý Thầy/Cô và Nhà Quản trị! Tôi là **Chuyên gia Tư vấn và Thiết kế Hệ thống Công nghệ Giáo dục (EdTech System Architect)**.

Tôi sẵn sàng hỗ trợ Quý vị giải quyết các bài toán nghiệp vụ sư phạm và kỹ thuật phần mềm trường học trên 4 phân hệ cốt lõi:
1. **Module 1 (Nhập liệu):** Chuẩn hóa cấu trúc hồ sơ học sinh, lớp học, môn học & tính toàn vẹn dữ liệu.
2. **Module 2 (Quản lý Điểm):** Ma trận điểm có trọng số (TX, ĐK, HK), công thức TBM và kiểm toán minh bạch (Audit Trail).
3. **Module 3 (Phân tích & Xếp hạng):** Thuật toán phân loại học lực đa chiều (Thông tư 22/58), hệ thống cảnh báo sớm và học bạ điện tử.
4. **Module 4 (Kế hoạch Giảng dạy):** Phân phối chương trình, đối sánh Kế hoạch vs Thực tế & cảnh báo chậm tiến độ.

Mọi phản hồi của tôi luôn được trình bày theo cấu trúc chuẩn 5 phần: **Tổng quan giải pháp &rarr; Chi tiết phân hệ &rarr; Đánh giá ưu điểm &amp; Rủi ro &rarr; Đề xuất hành động &rarr; Mã giả / Sơ đồ**.

Quý Thầy/Cô có thể chọn gợi ý bên dưới hoặc nhập câu hỏi trực tiếp!`,
      timestamp: '08:00',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeClassContext, setIncludeClassContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    {
      label: 'Quy chế điểm Thông tư 22',
      prompt:
        'Hãy tư vấn công thức tính điểm trung bình môn, điểm trung bình chung GPA và tiêu chí xếp loại học lực theo quy chuẩn Thông tư 22/2021/TT-BGDĐT.',
      icon: Calculator,
    },
    {
      label: 'Cảnh báo sớm học sinh sa sút',
      prompt:
        'Thiết lập thuật toán và bộ chỉ số KPI để tự động phát hiện học sinh có nguy cơ sa sút học lực hoặc trượt tốt nghiệp, kèm quy trình can thiệp sư phạm.',
      icon: Lightbulb,
    },
    {
      label: 'Kế hoạch bài dạy CV 5512',
      prompt:
        'Thiết kế khung kế hoạch bài dạy (giáo án) 5 bước chuẩn Công văn 5512/BGDĐT-GDTrH kết hợp phương pháp theo dõi tiến độ Kế hoạch vs Thực tế.',
      icon: BookOpen,
    },
    {
      label: 'Kiến trúc CSDL Scalability',
      prompt:
        'Đề xuất mô hình cơ sở dữ liệu quan hệ (ERD Schema) chuẩn hóa bậc 3 (3NF) cho hệ thống quản lý học bạ điện tử có khả năng mở rộng hàng vạn học sinh.',
      icon: Database,
    },
  ];

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputPrompt('');
    setIsLoading(true);

    try {
      let contextPayload = null;
      if (includeClassContext) {
        const students = StorageService.getStudents().filter((s) => s.classId === selectedClassId);
        const summaries = StorageService.getAcademicSummaries(selectedClassId, selectedSemester);
        const plans = StorageService.getLessonPlans().filter((p) => p.classId === selectedClassId);
        contextPayload = {
          currentClass: selectedClassId,
          semester: selectedSemester,
          totalStudents: students.length,
          delayedLessonsCount: plans.filter((p) => p.status === 'Chậm tiến độ').length,
          topStudents: summaries.slice(0, 3).map((s) => ({ name: s.student.fullName, gpa: s.gpa })),
          atRiskStudents: summaries.filter((s) => s.isAtRisk).map((s) => ({ name: s.student.fullName, gpa: s.gpa })),
        };
      }

      const res = await fetch('/api/gemini/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          context: contextPayload,
        }),
      });

      const data = await res.json();
      const aiReply = data.reply || data.error || 'Không nhận được phản hồi từ hệ thống.';

      const assistantMsg: Message = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `Đã xảy ra lỗi khi kết nối tới Chuyên gia EdTech: ${err.message}. Vui lòng thử lại sau.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm sm:text-base tracking-tight">
                Chuyên Gia Tư Vấn &amp; Thiết Kế EdTech (AI System Architect)
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Chuẩn hóa 4 phân hệ: Nhập liệu, Quản lý điểm, Phân tích xếp hạng &amp; Kế hoạch giảng dạy
            </p>
          </div>
        </div>

        {/* Toggle include context */}
        <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <input
            type="checkbox"
            checked={includeClassContext}
            onChange={(e) => setIncludeClassContext(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-0"
          />
          <span className="hidden sm:inline">Kèm dữ liệu Lớp {selectedClassId}</span>
          <span className="sm:hidden">Dữ liệu lớp</span>
        </label>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-tr from-indigo-700 to-purple-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="max-w-[85%] sm:max-w-[80%] group relative">
                <div
                  className={`p-4 rounded-2xl shadow-xs text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-sm max-w-none">
                    {m.content}
                  </div>
                </div>

                {/* Footer time & copy button */}
                <div
                  className={`flex items-center space-x-2 mt-1 text-[11px] text-slate-400 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600"
                      title="Sao chép nội dung"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-xs border border-slate-200 shadow-xs flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></div>
              <div
                className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></div>
              <span className="text-xs text-slate-500 font-medium pl-2">
                Chuyên gia EdTech đang xây dựng giải pháp theo chuẩn 5 phần...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Kịch bản tư vấn:</span>
        {quickPrompts.map((qp, i) => {
          const Icon = qp.icon;
          return (
            <button
              key={i}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Hỏi chuyên gia EdTech (VD: Thiết kế công thức tính điểm, chuẩn hóa CSDL, kế hoạch bài dạy...)"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all shrink-0 text-xs sm:text-sm"
          >
            <span>Gửi</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
