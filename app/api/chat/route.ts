import { NextResponse } from "next/server";
import { chat } from "../../src/agents/todo.agent";

export async function POST(req: Request) {
    const { message } = await req.json();

    const response = await chat(message);

    return NextResponse.json({
        answer: response,
    });
}