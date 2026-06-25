import { AgentStateType, GeneratedCode } from "../state/index";
import { chatJSON } from "../utils/llm";
import { HumanMessage } from "@langchain/core/messages";

interface CodegenResponse {
  files: Array<{
    filename: string;
    language: string;
    content: string;
    explanation: string;
  }>;
}

export async function codegenNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const iteration = state.iterationCount + 1;
  console.log(`\n[codegen_node] Generating code (iteration ${iteration})...`);

  const schema = {
    type: "object",
    properties: {
      files: {
        type: "array",
        items: {
          type: "object",
          properties: {
            filename: { type: "string" },
            language: { type: "string" },
            content: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["filename", "language", "content", "explanation"],
        },
      },
    },
    required: ["files"],
  };

  // Block 1 — project context from analyzer_node
  const contextBlock = state.projectContext
    .map(
      (f) =>
        `--- FILE: ${f.path} ---\nRelevance: ${f.relevance}\n\`\`\`\n${f.content}\n\`\`\``
    )
    .join("\n\n");

  // Block 2 — plan from planner_node
  const planBlock = state.plan
    .map((s) => `${s.id}. ${s.description}`)
    .join("\n");

  // Block 3 — review feedback from review_node (only on retries)
  const reviewBlock =
    state.reviewFeedback && !state.reviewFeedback.passed
      ? `\n\nPREVIOUS REVIEW FAILED (score ${state.reviewFeedback.score}/10):
Issues found:
${state.reviewFeedback.issues.map((i) => `  - ${i}`).join("\n")}

Suggestions:
${state.reviewFeedback.suggestions.map((s) => `  - ${s}`).join("\n")}

Fix ALL of the above issues in this iteration.`
      : "";

  const response = await chatJSON<CodegenResponse>(
    [
      {
        role: "system",
        content: `You are a senior software engineer specialising in TypeScript and Node.js.
Generate production-quality code that fully implements the requested task.

Rules:
- Write complete, runnable files — no placeholders, no TODO stubs
- Include error handling
- Follow the existing code style from the project context
- Add JSDoc comments to exported functions
- Maximum 3 files per generation`,
      },
      {
        role: "user",
        content: `Task: ${state.task.replace(/\[KEYWORDS:.+?\]/, "").trim()}

Implementation Plan:
${planBlock}

Project Context:
${contextBlock || "(no existing files — greenfield implementation)"}
${reviewBlock}`,
      },
    ],
    schema
  );

  const generatedCode: GeneratedCode[] = response.files.map((f) => ({
    filename: f.filename,
    content: f.content,
    explanation: f.explanation,
    language: f.language,
  }));

  console.log(`  → Generated ${generatedCode.length} file(s):`);
  generatedCode.forEach((f) => console.log(` ${f.filename}`));

  return {
    generatedCode,
    iterationCount: iteration,
    messages: [
      new HumanMessage(
        `[codegen] Generated ${generatedCode.length} file(s): ${generatedCode
          .map((f) => f.filename)
          .join(", ")}`
      ),
    ],
  };
}