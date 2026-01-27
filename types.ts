export enum Domain {
  MATH = 'Math',
  READING = 'Reading'
}

export enum SkillStatus {
  LOCKED = 'LOCKED',
  LEARNING = 'LEARNING',
  MASTERED = 'MASTERED'
}

export enum PersonaType {
  SARAH = 'SARAH', // Beginner
  MIKE = 'MIKE',   // Intermediate
  ALEX = 'ALEX'    // Advanced
}

export interface Skill {
  id: string;
  name: string;
  domain: Domain;
  category: string;
  pMastery: number; // 0 to 1
  status: SkillStatus;
  lastPracticed: string | null;
  attempts: number;
  prerequisites?: string[]; // Array of skill IDs
}

export interface MasterySummary {
  total: number;
  mastered: number;
  learning: number;
  locked: number;
}

export interface EngagementStats {
  streak: number;
  minutesToday: number;
  dailyGoalMinutes: number;
  practiceLog: string[]; // Array of YYYY-MM-DD strings
}

export interface TopicPerformance {
  topic: string;
  score: number; // 0 to 100
  averageScore: number; // New: for comparative analysis
}

export interface TestResult {
  id: string;
  date: string;
  totalScore: number;
  mathScore: number;
  readingScore: number;
  performanceBreakdown: TopicPerformance[];
}

export interface SessionHistoryItem {
  problemId: string;
  question: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  hintsUsed: string[];
  explanation: string;
}