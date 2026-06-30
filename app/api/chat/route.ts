import { dbConnect } from "@/app/src/lib/mongodb";
import { chat } from "../../src/agents/todo.agent";
import { NextResponse } from "next/server";

interface StreamEvent {
    event: string;
    name?: string;
    data?: {
        chunk?: {
            content?: string;
        };
    };
}

await dbConnect();

const encoder = new TextEncoder();

function encodeEvent(payload: object): Uint8Array {
    return encoder.encode(JSON.stringify(payload) + "\n");
}

//    POST /api/chat
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message: string | undefined = body.message;
        const threadId: string = body.threadId ?? "default_session";

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        const { selectedTools, stream: eventStream } = await chat(message, threadId);

        /* 2. Wrap the LangGraph event stream in a Web ReadableStream for SSE. */
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    /* Immediately tell the client which tools were selected. */
                    controller.enqueue(encodeEvent({ type: "router", tools: selectedTools }));

                    for await (const raw of eventStream) {
                        const event = raw as StreamEvent;

                        switch (event.event) {
                            case "on_tool_start":
                                controller.enqueue(encodeEvent({ type: "tool", name: event.name }));
                                break;

                            case "on_chat_model_start":
                                controller.enqueue(encodeEvent({ type: "thinking" }));
                                break;

                            case "on_chat_model_stream": {
                                const content = event.data?.chunk?.content;
                                if (content) {
                                    controller.enqueue(encodeEvent({ type: "text", content }));
                                }
                                break;
                            }

                            default:
                                break;
                        }
                    }

                    controller.enqueue(encodeEvent({ type: "done" }));
                } catch (err) {
                    console.error("[chat/stream] error:", err);
                    /* Surface the error to the client so the UI can show a message. */
                    controller.enqueue(encodeEvent({ type: "error", message: "Stream interrupted." }));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "application/x-ndjson",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("[chat/POST] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}