import { ChatOllama } from "@langchain/ollama"

export const ollama = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "llama3.1:8b",
    temperature: 0,
});