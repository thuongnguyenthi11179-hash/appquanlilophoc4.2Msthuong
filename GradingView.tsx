import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  History,
  Calculator,
  Save,
  Info,
  Check,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Search,
  Filter,
} from 'lucide-react';
import { Student, Subject, GradeEntry, GradeAuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import { calculateSubjectAverage } from '../../data/initialData';

interface GradingViewProps {
  selectedClassId: string;
  selectedSemester: 1 | 2;
}

export const GradingView: React.FC<GradingViewProps> = ({
  selectedClassId,
  selectedSemester,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'audit' | 'rules'>('matrix');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('TOAN');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<GradeAuditLog[]>([]);

  // Editing state for Audit modal
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [targetGradeType, setTargetGradeType] = useState<
    'tx1' | 'tx2' | 'tx3' | 'tx4' | 'midTerm' | 'finalExam'
  >('tx1');
  const [targetOldValue, setTargetOldValue] = useState<number | undefined>(undefined);
  const [targetNewValue, setTargetNewValue] = useState<number | ''>('');
  const [editReason, setEditReason] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('ThS. Nguyễn Văn Minh');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = () => {
    setStudents(StorageService.getStudents().filter((s) => s.classId === selectedClassId && s.status === 'Đang học'));
    setSubjects(StorageService.getSubjects());
    setGrades(StorageService.getGrades());
    setAuditLogs(StorageService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('edu_data_updated', handleUpdate);
    return () => window.removeEventListener('edu_data_updated', handleUpdate);
  }, [selectedClassId, selectedSemester]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Helper to get grade entry for a student in this subject & semester
  const getGradeForStudent = (studentId: string): GradeEntry => {
    const found = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.subjectId === selectedSubjectId &&
        g.semester === selectedSemester
    );
    if (found) return found;
    return {
      id: `G_${studentId}_${selectedSubjectId}`,
      studentId,
      subjectId: selectedSubjectId,
      classId: selectedClassId,
      semester: selectedSemester,
      academicYear: '2026-2027',
      updatedAt: new Date().toISOString(),
    };
  };

  // Open audit edit modal
  const openAuditEdit = (
    student: Student,
    gradeType: 'tx1' | 'tx2' | 'tx3' | 'tx4' | 'midTerm' | 'finalExam',
    currentVal?: number
  ) => {
    setTargetStudent(student);
    setTargetGradeType(gradeType);
    setTargetOldValue(currentVal);
    setTargetNewValue(currentVal !== undefined ? currentVal : '');
    setEditReason('');
    setAuditModalOpen(true);
  };

  const handleSaveAuditScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    const numVal = targetNewValue === '' ? undefined : Number(targetNewValue);
    if (numVal !== undefined && (numVal < 0 || numVal > 10 || isNaN(numVal))) {
      alert('Điểm số phải nằm trong khoảng từ 0.0 đến 10.0!');
      return;
    }

    if (!editReason.trim()) {
      alert('Vui lòng nhập lý do chỉnh sửa điểm để đảm bảo tính minh bạch kiểm toán!');
      return;
    }

    const currentEntry = { ...getGradeForStudent(targetStudent.id) };
    currentEntry[targetGradeType] = numVal;

    StorageService.updateGradeWithAudit(currentEntry, {
      gradeType: targetGradeType,
      oldValue: targetOldValue,
      newValue: numVal,
      reason: editReason.trim(),
      teacherName: teacherName.trim(),
    });

    setAuditModalOpen(false);
    setFeedbackMsg(`Đã cập nhật điểm cho ${targetStudent.fullName} và lưu nhật ký thành công!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Quick inline update without modal (will still record audit)
  const handleQuickInlineChange = (
    student: Student,
    gradeType: 'tx1' | 'tx2' | 'tx3' | 'tx4' | 'midTerm' | 'finalExam',
    rawVal: string
  ) => {
    const oldEntry = getGradeForStudent(student.id);
    const oldVal = oldEntry[gradeType];
    const numVal = rawVal === '' ? undefined : parseFloat(rawVal);

    if (numVal !== undefined && (numVal < 0 || numVal > 10 || isNaN(numVal))) {
      return;
    }

    const newEntry = { ...oldEntry };
    newEntry[gradeType] = numVal;

    StorageService.updateGradeWithAudit(newEntry, {
      gradeType,
      oldValue: oldVal,
      newValue: numVal,
      reason: 'Nhập điểm trực tiếp trên bảng ma trận điểm',
      teacherName: 'Giáo viên phụ trách',
    });
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
                Phân hệ 2
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Quản Lý Điểm Số &amp; Ma Trận Đánh Giá (Grading Management)
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Phân tách rõ ĐĐG Thường xuyên (HS1), Định kỳ (HS2), Học kỳ (HS3). Tự động tính Điểm trung bình môn (TBM) và lưu vết lịch sử chỉnh sửa (Audit Trail).
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs sm:text-sm font-medium self-start md:self-center">
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sổ Điểm Điện Tử</span>
            </button>
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'audit'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Nhật Ký Chỉnh Sửa ({auditLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('rules')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'rules'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Công Thức &amp; Quy Chế</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* --- TAB 1: SỔ ĐIỂM MA TRẬN --- */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Bar: Subject Select */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">Môn Học:</span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubjectId(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer border ${
                      selectedSubjectId === s.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Công thức: <span className="font-mono font-semibold text-indigo-700">TBM = (TX + GK×2 + CK×3) ÷ Tổng Trọng Số</span>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs">
                    <th rowSpan={2} className="py-3 px-3 border-r border-slate-200 text-center w-12">STT</th>
                    <th rowSpan={2} className="py-3 px-4 border-r border-slate-200 w-28">Mã HS</th>
                    <th rowSpan={2} className="py-3 px-4 border-r border-slate-200 min-w-[180px]">Họ và Tên</th>
                    <th colSpan={4} className="py-2 px-3 border-r border-slate-200 text-center bg-blue-50/60 text-blue-900 font-semibold">
                      Đánh Giá Thường Xuyên (Hệ số 1)
                    </th>
                    <th rowSpan={2} className="py-3 px-3 border-r border-slate-200 text-center bg-amber-50/60 text-amber-900 font-semibold w-24">
                      Giữa Kỳ<br />(Hệ số 2)
                    </th>
                    <th rowSpan={2} className="py-3 px-3 border-r border-slate-200 text-center bg-rose-50/60 text-rose-900 font-semibold w-24">
                      Cuối Kỳ<br />(Hệ số 3)
                    </th>
                    <th rowSpan={2} className="py-3 px-4 border-r border-slate-200 text-center bg-indigo-50/70 text-indigo-900 font-bold w-24">
                      ĐTB Môn<br />(TBM)
                    </th>
                    <th rowSpan={2} className="py-3 px-4 text-center w-28">Xếp Loại</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] text-center">
                    <th className="py-1 px-2 border-r border-slate-200 w-16">TX 1</th>
                    <th className="py-1 px-2 border-r border-slate-200 w-16">TX 2</th>
                    <th className="py-1 px-2 border-r border-slate-200 w-16">TX 3</th>
                    <th className="py-1 px-2 border-r border-slate-200 w-16">TX 4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, idx) => {
                    const grade = getGradeForStudent(student.id);
                    const avg = calculateSubjectAverage(grade);

                    let rankBadge = { text: 'Chưa đủ', cls: 'bg-slate-100 text-slate-600' };
                    if (avg !== undefined) {
                      if (avg >= 8.0) rankBadge = { text: 'Giỏi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                      else if (avg >= 6.5) rankBadge = { text: 'Khá', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
                      else if (avg >= 5.0) rankBadge = { text: 'Đạt', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
                      else rankBadge = { text: 'Chưa đạt', cls: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 text-xs text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-blue-700 border-r border-slate-200 text-xs">
                          {student.id}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-200">
                          {student.fullName}
                        </td>

                        {/* TX1 */}
                        <td className="p-1 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.tx1 !== undefined ? grade.tx1 : ''}
                            onChange={(e) => handleQuickInlineChange(student, 'tx1', e.target.value)}
                            onDoubleClick={() => openAuditEdit(student, 'tx1', grade.tx1)}
                            className="w-14 text-center py-1 text-xs rounded border border-slate-200 focus:bg-indigo-50 focus:border-indigo-500 focus:outline-none"
                            placeholder="—"
                          />
                        </td>

                        {/* TX2 */}
                        <td className="p-1 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.tx2 !== undefined ? grade.tx2 : ''}
                            onChange={(e) => handleQuickInlineChange(student, 'tx2', e.target.value)}
                            onDoubleClick={() => openAuditEdit(student, 'tx2', grade.tx2)}
                            className="w-14 text-center py-1 text-xs rounded border border-slate-200 focus:bg-indigo-50 focus:border-indigo-500 focus:outline-none"
                            placeholder="—"
                          />
                        </td>

                        {/* TX3 */}
                        <td className="p-1 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.tx3 !== undefined ? grade.tx3 : ''}
                            onChange={(e) => handleQuickInlineChange(student, 'tx3', e.target.value)}
                            onDoubleClick={() => openAuditEdit(student, 'tx3', grade.tx3)}
                            className="w-14 text-center py-1 text-xs rounded border border-slate-200 focus:bg-indigo-50 focus:border-indigo-500 focus:outline-none"
                            placeholder="—"
                          />
                        </td>

                        {/* TX4 */}
                        <td className="p-1 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.tx4 !== undefined ? grade.tx4 : ''}
                            onChange={(e) => handleQuickInlineChange(student, 'tx4', e.target.value)}
                            onDoubleClick={() => openAuditEdit(student, 'tx4', grade.tx4)}
                            className="w-14 text-center py-1 text-xs rounded border border-slate-200 focus:bg-indigo-50 focus:border-indigo-500 focus:outline-none"
                            placeholder="—"
                          />
                        </td>

                        {/* Mid-term (x2) */}
                        <td className="p-1 border-r border-slate-200 text-center bg-amber-50/20">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.midTerm !== undefined ? grade.midTerm : ''}
                            onChange={(e) => handleQuickInlineChange(student, 'midTerm', e.target.value)}
                            onDoubleClick={() => openAuditEdit(student, 'midTerm', grade.midTerm)}
                            className="w-14 text-center py-1 text-xs font-semibold rounded border border-amber-200 bg-amber-50/40 text-amber-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                            placeholder="—"
                          />
                        </td>

                        {/* Final (x3) */}
                        <td className="p-1 border-r border-slate-200 text-center bg-rose-50/20">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.finalExam !== undefined ? grade.finalExam : ''}
                            onChange={(e) => handleQuickInlineChange(student, 'finalExam', e.target.value)}
                            onDoubleClick={() => openAuditEdit(student, 'finalExam', grade.finalExam)}
                            className="w-14 text-center py-1 text-xs font-semibold rounded border border-rose-200 bg-rose-50/40 text-rose-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                            placeholder="—"
                          />
                        </td>

                        {/* Average (TBM) */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold bg-indigo-50/30 text-indigo-950 font-mono text-sm">
                          {avg !== undefined ? avg.toFixed(1) : '—'}
                        </td>

                        {/* Rank */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${rankBadge.cls}`}>
                            {rankBadge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nhấp đúp chuột vào ô điểm để mở cửa sổ chỉnh sửa có ghi nhận lý do kiểm toán (Audit Log).</span>
              </span>
              <span>Tổng số: {students.length} học sinh</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: AUDIT LOG (MINH BẠCH LỊCH SỬ SỬA ĐIỂM) --- */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Nhật Ký Kiểm Toán Điểm Số (Grade Audit Trail)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảo đảm tính minh bạch, ghi vết chính xác ai sửa, sửa lúc nào, điểm cũ sang điểm mới và lý do sư phạm.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Học Sinh</th>
                  <th className="py-3 px-4">Môn Học</th>
                  <th className="py-3 px-4">Cột Điểm</th>
                  <th className="py-3 px-4 text-center">Biến Động Điểm</th>
                  <th className="py-3 px-4">Lý Do Chỉnh Sửa</th>
                  <th className="py-3 px-4">Người Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Chưa có ghi nhận chỉnh sửa nào.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 text-xs">
                      <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{log.studentName}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{log.subjectName}</td>
                      <td className="py-3 px-4 uppercase font-mono font-medium text-indigo-700">
                        {log.gradeType}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-slate-400">{log.oldValue ?? 'Trống'}</span>
                        <span className="mx-2 text-indigo-600 font-bold">&rarr;</span>
                        <span className="font-bold text-slate-900">{log.newValue ?? 'Trống'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{log.updatedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: CÔNG THỨC & QUY CHẾ (EDUCATIONAL STANDARDS) --- */}
      {activeSubTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <span>Quy Chế Tính Điểm &amp; Trọng Số (Thông Tư 22 / 58 BGDĐT)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chi tiết công thức tính toán điểm thành phần, hệ số trọng số và thuật toán tính điểm trung bình chung GPA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 */}
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                <span>Điểm Thường Xuyên (ĐĐGtx)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <b>Trọng số / Hệ số: 1</b>. Bao gồm: hỏi đáp đầu giờ, bài tập 15 phút, thảo luận nhóm, bài thực hành nhỏ trên lớp. Môn 3-4 tiết/tuần cần tối thiểu 4 cột ĐĐGtx.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>Điểm Giữa Kỳ (ĐĐGđk)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <b>Trọng số / Hệ số: 2</b>. Thực hiện vào giữa học kỳ (tuần 9-10). Đánh giá tổng hợp kiến thức nửa đầu kỳ qua bài thi viết 45-60 phút hoặc sản phẩm học tập dự án.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-200">
              <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm mb-3">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">
                  3
                </span>
                <span>Điểm Cuối Kỳ (ĐĐGhk)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <b>Trọng số / Hệ số: 3</b>. Thực hiện vào cuối kỳ (tuần 17-18). Đánh giá chuẩn đầu ra toàn diện của môn học với thời lượng 60-90 phút theo ma trận đề quy chuẩn.
              </p>
            </div>
          </div>

          {/* Detailed Math Formula Display */}
          <div className="bg-slate-900 text-white p-5 rounded-xl font-mono text-xs sm:text-sm space-y-2">
            <p className="text-indigo-400 font-semibold">// Công thức chuẩn Điểm Trung Bình Môn Học Kỳ (TBMHK):</p>
            <p className="text-emerald-300">
              TBM = ( ∑ ĐĐGtx + 2 × ĐĐGđk + 3 × ĐĐGhk ) / ( Số_cột_ĐĐGtx + 2 + 3 )
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Ví dụ: Học sinh có 4 cột TX (9, 9.5, 9, 10), Giữa kỳ = 9.5, Cuối kỳ = 9.8:
              <br />
              TBM = [ (9 + 9.5 + 9 + 10) + (9.5 × 2) + (9.8 × 3) ] / (4 + 2 + 3) = (37.5 + 19 + 29.4) / 9 = 85.9 / 9 = <b>9.54 &rarr; 9.5</b>
            </p>
          </div>
        </div>
      )}

      {/* --- MODAL: CHỈNH SỬA ĐIỂM CÓ GHI VẾT AUDIT --- */}
      {auditModalOpen && targetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Chỉnh Sửa Điểm (Có Lưu Vết Kiểm Toán)</h3>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAuditScore} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p>
                  <span className="text-slate-500">Học sinh:</span>{' '}
                  <b className="text-slate-900">{targetStudent.fullName}</b> ({targetStudent.id})
                </p>
                <p>
                  <span className="text-slate-500">Môn học:</span>{' '}
                  <b className="text-indigo-700">{currentSubject.name}</b>
                </p>
                <p>
                  <span className="text-slate-500">Cột điểm:</span>{' '}
                  <span className="font-mono uppercase font-bold text-slate-800">{targetGradeType}</span>
                </p>
                <p>
                  <span className="text-slate-500">Điểm hiện tại:</span>{' '}
                  <b className="text-slate-800">{targetOldValue !== undefined ? targetOldValue : 'Chưa có'}</b>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Điểm Mới (Thang điểm 0.0 - 10.0) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={targetNewValue}
                  onChange={(e) => setTargetNewValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Nhập điểm mới..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-base text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý Do Chỉnh Sửa Điểm <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="VD: Chấm phúc khảo bài kiểm tra; cộng điểm chuyên cần làm bài tập..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giáo Viên Ký Nhận / Thực Hiện</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Lưu &amp; Ghi Nhật Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
