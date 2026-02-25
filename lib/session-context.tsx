"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  SessionState,
  SessionConfig,
  Question,
  Answer,
  Challenge,
  FullReport,
} from "./types";

const STORAGE_KEY = "interview-coach-session";

const initialState: SessionState = {
  config: null,
  questions: [],
  answers: [],
  challenge: null,
  challengeSubmission: "",
  report: null,
};

type Action =
  | { type: "HYDRATE"; payload: SessionState }
  | { type: "SET_CONFIG"; payload: SessionConfig }
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "SET_ANSWER"; payload: Answer }
  | { type: "SET_CHALLENGE"; payload: Challenge }
  | { type: "SET_CHALLENGE_SUBMISSION"; payload: string }
  | { type: "SET_REPORT"; payload: FullReport }
  | { type: "RESET" };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "SET_CONFIG":
      return { ...state, config: action.payload };
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload, answers: [] };
    case "SET_ANSWER": {
      const existing = state.answers.filter(
        (a) => a.questionId !== action.payload.questionId
      );
      return { ...state, answers: [...existing, action.payload] };
    }
    case "SET_CHALLENGE":
      return { ...state, challenge: action.payload };
    case "SET_CHALLENGE_SUBMISSION":
      return { ...state, challengeSubmission: action.payload };
    case "SET_REPORT":
      return { ...state, report: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  hydrated: boolean;
  setConfig: (config: SessionConfig) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (answer: Answer) => void;
  setChallenge: (challenge: Challenge) => void;
  setChallengeSubmission: (submission: string) => void;
  setReport: (report: FullReport) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // hydrated becomes true after localStorage has been read — guards on
  // child pages must wait for this before deciding to redirect.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "HYDRATE", payload: JSON.parse(saved) as SessionState });
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // don't overwrite storage with empty state before hydration
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  const value: SessionContextValue = {
    state,
    hydrated,
    setConfig: (config) => dispatch({ type: "SET_CONFIG", payload: config }),
    setQuestions: (questions) => dispatch({ type: "SET_QUESTIONS", payload: questions }),
    setAnswer: (answer) => dispatch({ type: "SET_ANSWER", payload: answer }),
    setChallenge: (challenge) => dispatch({ type: "SET_CHALLENGE", payload: challenge }),
    setChallengeSubmission: (submission) =>
      dispatch({ type: "SET_CHALLENGE_SUBMISSION", payload: submission }),
    setReport: (report) => dispatch({ type: "SET_REPORT", payload: report }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
