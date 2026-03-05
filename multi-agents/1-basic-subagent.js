/**
 * TUTORIAL 1: Basic Subagent
 *
 * A "subagent" is a specialized agent that a parent agent can call via the
 * built-in "Agent" tool. You define subagents in the `agents` option and
 * the parent agent decides when to use them.
 *
 * This example has:
 *   - Parent agent: general purpose, can delegate tasks
 *   - "car-advisor" subagent: specialist that answers car questions
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Tutorial 1: Basic Subagent ===\n");

  // Step 1: Define your subagent(s) inside the `agents` option.
  //         Each key becomes the subagent's name.
  for await (const message of query({
    prompt: `
      A user asked: "I have a budget of $30,000. Should I buy a sedan or an SUV?"
      Use the car-advisor agent to give a thorough recommendation.
    `,
    options: {
      // The parent agent needs "Agent" in its allowed tools to spawn subagents
      allowedTools: ["Agent"],

      // Define your subagents here
      agents: {
        "car-advisor": {
          // description: tells the parent WHEN to use this subagent
          description:
            "Expert car advisor. Use this agent for any car buying advice, comparisons, or recommendations.",

          // prompt: the system prompt / persona for the subagent
          prompt: `You are an expert car advisor with 20 years of experience.
You give practical, honest advice about car buying based on budget, lifestyle, and needs.
Always consider: total cost of ownership, reliability, resale value, and practicality.`,

          // tools: what the subagent itself is allowed to use
          // (keep it minimal — subagents don't need broad access)
          tools: [],
        },
      },

      // Safety: cap how many turns the whole system can take
      maxTurns: 10,
    },
  })) {
    // The `message` stream includes system messages, assistant turns, and
    // finally a ResultMessage with the `.result` property.
    if ("result" in message) {
      console.log("Final answer:\n");
      console.log(message.result);
    }
  }
}

main().catch(console.error);
