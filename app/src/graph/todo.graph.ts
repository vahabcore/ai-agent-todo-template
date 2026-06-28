import {
    Runnable,
} from "@langchain/core/runnables";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TodoState } from "./state";
import { todoTools } from "../tools/todo.tools";

function shouldContinue(state: typeof TodoState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    if ("tool_calls" in lastMessage && (lastMessage as any).tool_calls?.length) {
        return "tools";
    }
    return END;
}

export function createTodoGraph(
    llm: Runnable
) {
    async function callModel(state: typeof TodoState.State) {
        const response =
            await llm.invoke(state.messages);
        return {
            messages: [response],
        };

    }
    const toolNode =
        new ToolNode(todoTools);
    return new StateGraph(TodoState)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addEdge(START, "agent")
        .addConditionalEdges(
            "agent",
            shouldContinue
        )
        .addEdge("tools", "agent")
        .compile();

}