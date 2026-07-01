import { AgentStateType, PlanStep } from "../state/index";
import { chatJSON } from "../utils/llm";
import { HumanMessage } from "@langchain/core/messages";

interface PlannerResponse {
  steps: Array<{ id: number; description: string }>;
  keywords: string[];
}

export async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("\n[planner_node] Creating implementation plan...");

  const schema = {
    type: "object",
    properties: {
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            description: { type: "string" },
          },
          required: ["id", "description"],
        },
      },
      keywords: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["steps", "keywords"],
  };

  const response = await chatJSON<PlannerResponse>(
    [
      {
        role: "system",
        content: `You are a senior software architect.
Analyse the coding task and break it into clear, concrete implementation steps.

Rules:
- 3 to 7 steps maximum
- Each step is a single, concrete action — not vague
- keywords are short file-path search terms to find relevant files`,
      },
      {
        role: "user",
        content: `Task: ${state.task}`,
      },
    ],
    schema
  );

  const plan: PlanStep[] = response.steps.map((s) => ({
    id: s.id,
    description: s.description,
    status: "pending" as const,
  }));

  console.log(`  -> Generated ${plan.length} steps`);
  plan.forEach((s) => console.log(`     ${s.id}. ${s.description}`));

  return {
    plan,
    task: state.task + `\n\n[KEYWORDS:${response.keywords.join(",")}]`,
    messages: [
      new HumanMessage(
        `[planner] Created ${plan.length}-step plan. Keywords: ${response.keywords.join(", ")}`
      ),
    ],
  };
}