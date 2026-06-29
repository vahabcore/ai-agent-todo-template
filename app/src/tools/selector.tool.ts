import { z } from "zod";

export const TOOL_CATALOG = [
    { name: "create_task", description: "Create a new todo task or reminder" },
    { name: "get_tasks", description: "Retrieve or list tasks using filters" },
    { name: "search_tasks", description: "Search tasks by title or description" },
    { name: "update_task", description: "Update task properties (rename, date, priority)" },
    { name: "complete_task", description: "Mark task as complete or reopen" },
    { name: "delete_task", description: "Delete a task" },
    { name: "bulk_update_tasks", description: "Update multiple tasks at once" },
    { name: "get_statistics", description: "Get stats about the todo list" },
];

const toolNames = TOOL_CATALOG.map(t => t.name) as [string, ...string[]];

export const ToolSelectionSchema = z.object({
    selectedTools: z.array(z.enum(toolNames)).describe("An array of tool names needed to fulfill the user request"),
});