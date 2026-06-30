import { dbConnect } from "@/app/src/lib/mongodb";
import todoService from "@/app/src/services/todo.service";
import { NextResponse } from "next/server";

await dbConnect();

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const task = await todoService.updateTask({ id, ...body });

        return NextResponse.json(task, { status: 200 });
    } catch (error: any) {
        console.error("PATCH /api/todos/[id] error:", error);
        if (error.message === "Task not found.") {
            return NextResponse.json({ error: "Task not found." }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update todo." }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await todoService.deleteTask({ id });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("DELETE /api/todos/[id] error:", error);
        if (error.message === "Task not found.") {
            return NextResponse.json({ error: "Task not found." }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete todo." }, { status: 500 });
    }
}
