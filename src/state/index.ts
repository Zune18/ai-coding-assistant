import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// ─────────────────────────────────────────────
//  Types — defined here so every node can import
//  them without circular dependencies
// ─────────────────────────────────────────────

export interface PlanStep {
  id: number;
  description: string;
  status: "pending" | "in_progress" | "done";
}

export interface FileContext {
  path: string;
  content: string;
  relevance: string;
}

export interface ReviewResult {
  passed: boolean;
  score: number;        // 0–10
  issues: string[];
  suggestions: string[];
  summary: string;
}

export interface GeneratedCode {
  filename: string;
  content: string;
  explanation: string;
  language: string;
}

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────

export const AgentState = Annotation.Root({

  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,  // built-in: appends
    default: () => [],
  }),

  task: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  plan: Annotation<PlanStep[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  projectContext: Annotation<FileContext[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  generatedCode: Annotation<GeneratedCode[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  reviewFeedback: Annotation<ReviewResult | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  iterationCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),

  routerDecision: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  clarificationQuestion: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  finalAnswer: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

});

// Type of the state object
export type AgentStateType = typeof AgentState.State;