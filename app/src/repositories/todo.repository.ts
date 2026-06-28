import Todo, { TaskStatus } from "../models/todo.model";
import {
    CreateTaskDto,
    GetTasksDto,
    UpdateTaskDto,
} from "../schemas/todo.schema";

class TodoRepository {

    async create(data: CreateTaskDto) {
        return await Todo.create(data);
    }

    async findById(id: string) {
        return await Todo.findById(id);
    }

    async findAll(filter: GetTasksDto = {}) {
        const query: any = {};
        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.priority) {
            query.priority = filter.priority;
        }
        if (filter.tag) {
            query.tags = filter.tag;
        }
        if (filter.overdue) {
            query.dueDate = {
                $lt: new Date(),
            };
            query.status = {
                $ne: TaskStatus.COMPLETED,
            };
        }
        if (filter.dueToday) {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            query.dueDate = {
                $gte: start,
                $lte: end,
            };
        }
        return await Todo.find(query)
            .sort({ createdAt: -1 })
            .limit(filter.limit ?? 100);
    }
    async search(query: string) {
        return await Todo.find({
            $text: {
                $search: query,
            },
        });
    }
    async count(filter = {}) {
        return await Todo.countDocuments(filter);
    }
    async update(id: string, updates: Partial<UpdateTaskDto> | Record<string, any>) {
        return await Todo.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async updateMany(
        ids: string[],
        updates: Partial<UpdateTaskDto>
    ) {
        return await Todo.updateMany(
            {
                _id: {
                    $in: ids,
                },
            },
            {
                $set: updates,
            }
        );
    }

    async delete(id: string) {
        return await Todo.findByIdAndDelete(id);
    }

    async deleteMany(ids: string[]) {
        return await Todo.deleteMany({
            _id: {
                $in: ids,
            },
        });
    }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new TodoRepository();