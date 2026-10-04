import React from 'react';
import {
  Users,
  FileSpreadsheet,
  TrendingUp,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export type TabType = 'data-input' | 'grading' | 'analytics' | 'curriculum' | 'ai-consultant';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  delayedCount: number;
  atRiskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  delayedCount,
  atRiskCount,
}) => {
  const menuItems = [
    {
      id: 'data-input' as TabType,
      title: 'Phân hệ 1: Nhập Liệu & Danh Mục',
      subtitle: 'Hồ sơ học sinh, lớp học, môn học',
      icon: Users,
      badge: null,
      color: 'text-blue-600',
      activeBg: 'bg-blue-50 text-blue-800 border-blue-600',
    },
    {
      id: 'grading' as TabType,
      title: 'Phân hệ 2: Quản Lý Điểm Số',
      subtitle: 'Điểm TX, ĐK, HK, Audit Log & TBM',
      icon: FileSpreadsheet,
      badge: null,
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-50 text-indigo-800 border-indigo-600',
    },
    {
      id: 'analytics' as TabType,
      title: 'Phân hệ 3: Phân Tích & Xếp Hạng',
      subtitle: 'Học lực, Hạnh kiểm, Cảnh báo & Học bạ',
      icon: TrendingUp,
      badge: atRiskCount > 0 ? `${atRiskCount} cần hỗ trợ` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      color: 'text-emerald-600',
      activeBg: 'bg-emerald-50 text-emerald-800 border-emerald-600',
    },
    {
      id: 'curriculum' as TabType,
      title: 'Phân hệ 4: Kế Hoạch Giảng Dạy',
      subtitle: 'Tiến độ PPCT, Kế hoạch vs Thực tế',
      icon: CalendarDays,
      badge: delayedCount > 0 ? `${delayedCount} bài trễ` : null,
      badgeColor: 'bg-rose-100 text-rose-800 font-semibold',
      color: 'text-amber-600',
      activeBg: 'bg-amber-50 text-amber-800 border-amber-600',
    },
    {
      id: 'ai-consultant' as TabType,
      title: 'Chuyên Gia EdTech AI',
      subtitle: 'Tư vấn kiến trúc hệ thống & sư phạm',
      icon: Sparkles,
      badge: 'Thông tư 22/5512',
      badgeColor: 'bg-purple-100 text-purple-800 font-medium',
      color: 'text-purple-600',
      activeBg: 'bg-purple-50 text-purple-800 border-purple-600',
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Navigation Title */}
      <div className="p-4 border-b border-slate-100 hidden md:block">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Cấu trúc 4 Phân hệ Cốt lõi
        </h2>
      </div>

      {/* Nav List */}
      <nav className="p-2 sm:p-3 space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between cursor-pointer border ${
                isActive
                  ? `${item.activeBg} font-semibold shadow-xs`
                  : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-lg ${
                    isActive ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-600'}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm leading-tight">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.subtitle}</p>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
                    item.badgeColor || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Compliance Note */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Quy Chuẩn Giáo Dục</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Tuân thủ quy chuẩn Thông tư 22/2021/TT-BGDĐT &amp; Thông tư 58 về đánh giá học sinh; Công văn 5512/BGDĐT-GDTrH về kế hoạch bài dạy.
        </p>
      </div>
    </aside>
  );
};
