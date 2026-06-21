import { AgentStateType } from "../state/index";
import { AIMessage } from "@langchain/core/messages";

export async function clarificationNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("\n[clarification_node] Task needs more information.");

  const question =
    state.clarificationQuestion ||
    "Could you provide more details about the task?";

  console.log(` -> ${question}`);

  return {
    finalAnswer: `Before I can implement this, I need to ask:\n\n${question}`,
    messages: [new AIMessage(`[clarification] ${question}`)],
  };
}