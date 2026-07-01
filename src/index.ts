import "dotenv/config";
import { buildGraph } from "./graph";

async function main() {
  const task =
    process.argv[2] ??
    "Add JWT authentication to my Express app. " +
      "Create a middleware that validates Bearer tokens, " +
      "a login route that returns a token, " +
      "and protect the /api/users route.";

  console.log("═".repeat(60));
  console.log("AI Software Engineering Assistant");
  console.log("═".repeat(60));
  console.log(`\nTask: ${task}\n`);

  const graph = buildGraph();

  const result = await graph.invoke({ task });

  console.log("\n" + "═".repeat(60));
  console.log("FINAL OUTPUT");
  console.log("═".repeat(60));
  console.log(result.finalAnswer);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});