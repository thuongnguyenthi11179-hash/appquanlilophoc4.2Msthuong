export type Gender = 'Nam' | 'Nữ' | 'Khác';

export type StudentStatus = 'Đang học' | 'Chuyển trường' | 'Nghỉ học';

export interface Student {
  id: string; // Mã học sinh (e.g., HS1001)
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  classId: string;
  parentName: string;
  parentPhone: string;
  email?: string;
  address: string;
  status: StudentStatus;
  conduct: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'; // Hạnh kiểm
  avatarColor?: string;
  notes?: string;
}

export interface ClassRoom {
  id: string; // e.g. 10A1
  name: string;
  gradeLevel: number; // 10, 11, 12
  academicYear: string; // e.g. 2026-2027
  homeroomTeacher: string;
  roomNumber: string;
  capacity: number;
}

export type SubjectType = 'Bắt buộc' | 'Tự chọn';

export interface Subject {
  id: string; // e.g. TOAN, VAN, ANH
  name: string;
  code: string;
  type: SubjectType;
  periodsPerWeek: number; // Số tiết/tuần
  coefficient: number; // Hệ số môn (mặc định 1)
  colorBadge: string;
}

export interface GradeEntry {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  semester: 1 | 2;
  academicYear: string;
  // Điểm đánh giá thường xuyên (hệ số 1, tối đa 4-5 cột)
  tx1?: number;
  tx2?: number;
  tx3?: number;
  tx4?: number;
  // Điểm đánh giá định kỳ (hệ số 2, giữa kỳ)
  midTerm?: number;
  // Điểm đánh giá học kỳ (hệ số 3, cuối kỳ)
  finalExam?: number;
  // Điểm trung bình môn được tính toán
  average?: number;
  updatedAt: string;
}

export interface GradeAuditLog {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  gradeType: 'tx1' | 'tx2' | 'tx3' | 'tx4' | 'midTerm' | 'finalExam';
  oldValue: number | undefined;
  newValue: number | undefined;
  reason: string;
  updatedBy: string;
}

export type LessonStatus = 'Đúng tiến độ' | 'Chậm tiến độ' | 'Đã hoàn thành' | 'Dạy bù';

export interface LessonPlan {
  id: string;
  subjectId: string;
  classId: string;
  periodNumber: number; // Tiết PPCT
  lessonTitle: string; // Tên bài dạy / chuyên đề
  plannedDate: string; // Ngày dự kiến YYYY-MM-DD
  actualDate?: string; // Ngày thực tế dạy YYYY-MM-DD
  durationMinutes: number; // e.g. 45 phút
  objectives: string; // Mục tiêu cần đạt (kiến thức, kỹ năng, phẩm chất)
  materials: string; // Tài liệu / học liệu hỗ trợ
  status: LessonStatus;
  notes?: string;
}

export interface AcademicSummary {
  studentId: string;
  student: Student;
  subjectScores: {
    [subjectId: string]: {
      subjectName: string;
      average: number;
    };
  };
  gpa: number; // Điểm trung bình các môn
  academicRank: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu';
  conduct: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  titleAward: 'Học sinh Xuất sắc' | 'Học sinh Giỏi' | 'Học sinh Tiên tiến' | 'Hoàn thành' | 'Cần rèn luyện thêm';
  isAtRisk: boolean; // Có nguy cơ sa sút
  riskReasons: string[];
}
