import React, { useState, useMemo } from 'react';
import { Skill, SkillStatus, MasterySummary, EngagementStats, TestResult } from '../types';
import SkillTrajectory from './SkillTrajectory';

interface ProgressPageProps {
  skills: Skill[];
  stats: MasterySummary;
  engagement: EngagementStats;
  pastTests: TestResult[];
  onSelectSkill: (skillId: string) => void;
}

type ProgressTab = 'Overview' | 'Trajectory' | 'Skills';

const ScoreChart: React.FC<{ 
  data: number[]; 
  color?: string; 
  height?: number; 
  target?: number;
  id?: string;
  isOverall?: boolean;
}> = ({ 
  data, 
  color = "#60A5FA", 
  height = 128, 
  target,
  id = "chart",
  isOverall = false
}) => {
  const min = isOverall ? 400 : 200;
  const max = isOverall ? 1600 : 800;
  
  const points = useMemo(() => data.map((val, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((val - min) / (max - min)) * 100,
    value: val
  })), [data, min, max]);

  const linePath = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i+1];
      const cp1x = curr.x + (next.x - curr.x) * 0.4;
      const cp2x = next.x - (next.x - curr.x) * 0.4;
      d += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath) return "";
    return `${linePath} L 100,100 L 0,100 Z`;
  }, [linePath]);

  const targetY = target ? 100 - ((target - min) / (max - min)) * 100 : null;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {targetY !== null && (
          <line x1="0" y1={targetY} x2="100" y2={targetY} stroke="rgba(255,255,255,0.15)" strokeDasharray="1,1" strokeWidth="0.3" />
        )}
        <path d={areaPath} fill={`url(#grad-${id})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
      </svg>
      <div className="absolute inset-0 pointer-events-none">
        {points.map((p, i) => (
          <div key={i} className="group pointer-events-auto absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-[1.8]" style={{ backgroundColor: color }} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              {p.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressPage: React.FC<ProgressPageProps> = ({ skills, stats, engagement, pastTests, onSelectSkill }) => {
  const [activeTab, setActiveTab] = useState<ProgressTab>('Overview');
  const [expandedSection, setExpandedSection] = useState<SkillStatus | null>(SkillStatus.LEARNING);
  const [highlightedZone, setHighlightedZone] = useState<SkillStatus | null>(SkillStatus.LEARNING);

  const learningSkills = useMemo(() => skills.filter(s => s.status === SkillStatus.LEARNING), [skills]);
  const masteredSkills = useMemo(() => skills.filter(s => s.status === SkillStatus.MASTERED), [skills]);
  const lockedSkills = useMemo(() => skills.filter(s => s.status === SkillStatus.LOCKED), [skills]);

  const avgPMastery = useMemo(() => {
    return skills.reduce((acc, s) => acc + s.pMastery, 0) / skills.length;
  }, [skills]);

  const baselineTest = [...pastTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const startingScore = baselineTest ? baselineTest.totalScore : 1100;
  const readingBaseline = baselineTest ? baselineTest.readingScore + 40 : 620;
  const mathPredicted = 200 + Math.round(avgPMastery * 600);
  const overallPredictedScore = mathPredicted + readingBaseline;
  
  const targetScoreOverall = Math.max(overallPredictedScore + 100, 1500);
  const weeksToGoal = Math.max(1, Math.round((targetScoreOverall - overallPredictedScore) / 25));

  const projectedScore = overallPredictedScore;

  const scoreTrendOverall = useMemo(() => {
    const historical = [...pastTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => t.totalScore);
    return [...historical, overallPredictedScore];
  }, [pastTests, overallPredictedScore]);

  const scoreTrendMath = useMemo(() => {
    const historical = [...pastTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => t.mathScore);
    return [...historical, mathPredicted];
  }, [pastTests, mathPredicted]);

  const scoreTrendReading = useMemo(() => {
    const historical = [...pastTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => t.readingScore);
    return [...historical, readingBaseline];
  }, [pastTests, readingBaseline]);

  const handleZoneClick = (zone: SkillStatus) => {
    setExpandedSection(zone);
    setHighlightedZone(zone);
  };

  const calculateZPDProgress = (p: number) => {
    const min = 0.40;
    const max = 0.85;
    const relative = (p - min) / (max - min);
    return Math.max(0, Math.min(100, relative * 100));
  };

  const getPrereqDisplay = (prereqIds: string[]) => {
    if (!prereqIds || prereqIds.length === 0) return null;
    const prereqSkills = prereqIds.map(id => skills.find(s => s.id === id));
    const masteredCount = prereqSkills.filter(s => s && s.status === SkillStatus.MASTERED).length;
    return {
      masteredCount,
      totalCount: prereqIds.length,
      names: prereqSkills.map(s => s?.name).join(', ')
    };
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl self-start mb-2">
        {(['Overview', 'Trajectory', 'Skills'] as ProgressTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-100 flex flex-col justify-center overflow-hidden relative min-h-[280px]">
             <div>
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Predicted SAT Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-slate-900">{overallPredictedScore}</span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                   Target: {targetScoreOverall} • {weeksToGoal}w to goal
                </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl shadow-slate-200 relative overflow-hidden min-h-[280px]">
            <div>
              <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Core Trajectory</h3>
              <ScoreChart id="overview-trend" data={scoreTrendOverall} color="#60A5FA" height={80} isOverall={true} />
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs font-black text-blue-400">Steady Growth</span>
              <span className="text-[10px] font-bold text-slate-500">+{overallPredictedScore - scoreTrendOverall[0]} PTS GAIN</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-100 flex flex-col justify-between min-h-[280px]">
            <div>
              <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">Learning Activity</h3>
              <div className="flex items-center gap-6 mb-8">
                <div className="text-5xl">🔥</div>
                <div>
                  <span className="text-4xl font-black text-slate-900 block leading-none">{engagement.streak}</span>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Day Streak</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Hours Studied</span>
                  <span className="text-lg font-black text-slate-900">{(engagement.minutesToday / 60).toFixed(1)}h</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: `${Math.min(100, (engagement.minutesToday / engagement.dailyGoalMinutes) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Trajectory' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl">
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-8">Comprehensive History</h3>
                <ScoreChart id="main-trend" data={scoreTrendOverall} color="#60A5FA" height={160} target={targetScoreOverall} isOverall={true} />
                <div className="mt-8 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Baseline</span>
                  <span>Predicted Current</span>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">∑</div>
                     <div>
                       <h4 className="font-bold text-slate-800">Math Section</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Projected: {mathPredicted}</p>
                     </div>
                   </div>
                   <div className="w-48">
                      <ScoreChart id="math-trend" data={scoreTrendMath} color="#F59E0B" height={40} isOverall={false} />
                   </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">✎</div>
                     <div>
                       <h4 className="font-bold text-slate-800">Reading & Writing</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Projected: {readingBaseline}</p>
                     </div>
                   </div>
                   <div className="w-48">
                      <ScoreChart id="reading-trend" data={scoreTrendReading} color="#3B82F6" height={40} isOverall={false} />
                   </div>
                </div>
                <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex-1">
                   <h4 className="text-indigo-900 font-black text-lg mb-2">Strategy Insight</h4>
                   <p className="text-indigo-800/70 text-sm leading-relaxed">
                     Your current mastery trajectory suggests a strong upward trend. Focus on Reading Comprehension to balance your profile.
                   </p>
                </div>
             </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Simulation Archive</h3>
            <div className="space-y-4">
              {[...pastTests].reverse().map((test) => (
                <div key={test.id} className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                       <span className="text-[8px] font-black uppercase opacity-50">{new Date(test.date).toLocaleString('default', { month: 'short' })}</span>
                       <span className="text-xl font-bold leading-none">{new Date(test.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Adaptive Simulation #{test.id.split('-')[1]}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status: Score Verified • {new Date(test.date).getFullYear()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-center">
                       <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Total Score</span>
                       <span className="text-3xl font-black text-slate-900">{test.totalScore}</span>
                    </div>
                    <div className="w-px h-10 bg-slate-100 hidden md:block" />
                    <button className="bg-white border-2 border-slate-900 text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                       Review Score Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Skills' && (
        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Learning Journey</h2>
              <p className="text-slate-500 font-medium">Tracking {stats.learning} active skills in your path to mastery.</p>
            </div>
            
            <SkillTrajectory 
              stats={stats} 
              activeZone={highlightedZone} 
              onZoneClick={handleZoneClick} 
              startingScore={startingScore}
              projectedScore={projectedScore}
            />
          </div>

          <div className="space-y-6">
            <div id={`section-${SkillStatus.LEARNING}`} className={`rounded-[2rem] border transition-all duration-300 ${expandedSection === SkillStatus.LEARNING ? 'bg-white border-amber-200 shadow-2xl shadow-amber-200/10' : 'bg-slate-50 border-transparent hover:bg-slate-100 cursor-pointer'}`}>
              <button className="w-full px-10 py-8 flex items-center justify-between" onClick={() => handleZoneClick(SkillStatus.LEARNING)}>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-amber-200/50">🎯</div>
                  <div className="text-left max-w-2xl">
                    <span className="font-black text-slate-900 text-xl block leading-tight">Learning Zone</span>
                    <p className="text-[11px] font-medium text-amber-800/70 mt-1 leading-relaxed">
                      These skills will feel challenging—that's the point. Click any skill to view its full lesson and resources.
                    </p>
                  </div>
                </div>
                <svg className={`w-6 h-6 text-slate-400 transition-transform ${expandedSection === SkillStatus.LEARNING ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === SkillStatus.LEARNING && (
                <div className="px-10 pb-10 space-y-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {learningSkills.map(skill => (
                      <div 
                        key={skill.id} 
                        onClick={() => onSelectSkill(skill.id)}
                        className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-amber-400 hover:shadow-xl hover:shadow-amber-100/50 transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 pr-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{skill.category}</span>
                            <span className="text-base font-black text-slate-800 group-hover:text-amber-600 transition-colors leading-tight block">{skill.name}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000" style={{ width: `${calculateZPDProgress(skill.pMastery)}%` }} />
                        </div>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-amber-400 transition-colors">View Lesson & Resources</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div id={`section-${SkillStatus.MASTERED}`} className={`rounded-[2rem] border transition-all duration-300 ${expandedSection === SkillStatus.MASTERED ? 'bg-white border-green-200 shadow-2xl shadow-green-200/10' : 'bg-slate-50 border-transparent hover:bg-slate-100 cursor-pointer'}`}>
              <button className="w-full px-10 py-8 flex items-center justify-between" onClick={() => handleZoneClick(SkillStatus.MASTERED)}>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-green-200/50">✅</div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 text-xl block leading-tight">Mastered Area</span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-[0.2em]">{masteredSkills.length} SKILLS COMPLETED</span>
                  </div>
                </div>
                <svg className={`w-6 h-6 text-slate-400 transition-transform ${expandedSection === SkillStatus.MASTERED ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === SkillStatus.MASTERED && (
                <div className="px-10 pb-10 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {masteredSkills.map(skill => (
                      <div 
                        key={skill.id} 
                        onClick={() => onSelectSkill(skill.id)}
                        className="p-4 bg-green-50/40 rounded-2xl border border-green-100/50 flex items-center justify-between cursor-pointer hover:bg-green-100/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          <p className="font-bold text-green-900 text-sm truncate">{skill.name}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase text-green-600/60 ml-2">100%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div id={`section-${SkillStatus.LOCKED}`} className={`rounded-[2rem] border transition-all duration-300 ${expandedSection === SkillStatus.LOCKED ? 'bg-white border-slate-300 shadow-2xl shadow-slate-100' : 'bg-slate-50 border-transparent hover:bg-slate-100 cursor-pointer'}`}>
              <button className="w-full px-10 py-8 flex items-center justify-between" onClick={() => handleZoneClick(SkillStatus.LOCKED)}>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center text-2xl">⏳</div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 text-xl block leading-tight">Not Ready</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{lockedSkills.length} SKILLS PENDING</span>
                  </div>
                </div>
                <svg className={`w-6 h-6 text-slate-400 transition-transform ${expandedSection === SkillStatus.LOCKED ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === SkillStatus.LOCKED && (
                <div className="px-10 pb-10 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lockedSkills.map(skill => {
                      const prereqData = getPrereqDisplay(skill.prerequisites || []);
                      return (
                        <div key={skill.id} className="p-6 bg-white rounded-[2rem] border border-slate-200 group hover:border-slate-400 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 pr-4">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{skill.category}</span>
                              <span className="text-base font-black text-slate-700 leading-tight block">{skill.name}</span>
                            </div>
                            {prereqData && (
                              <span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-full text-slate-500 uppercase tracking-tighter">
                                {prereqData.masteredCount}/{prereqData.totalCount} Unlocked
                              </span>
                            )}
                          </div>
                          {prereqData && (
                            <div className="space-y-4">
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 transition-all duration-1000" style={{ width: `${(prereqData.masteredCount / prereqData.totalCount) * 100}%` }} />
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                <span className="uppercase text-[9px] text-rose-400 block mb-1">Missing Prerequisite:</span>
                                <span className="text-slate-600 underline decoration-slate-300 underline-offset-4">{prereqData.names}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
