import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

/**
 * TodoState — the single source of truth that flows through every graph node.
 *
 * MessagesAnnotation.spec already handles:
 *   - messages: BaseMessage[]
 *   - automatic append-reducer (new messages are merged, not overwritten)
 *
 * We extend it with lightweight metadata that nodes may read / write.
 */
export const TodoState = Annotation.Root({
    /** Full conversation history (user ↔ assistant ↔ tool messages). */
    ...MessagesAnnotation.spec,

    /** Raw result from the most-recently executed tool (useful for chaining). */
    toolResult: Annotation<unknown>(),

    /** ID of the task the user is currently acting on, for multi-step flows. */
    selectedTaskId: Annotation<string | null>(),

    /** Optional: caller's user/session identifier. */
    userId: Annotation<string | null>(),
});

/** Convenience type alias for node functions. */
export type TodoStateType = typeof TodoState.State;