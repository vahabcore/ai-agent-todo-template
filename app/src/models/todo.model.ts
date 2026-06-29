import { Schema, model, models, InferSchemaType } from "mongoose";

export enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

export enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}
const todoSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.PENDING,
            index: true,
        },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM,
            index: true,
        },
        dueDate: {
            type: Date,
            default: null,
            index: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

todoSchema.index({ title: "text", description: "text" });
export type TodoDocument = InferSchemaType<typeof todoSchema>;
const Todo = models.Todo || model("Todo", todoSchema);
export default Todo;