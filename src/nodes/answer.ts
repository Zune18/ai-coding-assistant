import { AgentStateType } from "../state/index";
import { chatText } from "../utils/llm";
import { AIMessage } from "@langchain/core/messages";

export async function answerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("\n[answer_node] Assembling final answer...");

  const codeSection = state.generatedCode
    .map(
      (f) =>
        `### \`${f.filename}\`\n> ${f.explanation}\n\n\`\`\`${f.language}\n${f.content}\n\`\`\``
    )
    .join("\n\n---\n\n");

  const planSection = state.plan
    .map((s) => `- [x] ${s.description}`)
    .join("\n");

  const summary = await chatText([
    {
      role: "system",
      content: `You are a senior engineer writing a handoff document.
Produce a clear, concise implementation summary covering:
1. What was implemented
2. How to integrate / use it
3. Any important caveats or next steps`,
    },
    {
      role: "user",
      content: `Task: ${state.task.replace(/\[KEYWORDS:.+?\]/, "").trim()}

Completed Plan:
${planSection}

Review score: ${state.reviewFeedback?.score ?? "N/A"}/10
${state.reviewFeedback?.summary ?? ""}

Files generated: ${state.generatedCode.map((f) => f.filename).join(", ")}`,
    },
  ]);

  const fullAnswer = `## Implementation Complete

${summary}

---

## Generated Files

${codeSection}

---

**Review Score:** ${state.reviewFeedback?.score ?? "N/A"}/10  
**Iterations:** ${state.iterationCount}`;

  console.log("Final answer assembled.");

  return {
    finalAnswer: fullAnswer,
    messages: [new AIMessage(fullAnswer)],
  };
}