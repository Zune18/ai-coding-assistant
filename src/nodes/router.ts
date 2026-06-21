import { AgentStateType } from "../state/index";
import { chatJSON } from "../utils/llm";
import { HumanMessage } from "@langchain/core/messages";

interface RouterResponse {
  decision: "codegen" | "clarification";
  reasoning: string;
  clarificationQuestion?: string;
}

export async function routerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("\n[router_node] Deciding next step...");

  const schema = {
    type: "object",
    properties: {
      decision: {
        type: "string",
        enum: ["codegen", "clarification"],
      },
      reasoning: { type: "string" },
      clarificationQuestion: { type: "string" },
    },
    required: ["decision", "reasoning"],
  };

  const contextSummary = state.projectContext
    .map((f) => `  -> ${f.path}: ${f.relevance}`)
    .join("\n");

  const planSummary = state.plan
    .map((s) => ` -> ${s.id}. ${s.description}`)
    .join("\n");

  const response = await chatJSON<RouterResponse>(
    [
      {
        role: "system",
        content: `You are a routing decision maker for a software engineering agent.
Evaluate whether the task is clear and actionable, or if critical information is missing.

Go with "codegen" unless something genuinely blocks implementation:
- Unknown database schema with no files to infer from
- Completely ambiguous framework (e.g. "add auth" with zero project files and zero context)
- Two contradictory requirements

Do NOT ask for clarification on things you can reasonably infer.`,
      },
      {
        role: "user",
        content: `Task: ${state.task.replace(/\[KEYWORDS:.+?\]/, "").trim()}

Implementation Plan:
${planSummary}

Available Project Context:
${contextSummary || "  (no project files found)"}`,
      },
    ],
    schema
  );

  console.log(` -> ${response.decision.toUpperCase()} - ${response.reasoning}`);

  return {
    routerDecision: response.decision,
    clarificationQuestion: response.clarificationQuestion ?? "",
    messages: [
      new HumanMessage(
        `[router] ${response.decision.toUpperCase()} — ${response.reasoning}`
      ),
    ],
  };
}

// Edge function — called by LangGraph after router_node runs
export function routerEdge(
  state: AgentStateType
): "clarification_node" | "codegen_node" {
  return state.routerDecision === "clarification"
    ? "clarification_node"
    : "codegen_node";
}