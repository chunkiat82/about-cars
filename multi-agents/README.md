# Multi-Agents Tutorial

This folder teaches you how to build multi-agent systems using the Claude Agent SDK and Claude API.

## What are multi-agents?

A multi-agent system has multiple AI agents working together. Each agent can:
- Have its own specialization and tools
- Be orchestrated by a parent (orchestrator) agent
- Run in parallel or sequentially
- Pass results to each other

## Files in this folder

| File | What it teaches |
|------|----------------|
| `1-basic-subagent.js` | Define a subagent and call it from a parent agent |
| `2-orchestrator.js` | Orchestrator pattern — one agent delegates to specialists |
| `3-parallel-agents.js` | Run multiple agents in parallel with `Promise.all` |
| `4-claude-api-agents.js` | Build agents using only the Claude API (no Agent SDK) |

## Setup

```bash
npm install @anthropic-ai/claude-agent-sdk @anthropic-ai/sdk
export ANTHROPIC_API_KEY="your-key"
```

## Core concepts

### 1. Subagents (Agent SDK)

The `agents` option lets you define named subagents. The parent agent can invoke them via the `Agent` tool.

```js
query({
  prompt: "Use the analyst to find trends",
  options: {
    allowedTools: ["Agent"],
    agents: {
      analyst: {
        description: "Data analyst",
        prompt: "Analyze data and find trends.",
        tools: ["Read", "Bash"],
      },
    },
  },
})
```

### 2. Orchestrator pattern

An orchestrator agent breaks down a task and delegates parts to specialized subagents. The orchestrator collects and merges results.

### 3. Parallel agents (Claude API)

For maximum control and parallelism, skip the Agent SDK and call Claude directly with `Promise.all`. Each agent is an independent API call with its own system prompt and tool set.
