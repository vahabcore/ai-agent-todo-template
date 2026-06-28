import { z } from "zod";

export const PrioritySchema = z.enum([
    "low",
    "medium",
    "high",
]);
export const StatusSchema = z.enum([
    "pending",
    "in_progress",
    "completed",
    "cancelled",
]);

export const CreateTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(100),

    description: z
        .string()
        .trim()
        .max(500)
        .optional(),

    priority: PrioritySchema.default("medium"),

    dueDate: z
        .string()
        .datetime()
        .optional(),

    tags: z
        .array(z.string().trim())
        .default([]),
});

export type CreateTaskDto = z.infer<
    typeof CreateTaskSchema
>;

export const UpdateTaskSchema = z.object({
    id: z.string(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    priority: PrioritySchema.optional(),
    status: StatusSchema.optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
});
export type UpdateTaskDto = z.infer<
    typeof UpdateTaskSchema
>;
export const DeleteTaskSchema = z.object({
    id: z.string(),
});
export type DeleteTaskDto = z.infer<
    typeof DeleteTaskSchema
>;
export const SearchTaskSchema = z.object({
    query: z.string().min(1),
});
export type SearchTaskDto = z.infer<
    typeof SearchTaskSchema
>;
export const GetTasksSchema = z.object({
    status: StatusSchema.optional(),
    priority: PrioritySchema.optional(),
    tag: z.string().optional(),
    overdue: z.boolean().optional(),
    dueToday: z.boolean().optional(),
    limit: z.number().positive().optional(),
});
export type GetTasksDto = z.infer<
    typeof GetTasksSchema
>;
export const CompleteTaskSchema = z.object({
    id: z.string(),
    completed: z.boolean().default(true),
});
export type CompleteTaskDto = z.infer<
    typeof CompleteTaskSchema
>;
export const BulkUpdateTasksSchema = z.object({
    ids: z.array(z.string()).min(1),
    updates: UpdateTaskSchema.omit({
        id: true,
    }),
});
export type BulkUpdateTasksDto = z.infer<
    typeof BulkUpdateTasksSchema
>;