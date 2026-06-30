import { dbConnect } from "@/app/src/lib/mongodb";
import todoService from "@/app/src/services/todo.service";
import { NextResponse } from "next/server";

await dbConnect();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as any ?? undefined;
        const priority = searchParams.get("priority") as any ?? undefined;

        const tasks = await todoService.getTasks({ status, priority });

        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        console.error("GET /api/todos error:", error);
        return NextResponse.json({ error: "Failed to fetch todos." }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.title) {
            return NextResponse.json({ error: "Title is required." }, { status: 400 });
        }

        const task = await todoService.createTask({
            title: body.title,
            description: body.description,
            priority: body.priority ?? "medium",
            dueDate: body.dueDate,
            tags: body.tags ?? [],
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("POST /api/todos error:", error);
        return NextResponse.json({ error: "Failed to create todo." }, { status: 500 });
    }
}
