import todoRepository from "../repositories/todo.repository";

import {
    BulkUpdateTasksDto,
    CompleteTaskDto,
    CreateTaskDto,
    DeleteTaskDto,
    GetTasksDto,
    SearchTaskDto,
    UpdateTaskDto,
} from "../schemas/todo.schema";

import {
    TaskStatus,
} from "../models/todo.model";

class TodoService {
    async createTask(data: CreateTaskDto) {
        return await todoRepository.create(data);
    }
    async getTasks(filters: GetTasksDto) {
        return await todoRepository.findAll(filters);
    }
    async searchTasks(data: SearchTaskDto) {
        return await todoRepository.search(data.query);
    }
    async updateTask(data: UpdateTaskDto) {

        const task = await todoRepository.findById(data.id);

        if (!task) {
            throw new Error("Task not found.");
        }

        const { id, ...updates } = data;

        return await todoRepository.update(id, updates);
    }
    async completeTask(data: CompleteTaskDto) {

        const task = await todoRepository.findById(data.id);

        if (!task) {
            throw new Error("Task not found.");
        }

        return await todoRepository.update(data.id, {
            status: data.completed
                ? TaskStatus.COMPLETED
                : TaskStatus.PENDING,

            completedAt: data.completed
                ? new Date()
                : undefined,
        });
    }

    async deleteTask(data: DeleteTaskDto) {

        const task = await todoRepository.findById(data.id);

        if (!task) {
            throw new Error("Task not found.");
        }

        await todoRepository.delete(data.id);

        return {
            success: true,
            message: "Task deleted successfully.",
        };
    }
    async bulkUpdateTasks(data: BulkUpdateTasksDto) {

        return await todoRepository.updateMany(
            data.ids,
            data.updates
        );
    }

    async getStatistics() {
        const [
            total,
            pending,
            completed,
            inProgress,
            cancelled,
        ] = await Promise.all([
            todoRepository.count(),
            todoRepository.count({
                status: TaskStatus.PENDING,
            }),
            todoRepository.count({
                status: TaskStatus.COMPLETED,
            }),
            todoRepository.count({
                status: TaskStatus.IN_PROGRESS,
            }),
            todoRepository.count({
                status: TaskStatus.CANCELLED,
            }),
        ]);
        return {
            total,
            pending,
            completed,
            inProgress,
            cancelled,
        };
    }
}
// eslint-disable-next-line import/no-anonymous-default-export
export default new TodoService();