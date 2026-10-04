import React, { useState } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { Student, ClassRoom, Subject, Gender, StudentStatus, SubjectType } from '../../types';
import { StorageService } from '../../services/storage';

interface DataInputViewProps {
  selectedClassId: string;
}

export const DataInputView: React.FC<DataInputViewProps> = ({ selectedClassId }) => {
  const [subTab, setSubTab] = useState<'students' | 'classes' | 'subjects' | 'schema'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>(selectedClassId);

  // Data from Storage
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [subjects, setSubjects] = useState<Subject[]>(() => StorageService.getSubjects());

  // Student Form Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFormData, setStudentFormData] = useState<Partial<Student>>({
    id: '',
    fullName: '',
    dob: '2010-01-01',
    gender: 'Nam',
    classId: selectedClassId,
    parentName: '',
    parentPhone: '',
    email: '',
    address: '',
    status: 'Đang học',
    conduct: 'Tốt',
    notes: '',
  });

  // Class Form Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classFormData, setClassFormData] = useState<Partial<ClassRoom>>({
    id: '',
    name: '',
    gradeLevel: 10,
    academicYear: '2026-2027',
    homeroomTeacher: '',
    roomNumber: '',
    capacity: 40,
  });

  // Subject Form Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState<Partial<Subject>>({
    id: '',
    name: '',
    code: '',
    type: 'Bắt buộc',
    periodsPerWeek: 3,
    coefficient: 1,
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-200',
  });

  const refreshData = () => {
    setStudents(StorageService.getStudents());
    setClasses(StorageService.getClasses());
    setSubjects(StorageService.getSubjects());
  };

  // --- Student Operations ---
  const handleOpenStudentModal = (student?: Student) => {
    setStudentFormError('');
    if (student) {
      setEditingStudent(student);
      setStudentFormData({ ...student });
    } else {
      // Auto-generate next Student ID like HS1009
      const existingIds = students.map((s) => s.id);
      let nextNum = 1001;
      while (existingIds.includes(`HS${nextNum}`)) {
        nextNum++;
      }
      setEditingStudent(null);
      setStudentFormData({
        id: `HS${nextNum}`,
        fullName: '',
        dob: '2010-05-15',
        gender: 'Nam',
        classId: filterClass || selectedClassId,
        parentName: '',
        parentPhone: '',
        email: '',
        address: '',
        status: 'Đang học',
        conduct: 'Tốt',
        notes: '',
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError('');

    // Data Integrity Validation
    if (!studentFormData.id?.trim() || !studentFormData.fullName?.trim()) {
      setStudentFormError('Vui lòng điền Mã học sinh và Họ tên đầy đủ!');
      return;
    }

    // Check duplicate ID if new
    if (!editingStudent && students.some((s) => s.id.toUpperCase() === studentFormData.id?.toUpperCase())) {
      setStudentFormError(`Mã học sinh "${studentFormData.id}" đã tồn tại trên hệ thống. Đảm bảo tính toàn vẹn dữ liệu!`);
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{9,11}$/;
    if (studentFormData.parentPhone && !phoneRegex.test(studentFormData.parentPhone.replace(/\s+/g, ''))) {
      setStudentFormError('Số điện thoại phụ huynh không đúng định dạng (9-11 chữ số)!');
      return;
    }

    const updatedStudent: Student = {
      id: studentFormData.id.trim().toUpperCase(),
      fullName: studentFormData.fullName.trim(),
      dob: studentFormData.dob || '2010-01-01',
      gender: (studentFormData.gender as Gender) || 'Nam',
      classId: studentFormData.classId || selectedClassId,
      parentName: studentFormData.parentName?.trim() || '',
      parentPhone: studentFormData.parentPhone?.trim() || '',
      email: studentFormData.email?.trim() || `${studentFormData.id?.toLowerCase()}@school.edu.vn`,
      address: studentFormData.address?.trim() || '',
      status: (studentFormData.status as StudentStatus) || 'Đang học',
      conduct: (studentFormData.conduct as any) || 'Tốt',
      notes: studentFormData.notes?.trim() || '',
      avatarColor: editingStudent?.avatarColor || 'bg-blue-600',
    };

    let updatedList = [...students];
    if (editingStudent) {
      updatedList = updatedList.map((s) => (s.id === editingStudent.id ? updatedStudent : s));
    } else {
      updatedList.push(updatedStudent);
    }

    StorageService.saveStudents(updatedList);
    refreshData();
    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${name}" (${id}) khỏi hệ thống?`)) {
      const updatedList = students.filter((s) => s.id !== id);
      StorageService.saveStudents(updatedList);
      refreshData();
    }
  };

  // --- Class Operations ---
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.id || !classFormData.name) {
      alert('Vui lòng nhập Mã lớp và Tên lớp!');
      return;
    }
    const newClass: ClassRoom = {
      id: classFormData.id.trim().toUpperCase(),
      name: classFormData.name.trim(),
      gradeLevel: Number(classFormData.gradeLevel) || 10,
      academicYear: classFormData.academicYear || '2026-2027',
      homeroomTeacher: classFormData.homeroomTeacher?.trim() || 'Chưa phân công',
      roomNumber: classFormData.roomNumber?.trim() || 'Phòng học số',
      capacity: Number(classFormData.capacity) || 40,
    };

    const exists = classes.some((c) => c.id === newClass.id);
    let updated = [...classes];
    if (exists) {
      updated = updated.map((c) => (c.id === newClass.id ? newClass : c));
    } else {
      updated.push(newClass);
    }
    StorageService.saveClasses(updated);
    refreshData();
    setIsClassModalOpen(false);
  };

  // --- Subject Operations ---
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.id || !subjectFormData.name) {
      alert('Vui lòng nhập Mã môn và Tên môn!');
      return;
    }
    const newSub: Subject = {
      id: subjectFormData.id.trim().toUpperCase(),
      name: subjectFormData.name.trim(),
      code: subjectFormData.code?.trim() || subjectFormData.id,
      type: (subjectFormData.type as SubjectType) || 'Bắt buộc',
      periodsPerWeek: Number(subjectFormData.periodsPerWeek) || 3,
      coefficient: Number(subjectFormData.coefficient) || 1,
      colorBadge: subjectFormData.colorBadge || 'bg-blue-100 text-blue-800 border-blue-200',
    };

    let updated = [...subjects];
    const exists = subjects.some((s) => s.id === newSub.id);
    if (exists) {
      updated = updated.map((s) => (s.id === newSub.id ? newSub : s));
    } else {
      updated.push(newSub);
    }
    StorageService.saveSubjects(updated);
    refreshData();
    setIsSubjectModalOpen(false);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = filterClass === 'ALL' || s.classId === filterClass;
    const matchesQuery =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery);
    return matchesClass && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Module Banner / Specs Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                Phân hệ 1
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Nhập Liệu &amp; Danh Mục Hồ Sơ (Data Input &amp; Directory)
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Thiết lập cấu trúc dữ liệu linh hoạt, đảm bảo tính nhất quán (Data Integrity) và khả năng mở rộng (Scalability) theo đúng quy chuẩn kiến trúc EdTech.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs sm:text-sm font-medium self-start md:self-center">
            <button
              onClick={() => setSubTab('students')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'students'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Học Sinh ({students.length})</span>
            </button>
            <button
              onClick={() => setSubTab('classes')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'classes'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Lớp Học ({classes.length})</span>
            </button>
            <button
              onClick={() => setSubTab('subjects')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'subjects'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Môn Học ({subjects.length})</span>
            </button>
            <button
              onClick={() => setSubTab('schema')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'schema'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Cấu Trúc Dữ Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: DANH SÁCH HỌC SINH --- */}
      {subTab === 'students' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã HS, Họ tên, SĐT phụ huynh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Class Filter */}
              <select
                aria-label="Lọc theo lớp học"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả các lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Student Button */}
            <button
              onClick={() => handleOpenStudentModal()}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Học Sinh Mới</span>
            </button>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã HS</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Ngày Sinh &amp; Giới Tính</th>
                    <th className="py-3 px-4">Liên Hệ Phụ Huynh</th>
                    <th className="py-3 px-4">Hạnh Kiểm</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Không tìm thấy học sinh nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-blue-700">
                          {student.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${
                                student.avatarColor || 'bg-indigo-600'
                              }`}
                            >
                              {student.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{student.fullName}</p>
                              {student.email && (
                                <p className="text-xs text-slate-500">{student.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs">
                            {student.classId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div>{student.dob}</div>
                          <span className="text-[11px] text-slate-500">{student.gender}</span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <p className="font-medium text-slate-800">{student.parentName || 'Chưa cập nhật'}</p>
                          <div className="flex items-center text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            <span>{student.parentPhone || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              student.conduct === 'Tốt'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : student.conduct === 'Khá'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {student.conduct || 'Tốt'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                              student.status === 'Đang học'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenStudentModal(student)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.fullName)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <span>Hiển thị {filteredStudents.length} / {students.length} học sinh</span>
              <span className="italic">Dữ liệu được chuẩn hóa theo quy chuẩn EdTech Data Integrity</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DANH MỤC LỚP HỌC --- */}
      {subTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Danh Mục Lớp Học Niên Khóa 2026-2027</h2>
            <button
              onClick={() => {
                setClassFormData({
                  id: '',
                  name: '',
                  gradeLevel: 10,
                  academicYear: '2026-2027',
                  homeroomTeacher: '',
                  roomNumber: '',
                  capacity: 40,
                });
                setIsClassModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp Học Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const enrolled = students.filter((s) => s.classId === cls.id && s.status === 'Đang học').length;
              return (
                <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        Khối {cls.gradeLevel}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{cls.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Mã lớp: {cls.id}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giáo viên chủ nhiệm:</span>
                      <span className="font-semibold text-slate-800">{cls.homeroomTeacher}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phòng học:</span>
                      <span className="font-medium text-slate-700">{cls.roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sĩ số thực tế:</span>
                      <span className="font-bold text-blue-700">{enrolled} / {cls.capacity} học sinh</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (enrolled / cls.capacity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: DANH MỤC MÔN HỌC --- */}
      {subTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Danh Mục Môn Học (Khung Chương Trình GDPT 2018)</h2>
              <p className="text-xs text-slate-500">Phân loại môn Bắt buộc và Tự chọn, số tiết định mức</p>
            </div>
            <button
              onClick={() => {
                setSubjectFormData({
                  id: '',
                  name: '',
                  code: '',
                  type: 'Bắt buộc',
                  periodsPerWeek: 3,
                  coefficient: 1,
                  colorBadge: 'bg-blue-100 text-blue-800 border-blue-200',
                });
                setIsSubjectModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Môn Học Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {sub.id.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{sub.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">Mã: {sub.code || sub.id}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      sub.type === 'Bắt buộc'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {sub.type}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Số tiết/tuần:</span>{' '}
                    <span className="font-bold text-slate-800">{sub.periodsPerWeek} tiết</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Hệ số môn:</span>{' '}
                    <span className="font-bold text-slate-800">x{sub.coefficient}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: CẤU TRÚC DỮ LIỆU & SCALABILITY (ARCHITECT VIEW) --- */}
      {subTab === 'schema' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Kiến Trúc Dữ Liệu &amp; Tính Toàn Vẹn (Data Integrity &amp; Scalability)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mô hình hóa thực thể quan hệ (ERD Schema) và cơ chế đảm bảo tính toàn vẹn khóa chính, khóa ngoại, ma trận điểm có audit log.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entity 1: Students */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center justify-between">
                <span>Thực thể Student (Học sinh)</span>
                <span className="text-xs text-blue-600 font-mono">Primary Key: id</span>
              </h3>
              <ul className="text-xs space-y-1.5 font-mono text-slate-600">
                <li><b className="text-slate-900">id:</b> string (Unique, format: HS1001)</li>
                <li><b className="text-slate-900">fullName:</b> string (Required, Normalized UTF-8)</li>
                <li><b className="text-slate-900">dob:</b> ISO Date (YYYY-MM-DD)</li>
                <li><b className="text-slate-900">gender:</b> 'Nam' | 'Nữ' | 'Khác'</li>
                <li><b className="text-slate-900">classId:</b> Foreign Key -&gt; ClassRoom.id</li>
                <li><b className="text-slate-900">parentPhone:</b> string (Validated 10 digits)</li>
                <li><b className="text-slate-900">conduct:</b> 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'</li>
              </ul>
            </div>

            {/* Entity 2: Grades & Audit */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center justify-between">
                <span>Thực thể GradeEntry &amp; Audit Log</span>
                <span className="text-xs text-indigo-600 font-mono">Composite Key: studentId + subjectId + semester</span>
              </h3>
              <ul className="text-xs space-y-1.5 font-mono text-slate-600">
                <li><b className="text-slate-900">tx1, tx2, tx3, tx4:</b> float (0.0 - 10.0, HeSo = 1)</li>
                <li><b className="text-slate-900">midTerm:</b> float (0.0 - 10.0, HeSo = 2)</li>
                <li><b className="text-slate-900">finalExam:</b> float (0.0 - 10.0, HeSo = 3)</li>
                <li><b className="text-slate-900">average:</b> Computed field (Real-time recalculation)</li>
                <li><b className="text-slate-900">auditLog:</b> Immutable historical trail (OldVal, NewVal, Reason, Timestamp)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: THÊM / SỬA HỌC SINH --- */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới Vào Hệ Thống'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {studentFormError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{studentFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã Học Sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={studentFormData.id}
                    onChange={(e) => setStudentFormData({ ...studentFormData, id: e.target.value })}
                    placeholder="VD: HS1009"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lớp Học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={studentFormData.classId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và Tên Học Sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentFormData.fullName}
                  onChange={(e) => setStudentFormData({ ...studentFormData, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={studentFormData.dob}
                    onChange={(e) => setStudentFormData({ ...studentFormData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới Tính</label>
                  <select
                    value={studentFormData.gender}
                    onChange={(e) => setStudentFormData({ ...studentFormData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ Tên Phụ Huynh</label>
                  <input
                    type="text"
                    value={studentFormData.parentName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, parentName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Bình"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT Phụ Huynh</label>
                  <input
                    type="tel"
                    value={studentFormData.parentPhone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, parentPhone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hạnh Kiểm</label>
                  <select
                    value={studentFormData.conduct}
                    onChange={(e) => setStudentFormData({ ...studentFormData, conduct: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Khá">Khá</option>
                    <option value="Đạt">Đạt</option>
                    <option value="Chưa đạt">Chưa đạt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Học Tập</label>
                  <select
                    value={studentFormData.status}
                    onChange={(e) => setStudentFormData({ ...studentFormData, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Chuyển trường">Chuyển trường</option>
                    <option value="Nghỉ học">Nghỉ học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa Chỉ Thường Trú</label>
                <input
                  type="text"
                  value={studentFormData.address}
                  onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                  placeholder="VD: Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: THÊM LỚP HỌC --- */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm / Cập Nhật Lớp Học</h3>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Lớp (VD: 10A3)</label>
                <input
                  type="text"
                  required
                  value={classFormData.id}
                  onChange={(e) => setClassFormData({ ...classFormData, id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Lớp Đầy Đủ</label>
                <input
                  type="text"
                  required
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  placeholder="VD: Lớp 10A3 (Định hướng Ngoại ngữ)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối Lớp</label>
                  <select
                    value={classFormData.gradeLevel}
                    onChange={(e) => setClassFormData({ ...classFormData, gradeLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sĩ Số Tối Đa</label>
                  <input
                    type="number"
                    value={classFormData.capacity}
                    onChange={(e) => setClassFormData({ ...classFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giáo Viên Chủ Nhiệm</label>
                <input
                  type="text"
                  value={classFormData.homeroomTeacher}
                  onChange={(e) => setClassFormData({ ...classFormData, homeroomTeacher: e.target.value })}
                  placeholder="VD: ThS. Lê Văn Dũng"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                  Lưu Lớp Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: THÊM MÔN HỌC --- */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm Môn Học Mới</h3>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Môn (VD: SU, DIA)</label>
                <input
                  type="text"
                  required
                  value={subjectFormData.id}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Môn Học</label>
                <input
                  type="text"
                  required
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  placeholder="VD: Lịch sử"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phân Loại</label>
                  <select
                    value={subjectFormData.type}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, type: e.target.value as SubjectType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Bắt buộc">Bắt buộc</option>
                    <option value="Tự chọn">Tự chọn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số Tiết / Tuần</label>
                  <input
                    type="number"
                    value={subjectFormData.periodsPerWeek}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, periodsPerWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                  Lưu Môn Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
