import React, { useMemo, useState } from 'react';
import { SkillStatus, MasterySummary } from '../types';

interface SkillTrajectoryProps {
  stats: MasterySummary;
  activeZone: SkillStatus | null;
  onZoneClick: (zone: SkillStatus) => void;
  startingScore: number;
  projectedScore: number;
}

const SkillTrajectory: React.FC<SkillTrajectoryProps> = ({ stats, activeZone, onZoneClick, startingScore, projectedScore }) => {
  const [hoveredZone, setHoveredZone] = useState<SkillStatus | null>(null);
  const totalSlots = 24;
  
  // Calculate segments
  const masteredCount = Math.round((stats.mastered / stats.total) * totalSlots);
  const learningCount = Math.round((stats.learning / stats.total) * totalSlots);
  const lockedCount = totalSlots - masteredCount - learningCount;
  
  // The airplane replaces the dot at this index
  const airplaneIndex = Math.min(masteredCount, totalSlots - 1);

  // Helper to determine zone of a slot
  const getSlotType = (i: number): SkillStatus => {
    if (i < masteredCount) return SkillStatus.MASTERED;
    if (i < masteredCount + learningCount) return SkillStatus.LEARNING;
    return SkillStatus.LOCKED;
  };

  const getSlotColor = (type: SkillStatus) => {
    switch (type) {
      case SkillStatus.MASTERED: return 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]';
      case SkillStatus.LEARNING: return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
      case SkillStatus.LOCKED: return 'bg-slate-700';
    }
  };

  return (
    <div className="w-full pt-8 pb-4" id="tutorial-bullseye">
      <div className="bg-[#0f172a] rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 relative overflow-hidden">
        
        <div className="relative flex items-center justify-between gap-6 mb-2">
          {/* Departure: Starting Score */}
          <div 
            className={`flex flex-col cursor-pointer transition-all duration-300 group ${activeZone === SkillStatus.MASTERED ? 'scale-110' : ''}`}
            onClick={() => onZoneClick(SkillStatus.MASTERED)}
          >
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Initial Score</span>
            <span className={`text-5xl font-black tracking-tighter transition-colors ${activeZone === SkillStatus.MASTERED ? 'text-green-300' : 'text-white group-hover:text-green-200'}`}>{startingScore}</span>
            <span className="text-white/40 text-[9px] font-bold mt-2 uppercase tracking-widest">{stats.mastered} Mastered</span>
          </div>

          {/* Progress Container */}
          <div className="flex-1 h-24 relative flex items-center px-4">
            
            {/* Layer 1: Hit Areas (Interactive broad boxes) */}
            <div className="absolute inset-0 flex z-0">
              {/* Mastered Hit Area */}
              <div 
                className={`h-full cursor-pointer transition-all duration-300 rounded-l-2xl ${
                  activeZone === SkillStatus.MASTERED ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                style={{ flex: masteredCount }}
                onMouseEnter={() => setHoveredZone(SkillStatus.MASTERED)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onZoneClick(SkillStatus.MASTERED)}
              />
              {/* Learning Hit Area */}
              <div 
                className={`h-full cursor-pointer transition-all duration-300 ${
                  activeZone === SkillStatus.LEARNING ? 'bg-amber-400/10' : 'hover:bg-white/5'
                }`}
                style={{ flex: learningCount }}
                onMouseEnter={() => setHoveredZone(SkillStatus.LEARNING)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onZoneClick(SkillStatus.LEARNING)}
              />
              {/* Locked Hit Area */}
              <div 
                className={`h-full cursor-pointer transition-all duration-300 rounded-r-2xl ${
                  activeZone === SkillStatus.LOCKED ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                style={{ flex: lockedCount }}
                onMouseEnter={() => setHoveredZone(SkillStatus.LOCKED)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onZoneClick(SkillStatus.LOCKED)}
              />
            </div>

            {/* Layer 2: Dots & Airplane */}
            <div className="absolute inset-x-4 flex items-center justify-between z-10 pointer-events-none">
              {Array.from({ length: totalSlots }).map((_, i) => {
                const type = getSlotType(i);
                const isAirplane = i === airplaneIndex;
                const isHighlighted = hoveredZone === type || activeZone === type;
                
                if (isAirplane) {
                  return (
                    <div key={i} className="relative z-30 mx-[-8px] pointer-events-auto">
                      <div 
                        className="relative group cursor-pointer transition-transform duration-300 hover:scale-110"
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredZone(null); // Clear section hover when on the plane
                        }}
                      >
                        <div className={`absolute inset-0 blur-lg rounded-full scale-150 animate-pulse ${activeZone === SkillStatus.LEARNING ? 'bg-amber-400/30' : 'bg-white/10'}`} />
                        <svg 
                          className={`w-10 h-10 fill-current drop-shadow-lg transition-colors ${activeZone === SkillStatus.LEARNING ? 'text-amber-400' : 'text-white'}`} 
                          viewBox="0 0 24 24"
                        >
                          <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" transform="rotate(90 12 12)" />
                        </svg>
                        
                        {/* Airplane Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-[#0f172a] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                          Cruising Level: {Math.round((stats.mastered / stats.total) * 100)}% Mastery
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${getSlotColor(type)} ${
                      isHighlighted ? 'scale-[1.75] ring-4 ring-white/20' : 'scale-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Arrival: Projected */}
          <div 
            className={`flex flex-col items-end cursor-pointer transition-all duration-300 group ${activeZone === SkillStatus.LOCKED ? 'scale-110' : ''}`}
            onClick={() => onZoneClick(SkillStatus.LOCKED)}
          >
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Projected</span>
            <span className={`text-5xl font-black tracking-tighter transition-colors ${activeZone === SkillStatus.LOCKED ? 'text-amber-300' : 'text-white group-hover:text-amber-200'}`}>{projectedScore}</span>
            <span className="text-white/40 text-[9px] font-bold mt-2 uppercase tracking-widest">{stats.locked} Pending</span>
          </div>
        </div>

        {/* Legend / Status Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-6">
            <div 
              className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${
                hoveredZone === SkillStatus.MASTERED || activeZone === SkillStatus.MASTERED ? 'opacity-100 scale-110' : 'opacity-60'
              }`}
              onMouseEnter={() => setHoveredZone(SkillStatus.MASTERED)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => onZoneClick(SkillStatus.MASTERED)}
            >
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-white text-[10px] font-bold uppercase tracking-widest">Mastered</span>
            </div>
            <div 
              className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${
                hoveredZone === SkillStatus.LEARNING || activeZone === SkillStatus.LEARNING ? 'opacity-100 scale-110' : 'opacity-60'
              } ${activeZone === SkillStatus.LEARNING ? 'ring-1 ring-amber-400/50 rounded-full px-2 py-0.5' : ''}`}
              onMouseEnter={() => setHoveredZone(SkillStatus.LEARNING)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => onZoneClick(SkillStatus.LEARNING)}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-white text-[10px] font-bold uppercase tracking-widest">Learning Zone</span>
            </div>
            <div 
              className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${
                hoveredZone === SkillStatus.LOCKED || activeZone === SkillStatus.LOCKED ? 'opacity-100 scale-110' : 'opacity-60'
              }`}
              onMouseEnter={() => setHoveredZone(SkillStatus.LOCKED)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => onZoneClick(SkillStatus.LOCKED)}
            >
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="text-white text-[10px] font-bold uppercase tracking-widest">Not Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTrajectory;