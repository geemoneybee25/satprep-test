import React, { useState, useMemo, useEffect } from 'react';
import { Skill, SkillStatus, EngagementStats, SessionHistoryItem } from '../types';
import { StudyPlanAdjustment } from '../App';

interface PracticePageProps {
  skills: Skill[];
  onUpdateSkill: (id: string, newP: number) => void;
  onNavigateToProgress: () => void;
  adjustment?: StudyPlanAdjustment | null;
  engagement: EngagementStats;
  onSessionComplete: (minutes: number) => void;
  queuedSkillId?: string | null;
}

type HintType = 'Strategic' | 'Conceptual' | 'Procedural' | 'Bottom-out';

interface GraduatedHint {
  level: number;
  type: HintType;
  text: string;
}

interface Problem {
  id: string;
  question: string;
  answer: string;
  hints: GraduatedHint[];
  explanation: string;
}

const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'p1',
    question: `If 3x + 7 = 19, what is the value of 2x - 3?`,
    answer: '5',
    hints: [
      { level: 1, type: 'Strategic', text: "Find x first, then substitute." },
      { level: 2, type: 'Conceptual', text: "Isolate 3x by subtracting 7." },
      { level: 3, type: 'Procedural', text: "3x = 12, so x = 4." },
      { level: 4, type: 'Bottom-out', text: "Substitute 4 into 2x - 3: 2(4) - 3 = 5." }
    ],
    explanation: "First, subtract 7 from both sides to get 3x = 12. Dividing by 3 gives x = 4. Substituting x = 4 into the expression 2x - 3 yields 2(4) - 3 = 8 - 3 = 5."
  },
  {
    id: 'p2',
    question: `Solve for y: 4(y - 2) = 12.`,
    answer: '5',
    hints: [
      { level: 1, type: 'Strategic', text: "Divide both sides by 4 or distribute." },
      { level: 2, type: 'Conceptual', text: "Dividing by 4 gives y - 2 = 3." },
      { level: 3, type: 'Procedural', text: "Add 2 to both sides." },
      { level: 4, type: 'Bottom-out', text: "y = 5." }
    ],
    explanation: "Divide both sides of the equation by 4 to get y - 2 = 3. Then, add 2 to both sides to find that y = 5."
  },
  {
    id: 'p3',
    question: `If f(x) = 2x + 1, find f(3).`,
    answer: '7',
    hints: [
      { level: 1, type: 'Strategic', text: "Substitute 3 into the function." },
      { level: 2, type: 'Conceptual', text: "Replace x with 3." },
      { level: 3, type: 'Procedural', text: "Calculate 2(3) + 1." },
      { level: 4, type: 'Bottom-out', text: "2(3) + 1 = 7." }
    ],
    explanation: "To find f(3), replace every x in the function definition with 3: f(3) = 2(3) + 1 = 6 + 1 = 7."
  },
  {
    id: 'p4',
    question: `Find the value of x: 2x + 5 = 13.`,
    answer: '4',
    hints: [
      { level: 1, type: 'Strategic', text: "Subtract 5 from both sides." },
      { level: 2, type: 'Conceptual', text: "2x = 8." },
      { level: 3, type: 'Procedural', text: "Divide by 2." },
      { level: 4, type: 'Bottom-out', text: "x = 4." }
    ],
    explanation: "Subtract 5 from both sides of the equation to get 2x = 8. Dividing both sides by 2 results in x = 4."
  },
  {
    id: 'p5',
    question: `If x/4 - 2 = 1, what is the value of x?`,
    answer: '12',
    hints: [
      { level: 1, type: 'Strategic', text: "Isolate the fraction term first." },
      { level: 2, type: 'Conceptual', text: "Add 2 to both sides." },
      { level: 3, type: 'Procedural', text: "x/4 = 3." },
      { level: 4, type: 'Bottom-out', text: "Multiply by 4: x = 12." }
    ],
    explanation: "Add 2 to both sides to get x/4 = 3. Multiply both sides by 4 to find x = 12."
  },
  {
    id: 'p6',
    question: `Solve for x: 3(2x - 5) = 15.`,
    answer: '5',
    hints: [
      { level: 1, type: 'Strategic', text: "Divide by 3 or distribute first." },
      { level: 2, type: 'Conceptual', text: "Dividing by 3 gives 2x - 5 = 5." },
      { level: 3, type: 'Procedural', text: "Add 5: 2x = 10." },
      { level: 4, type: 'Bottom-out', text: "x = 5." }
    ],
    explanation: "Divide both sides by 3 to get 2x - 5 = 5. Add 5 to both sides to get 2x = 10, then divide by 2 to find x = 5."
  },
  {
    id: 'p7',
    question: `If x + 2y = 10 and x = 4, what is the value of y?`,
    answer: '3',
    hints: [
      { level: 1, type: 'Strategic', text: "Substitute the known value of x." },
      { level: 2, type: 'Conceptual', text: "4 + 2y = 10." },
      { level: 3, type: 'Procedural', text: "Subtract 4: 2y = 6." },
      { level: 4, type: 'Bottom-out', text: "y = 3." }
    ],
    explanation: "Substitute x = 4 into the equation to get 4 + 2y = 10. Subtract 4 from both sides to get 2y = 6. Divide by 2 to find y = 3."
  },
  {
    id: 'p8',
    question: `Solve for x: 7x - 2 = 5x + 8.`,
    answer: '5',
    hints: [
      { level: 1, type: 'Strategic', text: "Group all x terms on one side." },
      { level: 2, type: 'Conceptual', text: "Subtract 5x from both sides." },
      { level: 3, type: 'Procedural', text: "2x - 2 = 8, so 2x = 10." },
      { level: 4, type: 'Bottom-out', text: "x = 5." }
    ],
    explanation: "Subtract 5x from both sides to get 2x - 2 = 8. Add 2 to both sides to get 2x = 10. Divide by 2 to find x = 5."
  },
  {
    id: 'p9',
    question: `If h(x) = x² - 10, find h(4).`,
    answer: '6',
    hints: [
      { level: 1, type: 'Strategic', text: "Plug 4 into the function." },
      { level: 2, type: 'Conceptual', text: "h(4) = 4² - 10." },
      { level: 3, type: 'Procedural', text: "Calculate 16 - 10." },
      { level: 4, type: 'Bottom-out', text: "The answer is 6." }
    ],
    explanation: "Substitute x = 4 into the function: h(4) = 4² - 10 = 16 - 10 = 6."
  },
  {
    id: 'p10',
    question: `If 2x + y = 12 and y = 2x, what is the value of x?`,
    answer: '3',
    hints: [
      { level: 1, type: 'Strategic', text: "Use substitution for y." },
      { level: 2, type: 'Conceptual', text: "Replace y with 2x: 2x + 2x = 12." },
      { level: 3, type: 'Procedural', text: "Combine terms: 4x = 12." },
      { level: 4, type: 'Bottom-out', text: "x = 3." }
    ],
    explanation: "Substitute y = 2x into the first equation: 2x + 2x = 12. This simplifies to 4x = 12. Dividing by 4 gives x = 3."
  }
];

