import "dotenv/config";
import { plannerNode } from "./src/nodes/planner";
import { AgentStateType } from "./src/state/index";

// Build a minimal state — only task is needed by this node
const fakeState: AgentStateType = {
  messages: [],
  task: "Add JWT authentication to my Express app",
  plan: [],
  projectContext: [],
  generatedCode: [],
  reviewFeedback: null,
  iterationCount: 0,
  routerDecision: "",
  clarificationQuestion: "",
  finalAnswer: "",
};

async function main() {
  const result = await plannerNode(fakeState);

  console.log("\n--- plan ---");
  console.log(result.plan);

  console.log("\n--- task (with keywords appended) ---");
  console.log(result.task);
}

main().catch(console.error);