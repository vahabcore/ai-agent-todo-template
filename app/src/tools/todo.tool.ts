import { tool } from "@langchain/core/tools";
import { z } from "zod";
import todoService from "../services/todo.service";
import {
    CreateTaskSchema,
    UpdateTaskSchema,
    DeleteTaskSchema,
    SearchTaskSchema,
    GetTasksSchema,
    CompleteTaskSchema,
    BulkUpdateTasksSchema,
} from "../schemas/todo.schema";

/* ─────────────────────────────────────────────────────────────
   HELPER
   Serialises a result to JSON and converts thrown errors into
   a structured { error } response so the LLM can self-correct
   instead of crashing the graph node.
───────────────────────────────────────────────────────────── */
function toJson(value: unknown): string {
    return JSON.stringify(value);
}

function errorJson(err: unknown): string {
    const message = err instanceof Error ? err.message : "An unknown error occurred.";
    return JSON.stringify({ error: message });
}

//    TOOLS
export const createTaskTool = tool(
    async (input) => {
        try { return toJson(await todoService.createTask(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "create_task",
        description:
            "Create a new todo task. " +
            "Use when the user wants to add a task, set a reminder, or schedule work.",
        schema: CreateTaskSchema,
    }
);

export const getTasksTool = tool(
    async (input) => {
        try { return toJson(await todoService.getTasks(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "get_tasks",
        description:
            "Retrieve tasks with optional filters. " +
            "Use for: listing tasks, showing pending/completed/overdue tasks, filtering by priority or tag.",
        schema: GetTasksSchema.extend({
            intent: z
                .string()
                .describe("Brief description of what to retrieve, e.g. 'all', 'pending', 'high priority overdue'"),
        }),
    }
);

export const searchTasksTool = tool(
    async (input) => {
        try { return toJson(await todoService.searchTasks(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "search_tasks",
        description:
            "Full-text search across task titles and descriptions. " +
            "Use when the user provides a keyword or phrase to find a specific task.",
        schema: SearchTaskSchema,
    }
);

export const updateTaskTool = tool(
    async (input) => {
        try { return toJson(await todoService.updateTask(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "update_task",
        description:
            "Update one or more properties of an existing task (title, description, priority, due date, tags, status). " +
            "Requires the task ID — call get_tasks or search_tasks first if needed.",
        schema: UpdateTaskSchema,
    }
);

export const completeTaskTool = tool(
    async (input) => {
        try { return toJson(await todoService.completeTask(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "complete_task",
        description:
            "Mark a task as completed (or reopen it). " +
            "Use when the user says a task is done, finished, or wants to undo a completion.",
        schema: CompleteTaskSchema,
    }
);

export const deleteTaskTool = tool(
    async (input) => {
        try { return toJson(await todoService.deleteTask(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "delete_task",
        description:
            "Permanently delete a task by ID. " +
            "Requires the task ID — call get_tasks or search_tasks first if you don't have it.",
        schema: DeleteTaskSchema,
    }
);

export const bulkUpdateTasksTool = tool(
    async (input) => {
        try { return toJson(await todoService.bulkUpdateTasks(input)); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "bulk_update_tasks",
        description:
            "Update multiple tasks at once with the same changes. " +
            "Use for bulk completions, priority changes, or status updates across many tasks.",
        schema: BulkUpdateTasksSchema,
    }
);

export const getStatisticsTool = tool(
    async () => {
        try { return toJson(await todoService.getStatistics()); }
        catch (e) { return errorJson(e); }
    },
    {
        name: "get_statistics",
        description:
            "Return a summary of the todo list: total, pending, in-progress, completed, and cancelled counts. " +
            "Use when the user asks for an overview, stats, or productivity summary.",
    }
);

export const todoTools = [
    createTaskTool,
    getTasksTool,
    searchTasksTool,
    updateTaskTool,
    completeTaskTool,
    deleteTaskTool,
    bulkUpdateTasksTool,
    getStatisticsTool,
] as const;

export type TodoToolName = (typeof todoTools)[number]["name"];