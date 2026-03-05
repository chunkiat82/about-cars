/**
 * TUTORIAL 4: Multi-Agents with the Claude API (no Agent SDK)
 *
 * You don't need the Agent SDK for multi-agent systems. You can build them
 * manually with just the @anthropic-ai/sdk by:
 *   1. Making separate API calls for each "agent" (different system prompts)
 *   2. Using tool_use so one agent can call another
 *   3. Running agents in parallel with Promise.all
 *
 * This gives you MAXIMUM control: streaming, custom logging, approval gates,
 * conditional logic between agents, etc.
 *
 * Example: A loan analysis pipeline that connects to the existing
 * remainingLoan.js calculation in this project.
 */

import Anthropic from "@anthropic-ai/sdk";
import getRemainingLoan from "../remainingLoan.js";

const client = new Anthropic();

// ─── Agent factory ──────────────────────────────────────────────────────────
// Each "agent" is just a Claude API call with its own system prompt.
// This helper makes a single non-streaming call and returns the text.
async function callAgent(systemPrompt, userMessage, tools = []) {
  const messages = [{ role: "user", content: userMessage }];

  // Simple agentic loop (handles tool calls if any)
  while (true) {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
      thinking: { type: "adaptive" },
    });

    if (response.stop_reason === "end_turn") {
      // Return the text content
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text ?? "";
    }

    if (response.stop_reason === "tool_use") {
      // Execute each requested tool
      messages.push({ role: "assistant", content: response.content });
      const toolResults = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        let result;
        if (block.name === "calculate_remaining_loan") {
          // Call our real loan function from the project!
          try {
            result = String(getRemainingLoan(block.input));
          } catch (e) {
            result = `Error: ${e.message}`;
          }
        } else {
          result = `Unknown tool: ${block.name}`;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return "";
}

// ─── Tool definition ─────────────────────────────────────────────────────────
const loanTool = {
  name: "calculate_remaining_loan",
  description:
    "Calculate the remaining loan balance after a number of repaid months, including the early repayment penalty rebate.",
  input_schema: {
    type: "object",
    properties: {
      loanAmount: { type: "number", description: "Original loan amount" },
      loanPeriod: { type: "number", description: "Total loan period in months" },
      interestRate: { type: "number", description: "Annual interest rate as a percentage (e.g. 1.88 for 1.88%)" },
      repaidPeriod: { type: "number", description: "Number of months already repaid" },
    },
    required: ["loanAmount", "loanPeriod", "interestRate", "repaidPeriod"],
  },
};

// ─── Agents ──────────────────────────────────────────────────────────────────

// Agent 1: Data Extractor
// Reads a user message and extracts loan parameters
const DATA_EXTRACTOR_PROMPT = `You are a data extraction specialist.
Extract loan parameters from user messages and present them as a clear structured list.
If information is missing, use reasonable defaults and flag them.
Format: loanAmount, loanPeriod (months), interestRate (%), repaidPeriod (months).`;

// Agent 2: Loan Calculator
// Uses the real calculate_remaining_loan tool
const LOAN_CALCULATOR_PROMPT = `You are a precise financial calculator.
You calculate remaining loan balances using the provided tool.
Always call the tool with the exact numbers given. Report the result in full.`;

// Agent 3: Financial Advisor
// Interprets results and gives advice
const ADVISOR_PROMPT = `You are a friendly financial advisor specializing in car loans.
You explain loan calculations in plain language and give practical advice.
Focus on: what the number means, whether early repayment makes sense, and next steps.`;

// ─── Pipeline ────────────────────────────────────────────────────────────────
async function analyzeLoan(userRequest) {
  console.log("\n=== Multi-Agent Loan Analysis Pipeline ===\n");
  console.log(`User: "${userRequest}"\n`);

  // AGENT 1: Extract the loan data
  console.log("[Agent 1: Data Extractor] Extracting loan parameters...");
  const extractedData = await callAgent(
    DATA_EXTRACTOR_PROMPT,
    userRequest
  );
  console.log("Extracted:\n", extractedData, "\n");

  // AGENT 2: Calculate the remaining loan (uses the real tool + function)
  console.log("[Agent 2: Loan Calculator] Calculating remaining balance...");
  const calculation = await callAgent(
    LOAN_CALCULATOR_PROMPT,
    `Calculate the remaining loan balance for:\n${extractedData}`,
    [loanTool]
  );
  console.log("Calculation:\n", calculation, "\n");

  // AGENT 3: Give advice based on the calculation
  console.log("[Agent 3: Financial Advisor] Generating advice...");
  const advice = await callAgent(
    ADVISOR_PROMPT,
    `A customer has this loan situation:\n${extractedData}\n\nThe remaining balance is:\n${calculation}\n\nGive them friendly, practical advice.`
  );
  console.log("Advice:\n", advice, "\n");

  return { extractedData, calculation, advice };
}

// ─── Parallel variant ────────────────────────────────────────────────────────
// Run independent analyses in parallel, then combine
async function compareLoans(loans) {
  console.log("\n=== Parallel Loan Comparison ===\n");

  // All calculations happen simultaneously
  const analyses = await Promise.all(
    loans.map(async (loan) => {
      const remaining = getRemainingLoan(loan);
      const analysis = await callAgent(
        ADVISOR_PROMPT,
        `Loan details: ${JSON.stringify(loan)}\nRemaining balance: $${remaining.toFixed(2)}\nIs this a good deal compared to a typical car loan?`
      );
      return { loan, remaining, analysis };
    })
  );

  console.log("Results:\n");
  for (const { loan, remaining, analysis } of analyses) {
    console.log(`Loan (${loan.repaidPeriod}mo repaid of ${loan.loanPeriod}mo):`);
    console.log(`  Remaining: $${remaining.toFixed(2)}`);
    console.log(`  Analysis: ${analysis.slice(0, 200)}...\n`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Tutorial 4: Multi-Agents with Claude API ===\n");

  // Sequential pipeline
  await analyzeLoan(
    "I took a car loan of $100,000 for 10 years at 1.88% interest. " +
    "I've repaid 36 months so far. What's my remaining balance and should I pay it off early?"
  );

  // Parallel comparison
  await compareLoans([
    { loanAmount: 100000, loanPeriod: 120, interestRate: 1.88, repaidPeriod: 36 },
    { loanAmount: 100000, loanPeriod: 120, interestRate: 1.88, repaidPeriod: 48 },
  ]);
}

main().catch(console.error);
