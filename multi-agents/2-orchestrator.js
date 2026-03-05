/**
 * TUTORIAL 2: Orchestrator Pattern
 *
 * The orchestrator pattern has ONE coordinator agent that:
 *   1. Receives the overall task
 *   2. Breaks it into sub-tasks
 *   3. Delegates each sub-task to a specialist subagent
 *   4. Synthesizes the results into a final answer
 *
 * This is the most common and powerful multi-agent pattern.
 *
 * Example: a car research system with three specialists:
 *   - market-researcher  → finds current prices and market trends
 *   - reliability-expert → evaluates long-term reliability and common issues
 *   - finance-advisor    → calculates total cost of ownership
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function researchCar(carModel) {
  console.log(`\n=== Researching: ${carModel} ===\n`);

  const results = [];

  for await (const message of query({
    prompt: `
      Research the "${carModel}" comprehensively for a potential buyer.

      You MUST use ALL THREE specialist agents:
      1. market-researcher   — get pricing and market position
      2. reliability-expert  — get reliability and common issues
      3. finance-advisor     — calculate total cost of ownership

      After collecting all three reports, synthesize them into a final
      "Should I buy it?" verdict with a clear YES / NO / MAYBE recommendation.
    `,
    options: {
      allowedTools: ["Agent"],

      agents: {
        // --- Specialist 1: Market Researcher ---
        "market-researcher": {
          description:
            "Research current market prices, availability, and competitive positioning for a vehicle.",
          prompt: `You are a car market analyst. You provide accurate, current information about:
- MSRP and typical transaction prices
- Whether prices are above or below MSRP
- Main competitors and how this vehicle compares
- Who this vehicle is best suited for
Be concise and data-focused.`,
          tools: [],
        },

        // --- Specialist 2: Reliability Expert ---
        "reliability-expert": {
          description:
            "Evaluate vehicle reliability, known issues, owner satisfaction, and maintenance costs.",
          prompt: `You are a master mechanic and reliability expert. You assess:
- Overall reliability rating (1-10) with reasoning
- Most common problems reported by owners
- Typical maintenance costs
- Expected lifespan with proper care
- Any recalls or safety concerns
Be honest — don't sugarcoat known issues.`,
          tools: [],
        },

        // --- Specialist 3: Finance Advisor ---
        "finance-advisor": {
          description:
            "Calculate and explain the total cost of ownership including depreciation, insurance, fuel, and maintenance.",
          prompt: `You are an automotive financial advisor. You calculate:
- 5-year total cost of ownership estimate
- Depreciation curve (how quickly value drops)
- Insurance cost tier (low/medium/high)
- Annual fuel cost estimate
- Resale value projection
Present numbers clearly. Flag any hidden costs.`,
          tools: [],
        },
      },

      maxTurns: 20,
    },
  })) {
    if ("result" in message) {
      results.push(message.result);
    }
  }

  return results[0] || "No result";
}

async function main() {
  console.log("=== Tutorial 2: Orchestrator Pattern ===");

  // Try it with a car from the about-cars project theme
  const report = await researchCar("Toyota Camry 2024");
  console.log("\n--- FINAL REPORT ---\n");
  console.log(report);
}

main().catch(console.error);
