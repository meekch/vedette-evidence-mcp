#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { evidenceChunks, opportunities } from "./data.js";
import { computeRoi } from "./roi.js";

const server = new McpServer({
  name: "vedette-evidence-mcp",
  version: "0.1.0",
});

// Tool 1: search evidence chunks by keyword.
// Demonstrates evidence-grounded retrieval — every result is traceable to a
// named source document, nothing is generated.
server.tool(
  "search_evidence",
  "Search the seeded evidence corpus by keyword and return matching chunks with their source document.",
  {
    query: z.string().describe("Keyword or phrase to search for, e.g. 'reconciliation' or 'forecast'"),
  },
  async ({ query }) => {
    const q = query.toLowerCase();
    const matches = evidenceChunks.filter((c) => c.text.toLowerCase().includes(q));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              matchCount: matches.length,
              matches,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 2: list opportunities, each with the evidence that supports it.
server.tool(
  "list_opportunities",
  "List all identified opportunities, each linked to the evidence chunk IDs that support it.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(opportunities, null, 2),
        },
      ],
    };
  }
);

// Tool 3: compute ROI. The model may call this with proposed inputs
// (hours saved, people affected) but the dollar math happens entirely here,
// in plain TypeScript — the model cannot emit a dollar figure itself.
server.tool(
  "compute_roi",
  "Compute annual hours and dollars saved from proposed hours-per-week savings, people affected, and hourly cost. All arithmetic is deterministic; the caller supplies the assumptions, this tool supplies the math.",
  {
    hoursPerWeekSaved: z.number().min(0).describe("Hours saved per person per week"),
    peopleAffected: z.number().min(0).describe("Number of people whose time is saved"),
    hourlyCost: z.number().min(0).describe("Fully loaded hourly cost per person, in dollars"),
    adoptionRampWeeks: z
      .number()
      .min(0)
      .max(52)
      .optional()
      .describe("Weeks to reach full adoption (default 4)"),
  },
  async ({ hoursPerWeekSaved, peopleAffected, hourlyCost, adoptionRampWeeks }) => {
    const result = computeRoi({
      hoursPerWeekSaved,
      peopleAffected,
      hourlyCost,
      adoptionRampWeeks,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("vedette-evidence-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
