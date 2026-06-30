import { AgentStateType, ReviewResult } from "../state/index";
import { chatJSON } from "../utils/llm";
import { HumanMessage } from "@langchain/core/messages";

const MAX_ITERATIONS = 3;

export async function reviewNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("\n[review_node] Reviewing generated code...");

  // Safety valve — never loop more than MAX_ITERATIONS times
  if (state.iterationCount >= MAX_ITERATIONS) {
    console.log(`Max iterations (${MAX_ITERATIONS}) reached — force-passing.`);
    const forcedPass: ReviewResult = {
      passed: true,
      score: 6,
      issues: [],
      suggestions: ["Max retry limit reached — accepting current output."],
      summary: "Accepted after maximum retry limit.",
    };
    return { reviewFeedback: forcedPass };
  }

  const schema = {
    type: "object",
    properties: {
      passed: { type: "boolean" },
      score: { type: "number" },
      issues: { type: "array", items: { type: "string" } },
      suggestions: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
    },
    required: ["passed", "score", "issues", "suggestions", "summary"],
  };

  const codeBlock = state.generatedCode
    .map(
      (f) =>
        `--- FILE: ${f.filename} ---\nExplanation: ${f.explanation}\n\`\`\`${f.language}\n${f.content}\n\`\`\``
    )
    .join("\n\n");

  const planBlock = state.plan
    .map((s) => `${s.id}. ${s.description}`)
    .join("\n");

  const response = await chatJSON<ReviewResult>(
    [
      {
        role: "system",
        content: `You are a strict senior code reviewer.
Review the provided code against the task requirements.

Pass criteria (score >= 7):
- All plan steps are implemented
- No obvious bugs or security holes
- Proper error handling
- Types are correct (no 'any' abuse)
- Code is production-ready

Be strict. A score of 7+ means "I'd approve this in a real PR."`,
      },
      {
        role: "user",
        content: `Task: ${state.task.replace(/\[KEYWORDS:.+?\]/, "").trim()}

Implementation Plan (all steps must be covered):
${planBlock}

Generated Code:
${codeBlock}`,
      },
    ],
    schema
  );

  // Enforce the pass threshold ourselves — don't fully trust the model's own "passed" flag
  const passed = response.passed && response.score >= 7;
  const reviewFeedback: ReviewResult = { ...response, passed };

  console.log(`  -> Score: ${reviewFeedback.score}/10 — ${passed ? "PASSED" : "FAILED"}`);
  if (reviewFeedback.issues.length > 0) {
    reviewFeedback.issues.forEach((i) => console.log(`Issue ${i}`));
  }

  return {
    reviewFeedback,
    messages: [
      new HumanMessage(
        `[review] Score: ${reviewFeedback.score}/10 — ${passed ? "PASSED" : "FAILED"}. ${reviewFeedback.summary}`
      ),
    ],
  };
}

// Edge function — called by LangGraph after review_node runs
export function reviewEdge(
  state: AgentStateType
): "codegen_node" | "answer_node" {
  return state.reviewFeedback?.passed ? "answer_node" : "codegen_node";
}