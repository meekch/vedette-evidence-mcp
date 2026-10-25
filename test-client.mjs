import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
});

const client = new Client({ name: "test-client", version: "0.1.0" });
await client.connect(transport);

console.log("=== Tools available ===");
const tools = await client.listTools();
console.log(tools.tools.map((t) => t.name));

console.log("\n=== search_evidence('reconcil') ===");
const search = await client.callTool({
  name: "search_evidence",
  arguments: { query: "reconcil" },
});
console.log(search.content[0].text);

console.log("\n=== list_opportunities ===");
const list = await client.callTool({ name: "list_opportunities", arguments: {} });
console.log(list.content[0].text);

console.log("\n=== compute_roi ===");
const roi = await client.callTool({
  name: "compute_roi",
  arguments: {
    hoursPerWeekSaved: 1.5,
    peopleAffected: 2,
    hourlyCost: 65,
    adoptionRampWeeks: 4,
  },
});
console.log(roi.content[0].text);

await client.close();
process.exit(0);
