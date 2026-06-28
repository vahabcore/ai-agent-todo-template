import { tool } from "@langchain/core/tools";

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

export const createTaskTool = tool(
    async (input) => {
        return await todoService.createTask(input);
    },
    {
        name: "create_task",
        description: `
Create a new todo task.

Use this tool whenever the user wants to:
- create a task
- add a todo
- add a reminder
- remember something
- schedule work
`,
        schema: CreateTaskSchema,
    }
);

export const getTasksTool = tool(
    async (input) => {
        return await todoService.getTasks(input);
    },
    {
        name: "get_tasks",
        description: `
Retrieve tasks using filters.

Examples:
- Show my tasks
- Show pending tasks
- Show completed tasks
- Show today's tasks
- Show overdue tasks
- Show high priority tasks
`,
        schema: GetTasksSchema,
    }
);

export const searchTasksTool = tool(
    async (input) => {
        return await todoService.searchTasks(input);
    },
    {
        name: "search_tasks",
        description: `
Search tasks by title or description.

Examples:
- Find grocery task
- Search project
- Find meeting
`,
        schema: SearchTaskSchema,
    }
);

export const updateTaskTool = tool(
    async (input) => {
        return await todoService.updateTask(input);
    },
    {
        name: "update_task",
        description: `
Update any property of a task.

Examples:
- Rename task
- Change due date
- Change priority
- Update description
- Update tags
`,
        schema: UpdateTaskSchema,
    }
);

export const completeTaskTool = tool(
    async (input) => {
        return await todoService.completeTask(input);
    },
    {
        name: "complete_task",
        description: `
Mark a task as completed or reopen it.
`,
        schema: CompleteTaskSchema,
    }
);

export const deleteTaskTool = tool(
    async (input) => {
        return await todoService.deleteTask(input);
    },
    {
        name: "delete_task",
        description: `
Delete a task by its ID.
`,
        schema: DeleteTaskSchema,
    }
);

export const bulkUpdateTasksTool = tool(
    async (input) => {
        return await todoService.bulkUpdateTasks(input);
    },
    {
        name: "bulk_update_tasks",
        description: `
Update multiple tasks at once.

Examples:
- Complete all overdue tasks
- Mark all work tasks completed
- Change all personal tasks to high priority
`,
        schema: BulkUpdateTasksSchema,
    }
);

export const getStatisticsTool = tool(
    async () => {
        return await todoService.getStatistics();
    },
    {
        name: "get_statistics",
        description: `
Get statistics about the user's todo list.

Examples:
- How many tasks do I have?
- Show my productivity
- Count completed tasks
`,
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
];