const SESSION_TARGET = 10;

const PracticePage: React.FC<PracticePageProps> = ({ skills, onUpdateSkill, onNavigateToProgress, engagement, onSessionComplete, queuedSkillId }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectionRationale, setSelectionRationale] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Tracking detailed metrics
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [initialMastery, setInitialMastery] = useState<number>(0);

  // Persistent state for hint explanation box
  const [showHintExplanation, setShowHintExplanation] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sat_adaptive_hide_hint_info_v3') !== 'true';
    }
    return true;
  });

  const handleDismissHintExplanation = () => {
    setShowHintExplanation(false);
    localStorage.setItem('sat_adaptive_hide_hint_info_v3', 'true');
  };
  
  const [problemsCompleted, setProblemsCompleted] = useState(0);
  const [sessionSkills, setSessionSkills] = useState<Set<string>>(new Set());
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const learningSkills = useMemo(() => skills.filter(s => s.status === SkillStatus.LEARNING), [skills]);
  
  useEffect(() => {
    if (queuedSkillId && !isPracticing && !showIntro && !isSelecting) {
      handleBeginSession(queuedSkillId);
    }
  }, [queuedSkillId]);

  const weeklySchedule = useMemo(() => {
    const today = new Date();
    const startOfSelectedWeek = new Date(today);
    // Start from the Sunday of the selected week (Sunday = 0)
    startOfSelectedWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    const days = [];
    const learningZone = [...learningSkills];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfSelectedWeek);
      day.setDate(startOfSelectedWeek.getDate() + i);
      
      const daySkills = [];
      const skillCount = i % 3 === 0 ? 2 : 1;
      
      for (let j = 0; j < skillCount; j++) {
        const skillIndex = (i + j + weekOffset * 3) % (learningZone.length || 1);
        if (learningZone[skillIndex]) daySkills.push(learningZone[skillIndex]);
      }

      const isRealToday = day.toDateString() === today.toDateString();

      days.push({
        date: day,
        label: isRealToday ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: day.getDate(),
        isToday: isRealToday,
        skills: daySkills,
        taskType: i % 2 === 0 ? 'Review' : 'Deep Dive'
      });
    }
    return days;
  }, [learningSkills, weekOffset]);

  const weekOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay() + (i * 7));
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      
      const label = i === 0 ? 'Current Week' : i === 1 ? 'Next Week' : `Week of ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      options.push({ value: i, label });
    }
    return options;
  }, []);

  const selectedSkill = useMemo(() => 
    skills.find(s => s.id === selectedSkillId) || null
  , [skills, selectedSkillId]);

  const currentProblem = useMemo<Problem>(() => {
    return MOCK_PROBLEMS[problemsCompleted % MOCK_PROBLEMS.length];
  }, [problemsCompleted]);

  const handleNextProblem = () => {
    const nextCount = problemsCompleted + 1;
    if (nextCount >= SESSION_TARGET) {
      setIsSessionFinished(true);
      onSessionComplete(15);
      return;
    }
    setProblemsCompleted(nextCount);
    setFeedback(null);
    setUserAnswer('');
    setHintLevel(0);
    setProblemStartTime(Date.now());
  };

  const handleBeginSession = (forceSkillId?: string) => {
    setProblemsCompleted(0);
    setSessionSkills(new Set());
    setIsSessionFinished(false);
    setIsSelecting(true);
    setShowIntro(false);
    setIsPracticing(false);
    setFeedback(null);
    setUserAnswer('');
    setHintLevel(0);
    setSessionHistory([]);

    setTimeout(() => {
        const initialSkill = forceSkillId 
          ? skills.find(s => s.id === forceSkillId) 
          : (skills.find(s => s.name === 'Linear Equations in One Variable') || skills[0]);
        
        setSelectedSkillId(initialSkill?.id || skills[0].id);
        setInitialMastery(initialSkill?.pMastery || 0);
        setSelectionRationale(forceSkillId ? `Starting focused sprint for ${initialSkill?.name}.` : 'Starting your adaptive sprint.');
        setIsSelecting(false);
        setShowIntro(true);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || !selectedSkill || feedback !== null) return;
    const isCorrect = userAnswer.trim() === currentProblem.answer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Track this problem in session history
    const timeSpent = problemStartTime ? Math.floor((Date.now() - problemStartTime) / 1000) : 0;
    setSessionHistory(prev => [...prev, {
      problemId: currentProblem.id,
      question: currentProblem.question,
      isCorrect,
      timeSpent,
      hintsUsed: currentProblem.hints.slice(0, hintLevel).map(h => h.text),
      explanation: currentProblem.explanation
    }]);

    let delta = isCorrect ? (hintLevel === 0 ? 0.15 : 0.08) : -0.05;
    const newP = Math.max(0, Math.min(1, selectedSkill.pMastery + delta));

    onUpdateSkill(selectedSkill.id, newP);
    setSessionSkills(prev => new Set(prev).add(selectedSkill.id));
  };

  const handleHintClick = () => {
    if (hintLevel < currentProblem.hints.length) {
      setHintLevel(prev => prev + 1);
    }
  };

  const practicedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return engagement.practiceLog.includes(today);
  }, [engagement.practiceLog]);

  if (isSessionFinished) {
    const accuracy = Math.round((sessionHistory.filter(h => h.isCorrect).length / sessionHistory.length) * 100);
    const totalHints = sessionHistory.reduce((acc, curr) => acc + curr.hintsUsed.length, 0);
    const avgHintsPerProblem = totalHints / sessionHistory.length;
    const avgTimePerProblem = Math.round(sessionHistory.reduce((acc, curr) => acc + curr.timeSpent, 0) / sessionHistory.length / 60 * 10) / 10;
    const finalMastery = selectedSkill?.pMastery || 0;
    const masteryDelta = Math.round((finalMastery - initialMastery) * 100);
    const isMastered = finalMastery >= 0.85;

    const hintDescriptor = avgHintsPerProblem < 0.5 ? "minimal hint usage" : 
                           avgHintsPerProblem <= 1.0 ? "moderate hint usage" : 
                           "frequent hint usage";

    let whyUpdateText = "";
    if (accuracy >= 80) whyUpdateText = `Your strong accuracy with ${hintDescriptor} shows excellent progress.`;
    else if (accuracy >= 60) whyUpdateText = `Your solid performance with ${hintDescriptor} shows good progress.`;
    else whyUpdateText = "Your performance suggests this skill needs more practice.";

    if (masteryDelta < 0) {
      whyUpdateText += ` Don't worry—this happens! Your ${accuracy}% accuracy suggests reviewing prerequisites first.`;
    }

    return (
      <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            {isMastered ? '🎉 SKILL MASTERED!' : '🎉 Session Complete'}
          </h1>
          <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">{selectedSkill?.name}</p>
          <p className="text-slate-400 font-medium mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} • {Math.round(sessionHistory.reduce((a,b)=>a+b.timeSpent, 0)/60)} minutes
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Estimated Mastery Section */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-4 right-4 group cursor-help">
              <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold text-white group-hover:bg-white/10 transition-colors">i</div>
              <div className="absolute top-full right-0 mt-3 w-72 bg-white text-slate-700 text-xs p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none border border-slate-100 font-medium leading-relaxed">
                Based on your accuracy, hint usage, and problem difficulty using Bayesian Knowledge Tracing—a research-backed algorithm for estimating skill mastery. We use a proven statistical model to estimate your probability of having learned this skill.
              </div>
            </div>
            <div className="text-6xl font-black mb-2">{Math.round(finalMastery * 100)}%</div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Estimated Mastery</div>
            {isMastered && <div className="mt-4 px-4 py-1 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">✨ MASTERED!</div>}
          </div>

          {/* Session Summary Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-100 grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attempted</p>
              <p className="text-2xl font-black text-slate-900">{sessionHistory.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Correct</p>
              <p className="text-2xl font-black text-slate-900">{sessionHistory.filter(h=>h.isCorrect).length} ({accuracy}%)</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hints Used</p>
              <p className="text-2xl font-black text-slate-900">{totalHints}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Time</p>
              <p className="text-2xl font-black text-slate-900">{avgTimePerProblem}m</p>
            </div>
          </div>
        </div>

        {/* Mastery Update Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-100 mb-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <span>📈</span> Mastery Update
          </h3>
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Before: {Math.round(initialMastery * 100)}%</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black ${masteryDelta >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                After: {Math.round(finalMastery * 100)}% {masteryDelta >= 0 ? '↗️' : '↘️'} {masteryDelta >= 0 ? '+' : ''}{masteryDelta}%
              </p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2">
                <span>Previous</span>
                <span>{Math.round(initialMastery * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 transition-all duration-1000" style={{ width: `${initialMastery * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-900 uppercase mb-2">
                <span>Updated</span>
                <span className={masteryDelta >= 0 ? 'text-green-600' : 'text-rose-600'}>{Math.round(finalMastery * 100)}% ({masteryDelta >= 0 ? '+' : ''}{masteryDelta}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${masteryDelta >= 0 ? 'bg-green-500' : 'bg-rose-500'}`} style={{ width: `${finalMastery * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
             <div className="text-sm font-bold text-slate-500">🎯 {isMastered ? 'Mastery goal reached!' : `You need 85% to master this skill`}</div>
             {!isMastered && <div className="text-xs font-black text-slate-400 uppercase tracking-widest">📊 {Math.round((0.85 - finalMastery) * 100)}% away from mastery</div>}
          </div>
        </div>

        {/* Why This Update? Card */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 mb-8">
          <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2">
            <span>💡</span> Why This Update?
          </h3>
          <p className="text-indigo-800 font-bold mb-6 text-lg">{whyUpdateText}</p>
          <ul className="space-y-3">
             <li className="flex items-center gap-3 text-indigo-700/80 font-semibold">
                <span className="w-5 h-5 bg-green-200 text-green-700 rounded-full flex items-center justify-center text-[10px] font-black">✓</span>
                Strengths: Solving for variables, handling integer subtraction.
             </li>
             <li className="flex items-center gap-3 text-indigo-700/80 font-semibold">
                <span className="w-5 h-5 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-black">!</span>
                Focus next: Distribution property and managing fractional results.
             </li>
          </ul>
        </div>

        {/* Problem Review Section */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-100 mb-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>📝</span> Problem Review
              </h3>
           </div>
           
           <div className="space-y-4">
              {sessionHistory.map((item, idx) => (
                 <details key={idx} className="group border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                    <summary className="list-none cursor-pointer p-5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <span className={item.isCorrect ? 'text-green-500' : 'text-rose-500'}>{item.isCorrect ? '✅' : '❌'}</span>
                          <span className="font-bold text-slate-700 truncate max-w-xs">{item.question}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase bg-white border border-slate-100 px-2.5 py-1 rounded-full">{item.hintsUsed.length} Hints</span>
                          <span className="text-slate-300">
                             <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                             </svg>
                          </span>
                       </div>
                    </summary>
                    <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2">
                       <div className="text-sm text-slate-600 font-medium bg-white p-4 rounded-xl border border-slate-100">
                          {item.question}
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-amber-600 uppercase">Hints used: {item.hintsUsed.length}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Time spent: {item.timeSpent}s</p>
                       </div>
                       <div className="flex gap-3 pt-2">
                          <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50">Review Problem</button>
                          <button className="flex-1 py-3 bg-slate-900 rounded-xl text-xs font-black text-white hover:bg-slate-800">Practice Similar</button>
                       </div>
                    </div>
                 </details>
              ))}
           </div>
        </div>

        {/* What's Next? Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white mb-12 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">🎯 What's Next?</h3>
           
           <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
              <div className="flex-1">
                 <h4 className="text-2xl font-black mb-2">Continue {selectedSkill?.name}</h4>
                 <p className="text-slate-400 font-medium">Focus on: <span className="text-white">Multi-step isolation</span></p>
              </div>
              <button onClick={() => handleBeginSession(selectedSkillId || undefined)} className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">Start Practice</button>
           </div>

           <div className="pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Or try another available skill:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {skills.filter(s => s.status === SkillStatus.LEARNING && s.id !== selectedSkillId).slice(0, 2).map(skill => (
                    <button key={skill.id} onClick={() => handleBeginSession(skill.id)} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group">
                       <div>
                          <p className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{skill.name}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase">{Math.round(skill.pMastery * 100)}% Mastery</p>
                       </div>
                       <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7-7" />
                       </svg>
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
           <button onClick={onNavigateToProgress} className="px-10 py-5 bg-white border-2 border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all active:scale-95">View Progress Dashboard</button>
           <button onClick={() => { setIsSessionFinished(false); setIsPracticing(false); setShowIntro(false); }} className="px-10 py-5 bg-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95">Practice Another Skill</button>
        </div>
      </div>
    );
  }

  if (showIntro && selectedSkill) {
    return (
      <div className="max-w-3xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[3rem] border border-slate-200 p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-amber-100">Learning Zone</div>
            <h1 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Focused Sprint</h1>
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{selectedSkill.name}</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-xl mx-auto font-medium">This subject is currently in your <strong>Learning Zone</strong>. Based on your trajectory, this skill offers the highest potential for score improvement right now.</p>
            <button onClick={() => { setShowIntro(false); setIsPracticing(true); setProblemStartTime(Date.now()); }} className="bg-slate-900 text-white px-16 py-6 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl">Start Practice</button>
          </div>
        </div>
      </div>
    );
  }

  if (isPracticing && selectedSkill) {
    const activeHints = currentProblem.hints.slice(0, hintLevel);
    const hasMoreHints = hintLevel < currentProblem.hints.length;
    return (
      <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-500">
        {showHintExplanation && (
          <div className="mb-8 bg-white border-2 border-slate-900 rounded-2xl p-8 relative animate-in slide-in-from-top-4 duration-500 shadow-xl overflow-hidden">
            <button 
              onClick={handleDismissHintExplanation}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-50"
              aria-label="Dismiss hint explanation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex gap-6">
              <div className="text-4xl mt-1">💡</div>
              <div className="flex-1 pr-6">
                <h4 className="font-black text-slate-900 text-lg uppercase tracking-[0.1em] mb-4">How hints work</h4>
                <div className="space-y-3">
                  <p className="text-slate-700 text-base font-semibold leading-relaxed">
                    Hints are part of learning—not cheating.
                  </p>
                  <p className="text-slate-700 text-base font-semibold leading-relaxed">
                    Use them when stuck to build understanding.
                  </p>
                  <p className="text-slate-700 text-base font-semibold leading-relaxed">
                    As you improve, hints will naturally fade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Session Progress</span>
             <span className="text-sm font-bold text-slate-700">Problem {problemsCompleted + 1} of {SESSION_TARGET}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1 rounded-full mb-1">{selectedSkill.name}</div>
            <span className="text-[10px] text-slate-400 font-medium italic">{selectionRationale}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
          <div className="h-2 w-full bg-slate-100"><div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(problemsCompleted / SESSION_TARGET) * 100}%` }} /></div>
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8">{currentProblem.question}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Type your answer..." disabled={feedback !== null} className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 text-xl font-bold transition-all focus:outline-none focus:ring-4 ${feedback === 'correct' ? 'border-green-500 bg-green-50 ring-green-100' : feedback === 'incorrect' ? 'border-red-500 bg-red-50 ring-red-100' : 'border-slate-100 focus:border-slate-900'}`} autoFocus />
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="submit" disabled={!userAnswer || feedback !== null} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50">Submit Answer</button>
                <button type="button" id="tutorial-hints" onClick={handleHintClick} disabled={!hasMoreHints || feedback !== null} className="flex-none px-6 py-4 rounded-xl border-2 font-bold flex items-center gap-2 bg-white border-slate-100 text-slate-500 disabled:opacity-50">🙋 Hint {hintLevel > 0 ? `${hintLevel}/4` : ''}</button>
              </div>
            </form>
            <div className="mt-8 space-y-4">
              {activeHints.map((hint, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-2 text-sm font-medium animate-in slide-in-from-top-2 ${hint.type === 'Strategic' ? 'bg-blue-50 border-blue-100 text-blue-800' : hint.type === 'Conceptual' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-purple-50 border-purple-100 text-purple-800'}`}><span className="text-[10px] font-bold uppercase mr-2 opacity-60">{hint.type}</span>{hint.text}</div>
              ))}
            </div>
            {feedback !== null && (
              <div className="mt-10 pt-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-500 text-center">
                <div className={`p-6 rounded-2xl border-2 ${feedback === 'correct' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                   <h4 className="text-lg font-black mb-2 uppercase tracking-tight">{feedback === 'correct' ? 'Correct!' : 'Not Quite Right'}</h4>
                   <p className="text-slate-700 text-sm leading-relaxed"><span className="font-bold">Explanation:</span> {currentProblem.explanation}</p>
                </div>
                <button onClick={handleNextProblem} className="bg-slate-900 text-white font-black px-12 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95">{problemsCompleted + 1 >= SESSION_TARGET ? 'Finish Session' : 'Next Problem'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-700">
      {!practicedToday && (
        <div className="mb-12">
          <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-lg">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-sm animate-pulse">🔥</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-rose-900 text-2xl font-black mb-2 tracking-tight">Ready to continue your {engagement.streak}-day streak?</h3>
              <p className="text-rose-700/70 font-medium">Keep your momentum going. Don't let your progress cool down!</p>
            </div>
            <button onClick={() => handleBeginSession()} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl">Extend Streak</button>
          </div>
        </div>
      )}

      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-2 gap-6">
          <div className="flex-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Adaptive Training Path</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Weekly Study Sprint</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <select 
                value={weekOffset}
                onChange={(e) => setWeekOffset(Number(e.target.value))}
                className="appearance-none w-full sm:w-64 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 pr-10 text-xs font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:border-slate-900 transition-all shadow-sm cursor-pointer"
              >
                {weekOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weeklySchedule.map((day, idx) => (
            <div key={idx} className={`relative group bg-white rounded-[2rem] border transition-all duration-300 p-5 flex flex-col min-h-[180px] ${day.isToday ? 'border-slate-900 shadow-xl ring-2 ring-slate-900/5' : 'border-slate-100 hover:border-slate-300'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${day.isToday ? 'text-slate-900' : 'text-slate-400'}`}>{day.label}</span>
                  <span className={`text-2xl font-black ${day.isToday ? 'text-slate-900' : 'text-slate-300'}`}>{day.dayNum}</span>
                </div>
                {day.isToday && <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-[10px] text-white">🎯</div>}
              </div>
              <div className="flex-1 space-y-2">
                {day.skills.length > 0 ? day.skills.map((skill, sIdx) => (
                  <div key={sIdx} className={`p-2 rounded-xl border text-[9px] font-bold transition-all ${day.isToday ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    <p className="truncate leading-tight">{skill.name}</p>
                  </div>
                )) : (
                  <div className="p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-400">Recovery</span>
                  </div>
                )}
              </div>
              {day.isToday && <div className="mt-4 pt-3 border-t border-slate-100"><div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{ width: `${Math.min(100, (engagement.minutesToday / engagement.dailyGoalMinutes) * 100)}%` }} /></div></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-white rounded-[2rem] border border-slate-200 p-12 shadow-2xl shadow-slate-200/40">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-3xl mb-8 rotate-3 transition-transform hover:rotate-0"><svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Ready for your Sprint?</h1>
          <p className="text-slate-500 text-lg max-w-sm mx-auto mb-10 leading-relaxed">We'll serve you 10 problems tailored precisely to your current knowledge state.</p>
          <button id="tutorial-practice-start" onClick={() => handleBeginSession()} disabled={isSelecting} className="group relative overflow-hidden bg-slate-900 text-white px-16 py-6 rounded-2xl font-black text-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-slate-900/20">{isSelecting ? 'Calibrating...' : 'Start 10-Problem Sprint'}</button>
        </div>
      </div>
    </div>
  );
};

export default PracticePage;