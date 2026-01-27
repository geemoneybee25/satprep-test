import React, { useState, useMemo } from 'react';
import { Skill, SkillStatus } from '../types';
import SkillDetail from './SkillDetail';

interface LearnPageProps {
  skills: Skill[];
  onTabChange: (tab: 'Practice') => void;
  onSelectPracticeSkill: (skillId: string) => void;
  activeLessonId: string | null;
  setActiveLessonId: (id: string | null) => void;
}

type FilterStatus = 'All' | SkillStatus;

const LearnPage: React.FC<LearnPageProps> = ({ skills, onTabChange, onSelectPracticeSkill, activeLessonId, setActiveLessonId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            skill.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || skill.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [skills, searchTerm, statusFilter]);

  const groupedSkills = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    filteredSkills.forEach(skill => {
      if (!groups[skill.category]) {
        groups[skill.category] = [];
      }
      groups[skill.category].push(skill);
    });
    return groups;
  }, [filteredSkills]);

  const selectedSkill = useMemo(() => 
    skills.find(s => s.id === activeLessonId) || null
  , [skills, activeLessonId]);

  const handleStartLesson = (skillId: string) => {
    setActiveLessonId(skillId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartPractice = (skillId: string) => {
    onSelectPracticeSkill(skillId);
    onTabChange('Practice');
  };

  if (selectedSkill) {
    return (
      <SkillDetail 
        skill={selectedSkill} 
        onBack={() => setActiveLessonId(null)} 
        onStartPractice={handleStartPractice}
      />
    );
  }

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All Lessons', value: 'All' },
    { label: 'Mastered', value: SkillStatus.MASTERED },
    { label: 'Learning Zone', value: SkillStatus.LEARNING },
    { label: 'Not Ready', value: SkillStatus.LOCKED }
  ];

  const getStatusDotColor = (status: SkillStatus) => {
    switch (status) {
      case SkillStatus.MASTERED: return 'bg-green-500';
      case SkillStatus.LEARNING: return 'bg-amber-500';
      case SkillStatus.LOCKED: return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: SkillStatus) => {
    switch (status) {
      case SkillStatus.MASTERED: return 'Mastered';
      case SkillStatus.LEARNING: return 'Learning Zone';
      case SkillStatus.LOCKED: return 'Not Ready';
      default: return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Knowledge Base</h1>
          <p className="text-slate-500 font-medium">Browse the full index of SAT lessons across all curriculum domains.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search skills or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-12">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
              statusFilter === f.value 
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category Index */}
      <div className="space-y-16">
        {Object.keys(groupedSkills).length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-xl font-bold text-slate-900">No lessons found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
              className="mt-6 text-blue-600 font-black text-sm uppercase tracking-widest hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          (Object.entries(groupedSkills) as [string, Skill[]][]).map(([category, categorySkills]) => (
            <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-[0.2em]">{category}</h2>
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{categorySkills.length} Lessons</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorySkills.map((skill) => (
                  <div 
                    key={skill.id} 
                    className="group bg-white rounded-3xl border border-slate-200 p-6 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 flex flex-col cursor-default"
                  >
                    <div className="flex justify-between items-start mb-4">
                      {/* Status Dot */}
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(skill.status)} shadow-sm`}
                          title={getStatusLabel(skill.status)}
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          {getStatusLabel(skill.status)}
                        </span>
                      </div>
                      
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {Math.floor(Math.random() * 5) + 8}m
                      </div>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 mb-6 leading-tight group-hover:text-blue-600 transition-colors">
                      {skill.name}
                    </h3>
                    
                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {skill.attempts > 0 ? `${skill.attempts} Review Sprints` : 'Ready to Start'}
                      </div>
                      <button 
                        onClick={() => handleStartLesson(skill.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          skill.status === SkillStatus.MASTERED 
                            ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
                        }`}
                        title="Watch Lesson"
                      >
                        <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Global Learning Call to Action */}
      <div className="mt-20 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
          <div className="flex-1">
            <h4 className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Adaptive Study Tip</h4>
            <h3 className="text-3xl font-black mb-4 leading-tight">Mastery is the goal, practice is the path.</h3>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
              Watching lessons is only the first step. Jump into adaptive practice to convert these concepts into long-term memory points.
            </p>
          </div>
          <button 
            onClick={() => onTabChange('Practice')}
            className="whitespace-nowrap bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            Go to Practice Sprints
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;