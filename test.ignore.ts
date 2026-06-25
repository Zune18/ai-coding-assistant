import "dotenv/config";
import { codegenNode } from "./src/nodes/codegen";
import { AgentStateType } from "./src/state/index";

const baseState: AgentStateType = {
  messages: [],
  task: "Add JWT authentication to my Express app",
  plan: [
    { id: 1, description: "Create JWT verification middleware", status: "pending" },
    { id: 2, description: "Create login route that issues a token", status: "pending" },
  ],
  projectContext: [
    {
      path: "src/app.ts",
      content: `import express from 'express';\nconst app = express();\napp.use(express.json());\nexport default app;`,
      relevance: "Main Express entry point",
    },
  ],
  generatedCode: [],
  reviewFeedback: null,
  iterationCount: 0,
  routerDecision: "codegen",
  clarificationQuestion: "",
  finalAnswer: "",
};

async function main() {
  console.log("========== FIRST RUN (no feedback) ==========");
  const firstResult = await codegenNode(baseState);
  console.log("\niterationCount after run:", firstResult.iterationCount);
  firstResult.generatedCode?.forEach((f) =>
    console.log(`\n--- ${f.filename} ---\n${f.content.slice(0, 200)}...`)
  );

  console.log("\n\n========== SECOND RUN (simulated retry) ==========");
  const stateWithFeedback: AgentStateType = {
    ...baseState,
    ...firstResult,
    reviewFeedback: {
      passed: false,
      score: 5,
      issues: [
        "JWT secret is hardcoded instead of read from environment variables",
        "No error handling for malformed Authorization header",
      ],
      suggestions: [
        "Use process.env.JWT_SECRET",
        "Wrap token verification in try/catch and return 401 on failure",
      ],
      summary: "Functional but has security and robustness gaps.",
    },
  };

  const secondResult = await codegenNode(stateWithFeedback);
  console.log("\niterationCount after retry:", secondResult.iterationCount);
  secondResult.generatedCode?.forEach((f) =>
    console.log(`\n--- ${f.filename} ---\n${f.content.slice(0, 300)}...`)
  );
}

main().catch(console.error);