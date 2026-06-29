import { Runnable } from "@langchain/core/runnables";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { TodoState } from "./state";
import { todoTools } from "../tools/todo.tool";

const memory = new MemorySaver();

function shouldContinue(state: typeof TodoState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    if ("tool_calls" in lastMessage && (lastMessage as any).tool_calls?.length) {
        return "tools";
    }
    return END;
}

export function createTodoGraph(llm: Runnable) {
    async function callModel(state: typeof TodoState.State) {
        const systemPrompt = new SystemMessage(`
            You are a helpful, professional Todo Assistant.
            You have access to tools to manage the user's tasks.
            When a tool returns data, read it and summarize it for the user in natural, conversational language.
            NEVER show the user raw JSON, tool parameters, or command syntax. 
            Just give them the final answer directly.
        `);

        const response = await llm.invoke([systemPrompt, ...state.messages]);
        return { messages: [response] };
    }

    const toolNode = new ToolNode(todoTools);

    return new StateGraph(TodoState)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent")
        // 3. Attach the memory checkpointer during compile
        .compile({ checkpointer: memory });
}