import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { todoTools } from "../tools/todo.tool";
import { TOOL_CATALOG, ToolSelectionSchema } from "../tools/selector.tool";
import { createTodoGraph } from "../graph/todo.graph";
import { ollama } from "../lib/llm";

const routerLlm = ollama.withStructuredOutput(ToolSelectionSchema);

export async function chat(message: string, threadId: string) {

    const routerPrompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `You are a smart routing assistant. Look at the user's request and decide which tools are needed to fulfill it. 
             Here are the available tools: {tool_catalog}
             Only select the tools that are absolutely necessary. If no tools are needed, return an empty array.`
        ],
        ["user", "{input}"]
    ]);

    const routerChain = routerPrompt.pipe(routerLlm);

    const routingDecision = await routerChain.invoke({
        input: message,
        tool_catalog: JSON.stringify(TOOL_CATALOG, null, 2)
    });

    const selectedToolNames = routingDecision.selectedTools || [];
    console.log(`AI selected tools: ${selectedToolNames.join(", ")}`);

    let optimizedModel;
    if (selectedToolNames.length > 0) {
        const activeTools = todoTools.filter(tool =>
            selectedToolNames.includes(tool.name)
        );
        optimizedModel = ollama.bindTools(activeTools);
    } else {
        optimizedModel = ollama;
    }

    const todoAgent = createTodoGraph(optimizedModel);

    const eventStream = await todoAgent.streamEvents(
        { messages: [new HumanMessage(message)] },
        {
            version: "v2",
            configurable: { thread_id: threadId }
        }
    );

    return eventStream;
}