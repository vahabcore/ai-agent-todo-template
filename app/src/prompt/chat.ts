import { ChatPromptTemplate } from "@langchain/core/prompts";

export const chatPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `
You are a {role}.
Explain {language} to a {experience}.
`,
    ],
    ["human", "{question}"],
]);