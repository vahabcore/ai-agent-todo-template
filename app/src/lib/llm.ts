import { ChatOllama } from "@langchain/ollama";

/**
 * Shared Ollama LLM instance.
 * temperature: 0 → deterministic/consistent tool usage.
 * numCtx: larger context window for multi-turn conversations.
 */
export const ollama = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
    temperature: 0,
    numCtx: 4096,
});