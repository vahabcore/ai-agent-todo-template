import { dbConnect } from "@/app/src/lib/mongodb";
import { chat } from "../../src/agents/todo.agent";
import { NextResponse } from "next/server";

await dbConnect();

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Extract the new single message and the optional threadId
        const message = body.message;
        const threadId = body.threadId || "default_session"; // Fallback ID

        if (!message) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        // 2. Pass both to your agent
        const eventStream = await chat(message, threadId);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of eventStream) {
                        if (event.event === "on_chat_model_stream") {
                            const chunk = event.data.chunk;
                            if (chunk && chunk.content) {
                                controller.enqueue(encoder.encode(chunk.content));
                            }
                        }
                    }
                } catch (err) {
                    console.error("Stream error:", err);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}