import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { todoTools, TodoToolName } from "../tools/todo.tool";
import { TOOL_CATALOG, ToolSelectionSchema, ToolSelection } from "../tools/selector.tool";
import { createTodoGraph } from "../graph/todo.graph";
import { ollama } from "../lib/llm";


const routerLlm = ollama.withStructuredOutput(ToolSelectionSchema);

const routerPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are a routing assistant. Given the user's message, select which tools " +
        "are needed from the catalog below to fulfill the request.\n\n" +
        "Tool catalog:\n{tool_catalog}\n\n" +
        "Rules:\n" +
        "- Only pick tools that are directly needed.\n" +
        "- Return an empty array for conversational messages with no task actions.",
    ],
    ["human", "{input}"],
]);

const routerChain = routerPrompt.pipe(routerLlm);

export async function chat(
    message: string,
    threadId: string
): Promise<{ selectedTools: string[]; stream: AsyncIterable<unknown> }> {

    const routing: ToolSelection = await routerChain.invoke({
        input: message,
        tool_catalog: JSON.stringify(TOOL_CATALOG, null, 2),
    });

    const selectedToolNames: string[] = routing.selectedTools ?? [];
    console.log(`[router] selected: [${selectedToolNames.join(", ") || "none"}]`);

    const activeLlm =
        selectedToolNames.length > 0
            ? ollama.bindTools(
                todoTools.filter((t): t is (typeof todoTools)[number] =>
                    selectedToolNames.includes(t.name as TodoToolName)
                )
            )
            : ollama;

    const graph = createTodoGraph(activeLlm);

    const stream = graph.streamEvents(
        { messages: [new HumanMessage(message)] },
        {
            version: "v2",
            configurable: { thread_id: threadId },
        }
    );

    return { selectedTools: selectedToolNames, stream };
}