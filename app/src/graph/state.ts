import {
    Annotation,
    MessagesAnnotation,
} from "@langchain/langgraph";

/* -------------------------------------------------------------------------- */
/*                                Graph State                                 */
/* -------------------------------------------------------------------------- */

export const TodoState = Annotation.Root({

    /**
     * Conversation history
     */
    ...MessagesAnnotation.spec,

    /**
     * Last tool result
     */
    toolResult: Annotation<any>(),

    /**
     * Current selected task
     */
    selectedTaskId: Annotation<string | null>(),

    /**
     * User session (optional)
     */
    userId: Annotation<string | null>(),

});