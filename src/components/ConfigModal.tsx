import React, { useState, useEffect } from 'react';
import {
  X,
  School,
  UserCheck,
  Phone,
  User,
  Users,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  FileText,
  List,
} from 'lucide-react';
import { ClassConfig, Student } from '../types';
import { INITIAL_STUDENTS, DEFAULT_CONFIG } from '../data/defaultData';
import { cleanPhoneNumber } from '../utils/zaloHelper';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  onSaveConfig: (newConfig: ClassConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [schoolName, setSchoolName] = useState(config.schoolName);
  const [className, setClassName] = useState(config.className);
  const [teacherName, setTeacherName] = useState(config.teacherName);
  const [zaloPhone, setZaloPhone] = useState(config.zaloPhone);
  const [reporterName, setReporterName] = useState(config.reporterName);
  const [reporterRole, setReporterRole] = useState(config.reporterRole);

  const [activeRosterTab, setActiveRosterTab] = useState<'bulk' | 'list'>('bulk');
  const [bulkText, setBulkText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [editableStudents, setEditableStudents] = useState<Student[]>(config.students);

  useEffect(() => {
    if (isOpen) {
      setSchoolName(config.schoolName);
      setClassName(config.className);
      setTeacherName(config.teacherName);
      setZaloPhone(config.zaloPhone);
      setReporterName(config.reporterName);
      setReporterRole(config.reporterRole);
      setEditableStudents(config.students);
      setBulkText(config.students.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleParseBulkText = () => {
    const lines = bulkText.split('\n');
    const parsed: Student[] = [];
    lines.forEach((line) => {
      let clean = line.trim();
      if (!clean) return;
      // strip preceding numbers like "1. ", "1/ ", "1- ", "01. "
      clean = clean.replace(/^\d+[\.\-\/\:\)\s]+\s*/, '').trim();
      if (clean) {
        parsed.push({
          id: `std-${parsed.length + 1}-${Date.now()}`,
          stt: parsed.length + 1,
          name: clean,
        });
      }
    });
    return parsed;
  };

  const handleLoadSampleRoster = () => {
    setBulkText(INITIAL_STUDENTS.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    setEditableStudents(INITIAL_STUDENTS);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) return;
    const nextStt = editableStudents.length + 1;
    const updated = [
      ...editableStudents,
      {
        id: `std-${nextStt}-${Date.now()}`,
        stt: nextStt,
        name,
      },
    ];
    setEditableStudents(updated);
    setBulkText(updated.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    setNewStudentName('');
  };

  const handleDeleteStudent = (index: number) => {
    const updated = editableStudents
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, stt: idx + 1 }));
    setEditableStudents(updated);
    setBulkText(updated.map((s) => `${s.stt}. ${s.name}`).join('\n'));
  };

  const handleSave = () => {
    let finalStudents = editableStudents;
    if (activeRosterTab === 'bulk') {
      const parsed = handleParseBulkText();
      if (parsed.length > 0) {
        finalStudents = parsed;
      }
    }

    const newConfig: ClassConfig = {
      schoolName: schoolName.trim(),
      className: className.trim(),
      teacherName: teacherName.trim(),
      zaloPhone: cleanPhoneNumber(zaloPhone.trim()),
      reporterName: reporterName.trim(),
      reporterRole: reporterRole.trim(),
      students: finalStudents,
    };

    onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base">Cấu hình thông tin Lớp học & GVCN</h3>
              <p className="text-xs text-blue-200">
                Thông tin này sẽ được lưu tự động trên trình duyệt của bạn (LocalStorage)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Section: Thông tin trường lớp & GVCN */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <School className="w-4 h-4 text-blue-600" />
              Thông tin chung
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên trường học *
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ví dụ: THPT Chu Văn An"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 11A1"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Họ tên GVCN *
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ví dụ: Cô Lê Hoàng Yến"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Số điện thoại Zalo nhận tin *
                </label>
                <input
                  type="text"
                  value={zaloPhone}
                  onChange={(e) => setZaloPhone(e.target.value)}
                  placeholder="Ví dụ: 0988123456"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dùng để mở trực tiếp chat qua link <em>zalo.me/số_điện_thoại</em>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Họ tên người báo cáo
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Tuấn"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ / Vai trò
                </label>
                <input
                  type="text"
                  value={reporterRole}
                  onChange={(e) => setReporterRole(e.target.value)}
                  placeholder="Ví dụ: Lớp trưởng, Lớp phó học tập, Cờ đỏ..."
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section: Danh sách học sinh */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Danh sách học sinh của lớp
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleRoster}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Khôi phục 35 học sinh mẫu
                </button>
              </div>
            </div>

            {/* Sub-tabs: Nhập dạng text vs Xem danh sách */}
            <div className="flex border-b border-slate-200 mb-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveRosterTab('bulk');
                  setBulkText(editableStudents.map((s) => `${s.stt}. ${s.name}`).join('\n'));
                }}
                className={`py-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeRosterTab === 'bulk'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Dán danh sách nhanh (Mỗi bạn 1 dòng)
              </button>

              <button
                type="button"
                onClick={() => {
                  const parsed = handleParseBulkText();
                  if (parsed.length > 0) setEditableStudents(parsed);
                  setActiveRosterTab('list');
                }}
                className={`py-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeRosterTab === 'list'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Xem & Quản lý từng học sinh ({editableStudents.length})
              </button>
            </div>

            {activeRosterTab === 'bulk' ? (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Dán trực tiếp từ Excel hoặc danh sách lớp. Hệ thống sẽ tự lọc bỏ số thứ tự thừa nếu có.
                </p>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="1. Nguyễn An Bình&#10;2. Trần Gia Bảo&#10;3. Lê Phương Chi..."
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Add new student inline */}
                <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Nhập họ và tên học sinh mới..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </form>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {editableStudents.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Chưa có học sinh nào trong danh sách.
                    </div>
                  ) : (
                    editableStudents.map((s, index) => (
                      <div
                        key={s.id || index}
                        className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-mono text-slate-400 font-semibold">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-slate-800">{s.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Xóa học sinh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {editableStudents.length > 0
              ? `Tổng cộng: ${editableStudents.length} học sinh`
              : 'Chưa có học sinh'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
