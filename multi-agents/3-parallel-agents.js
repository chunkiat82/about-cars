/**
 * TUTORIAL 3: Parallel Agents
 *
 * Instead of sequential subagents (one after the other), you can run agents
 * IN PARALLEL using Promise.all(). This is faster when tasks are independent.
 *
 * Pattern:
 *   - Launch multiple query() calls simultaneously
 *   - Collect all results with Promise.all
 *   - Pass results to a final "synthesis" agent
 *
 * This example compares THREE cars simultaneously, then a synthesis agent
 * picks the winner.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

// Helper: run a single agent and return its final result
async function runAgent(prompt, systemPrompt) {
  for await (const message of query({
    prompt,
    options: {
      allowedTools: [],
      systemPrompt,
      maxTurns: 5,
    },
  })) {
    if ("result" in message) {
      return message.result;
    }
  }
  return "";
}

async function compareCarsPArallel(cars) {
  console.log(`\nComparing in parallel: ${cars.join(" vs ")}\n`);
  console.log("Launching agents simultaneously...\n");

  const reviewerPrompt = `You are a professional car reviewer.
For the given car, provide a concise review covering:
1. Key strengths (3 bullet points)
2. Key weaknesses (3 bullet points)
3. Overall score out of 10
4. Best suited for: (one sentence)
Keep total response under 200 words.`;

  // --- Launch all agents at the same time with Promise.all ---
  const startTime = Date.now();

  const [results] = await Promise.all([
    // Each car gets its own independent agent, all running in parallel
    Promise.all(
      cars.map((car) =>
        runAgent(`Review the ${car} as a family car purchase option.`, reviewerPrompt)
          .then((result) => ({ car, result }))
      )
    ),
  ]);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`All ${cars.length} agents completed in ${elapsed}s (parallel)\n`);

  // Print individual reviews
  for (const { car, result } of results) {
    console.log(`\n--- ${car} ---`);
    console.log(result);
    console.log();
  }

  // --- Synthesis agent: reads all reviews and picks a winner ---
  console.log("\n--- SYNTHESIS AGENT: Picking the winner ---\n");

  const reviewsText = results
    .map(({ car, result }) => `=== ${car} ===\n${result}`)
    .join("\n\n");

  const winner = await runAgent(
    `Here are independent reviews of ${cars.length} cars:\n\n${reviewsText}\n\nBased on these reviews, which car is the best overall choice for a family buyer? Give a clear recommendation with a 2-3 sentence justification.`,
    "You are an objective car buying advisor. You synthesize multiple expert reviews into a clear, actionable recommendation."
  );

  console.log("WINNER:\n");
  console.log(winner);
}

async function main() {
  console.log("=== Tutorial 3: Parallel Agents ===");

  await compareCarsPArallel([
    "Honda CR-V 2024",
    "Toyota RAV4 2024",
    "Mazda CX-5 2024",
  ]);
}

main().catch(console.error);
