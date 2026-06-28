# 🤖 AI Agent Todo Template

A modern, agentic Todo application template powered by **Next.js**, **LangGraph**, **Ollama**, and **MongoDB**. 

This template demonstrates how to build a stateful, capable AI agent that can autonomously manage your tasks—creating, updating, searching, and deleting them—using a natural language interface. Instead of just answering questions, the agent actively orchestrates tools and database operations via LangGraph's state machine to accomplish your goals.

---

## ✨ Features

- **🧠 Autonomous Agentic Workflow**: Built with [LangGraph](https://langchain-ai.github.io/langgraphjs/) for a resilient, stateful, and cyclic graph-based agent architecture.
- **🛠️ Rich Tool Ecosystem**: The agent is equipped with several tools (CRUD operations, search, statistics, bulk update) built using `Zod` schemas.
- **🦙 Local AI Models**: Uses [Ollama](https://ollama.com/) (defaults to `llama3.1:8b`) for complete privacy and cost-free local development.
- **⚡ Next.js App Router**: Modern API routes and server actions using Next.js 14+.
- **🗄️ MongoDB Integration**: Robust database models utilizing Mongoose for storing tasks.
- **🔒 Type-Safe**: End-to-end type safety with TypeScript and Zod validation.

---

## 🏗️ Architecture & Project Structure

The core agent logic is structured modularly under `app/src/`:

```text
app/src/
├── agents/             # The main agent interface (e.g., todo.agent.ts)
├── graph/              # LangGraph state machine & routing (todo.graph.ts, state.ts)
├── lib/                # LLM initialization (llm.ts)
├── models/             # Mongoose database models (todo.model.ts)
├── repositories/       # Database access layer (todo.repository.ts)
├── schemas/            # Zod validation schemas (todo.schema.ts)
├── services/           # Business logic layer (todo.service.ts)
└── tools/              # LangChain tools for the agent (todo.tools.ts)
```

### How It Works
1. You send a natural language message to the `/api/chat` endpoint.
2. The `todoAgent` (a compiled LangGraph `StateGraph`) processes the message.
3. The LLM decides if it needs to call one of the provided tools (e.g., `create_task`, `search_tasks`).
4. If a tool is called, the graph loops back, executes the tool, and returns the result to the LLM.
5. Once the LLM formulates a final response, it is returned to the user.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB**: A running MongoDB instance (local or MongoDB Atlas).
- **Ollama**: Download and install [Ollama](https://ollama.com/).

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Ollama

Ensure Ollama is running in the background, then pull the recommended model:

```bash
ollama pull llama3.1:8b
```

*(Note: The model name in `app/src/lib/llm.ts` is configured to `"llama3.1:8b"`. You can change this to any model you have pulled in Ollama).*

### 3. Environment Variables

Create a `.env` or `.env.local` file in the root directory and add your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/ai-agent-todo
```

*(If you are using the default Mongoose connection, ensure your database connection logic in your `config/db.ts` or main app file uses this variable).*

### 4. Run the Development Server

```bash
npm run dev
```

The Next.js server will start on [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Available Agent Tools

The agent has access to the following tools to manage your tasks:

- **`create_task`**: Create a new task with title, description, priority, and due date.
- **`get_tasks`**: Retrieve tasks based on filters (e.g., pending, completed, overdue, due today).
- **`search_tasks`**: Full-text search for tasks by title or description.
- **`update_task`**: Modify task properties (title, priority, tags, etc.).
- **`complete_task`**: Mark a task as completed or reopen it.
- **`delete_task`**: Remove a task by its ID.
- **`bulk_update_tasks`**: Update multiple tasks simultaneously.
- **`get_statistics`**: Get a summary of your tasks (total, pending, completed, etc.).

---

## 💬 Example Usage

You can test the agent by sending a POST request to `/api/chat`:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I need to buy groceries tomorrow. Add it as high priority."}'
```

**Agent's autonomous actions:**
1. The agent parses your message.
2. It invokes the `create_task` tool with `title: "Buy groceries"`, `priority: "high"`, and sets the `dueDate` to tomorrow.
3. The task is saved to MongoDB.
4. The agent responds with a confirmation message.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request if you'd like to add new tools, improve the graph logic, or enhance the frontend.

## 📄 License

This project is licensed under the MIT License.
