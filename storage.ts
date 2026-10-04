import {
  Student,
  ClassRoom,
  Subject,
  GradeEntry,
  LessonPlan,
  GradeAuditLog,
  AcademicSummary,
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_GRADES,
  INITIAL_LESSON_PLANS,
  INITIAL_AUDIT_LOGS,
  calculateSubjectAverage,
} from '../data/initialData';

const KEYS = {
  CLASSES: 'edu_classes_v1',
  SUBJECTS: 'edu_subjects_v1',
  STUDENTS: 'edu_students_v1',
  GRADES: 'edu_grades_v1',
  LESSON_PLANS: 'edu_lesson_plans_v1',
  AUDIT_LOGS: 'edu_audit_logs_v1',
};

export const StorageService = {
  getClasses(): ClassRoom[] {
    const raw = localStorage.getItem(KEYS.CLASSES);
    if (!raw) {
      localStorage.setItem(KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
      return INITIAL_CLASSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CLASSES;
    }
  },

  saveClasses(classes: ClassRoom[]) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  getSubjects(): Subject[] {
    const raw = localStorage.getItem(KEYS.SUBJECTS);
    if (!raw) {
      localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
      return INITIAL_SUBJECTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUBJECTS;
    }
  },

  saveSubjects(subjects: Subject[]) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  getStudents(): Student[] {
    const raw = localStorage.getItem(KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students: Student[]) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  getGrades(): GradeEntry[] {
    const raw = localStorage.getItem(KEYS.GRADES);
    if (!raw) {
      localStorage.setItem(KEYS.GRADES, JSON.stringify(INITIAL_GRADES));
      return INITIAL_GRADES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GRADES;
    }
  },

  saveGrades(grades: GradeEntry[]) {
    localStorage.setItem(KEYS.GRADES, JSON.stringify(grades));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  updateGradeWithAudit(
    updatedEntry: GradeEntry,
    auditPayload: {
      oldValue?: number;
      newValue?: number;
      gradeType: 'tx1' | 'tx2' | 'tx3' | 'tx4' | 'midTerm' | 'finalExam';
      reason: string;
      teacherName?: string;
    }
  ) {
    const allGrades = this.getGrades();
    const students = this.getStudents();
    const subjects = this.getSubjects();

    // Recalculate average
    updatedEntry.average = calculateSubjectAverage(updatedEntry);
    updatedEntry.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const index = allGrades.findIndex(
      (g) =>
        g.studentId === updatedEntry.studentId &&
        g.subjectId === updatedEntry.subjectId &&
        g.semester === updatedEntry.semester
    );

    if (index >= 0) {
      allGrades[index] = updatedEntry;
    } else {
      allGrades.push(updatedEntry);
    }
    this.saveGrades(allGrades);

    // Save Audit Log
    const student = students.find((s) => s.id === updatedEntry.studentId);
    const subject = subjects.find((sub) => sub.id === updatedEntry.subjectId);
    const newLog: GradeAuditLog = {
      id: 'LOG_' + Date.now(),
      timestamp: updatedEntry.updatedAt,
      studentId: updatedEntry.studentId,
      studentName: student ? student.fullName : updatedEntry.studentId,
      subjectName: subject ? subject.name : updatedEntry.subjectId,
      gradeType: auditPayload.gradeType,
      oldValue: auditPayload.oldValue,
      newValue: auditPayload.newValue,
      reason: auditPayload.reason || 'Cập nhật điểm theo quy định kiểm tra',
      updatedBy: auditPayload.teacherName || 'Giáo viên phụ trách',
    };

    const logs = this.getAuditLogs();
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
  },

  getAuditLogs(): GradeAuditLog[] {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  saveAuditLogs(logs: GradeAuditLog[]) {
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  getLessonPlans(): LessonPlan[] {
    const raw = localStorage.getItem(KEYS.LESSON_PLANS);
    if (!raw) {
      localStorage.setItem(KEYS.LESSON_PLANS, JSON.stringify(INITIAL_LESSON_PLANS));
      return INITIAL_LESSON_PLANS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LESSON_PLANS;
    }
  },

  saveLessonPlans(plans: LessonPlan[]) {
    localStorage.setItem(KEYS.LESSON_PLANS, JSON.stringify(plans));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  // Calculate academic summaries for all students in a class
  getAcademicSummaries(classId: string, semester: 1 | 2 = 1): AcademicSummary[] {
    const students = this.getStudents().filter((s) => s.classId === classId && s.status === 'Đang học');
    const subjects = this.getSubjects();
    const grades = this.getGrades().filter((g) => g.classId === classId && g.semester === semester);

    return students.map((student) => {
      const studentGrades = grades.filter((g) => g.studentId === student.id);
      const subjectScores: AcademicSummary['subjectScores'] = {};
      let totalAvg = 0;
      let subjectCount = 0;
      const riskReasons: string[] = [];

      subjects.forEach((sub) => {
        const grade = studentGrades.find((g) => g.subjectId === sub.id);
        const avg = grade?.average !== undefined ? grade.average : calculateSubjectAverage(grade || {});
        if (typeof avg === 'number') {
          subjectScores[sub.id] = {
            subjectName: sub.name,
            average: avg,
          };
          totalAvg += avg * (sub.coefficient || 1);
          subjectCount += sub.coefficient || 1;

          if (avg < 5.0) {
            riskReasons.push(`Điểm TB môn ${sub.name} chưa đạt (${avg}/10)`);
          }
        }
      });

      const gpa = subjectCount > 0 ? Math.round((totalAvg / subjectCount) * 10) / 10 : 0;

      // Ranking classification according to Circular 22/58 standards:
      const scoresList = Object.values(subjectScores).map((s) => s.average);
      const minScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;
      const mathScore = subjectScores['TOAN']?.average ?? 0;
      const litScore = subjectScores['VAN']?.average ?? 0;
      const conduct = student.conduct || 'Tốt';

      let academicRank: AcademicSummary['academicRank'] = 'Trung bình';
      let titleAward: AcademicSummary['titleAward'] = 'Hoàn thành';

      if (gpa >= 8.0 && minScore >= 6.5 && (mathScore >= 8.0 || litScore >= 8.0)) {
        if (gpa >= 9.0 && conduct === 'Tốt') {
          academicRank = 'Xuất sắc';
          titleAward = 'Học sinh Xuất sắc';
        } else {
          academicRank = 'Giỏi';
          titleAward = conduct === 'Tốt' ? 'Học sinh Giỏi' : 'Học sinh Tiên tiến';
        }
      } else if (gpa >= 6.5 && minScore >= 5.0) {
        academicRank = 'Khá';
        titleAward = conduct === 'Tốt' || conduct === 'Khá' ? 'Học sinh Tiên tiến' : 'Hoàn thành';
      } else if (gpa >= 5.0 && minScore >= 3.5) {
        academicRank = 'Trung bình';
        titleAward = 'Hoàn thành';
      } else {
        academicRank = 'Yếu';
        titleAward = 'Cần rèn luyện thêm';
        riskReasons.push('Điểm trung bình chung GPA dưới 5.0 hoặc có môn điểm liệt (<3.5)');
      }

      if (conduct === 'Chưa đạt' || conduct === 'Đạt') {
        riskReasons.push(`Cần lưu ý rèn luyện ý thức hạnh kiểm (hiện tại: ${conduct})`);
      }

      return {
        studentId: student.id,
        student,
        subjectScores,
        gpa,
        academicRank,
        conduct,
        titleAward,
        isAtRisk: riskReasons.length > 0 || academicRank === 'Yếu' || minScore < 5.0,
        riskReasons,
      };
    });
  },

  resetToInitialDemo() {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(KEYS.GRADES, JSON.stringify(INITIAL_GRADES));
    localStorage.setItem(KEYS.LESSON_PLANS, JSON.stringify(INITIAL_LESSON_PLANS));
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    window.dispatchEvent(new Event('edu_data_updated'));
  },

  exportAllData(): string {
    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      classes: this.getClasses(),
      subjects: this.getSubjects(),
      students: this.getStudents(),
      grades: this.getGrades(),
      lessonPlans: this.getLessonPlans(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(bundle, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.classes)) localStorage.setItem(KEYS.CLASSES, JSON.stringify(data.classes));
      if (Array.isArray(data.subjects)) localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(data.subjects));
      if (Array.isArray(data.students)) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(data.students));
      if (Array.isArray(data.grades)) localStorage.setItem(KEYS.GRADES, JSON.stringify(data.grades));
      if (Array.isArray(data.lessonPlans)) localStorage.setItem(KEYS.LESSON_PLANS, JSON.stringify(data.lessonPlans));
      if (Array.isArray(data.auditLogs)) localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      window.dispatchEvent(new Event('edu_data_updated'));
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },
};
