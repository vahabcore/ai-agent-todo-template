import { HumanMessage } from "@langchain/core/messages";
import { todoTools } from "../tools/todo.tools";
import { createTodoGraph } from "../graph/todo.graph";
import { ollama } from "../lib/llm";

const model = ollama.bindTools(todoTools);
export const todoAgent = createTodoGraph(model);

export async function chat(message: string) {
    const result = await todoAgent.invoke({
        messages: [
            new HumanMessage(message),
        ],
    });

    return result.messages.at(-1)?.content;
}