import { StateGraph, END } from "@langchain/langgraph";
import { AgentState } from "./state/index";
import { plannerNode } from "./nodes/planner";
import { analyzerNode } from "./nodes/analyzer";
import { routerNode, routerEdge } from "./nodes/router";
import { clarificationNode } from "./nodes/clarification";
import { codegenNode } from "./nodes/codegen";
import { reviewNode, reviewEdge } from "./nodes/review";
import { answerNode } from "./nodes/answer";

export function buildGraph() {
  const graph = new StateGraph(AgentState)
    // Register node
    .addNode("planner_node", plannerNode)
    .addNode("analyzer_node", analyzerNode)
    .addNode("router_node", routerNode)
    .addNode("clarification_node", clarificationNode)
    .addNode("codegen_node", codegenNode)
    .addNode("review_node", reviewNode)
    .addNode("answer_node", answerNode)

    // Fixed edges
    .addEdge("__start__", "planner_node")
    .addEdge("planner_node", "analyzer_node")
    .addEdge("analyzer_node", "router_node")

    // Conditional edge
    .addConditionalEdges("router_node", routerEdge, {
      codegen_node: "codegen_node",
      clarification_node: "clarification_node",
    })

    // Clarification
    .addEdge("clarification_node", END)

    // codegen into review
    .addEdge("codegen_node", "review_node")

    // Conditional edge
    .addConditionalEdges("review_node", reviewEdge, {
      codegen_node: "codegen_node", // ← loops back
      answer_node: "answer_node",
    })

    // End
    .addEdge("answer_node", END);

  return graph.compile();
}