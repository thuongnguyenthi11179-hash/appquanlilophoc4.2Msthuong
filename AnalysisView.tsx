import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  ChevronRight,
  UserCheck,
  CheckCircle,
  HelpCircle,
  BrainCircuit,
  X,
} from 'lucide-react';
import { AcademicSummary, Student, Subject } from '../../types';
import { StorageService } from '../../services/storage';

interface AnalysisViewProps {
  selectedClassId: string;
  selectedSemester: 1 | 2;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  selectedClassId,
  selectedSemester,
}) => {
  const [summaries, setSummaries] = useState<AcademicSummary[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<AcademicSummary | null>(null);

  // AI Student Insight Modal State
  const [isAiInsightOpen, setIsAiInsightOpen] = useState(false);
  const [aiInsightTarget, setAiInsightTarget] = useState<AcademicSummary | null>(null);
  const [aiInsightContent, setAiInsightContent] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadData = () => {
    const list = StorageService.getAcademicSummaries(selectedClassId, selectedSemester);
    // Sort descending by GPA
    list.sort((a, b) => b.gpa - a.gpa);
    setSummaries(list);
    setSubjects(StorageService.getSubjects());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('edu_data_updated', handleUpdate);
    return () => window.removeEventListener('edu_data_updated', handleUpdate);
  }, [selectedClassId, selectedSemester]);

  // Calculations for KPI Cards & Distribution
  const totalStudents = summaries.length;
  const classAvgGpa =
    totalStudents > 0
      ? (summaries.reduce((acc, curr) => acc + curr.gpa, 0) / totalStudents).toFixed(2)
      : '0.00';

  const excellentCount = summaries.filter((s) => s.academicRank === 'Xuất sắc' || s.academicRank === 'Giỏi').length;
  const goodCount = summaries.filter((s) => s.academicRank === 'Khá').length;
  const averageCount = summaries.filter((s) => s.academicRank === 'Trung bình').length;
  const weakCount = summaries.filter((s) => s.academicRank === 'Yếu').length;

  const atRiskStudents = summaries.filter((s) => s.isAtRisk);

  // Trigger Gemini AI Pedagogical Insight for a struggling or outstanding student
  const handleGenerateStudentInsight = async (summary: AcademicSummary) => {
    setAiInsightTarget(summary);
    setAiInsightContent('');
    setIsAiInsightOpen(true);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/gemini/student-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: summary.student.fullName,
          classTitle: selectedClassId,
          scores: summary.subjectScores,
          conduct: summary.conduct,
          rank: `${summary.academicRank} (GPA: ${summary.gpa})`,
        }),
      });
      const data = await response.json();
      if (data.insight) {
        setAiInsightContent(data.insight);
      } else {
        setAiInsightContent('Không thể tạo báo cáo lúc này: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      setAiInsightContent('Lỗi kết nối tới máy chủ AI: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                Phân hệ 3
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Phân Tích Thành Tích &amp; Xếp Hạng Học Sinh (Performance Analytics)
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Thuật toán phân loại học lực đa chiều kết hợp rèn luyện hạnh kiểm (Thông tư 22/58), biểu đồ phổ điểm trực quan, nhận diện sớm học sinh tiến bộ / sa sút và học bạ số hóa.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Class GPA */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">GPA Trung Bình Lớp</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{classAvgGpa}</span>
            <span className="text-xs text-slate-500">/ 10.0</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Học kỳ {selectedSemester} - Năm học 2026-2027</p>
        </div>

        {/* Card 2: Excellent & Good */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tỷ Lệ Giỏi &amp; Xuất Sắc</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {totalStudents > 0 ? Math.round((excellentCount / totalStudents) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500 font-medium">({excellentCount} / {totalStudents} HS)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Đạt danh hiệu khen thưởng</p>
        </div>

        {/* Card 3: Good */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Học Lực Khá</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-indigo-700 font-mono">
              {totalStudents > 0 ? Math.round((goodCount / totalStudents) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500 font-medium">({goodCount} HS)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">GPA từ 6.5 đến 7.9</p>
        </div>

        {/* Card 4: At Risk Early Warning */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase">Cần Hỗ Trợ (Cảnh Báo)</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-700 font-mono">{atRiskStudents.length}</span>
            <span className="text-xs text-slate-500 font-medium">học sinh</span>
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Có môn &lt; 5.0 hoặc sa sút</p>
        </div>
      </div>

      {/* Visual Score Distribution Bar & Academic Classification */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Biểu Đồ Phân Phối Học Lực &amp; Phổ Điểm</h2>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-slate-100 rounded-xl h-5 overflow-hidden flex">
          {excellentCount > 0 && (
            <div
              className="bg-emerald-500 h-full text-white text-[10px] font-bold flex items-center justify-center transition-all"
              style={{ width: `${(excellentCount / totalStudents) * 100}%` }}
              title={`Giỏi & Xuất sắc: ${excellentCount} HS`}
            >
              {Math.round((excellentCount / totalStudents) * 100)}%
            </div>
          )}
          {goodCount > 0 && (
            <div
              className="bg-blue-500 h-full text-white text-[10px] font-bold flex items-center justify-center transition-all"
              style={{ width: `${(goodCount / totalStudents) * 100}%` }}
              title={`Khá: ${goodCount} HS`}
            >
              {Math.round((goodCount / totalStudents) * 100)}%
            </div>
          )}
          {averageCount > 0 && (
            <div
              className="bg-amber-400 h-full text-white text-[10px] font-bold flex items-center justify-center transition-all"
              style={{ width: `${(averageCount / totalStudents) * 100}%` }}
              title={`Trung bình / Đạt: ${averageCount} HS`}
            >
              {Math.round((averageCount / totalStudents) * 100)}%
            </div>
          )}
          {weakCount > 0 && (
            <div
              className="bg-rose-500 h-full text-white text-[10px] font-bold flex items-center justify-center transition-all"
              style={{ width: `${(weakCount / totalStudents) * 100}%` }}
              title={`Yếu: ${weakCount} HS`}
            >
              {Math.round((weakCount / totalStudents) * 100)}%
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Xuất sắc &amp; Giỏi (ĐTB &ge; 8.0): <b>{excellentCount} HS</b></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Khá (6.5 &le; ĐTB &lt; 8.0): <b>{goodCount} HS</b></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span>Trung bình / Đạt (5.0 &le; ĐTB &lt; 6.5): <b>{averageCount} HS</b></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Yếu / Chưa đạt (ĐTB &lt; 5.0): <b>{weakCount} HS</b></span>
          </div>
        </div>
      </div>

      {/* Early Warning Panel (Học Sinh Có Nguy Cơ Sa Sút) */}
      {atRiskStudents.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
              <span>Hệ Thống Cảnh Báo Sớm Học Tập (Early Intervention Alert)</span>
            </div>
            <span className="text-xs bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-semibold">
              {atRiskStudents.length} học sinh cần can thiệp
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Học sinh có điểm thành phần dưới 5.0, điểm trung bình chung chưa đạt chuẩn hoặc có vấn đề về chuyên cần. Giáo viên có thể nhấn nút để nhận lộ trình sư phạm cá nhân hóa từ AI:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {atRiskStudents.map((s) => (
              <div
                key={s.studentId}
                className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.student.fullName}</h4>
                      <p className="text-xs text-slate-500 font-mono">Mã HS: {s.student.id} | GPA: <b>{s.gpa}</b></p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      {s.academicRank}
                    </span>
                  </div>

                  <ul className="mt-2 text-xs text-rose-700 space-y-1">
                    {s.riskReasons.map((r, i) => (
                      <li key={i} className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Phụ huynh: {s.student.parentPhone || 'Chưa có SĐT'}</span>
                  <button
                    onClick={() => handleGenerateStudentInsight(s)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-medium hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Lập Lộ Trình AI</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Ranking Table (Bảng Xếp Hạng & Danh Hiệu) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Bảng Vinh Danh &amp; Xếp Hạng Học Lực (Thông Tư 22)</span>
          </h2>
          <span className="text-xs text-slate-500">Sắp xếp theo Điểm Trung Bình Chung (GPA) giảm dần</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-16">Hạng</th>
                <th className="py-3 px-4">Học Sinh</th>
                <th className="py-3 px-3 text-center">Toán</th>
                <th className="py-3 px-3 text-center">Văn</th>
                <th className="py-3 px-3 text-center">Anh</th>
                <th className="py-3 px-4 text-center font-bold">GPA</th>
                <th className="py-3 px-4 text-center">Hạnh Kiểm</th>
                <th className="py-3 px-4 text-center">Học Lực</th>
                <th className="py-3 px-4">Danh Hiệu Khen Thưởng</th>
                <th className="py-3 px-4 text-right">Học Bạ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((s, idx) => {
                const isTop3 = idx < 3;
                return (
                  <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {isTop3 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                            idx === 0
                              ? 'bg-amber-500 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-400'
                              : 'bg-amber-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-slate-500">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.student.fullName}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.student.id}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs font-semibold">
                      {s.subjectScores['TOAN']?.average ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs font-semibold">
                      {s.subjectScores['VAN']?.average ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs font-semibold">
                      {s.subjectScores['ANH']?.average ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700 text-base">
                      {s.gpa.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {s.conduct}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          s.academicRank === 'Xuất sắc'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : s.academicRank === 'Giỏi'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.academicRank === 'Khá'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {s.academicRank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-slate-800">
                        {s.titleAward}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudentForReport(s)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="Xem học bạ điện tử"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Phiếu Điểm</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: HỌC BẠ ĐIỆN TỬ / PHIẾU BÁO ĐIỂM (PRINTABLE) --- */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header of Report Card */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Trường THPT Chất Lượng Cao
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Phiếu Báo Điểm &amp; Học Bạ Điện Tử
                </h3>
                <p className="text-xs text-slate-500">
                  Học kỳ {selectedSemester} - Năm học 2026-2027 | Lớp: {selectedClassId}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu</span>
                </button>
                <button
                  onClick={() => setSelectedStudentForReport(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500">Họ và Tên:</span>{' '}
                <b className="text-slate-900 text-sm">{selectedStudentForReport.student.fullName}</b>
              </div>
              <div>
                <span className="text-slate-500">Mã Học Sinh:</span>{' '}
                <b className="font-mono text-slate-900">{selectedStudentForReport.student.id}</b>
              </div>
              <div>
                <span className="text-slate-500">Ngày Sinh:</span>{' '}
                <span className="text-slate-800">{selectedStudentForReport.student.dob}</span>
              </div>
              <div>
                <span className="text-slate-500">Phụ Huynh:</span>{' '}
                <span className="text-slate-800">{selectedStudentForReport.student.parentName} ({selectedStudentForReport.student.parentPhone})</span>
              </div>
            </div>

            {/* Detailed Subject Scores Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Môn Học</th>
                    <th className="py-2.5 px-3 text-center">Số Tiết</th>
                    <th className="py-2.5 px-3 text-center">ĐTB Môn</th>
                    <th className="py-2.5 px-3 text-center">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => {
                    const sc = selectedStudentForReport.subjectScores[sub.id];
                    const avg = sc?.average;
                    return (
                      <tr key={sub.id}>
                        <td className="py-2 px-3 font-medium text-slate-800">{sub.name}</td>
                        <td className="py-2 px-3 text-center text-slate-500">{sub.periodsPerWeek} tiết</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {avg !== undefined ? avg.toFixed(1) : '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {avg !== undefined ? (
                            avg >= 8.0 ? (
                              <span className="text-emerald-700 font-semibold">Tốt / Giỏi</span>
                            ) : avg >= 6.5 ? (
                              <span className="text-blue-700 font-medium">Khá</span>
                            ) : avg >= 5.0 ? (
                              <span className="text-amber-700">Đạt</span>
                            ) : (
                              <span className="text-rose-700 font-bold">Chưa đạt</span>
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Academic Evaluation Summary */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span>Điểm Trung Bình Tất Cả Các Môn (GPA):</span>
                <span className="text-lg font-bold font-mono text-indigo-900">
                  {selectedStudentForReport.gpa.toFixed(1)} / 10.0
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Xếp Loại Học Lực:</span>
                <span className="font-bold text-indigo-800">{selectedStudentForReport.academicRank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rèn Luyện Hạnh Kiểm:</span>
                <span className="font-bold text-slate-800">{selectedStudentForReport.conduct}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-indigo-200/60">
                <span className="font-semibold text-slate-700">Danh Hiệu Khen Thưởng:</span>
                <span className="text-sm font-bold text-emerald-800">
                  {selectedStudentForReport.titleAward}
                </span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700">Ý kiến Phụ huynh học sinh</p>
                <div className="h-16"></div>
                <p className="italic text-slate-400">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Giáo viên chủ nhiệm</p>
                <div className="h-16"></div>
                <p className="font-bold text-slate-800">ThS. Nguyễn Văn Minh</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: LẬP LỘ TRÌNH SƯ PHẠM AI (GEMINI) --- */}
      {isAiInsightOpen && aiInsightTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-lg">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Lộ Trình Sư Phạm Cá Nhân Hóa (AI EdTech Insight)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Học sinh: {aiInsightTarget.student.fullName} ({aiInsightTarget.student.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiInsightOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="my-4">
              {isAiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-medium text-indigo-700">
                    Chuyên gia AI EdTech đang phân tích ma trận điểm và thiết lập kế hoạch bồi dưỡng 4 tuần...
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {aiInsightContent}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAiInsightOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
