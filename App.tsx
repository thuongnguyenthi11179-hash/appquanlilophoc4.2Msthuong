import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DataInputView } from './components/DataInputModule/DataInputView';
import { GradingView } from './components/GradingModule/GradingView';
import { AnalysisView } from './components/AnalysisModule/AnalysisView';
import { LessonPlanView } from './components/LessonPlanModule/LessonPlanView';
import { AiConsultantView } from './components/AiConsultantModule/AiConsultantView';
import { StorageService } from './services/storage';

export default function App() {
  const [selectedClassId, setSelectedClassId] = useState<string>('10A1');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<TabType>('grading');

  // Stats for badges
  const [delayedCount, setDelayedCount] = useState<number>(0);
  const [atRiskCount, setAtRiskCount] = useState<number>(0);

  const updateBadges = () => {
    const plans = StorageService.getLessonPlans().filter((p) => p.classId === selectedClassId);
    const delayed = plans.filter((p) => p.status === 'Chậm tiến độ').length;
    setDelayedCount(delayed);

    const summaries = StorageService.getAcademicSummaries(selectedClassId, selectedSemester);
    const atRisk = summaries.filter((s) => s.isAtRisk).length;
    setAtRiskCount(atRisk);
  };

  useEffect(() => {
    updateBadges();
    const handleUpdate = () => updateBadges();
    window.addEventListener('edu_data_updated', handleUpdate);
    return () => window.removeEventListener('edu_data_updated', handleUpdate);
  }, [selectedClassId, selectedSemester]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        selectedClassId={selectedClassId}
        onSelectClass={(cls) => setSelectedClassId(cls)}
        selectedSemester={selectedSemester}
        onSelectSemester={(sem) => setSelectedSemester(sem)}
        onOpenAi={() => setActiveTab('ai-consultant')}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Module Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          delayedCount={delayedCount}
          atRiskCount={atRiskCount}
        />

        {/* Dynamic Module Workspace */}
        <main className="flex-1 min-w-0">
          {activeTab === 'data-input' && (
            <DataInputView selectedClassId={selectedClassId} />
          )}

          {activeTab === 'grading' && (
            <GradingView
              selectedClassId={selectedClassId}
              selectedSemester={selectedSemester}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalysisView
              selectedClassId={selectedClassId}
              selectedSemester={selectedSemester}
            />
          )}

          {activeTab === 'curriculum' && (
            <LessonPlanView selectedClassId={selectedClassId} />
          )}

          {activeTab === 'ai-consultant' && (
            <AiConsultantView
              selectedClassId={selectedClassId}
              selectedSemester={selectedSemester}
            />
          )}
        </main>
      </div>
    </div>
  );
}
