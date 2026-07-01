import path from "path";
import { AgentStateType, FileContext } from "../state/index";
import { chatJSON } from "../utils/llm";
import {
  listProjectFiles,
  readFile,
  buildDirectoryTree,
} from "../tools/fileSystem";
import { HumanMessage } from "@langchain/core/messages";

interface AnalyzerResponse {
  relevantFiles: Array<{
    path: string;
    relevance: string;
  }>;
}

export async function analyzerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("\n[analyzer_node] Scanning project files...");

  // Extract keywords planted by planner_node
  const keywordMatch = state.task.match(/\[KEYWORDS:(.+?)\]/);
  const keywords = keywordMatch
    ? keywordMatch[1].split(",")
    : ["index", "app"];

  // Step 1 — scan the filesystem
  const projectRoot = process.env.PROJECT_ROOT ?? process.cwd();
  const allFiles = listProjectFiles(projectRoot);
  console.log(`  -> Found ${allFiles.length} files in ${projectRoot}`);

  const treeText = buildDirectoryTree(allFiles);

  // Step 2 — ask LLM which files are relevant
  const schema = {
    type: "object",
    properties: {
      relevantFiles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            relevance: { type: "string" },
          },
          required: ["path", "relevance"],
        },
      }
    },
    required: ["relevantFiles"],
  };

  const response = await chatJSON<AnalyzerResponse>([
    {
      role: "system",
      content: `You are a code analyst.
Given a task and a project file list, identify which files are relevant.

Return JSON:
{
  "relevantFiles": [
    {
      "path": "src/app.ts",
      "relevance": "Main Express entry — JWT middleware must be registered here"
    }
  ]
}

Select at most 8 files. If the project is empty, return an empty array.`,
    },
    {
      role: "user",
      content: `Task: ${state.task.replace(/\[KEYWORDS:.+?\]/, "").trim()}

Keywords to look for: ${keywords.join(", ")}

Project files:
${treeText || "(empty project — generate from scratch)"}`,
    },
  ], schema);

  // Step 3 — read selected file contents
  const projectContext: FileContext[] = [];

  for (const rf of response.relevantFiles) {
    const fullPath = path.join(projectRoot, rf.path);
    const content =
      readFile(fullPath) ?? "(file not found — will be created)";

    projectContext.push({
      path: rf.path,
      content,
      relevance: rf.relevance,
    });

    console.log(`${rf.path} — ${rf.relevance}`);
  }

  return {
    projectContext,
    messages: [
      new HumanMessage(
        `[analyzer] Loaded ${projectContext.length} relevant files.`
      ),
    ],
  };
}