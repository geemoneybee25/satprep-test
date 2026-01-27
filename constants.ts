import { Domain, Skill, SkillStatus, PersonaType, TestResult } from './types';

export const calculateStatus = (p: number): SkillStatus => {
  if (p < 0.40) return SkillStatus.LOCKED;
  if (p < 0.85) return SkillStatus.LEARNING;
  return SkillStatus.MASTERED;
};

const MATH_SKILL_CATEGORIES: Record<string, string> = {
  "Linear Equations in One Variable": "Heart of Algebra",
  "Linear Functions": "Heart of Algebra",
  "Linear Equations in Two Variables": "Heart of Algebra",
  "Systems of Two Linear Equations": "Heart of Algebra",
  "Linear Inequalities": "Heart of Algebra",
  "Ratios, Rates, and Proportions": "Problem Solving & Data Analysis",
  "Percentages": "Problem Solving & Data Analysis",
  "Units and Conversions": "Problem Solving & Data Analysis",
  "Scatterplots": "Problem Solving & Data Analysis",
  "Data Inferences": "Problem Solving & Data Analysis",
  "Center and Spread": "Problem Solving & Data Analysis",
  "Data Collection and Conclusions": "Problem Solving & Data Analysis",
  "Equivalent Expressions": "Advanced Math",
  "Nonlinear Equations in One Variable": "Advanced Math",
  "Systems of Equations (Nonlinear)": "Advanced Math",
  "Quadratic Functions": "Advanced Math",
  "Exponential Functions": "Advanced Math",
  "Polynomial Factors and Graphs": "Advanced Math",
  "Radical and Rational Equations": "Advanced Math",
  "Absolute Value Equations": "Advanced Math",
  "Function Notation": "Advanced Math",
  "Circle Equations": "Geometry & Trigonometry",
  "Area and Volume": "Geometry & Trigonometry",
  "Lines and Angles": "Geometry & Trigonometry",
  "Triangles and Parallel Lines": "Geometry & Trigonometry",
  "Right Triangle Trigonometry": "Geometry & Trigonometry",
  "Circle Properties": "Geometry & Trigonometry",
  "Statistical Constants": "Problem Solving & Data Analysis",
  "Probability and Statistics": "Problem Solving & Data Analysis",
  "Complex Numbers": "Advanced Math"
};

const MATH_SKILL_NAMES = Object.keys(MATH_SKILL_CATEGORIES);

const PREREQUISITE_MAP: Record<string, string[]> = {
  "Systems of Two Linear Equations": ["Linear Equations in Two Variables"],
  "Linear Inequalities": ["Linear Equations in One Variable"],
  "Quadratic Functions": ["Equivalent Expressions", "Linear Equations in One Variable"],
  "Nonlinear Equations in One Variable": ["Linear Equations in One Variable"],
  "Circle Equations": ["Equivalent Expressions", "Linear Equations in Two Variables"],
  "Exponential Functions": ["Equivalent Expressions"],
  "Polynomial Factors and Graphs": ["Equivalent Expressions", "Quadratic Functions"],
  "Radical and Rational Equations": ["Linear Equations in One Variable", "Equivalent Expressions"],
  "Right Triangle Trigonometry": ["Triangles and Parallel Lines"],
  "Probability and Statistics": ["Data Inferences", "Statistical Constants"],
  "Complex Numbers": ["Quadratic Functions"]
};

export const generateMockPastTests = (persona: PersonaType): TestResult[] => {
  let baseline: number;
  switch (persona) {
    case PersonaType.SARAH: baseline = 880; break;
    case PersonaType.ALEX: baseline = 1380; break;
    case PersonaType.MIKE: 
    default: baseline = 1120; break;
  }

  return [
    {
      id: 'test-1',
      date: '2024-05-15T10:00:00Z',
      totalScore: baseline + 40,
      mathScore: Math.floor(baseline / 2) + 20,
      readingScore: Math.floor(baseline / 2) + 20,
      performanceBreakdown: [
        { topic: 'Linear Equations', score: baseline > 1300 ? 95 : 70, averageScore: 80 },
        { topic: 'Quadratic Functions', score: baseline > 1300 ? 80 : 40, averageScore: 72 },
      ]
    },
    {
      id: 'test-2',
      date: '2024-04-22T14:30:00Z',
      totalScore: baseline,
      mathScore: Math.floor(baseline / 2),
      readingScore: Math.floor(baseline / 2),
      performanceBreakdown: [
        { topic: 'Linear Equations', score: baseline > 1300 ? 90 : 60, averageScore: 80 },
      ]
    }
  ];
};

export const generateMockSkills = (persona: PersonaType = PersonaType.MIKE): Skill[] => {
  const skills: Skill[] = MATH_SKILL_NAMES.map((name, index) => {
    let pMastery: number;
    
    switch (persona) {
      case PersonaType.SARAH: // Beginner: Projected ~950-1050
        pMastery = index < 8 ? 0.45 + Math.random() * 0.2 : 0.15 + Math.random() * 0.25;
        break;
      case PersonaType.ALEX: // Advanced: Projected ~1480-1580
        pMastery = index < 25 ? 0.88 + Math.random() * 0.11 : 0.75 + Math.random() * 0.15;
        break;
      case PersonaType.MIKE: // Intermediate: Projected ~1250-1350
      default:
        if (index < 12) pMastery = 0.25 + Math.random() * 0.25;
        else if (index < 22) pMastery = 0.55 + Math.random() * 0.25;
        else pMastery = 0.88 + Math.random() * 0.11;
        break;
    }

    return {
      id: `math-skill-${index + 1}`,
      name,
      domain: Domain.MATH,
      category: MATH_SKILL_CATEGORIES[name],
      pMastery: Number(pMastery.toFixed(2)),
      status: calculateStatus(pMastery),
      lastPracticed: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString() : null,
      attempts: Math.floor(Math.random() * 100)
    };
  });

  return skills.map(skill => {
    const prereqNames = PREREQUISITE_MAP[skill.name];
    if (prereqNames) {
      const prereqIds = prereqNames.map(pName => {
        const found = skills.find(s => s.name === pName);
        return found ? found.id : '';
      }).filter(id => id !== '');
      
      const allPrereqsMastered = prereqIds.every(id => {
        const prereq = skills.find(s => s.id === id);
        return prereq && prereq.pMastery >= 0.85;
      });

      if (!allPrereqsMastered) {
        return {
          ...skill,
          prerequisites: prereqIds,
          status: SkillStatus.LOCKED,
          pMastery: Math.min(skill.pMastery, 0.35)
        };
      }

      return { ...skill, prerequisites: prereqIds };
    }
    return skill;
  });
};

export const INITIAL_SKILLS: Skill[] = generateMockSkills(PersonaType.MIKE);
export const MOCK_PAST_TESTS: TestResult[] = generateMockPastTests(PersonaType.MIKE);