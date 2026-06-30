import { z } from "zod";
import { todoTools } from "./todo.tool";

export const TOOL_CATALOG = todoTools.map((t) => ({
    name: t.name,
    description: t.description,
}));

const toolNameEnum = todoTools.map((t) => t.name) as [string, ...string[]];

export const ToolSelectionSchema = z.object({
    selectedTools: z
        .array(z.enum(toolNameEnum))
        .describe(
            "Ordered list of tool names needed to fulfill the user request. " +
            "Return an empty array if no tools are required."
        ),
});

export type ToolSelection = z.infer<typeof ToolSelectionSchema>;