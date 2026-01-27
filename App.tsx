import React, { useState, useMemo, useEffect } from 'react';
import { generateMockSkills, calculateStatus, generateMockPastTests } from './constants';
import { Skill, SkillStatus, MasterySummary, EngagementStats, PersonaType, TestResult } from './types';
import Navbar, { TabType } from './components/Navbar';
import ProgressPage from './components/ProgressPage';
import PracticePage from './components/PracticePage';
import TestPage from './components/TestPage';
import LearnPage from './components/LearnPage';
import TutorialOverlay, { TutorialStep } from './components/TutorialOverlay';

export interface StudyPlanAdjustment {
  date: string;
  weakSkills: string[];
  gainPotential: number;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: '',
    title: 'Welcome to Adaptive SAT',
    description: 'Let\'s take a 60-second tour of how this system optimizes your study path using Bayesian Knowledge Tracing.',
    position: 'center'
  },
  {
    targetId: 'tutorial-bullseye',
    title: 'The Mastery Matrix',
    description: 'This is your Zone of Proximal Development. The amber ring shows skills you\'re ready to master right now for the highest score gains.',
    tab: 'Progress',
    position: 'bottom'
  },
  {
    targetId: 'tutorial-practice-start',
    title: 'Adaptive Practice',
    description: 'When you start a sprint, our engine selects the perfect problems to push your boundaries without causing frustration.',
    tab: 'Practice',
    position: 'top'
  },
  {
    targetId: 'tutorial-hints',
    title: 'Graduated Hint System',
    description: 'Stuck? Use hints to learn concepts. You\'ll still gain mastery points if you solve it, just slightly fewer than if solved independently.',
    tab: 'Practice',
    position: 'top'
  },
  {
    targetId: 'tutorial-test-adjust',
    title: 'Diagnostic Feedback Loop',
    description: 'After every simulation, we analyze your gaps and automatically rewire your practice priorities to target weak spots.',
    tab: 'Test',
    position: 'top'
  },
  {
    targetId: '',
    title: 'You\'re All Set!',
    description: 'Switch personas at any time to see how the dashboard adapts to different student skill levels. Happy studying!',
    position: 'center'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Progress');
  const [persona, setPersona] = useState<PersonaType>(PersonaType.MIKE);
  const [skills, setSkills] = useState<Skill[]>(() => generateMockSkills(PersonaType.MIKE));
  const [pastTests, setPastTests] = useState<TestResult[]>(() => generateMockPastTests(PersonaType.MIKE));
  const [adjustment, setAdjustment] = useState<StudyPlanAdjustment | null>(null);
  
  // Lesson/Skill Detail View State
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [queuedSkillId, setQueuedSkillId] = useState<string | null>(null);

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);

  // Engagement State
  const [minutesToday, setMinutesToday] = useState(12);
  const [practiceLog, setPracticeLog] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date();
    const log = [];
    let frequency = 0.5;
    let streakDays = 7;
    let mins = 12;

    if (persona === PersonaType.SARAH) {
      frequency = 0.3;
      streakDays = 2;
      mins = 5;
    } else if (persona === PersonaType.ALEX) {
      frequency = 0.9;
      streakDays = 24;
      mins = 42;
    }

    for (let i = 1; i < 30; i++) {
      if (Math.random() < frequency || i <= streakDays) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        log.push(d.toISOString().split('T')[0]);
      }
    }
    log.push(today.toISOString().split('T')[0]);
    
    setPracticeLog(log);
    setMinutesToday(mins);
    setSkills(generateMockSkills(persona));
    setPastTests(generateMockPastTests(persona));
    setAdjustment(null); 
    setActiveLessonId(null);
  }, [persona]);

  const dailyGoalMinutes = 35;

  const currentStreak = useMemo(() => {
    const sortedDates = [...new Set(practiceLog)].sort().reverse();
    if (sortedDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak = 0;
    let currentCheck = sortedDates.includes(todayStr) ? todayStr : yesterdayStr;

    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) return 0;

    for (let i = 0; i < 365; i++) {
      const dateStr = new Date(new Date(currentCheck).getTime() - i * 86400000).toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [practiceLog]);

  const engagementStats: EngagementStats = {
    streak: currentStreak,
    minutesToday,
    dailyGoalMinutes,
    practiceLog
  };

  const handleSessionComplete = (minutesEarned: number) => {
    setMinutesToday(prev => prev + minutesEarned);
    const todayStr = new Date().toISOString().split('T')[0];
    setPracticeLog(prev => prev.includes(todayStr) ? prev : [...prev, todayStr]);
    setQueuedSkillId(null);
  };

  const handleNextTutorialStep = () => {
    if (tutorialStep === null) return;
    const nextStep = tutorialStep + 1;
    if (nextStep >= TUTORIAL_STEPS.length) {
      setTutorialStep(null);
    } else {
      const stepData = TUTORIAL_STEPS[nextStep];
      if (stepData.tab) setActiveTab(stepData.tab);
      setTutorialStep(nextStep);
    }
  };

  const handleSelectSkillForLesson = (skillId: string) => {
    setActiveLessonId(skillId);
    setActiveTab('Learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSkill = (skillId: string, newPMastery: number) => {
    setSkills(prevSkills => {
      const updatedSkills = prevSkills.map(skill => {
        if (skill.id === skillId) {
          const clampedP = Math.max(0, Math.min(1, newPMastery));
          return {
            ...skill,
            pMastery: Number(clampedP.toFixed(2)),
            status: calculateStatus(clampedP),
            attempts: skill.attempts + 1,
            lastPracticed: new Date().toISOString(),
          };
        }
        return skill;
      });

      const finalSkills = updatedSkills.map(skill => {
        if (skill.status === SkillStatus.LOCKED && skill.prerequisites && skill.prerequisites.length > 0) {
          const allPrereqsMet = skill.prerequisites.every(prereqId => {
            const pSkill = updatedSkills.find(s => s.id === prereqId);
            return pSkill && pSkill.status === SkillStatus.MASTERED;
          });

          if (allPrereqsMet) {
            return {
              ...skill,
              status: SkillStatus.LEARNING,
              pMastery: 0.40
            };
          }
        }
        return skill;
      });

      return finalSkills;
    });
  };

  const handleAdjustStudyPlan = (testDate: string, performanceData: any[]) => {
    setSkills(prevSkills => {
      const updated = prevSkills.map(skill => {
        const performance = performanceData.find(p => 
          skill.name.toLowerCase().includes(p.topic.toLowerCase()) || 
          p.topic.toLowerCase().includes(skill.name.toLowerCase())
        );
        if (performance) {
          let newP = skill.pMastery;
          if (performance.score < performance.averageScore) {
            newP = Math.max(0.2, skill.pMastery - 0.15);
          } else if (performance.score > performance.averageScore + 10) {
            newP = Math.min(1.0, skill.pMastery + 0.1);
          }
          return {
            ...skill,
            pMastery: Number(newP.toFixed(2)),
            status: calculateStatus(newP)
          };
        }
        return skill;
      });
      return updated;
    });

    const weakAreas = performanceData
      .filter(p => p.score < p.averageScore)
      .map(p => p.topic);

    setAdjustment({
      date: new Date(testDate).toLocaleDateString(undefined, { weekday: 'long' }),
      weakSkills: weakAreas,
      gainPotential: 30 + Math.floor(Math.random() * 20)
    });

    setActiveTab('Practice');
  };

  const stats = useMemo<MasterySummary>(() => {
    return {
      total: skills.length,
      mastered: skills.filter(s => s.status === SkillStatus.MASTERED).length,
      learning: skills.filter(s => s.status === SkillStatus.LEARNING).length,
      locked: skills.filter(s => s.status === SkillStatus.LOCKED).length,
    };
  }, [skills]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Progress':
        return (
          <ProgressPage 
            skills={skills} 
            stats={stats} 
            engagement={engagementStats} 
            pastTests={pastTests} 
            onSelectSkill={handleSelectSkillForLesson}
          />
        );
      case 'Practice':
        return (
          <PracticePage 
            skills={skills} 
            onUpdateSkill={updateSkill} 
            onNavigateToProgress={() => setActiveTab('Progress')}
            adjustment={adjustment}
            engagement={engagementStats}
            onSessionComplete={handleSessionComplete}
            queuedSkillId={queuedSkillId}
          />
        );
      case 'Test':
        return (
          <TestPage 
            pastTests={pastTests}
            onNavigateToProgress={() => setActiveTab('Progress')} 
            onAdjustStudyPlan={handleAdjustStudyPlan}
          />
        );
      case 'Learn':
        return (
          <LearnPage 
            skills={skills} 
            onTabChange={setActiveTab} 
            onSelectPracticeSkill={setQueuedSkillId}
            activeLessonId={activeLessonId}
            setActiveLessonId={setActiveLessonId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-amber-100 relative">
      {/* Persona Switcher Bar - Moved to absolute top */}
      <div className="bg-slate-900 py-3 border-b border-white/10 sticky top-0 z-[60] px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Demo Persona:</span>
            <div className="flex gap-2">
              {[
                { type: PersonaType.SARAH, name: 'Sarah', emoji: '🐣' },
                { type: PersonaType.MIKE, name: 'Mike', emoji: '🦊' },
                { type: PersonaType.ALEX, name: 'Alex', emoji: '🦉' }
              ].map((p) => (
                <button
                  key={p.type}
                  onClick={() => setPersona(p.type)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    persona === p.type 
                      ? 'bg-white text-slate-900 shadow-lg shadow-white/10' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{p.emoji}</span> {p.name}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <button 
              onClick={() => {
                setActiveTab('Progress');
                setTutorialStep(0);
              }}
              className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40"
            >
              🚀 Start Walkthrough
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Calibration Active
          </div>
        </div>
      </div>

      <Navbar activeTab={activeTab} onTabChange={setActiveTab} streak={engagementStats.streak} />

      {tutorialStep !== null && (
        <TutorialOverlay 
          currentStep={tutorialStep}
          totalSteps={TUTORIAL_STEPS.length}
          stepData={TUTORIAL_STEPS[tutorialStep]}
          onNext={handleNextTutorialStep}
          onSkip={() => setTutorialStep(null)}
        />
      )}

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        {renderContent()}
      </main>

      <footer className="max-w-7xl mx-auto px-6 md:px-10 pb-12">
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <div>Adaptive SAT Prep System &copy; 2024</div>
          <div className="flex gap-4">
            <span>Mastery Model v1.0</span>
            <span>•</span>
            <span>Bayesian Knowledge Tracing Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;