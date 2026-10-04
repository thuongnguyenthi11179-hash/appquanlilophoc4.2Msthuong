import React, { useRef } from 'react';
import {
  GraduationCap,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Users,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface HeaderProps {
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  selectedSemester: 1 | 2;
  onSelectSemester: (semester: 1 | 2) => void;
  onOpenAi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedClassId,
  onSelectClass,
  selectedSemester,
  onSelectSemester,
  onOpenAi,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classes = StorageService.getClasses();
  const students = StorageService.getStudents();
  const lessonPlans = StorageService.getLessonPlans();

  const delayedLessons = lessonPlans.filter((l) => l.status === 'Chậm tiến độ').length;
  const currentClassStudents = students.filter(
    (s) => s.classId === selectedClassId && s.status === 'Đang học'
  ).length;

  const handleResetDemo = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục dữ liệu mẫu chuẩn của hệ thống không?')) {
      StorageService.resetToInitialDemo();
      alert('Đã khôi phục dữ liệu ban đầu thành công!');
    }
  };

  const handleExport = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduArchitect_Data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (StorageService.importAllData(content)) {
        alert('Nhập dữ liệu thành công!');
      } else {
        alert('File không hợp lệ hoặc sai định dạng!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">EduArchitect</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                  EdTech 4.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hệ Thống Quản Trị Lớp Học &amp; Giáo Dục Toàn Diện
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-slate-600">Sĩ số lớp:</span>
              <span className="font-semibold text-slate-900">{currentClassStudents} HS</span>
            </div>

            {delayedLessons > 0 ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-medium">Chậm tiến độ:</span>
                <span className="font-bold text-amber-900">{delayedLessons} bài</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Tiến độ giảng dạy: 100%</span>
              </div>
            )}
          </div>

          {/* Context Selector & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Class Selector */}
            <div className="flex items-center">
              <select
                aria-label="Chọn lớp học"
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => onSelectSemester(1)}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  selectedSemester === 1
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HK I
              </button>
              <button
                onClick={() => onSelectSemester(2)}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  selectedSemester === 2
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HK II
              </button>
            </div>

            {/* AI EdTech Consultant Launch Button */}
            <button
              onClick={onOpenAi}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-xs shadow-indigo-500/20 transition-all cursor-pointer"
              title="Mở Trợ Lý Chuyên Gia EdTech"
            >
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" style={{ animationDuration: '4s' }} />
              <span className="hidden sm:inline">Chuyên Gia EdTech AI</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Data Tools Dropdown / Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleExport}
                title="Xuất dữ liệu dự phòng (JSON)"
                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Nhập dữ liệu sao lưu (JSON)"
                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetDemo}
                title="Khôi phục dữ liệu mẫu ban đầu"
                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
