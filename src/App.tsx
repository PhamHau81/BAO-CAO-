import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ReportForm } from './components/ReportForm';
import { PreviewCard } from './components/PreviewCard';
import { ConfigModal } from './components/ConfigModal';
import { HistoryModal } from './components/HistoryModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import {
  ClassConfig,
  ReportType,
  AbsentType,
  Student,
  ReportItem,
} from './types';
import { DEFAULT_CONFIG } from './data/defaultData';
import {
  generateReportMessage,
  cleanPhoneNumber,
  getZaloLink,
  formatVietnameseDate,
} from './utils/zaloHelper';

const STORAGE_KEY_CONFIG = 'app_class_zalo_config';
const STORAGE_KEY_HISTORY = 'app_class_zalo_history';

export default function App() {
  // Class configuration loaded from LocalStorage
  const [config, setConfig] = useState<ClassConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.students)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading config from LocalStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  // History records loaded from LocalStorage
  const [history, setHistory] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading history from LocalStorage', e);
    }
    return [];
  });

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Form State
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [period, setPeriod] = useState<string>('Tiết 1');
  const [subject, setSubject] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('ABSENT');
  const [absentType, setAbsentType] = useState<AbsentType>('EXCUSED');
  const [violationTags, setViolationTags] = useState<string[]>([]);
  const [commendationTags, setCommendationTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Toast feedback state
  const [toast, setToast] = useState<{ visible: boolean; message: string; icon: string }>({
    visible: false,
    message: '',
    icon: '✅',
  });

  const showToast = (message: string, icon = '✅') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Persist config whenever it changes
  const handleSaveConfig = (newConfig: ClassConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
      showToast('Đã lưu cấu hình lớp thành công!', '✅');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  // Persist history
  const saveHistory = (items: ReportItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  // Realtime calculated message
  const messageText = useMemo(() => {
    return generateReportMessage({
      config,
      reportType,
      absentType,
      selectedStudents,
      violationTags,
      commendationTags,
      customNote,
      dateStr,
      period,
      subject,
    });
  }, [
    config,
    reportType,
    absentType,
    selectedStudents,
    violationTags,
    commendationTags,
    customNote,
    dateStr,
    period,
    subject,
  ]);

  // Validation
  const validateForm = (): boolean => {
    if (selectedStudents.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh trong danh sách!', '⚠️');
      return false;
    }
    if (
      reportType === 'VIOLATION' &&
      violationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 lỗi vi phạm hoặc nhập ghi chú!', '⚠️');
      return false;
    }
    if (
      reportType === 'COMMENDATION' &&
      commendationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 mục tuyên dương hoặc ghi chú!', '⚠️');
      return false;
    }
    if (!config.zaloPhone.trim()) {
      showToast('Vui lòng nhập Số Zalo của GVCN trong phần Cấu hình!', '⚠️');
      setIsConfigOpen(true);
      return false;
    }
    return true;
  };

  const createHistoryItem = (): ReportItem => {
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      date: dateStr,
      dateDisplay: formatVietnameseDate(dateStr),
      period,
      subject,
      type: reportType,
      absentType: reportType === 'ABSENT' ? absentType : undefined,
      violationTags: reportType === 'VIOLATION' ? violationTags : [],
      commendationTags: reportType === 'COMMENDATION' ? commendationTags : [],
      customNote,
      students: selectedStudents,
      reporter: config.reporterName || 'Ban cán sự',
      teacherName: config.teacherName,
      className: config.className,
      schoolName: config.schoolName,
      formattedMessage: messageText,
    };
  };

  // Handle Send to Zalo
  const handleSendToZalo = () => {
    if (!validateForm()) return;

    // 1. Copy message automatically to clipboard
    navigator.clipboard.writeText(messageText).catch(() => {});

    // 2. Save to history
    const newItem = createHistoryItem();
    saveHistory([newItem, ...history]);

    // 3. Open Zalo chat
    const zaloUrl = getZaloLink(config.zaloPhone);
    showToast('Đã chép nội dung! Đang mở cửa sổ Zalo với GVCN...', '🚀');

    setTimeout(() => {
      window.open(zaloUrl, '_blank');
    }, 250);
  };

  // Handle Copy message
  const handleCopyText = () => {
    navigator.clipboard
      .writeText(messageText)
      .then(() => {
        showToast('Đã sao chép nội dung báo cáo vào Clipboard!', '📋');
      })
      .catch(() => {
        showToast('Lỗi khi sao chép. Vui lòng thử lại!', '❌');
      });
  };

  // Handle Save to history without opening Zalo
  const handleSaveToHistory = () => {
    if (!validateForm()) return;
    const newItem = createHistoryItem();
    saveHistory([newItem, ...history]);
    showToast('Đã lưu lượt báo cáo vào Nhật ký!', '💾');
  };

  // Handle Reset form
  const handleResetForm = () => {
    setSelectedStudents([]);
    setViolationTags([]);
    setCommendationTags([]);
    setCustomNote('');
    showToast('Đã làm mới biểu mẫu để nhập báo cáo tiếp theo!', '🔄');
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử báo cáo?')) {
      saveHistory([]);
      showToast('Đã xóa toàn bộ lịch sử.', '🗑️');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased flex flex-col pb-16">
      {/* Header Bar */}
      <Header
        config={config}
        historyCount={history.length}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 w-full flex-1">
        {/* Welcome / Quick status banner */}
        <div className="mb-5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              📢
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Báo cáo nề nếp học sinh - Gửi Zalo GVCN
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhận nhanh vắng học, vi phạm nội quy và tạo tin nhắn chuẩn mực gửi thẳng đến Zalo Giáo viên chủ nhiệm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
            >
              Lớp: <strong>{config.className || 'Chưa đặt'}</strong> ({config.students.length} học sinh)
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Student selector */}
          <div className="lg:col-span-7">
            <ReportForm
              config={config}
              dateStr={dateStr}
              setDateStr={setDateStr}
              period={period}
              setPeriod={setPeriod}
              subject={subject}
              setSubject={setSubject}
              reportType={reportType}
              setReportType={setReportType}
              absentType={absentType}
              setAbsentType={setAbsentType}
              violationTags={violationTags}
              setViolationTags={setViolationTags}
              commendationTags={commendationTags}
              setCommendationTags={setCommendationTags}
              customNote={customNote}
              setCustomNote={setCustomNote}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>

          {/* Right Column: Real-time Zalo Preview & Direct Action */}
          <div className="lg:col-span-5">
            <PreviewCard
              config={config}
              messageText={messageText}
              hasStudentsSelected={selectedStudents.length > 0}
              onSendToZalo={handleSendToZalo}
              onCopyText={handleCopyText}
              onSaveToHistory={handleSaveToHistory}
              onResetForm={handleResetForm}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        config={config}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onShowToast={showToast}
      />

      <StandaloneExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onShowToast={showToast}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      <div
        className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none max-w-sm ${
          toast.visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 scale-95'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80">
          <span className="text-base">{toast.icon}</span>
          <span className="font-medium text-slate-100">{toast.message}</span>
        </div>
      </div>
    </div>
  );
}
