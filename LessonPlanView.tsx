import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  BookOpen,
  Filter,
  FileCheck2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { LessonPlan, LessonStatus, Subject } from '../../types';
import { StorageService } from '../../services/storage';

interface LessonPlanViewProps {
  selectedClassId: string;
}

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({ selectedClassId }) => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [formData, setFormData] = useState<Partial<LessonPlan>>({
    id: '',
    subjectId: 'TOAN',
    classId: selectedClassId,
    periodNumber: 1,
    lessonTitle: '',
    plannedDate: new Date().toISOString().split('T')[0],
    actualDate: '',
    durationMinutes: 45,
    objectives: '',
    materials: '',
    status: 'Đúng tiến độ',
    notes: '',
  });

  const loadData = () => {
    const all = StorageService.getLessonPlans();
    setPlans(all.filter((p) => p.classId === selectedClassId));
    setSubjects(StorageService.getSubjects());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('edu_data_updated', handleUpdate);
    return () => window.removeEventListener('edu_data_updated', handleUpdate);
  }, [selectedClassId]);

  // Today reference date (e.g. 2026-10-04)
  const todayStr = '2026-10-04';

  // Automated detection of behind-schedule lessons:
  // If plannedDate <= today AND status !== 'Đã hoàn thành', it triggers delayed warning!
  const delayedLessons = plans.filter(
    (p) => p.status === 'Chậm tiến độ' || (p.plannedDate <= todayStr && p.status !== 'Đã hoàn thành')
  );

  const completedCount = plans.filter((p) => p.status === 'Đã hoàn thành').length;
  const totalPeriods = plans.length;
  const completionRate = totalPeriods > 0 ? Math.round((completedCount / totalPeriods) * 100) : 0;

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    const matchesSubject = filterSubject === 'ALL' || p.subjectId === filterSubject;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSubject && matchesStatus;
  });

  const handleOpenModal = (plan?: LessonPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ ...plan });
    } else {
      setEditingPlan(null);
      const nextPeriod = plans.length + 1;
      setFormData({
        id: 'LP_' + Date.now(),
        subjectId: filterSubject !== 'ALL' ? filterSubject : 'TOAN',
        classId: selectedClassId,
        periodNumber: nextPeriod,
        lessonTitle: '',
        plannedDate: todayStr,
        actualDate: '',
        durationMinutes: 45,
        objectives: 'Phát triển năng lực tư duy logic, giải quyết vấn đề toán học và phẩm chất chăm chỉ.',
        materials: 'Sách giáo khoa, Slide bài giảng điện tử, Phiếu học tập thực hành.',
        status: 'Đúng tiến độ',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lessonTitle?.trim()) {
      alert('Vui lòng nhập Tên bài học!');
      return;
    }

    const all = StorageService.getLessonPlans();
    const newPlan: LessonPlan = {
      id: formData.id || 'LP_' + Date.now(),
      subjectId: formData.subjectId || 'TOAN',
      classId: selectedClassId,
      periodNumber: Number(formData.periodNumber) || 1,
      lessonTitle: formData.lessonTitle.trim(),
      plannedDate: formData.plannedDate || todayStr,
      actualDate: formData.actualDate ? formData.actualDate : undefined,
      durationMinutes: Number(formData.durationMinutes) || 45,
      objectives: formData.objectives?.trim() || '',
      materials: formData.materials?.trim() || '',
      status: (formData.status as LessonStatus) || 'Đúng tiến độ',
      notes: formData.notes?.trim() || '',
    };

    let updated = [...all];
    if (editingPlan) {
      updated = updated.map((p) => (p.id === editingPlan.id ? newPlan : p));
    } else {
      updated.push(newPlan);
    }

    StorageService.saveLessonPlans(updated);
    setIsModalOpen(false);
  };

  const handleQuickMarkCompleted = (plan: LessonPlan) => {
    const all = StorageService.getLessonPlans();
    const updated = all.map((p) => {
      if (p.id === plan.id) {
        return {
          ...p,
          status: 'Đã hoàn thành' as LessonStatus,
          actualDate: todayStr,
        };
      }
      return p;
    });
    StorageService.saveLessonPlans(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                Phân hệ 4
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Kế Hoạch Giảng Dạy &amp; Theo Dõi Tiến Độ (Lesson Planning &amp; Curriculum)
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Phân phối chương trình, đối sánh Kế hoạch (Planned) vs Thực tế (Actual), mục tiêu cần đạt, học liệu và tự động cảnh báo chậm tiến độ.
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bài Học Mới</span>
          </button>
        </div>
      </div>

      {/* AUTOMATED BEHIND-SCHEDULE ALERT BANNER */}
      {delayedLessons.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-xl p-4 shadow-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900">
              Cảnh Báo Chậm Tiến Độ: Phát hiện {delayedLessons.length} bài học chưa hoàn thành theo khung thời gian!
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Hệ thống tự động so khớp ngày dự kiến với thời gian biểu thực tế. Vui lòng sắp xếp lịch dạy bù hoặc cập nhật ngày thực tế.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {delayedLessons.map((l) => (
                <div
                  key={l.id}
                  className="bg-white px-2.5 py-1 rounded-md border border-rose-200 text-xs text-rose-800 flex items-center space-x-2 font-medium"
                >
                  <span>
                    Tiết {l.periodNumber}: {l.lessonTitle} (Dự kiến: {l.plannedDate})
                  </span>
                  <button
                    onClick={() => handleQuickMarkCompleted(l)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline text-[11px] cursor-pointer"
                  >
                    Xác nhận đã dạy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tiến Độ Phân Phối Chương Trình</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{completionRate}%</span>
            <span className="text-xs text-slate-500">
              ({completedCount} / {totalPeriods} tiết)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Bài Giảng Đã Hoàn Thành</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono">{completedCount}</span>
            <span className="text-xs text-slate-500">tiết đã lên lớp</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Đầy đủ hồ sơ giáo án &amp; học liệu</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Trạng Thái Kế Hoạch Tuần Này</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-blue-700 font-mono">
              {plans.filter((p) => p.status === 'Đúng tiến độ').length}
            </span>
            <span className="text-xs text-slate-500">tiết sắp tới đúng hạn</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Bám sát kế hoạch năm học</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Môn:</span>
            <select
              aria-label="Lọc theo môn học"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm"
            >
              <option value="ALL">Tất cả các môn</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">Trạng thái:</span>
            <select
              aria-label="Lọc theo trạng thái"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đã hoàn thành">Đã hoàn thành</option>
              <option value="Đúng tiến độ">Đúng tiến độ</option>
              <option value="Chậm tiến độ">Chậm tiến độ</option>
              <option value="Dạy bù">Dạy bù</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị <b>{filteredPlans.length}</b> bài giảng trong chương trình
        </div>
      </div>

      {/* Detailed Lesson Plans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-3 text-center w-16">Tiết PPCT</th>
                <th className="py-3 px-4 min-w-[220px]">Tên Bài Giảng / Chuyên Đề</th>
                <th className="py-3 px-3">Môn</th>
                <th className="py-3 px-3 text-center">Thời Lượng</th>
                <th className="py-3 px-4">Kế Hoạch vs Thực Tế</th>
                <th className="py-3 px-4 min-w-[240px]">Mục Tiêu &amp; Học Liệu</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Không tìm thấy bài giảng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const sub = subjects.find((s) => s.id === plan.subjectId);
                  const isDelayed = plan.status === 'Chậm tiến độ';
                  const isCompleted = plan.status === 'Đã hoàn thành';

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {plan.periodNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{plan.lessonTitle}</p>
                        {plan.notes && (
                          <p className="text-xs text-amber-700 italic mt-0.5">Lưu ý: {plan.notes}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                          {sub ? sub.name : plan.subjectId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs font-mono text-slate-600">
                        {plan.durationMinutes}p
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <span className="text-slate-400">KH:</span>
                          <b>{plan.plannedDate}</b>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-slate-400">TT:</span>
                          <span className={plan.actualDate ? 'text-emerald-700 font-bold' : 'text-slate-400 italic'}>
                            {plan.actualDate || 'Chưa dạy'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <p className="text-slate-800 line-clamp-2" title={plan.objectives}>
                          <b>Mục tiêu:</b> {plan.objectives}
                        </p>
                        <p className="text-slate-500 mt-1 line-clamp-1" title={plan.materials}>
                          <b>Học liệu:</b> {plan.materials}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center space-x-1 border ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isDelayed
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <span>{plan.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isCompleted && (
                            <button
                              onClick={() => handleQuickMarkCompleted(plan)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Đánh dấu đã dạy hôm nay"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(plan)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Sửa kế hoạch"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: THÊM / SỬA KẾ HOẠCH BÀI GIẢNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPlan ? 'Chỉnh Sửa Bài Giảng PPCT' : 'Thêm Bài Giảng Vào Kế Hoạch Giảng Dạy'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn Học</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiết Theo PPCT <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.periodNumber}
                    onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Bài Giảng / Chuyên Đề <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lessonTitle}
                  onChange={(e) => setFormData({ ...formData, lessonTitle: e.target.value })}
                  placeholder="VD: Định lý Cosin và ứng dụng giải tam giác"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày Dự Kiến (KH) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.plannedDate}
                    onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Thực Tế (TT)</label>
                  <input
                    type="date"
                    value={formData.actualDate || ''}
                    onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục Tiêu Cần Đạt (Kiến thức, Năng lực, Phẩm chất theo CV 5512)
                </label>
                <textarea
                  rows={2}
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  placeholder="VD: Nắm được công thức định lý Cosin, giải thành thạo bài toán tam giác thực tế..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tài Liệu &amp; Học Liệu Hỗ Trợ
                </label>
                <input
                  type="text"
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                  placeholder="VD: SGK Toán 10, Video thực tế, Máy tính bỏ túi, Phiếu học tập"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Tiến Độ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LessonStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Đúng tiến độ">Đúng tiến độ</option>
                    <option value="Chậm tiến độ">Chậm tiến độ</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Dạy bù">Dạy bù</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Tiến Độ</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="VD: Lùi lịch do hoạt động Đoàn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Lưu Kế Hoạch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
