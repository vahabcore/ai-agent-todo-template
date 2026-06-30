import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { TodoState, TodoStateType } from "./state";
import { todoTools } from "../tools/todo.tool";

const memory = new MemorySaver();

const SYSTEM_PROMPT = new SystemMessage(`
You are a focused, professional Todo Assistant.

Rules you MUST follow:
1. ALWAYS use tools to read or mutate tasks — never invent or hallucinate task data.
2. When you need to call a tool, emit ONLY the tool call. No filler like "Sure, let me…".
3. After a tool returns, summarise the result clearly in plain English. Do NOT dump raw JSON.
4. If a user asks to update or delete a task but you don't have its ID, call get_tasks or
   search_tasks first, then proceed with the correct ID.
5. When listing tasks, group and format them clearly. Use markdown lists.
6. Be concise. One clear sentence is better than a paragraph.
`.trim());


function shouldContinue(state: TodoStateType): "tools" | typeof END {
   const lastMessage = state.messages.at(-1) as AIMessage | undefined;
   return lastMessage?.tool_calls?.length ? "tools" : END;
}

export function createTodoGraph(llm: Runnable) {
   const toolNode = new ToolNode([...todoTools]);

   async function callModel(state: TodoStateType) {
      const response = await llm.invoke([SYSTEM_PROMPT, ...state.messages]);
      return { messages: [response] };
   }

   return new StateGraph(TodoState)
      .addNode("agent", callModel)
      .addNode("tools", toolNode)
      .addEdge(START, "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge("tools", "agent")
      .compile({ checkpointer: memory });
}