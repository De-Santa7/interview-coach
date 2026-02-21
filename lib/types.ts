export type ExperienceLevel = "Junior" | "Mid-Level" | "Senior" | "Lead";
export type InterviewType = "Technical" | "Behavioral" | "Mixed";
export type QuestionCount = 3 | 5 | 10;
export type ChallengeType = "code" | "writing";
export type HiringVerdict =
  | "Strong Hire"
  | "Hire"
  | "Maybe"
  | "No Hire";

export interface SessionConfig {
  profession: string;
  level: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: QuestionCount;
  includeChallenge: boolean;
}

export interface Question {
  id: string;
  text: string;
  category?: string;
}

export interface Answer {
  questionId: string;
  text: string;
}

export interface Challenge {
  title: string;
  brief: string;
  type: ChallengeType;
  language?: string;
  context?: string;
}

export interface QuestionReport {
  question: string;
  answer: string;
  score: number;
  strengths: string[];
  gaps: string[];
  idealAnswer: string;
}

export interface ChallengeReport {
  brief: string;
  submission: string;
  score: number;
  feedback: string;
  idealSubmission: string;
}

export interface FullReport {
  verdict: HiringVerdict;
  overallScore: number;
  questions: QuestionReport[];
  challenge?: ChallengeReport;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

export interface SessionState {
  config: SessionConfig | null;
  questions: Question[];
  answers: Answer[];
  challenge: Challenge | null;
  challengeSubmission: string;
  report: FullReport | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  config: SessionConfig;
  report: FullReport;
  questions: Question[];
  answers: Answer[];
  challenge: Challenge | null;
  challengeSubmission: string;
}
