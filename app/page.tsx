"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./page.css";


/* ─────────────────── Types ─────────────────── */
type Priority = "low" | "medium" | "high";
type Status = "pending" | "in_progress" | "completed" | "cancelled";

type Todo = {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate?: string;
  tags?: string[];
  completedAt?: string;
  createdAt: string;
};

type ThinkingStep = { label: string; status: "running" | "done" };
type Message = {
  role: "user" | "assistant";
  content: string;
  thinkingSteps: ThinkingStep[];
  thinkingCollapsed: boolean;
};
type Filter = "all" | Status;

/* ─── Markdown renderer ─── */
function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
      h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
      h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
      p: ({ children }) => <p className="md-p">{children}</p>,
      code: ({ className, children, ...props }) => {
        const isBlock = className?.startsWith("language-");
        const lang = className?.replace("language-", "") ?? "";
        return isBlock ? (
          <div className="md-code-wrap">
            {lang && <span className="md-code-lang">{lang}</span>}
            <pre className="md-pre"><code className="md-code-block">{children}</code></pre>
          </div>
        ) : <code className="md-code-inline" {...props}>{children}</code>;
      },
      pre: ({ children }) => <>{children}</>,
      ul: ({ children }) => <ul className="md-ul">{children}</ul>,
      ol: ({ children }) => <ol className="md-ol">{children}</ol>,
      li: ({ children }) => <li className="md-li">{children}</li>,
      blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
      table: ({ children }) => <div className="md-table-wrap"><table className="md-table">{children}</table></div>,
      th: ({ children }) => <th className="md-th">{children}</th>,
      td: ({ children }) => <td className="md-td">{children}</td>,
      a: ({ children, href }) => <a className="md-a" href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      hr: () => <hr className="md-hr" />,
      strong: ({ children }) => <strong className="md-strong">{children}</strong>,
      em: ({ children }) => <em className="md-em">{children}</em>,
    }}>{content}</ReactMarkdown>
  );
}

/* ─── Priority config ─── */
const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string; dot: string }> = {
  high:   { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.3)", dot: "#ff6b6b" },
  medium: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  dot: "#fbbf24" },
  low:    { color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  dot: "#34d399" },
};

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  pending:     { color: "#7c6aff", label: "Pending" },
  in_progress: { color: "#60b4ff", label: "In Progress" },
  completed:   { color: "#34d399", label: "Completed" },
  cancelled:   { color: "#555",    label: "Cancelled" },
};

/* ─── Highlight matching text ─── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ─── Progress ring ─── */
function ProgressRing({ total, done }: { total: number; done: number }) {
  const r = 16; const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  const dash = circ * pct;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke="#1a1a2e" strokeWidth="3.5" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c6aff" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ════════════════════════════ MAIN ════════════════════════════ */
export default function TodoApp() {
  /* ── Todo state ── */
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addPriority, setAddPriority] = useState<Priority>("medium");
  const [addLoading, setAddLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  /* ── Chat state ── */
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const threadId = "user_session_123";

  /* ── Fetch todos ── */
  const fetchTodos = useCallback(async () => {
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/todos${params}`);
      if (!res.ok) throw new Error("Failed");
      setTodos(await res.json());
    } catch (err) {
      console.error("fetchTodos:", err);
    } finally {
      setTodosLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ── Search filter (client-side) ── */
  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const q = searchQuery.toLowerCase();
    return todos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.tags ?? []).some(tag => tag.toLowerCase().includes(q))
    );
  }, [todos, searchQuery]);

  /* ── Stats ── */
  const total = todos.length;
  const done = todos.filter(t => t.status === "completed").length;
  const pending = todos.filter(t => t.status === "pending" || t.status === "in_progress").length;

  /* ── Add todo ── */
  const handleAddTodo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = addTitle.trim();
    if (!title || addLoading) return;
    setAddLoading(true);
    const optimisticId = `opt_${Date.now()}`;
    const optimistic: Todo = { _id: optimisticId, title, status: "pending", priority: addPriority, createdAt: new Date().toISOString() };
    setTodos(prev => [optimistic, ...prev]);
    setAddTitle("");
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: addPriority }),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      setTodos(prev => prev.map(t => t._id === optimisticId ? created : t));
    } catch {
      setTodos(prev => prev.filter(t => t._id !== optimisticId));
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Toggle complete ── */
  const handleToggle = async (todo: Todo) => {
    if (togglingIds.has(todo._id)) return;
    setTogglingIds(prev => new Set(prev).add(todo._id));
    const ns: Status = todo.status === "completed" ? "pending" : "completed";
    setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, status: ns } : t));
    try {
      await fetch(`/api/todos/${todo._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ns }),
      });
    } catch {
      setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, status: todo.status } : t));
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(todo._id); return s; });
    }
  };

  /* ── Delete todo ── */
  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return;
    setDeletingIds(prev => new Set(prev).add(id));
    setTodos(prev => prev.filter(t => t._id !== id));
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
    } catch {
      fetchTodos();
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  /* ── Chat handlers ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const appendThinkingStep = (label: string) =>
    setMessages(prev => { const m = structuredClone(prev); const l = m[m.length - 1]; if (l?.role === "assistant") l.thinkingSteps.push({ label, status: "running" }); return m; });
  const markLastStepDone = () =>
    setMessages(prev => { const m = structuredClone(prev); const l = m[m.length - 1]; if (l?.role === "assistant") { const s = l.thinkingSteps; if (s.length > 0) s[s.length - 1].status = "done"; } return m; });
  const markAllThinkingDone = () =>
    setMessages(prev => { const m = structuredClone(prev); const l = m[m.length - 1]; if (l?.role === "assistant") l.thinkingSteps = l.thinkingSteps.map(s => ({ ...s, status: "done" })); return m; });
  const appendText = (chunk: string) =>
    setMessages(prev => { const m = structuredClone(prev); const l = m[m.length - 1]; if (l?.role === "assistant") l.content += chunk; return m; });
  const toggleThinking = (i: number) =>
    setMessages(prev => { const m = [...prev]; m[i] = { ...m[i], thinkingCollapsed: !m[i].thinkingCollapsed }; return m; });

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setMessages(prev => [...prev,
      { role: "user", content: text, thinkingSteps: [], thinkingCollapsed: false },
      { role: "assistant", content: "", thinkingSteps: [], thinkingCollapsed: false },
    ]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);
    let generatingStepAdded = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "router") {
              if (data.tools?.length > 0) appendThinkingStep(`Using: ${data.tools.join(", ")}`);
              else appendThinkingStep("Analyzing request…");
            } else if (data.type === "tool") {
              markLastStepDone(); appendThinkingStep(`Running ${data.name}…`);
            } else if (data.type === "thinking") {
              markLastStepDone();
              if (!generatingStepAdded) { appendThinkingStep("Generating response…"); generatingStepAdded = true; }
            } else if (data.type === "text") {
              appendText(data.content);
            } else if (data.type === "done") {
              markAllThinkingDone();
            }
          } catch { /* skip */ }
        }
      }
      markAllThinkingDone();
    } catch {
      setMessages(prev => { const m = structuredClone(prev); const l = m[m.length - 1]; if (l?.role === "assistant" && !l.content) l.content = "⚠️ Something went wrong. Please try again."; return m; });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
      setTimeout(() => fetchTodos(), 500);
    }
  };

  /* ── Date format ── */
  const fmtDate = (d?: string) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const overdue = date < new Date();
    return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), overdue };
  };

  /* ── Filter labels ── */
  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  /* ── Count badges per filter ── */
  const filterCounts: Record<Filter, number> = {
    all: todos.length,
    pending: todos.filter(t => t.status === "pending").length,
    in_progress: todos.filter(t => t.status === "in_progress").length,
    completed: todos.filter(t => t.status === "completed").length,
    cancelled: todos.filter(t => t.status === "cancelled").length,
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="app-root">

      {/* ══ HEADER ══ */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            <div className="logo-icon">
              <img src="/favicon.png" alt="AI Todo Logo" width="34" height="34" style={{ borderRadius: '9px', objectFit: 'cover' }} />
            </div>
            <div>
              <span className="logo-title">AI Todo</span>
              <span className="logo-sub">LangGraph + Ollama</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="progress-wrap">
            <ProgressRing total={total} done={done} />
            <div className="progress-label">
              <span className="progress-num">{total === 0 ? "—" : `${Math.round((done / total) * 100)}%`}</span>
              <span className="progress-sub">done</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-val" style={{ color: "#7c6aff" }}>{pending}</span>
              <span className="stat-key">pending</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-val" style={{ color: "#34d399" }}>{done}</span>
              <span className="stat-key">done</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-val" style={{ color: "#fbbf24" }}>{total}</span>
              <span className="stat-key">total</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="ai-badge">
            <span className="ai-dot" />
            AI Active
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="app-body">

        {/* ════ LEFT: Todo Panel ════ */}
        <aside className="todo-panel">

          {/* Add form */}
          <div className="panel-section add-section">
            <form className="add-form" onSubmit={handleAddTodo}>
              <div className="add-input-row">
                <div className="add-input-wrap">
                  <svg className="add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="add-input"
                    placeholder="Add a new task…"
                    value={addTitle}
                    onChange={e => setAddTitle(e.target.value)}
                    disabled={addLoading}
                    aria-label="New task title"
                    id="add-task-input"
                  />
                </div>
              </div>
              <div className="add-controls-row">
                <div className="priority-pills">
                  {(["low", "medium", "high"] as Priority[]).map(p => (
                    <button key={p} type="button"
                      className={`priority-pill ${addPriority === p ? "active" : ""}`}
                      style={addPriority === p ? {
                        background: PRIORITY_CONFIG[p].bg,
                        color: PRIORITY_CONFIG[p].color,
                        borderColor: PRIORITY_CONFIG[p].border,
                      } : {}}
                      onClick={() => setAddPriority(p)}
                      id={`priority-pill-${p}`}
                    >
                      <span className="pill-dot" style={{ background: PRIORITY_CONFIG[p].dot }} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <button type="submit" className="add-btn" disabled={addLoading || !addTitle.trim()} id="add-task-btn">
                  {addLoading ? <span className="spinner-xs white" /> : <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Add
                  </>}
                </button>
              </div>
            </form>
          </div>

          {/* Search bar */}
          <div className="panel-section search-section">
            <div className={`search-wrap ${searchQuery ? "has-value" : ""}`}>
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchRef}
                className="search-input"
                placeholder="Search tasks by title, description or tag…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search tasks"
                id="search-input"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} aria-label="Clear search" id="clear-search">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="search-result-count">
                {filteredTodos.length === 0
                  ? "No results"
                  : `${filteredTodos.length} result${filteredTodos.length !== 1 ? "s" : ""} for "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Filter tabs */}
          <div className="panel-section filter-section">
            <div className="filter-tabs" role="tablist">
              {FILTERS.map(f => (
                <button key={f.key} role="tab" aria-selected={filter === f.key}
                  className={`filter-tab ${filter === f.key ? "active" : ""}`}
                  onClick={() => { setFilter(f.key); setSearchQuery(""); }}
                  id={`filter-${f.key}`}
                >
                  {f.label}
                  {filterCounts[f.key] > 0 && (
                    <span className="filter-count">{filterCounts[f.key]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="task-list" role="list">
            {todosLoading ? (
              <div className="tasks-placeholder">
                {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="tasks-empty">
                {searchQuery ? (
                  <>
                    <div className="empty-emoji">🔍</div>
                    <p className="empty-title">No matches found</p>
                    <p className="empty-sub">Try a different search term</p>
                    <button className="empty-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>
                  </>
                ) : (
                  <>
                    <div className="empty-emoji">{filter === "completed" ? "🎉" : "✦"}</div>
                    <p className="empty-title">{filter === "completed" ? "Nothing completed yet" : filter === "all" ? "No tasks yet" : `No ${filter.replace("_", " ")} tasks`}</p>
                    <p className="empty-sub">{filter === "all" ? "Add a task above or ask the AI assistant" : "Switch filter or add tasks"}</p>
                  </>
                )}
              </div>
            ) : (
              filteredTodos.map(todo => {
                const due = fmtDate(todo.dueDate);
                const pc = PRIORITY_CONFIG[todo.priority];
                const isCompleted = todo.status === "completed";
                return (
                  <div key={todo._id} role="listitem" id={`task-${todo._id}`}
                    className={`task-card ${isCompleted ? "completed" : ""} ${deletingIds.has(todo._id) ? "deleting" : ""}`}
                    style={{ "--priority-color": pc.color } as React.CSSProperties}
                  >
                    {/* Priority stripe */}
                    <div className="task-stripe" style={{ background: pc.color }} />

                    {/* Checkbox */}
                    <button
                      className={`task-check ${isCompleted ? "checked" : ""}`}
                      style={isCompleted ? { borderColor: "#34d399", background: "rgba(52,211,153,0.15)" } : {}}
                      onClick={() => handleToggle(todo)}
                      aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                      aria-pressed={isCompleted}
                      id={`check-${todo._id}`}
                    >
                      {togglingIds.has(todo._id)
                        ? <span className="spinner-xs" style={{ borderTopColor: "#34d399" }} />
                        : isCompleted
                          ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          : null}
                    </button>

                    {/* Content */}
                    <div className="task-content">
                      <span className={`task-title ${isCompleted ? "struck" : ""}`}>
                        <Highlight text={todo.title} query={searchQuery} />
                      </span>
                      {todo.description && (
                        <span className="task-desc">
                          <Highlight text={todo.description} query={searchQuery} />
                        </span>
                      )}
                      <div className="task-meta">
                        <span className="priority-badge" style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}>
                          <span className="meta-dot" style={{ background: pc.dot }} />
                          {todo.priority}
                        </span>
                        {todo.status !== "pending" && todo.status !== "completed" && (
                          <span className="status-badge" style={{ color: STATUS_CONFIG[todo.status].color }}>
                            {STATUS_CONFIG[todo.status].label}
                          </span>
                        )}
                        {due && (
                          <span className={`due-badge ${due.overdue && !isCompleted ? "overdue" : ""}`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            {due.label}
                          </span>
                        )}
                        {todo.tags?.map(tag => (
                          <span key={tag} className="tag-badge" onClick={() => setSearchQuery(tag)} title={`Filter by #${tag}`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Delete */}
                    <button className="task-delete" onClick={() => handleDelete(todo._id)}
                      aria-label={`Delete: ${todo.title}`} id={`delete-${todo._id}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ════ RIGHT: Chat Panel ════ */}
        <section className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#7c6aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              AI Assistant
            </div>
            <p className="chat-panel-sub">Ask me to manage your tasks with natural language</p>
          </div>

          <main className="chat-main">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-glow" />
                <div className="empty-icon">✦</div>
                <h2>What would you like to do?</h2>
                <p>I can add, update, complete, search, and delete tasks using natural language.</p>
                <div className="suggestion-chips">
                  {[
                    { label: "📋 Show all tasks", msg: "Show my tasks" },
                    { label: "➕ Add a task", msg: "Add a task: Review the project report" },
                    { label: "⏳ What's pending?", msg: "What's pending?" },
                    { label: "✅ Mark all done", msg: "Mark all pending tasks as done" },
                    { label: "🔴 High priority", msg: "Show high priority tasks" },
                    { label: "📊 Statistics", msg: "Show my task statistics" },
                  ].map((c) => (
                    <button key={c.msg} className="chip"
                      onClick={() => { setInput(c.msg); inputRef.current?.focus(); }}
                      id={`chip-${c.msg.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message-row ${msg.role}`}>
                    <div className="avatar">
                      {msg.role === "user"
                        ? <span>U</span>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>}
                    </div>
                    <div className="message-body">
                      {msg.role === "assistant" && msg.thinkingSteps.length > 0 && (
                        <div className="thinking-panel">
                          <button className="thinking-toggle" onClick={() => toggleThinking(idx)} aria-expanded={!msg.thinkingCollapsed}>
                            <span className="thinking-icon">
                              {msg.thinkingSteps.some(s => s.status === "running")
                                ? <span className="spinner" />
                                : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </span>
                            <span className="thinking-label">
                              {msg.thinkingSteps.some(s => s.status === "running")
                                ? msg.thinkingSteps[msg.thinkingSteps.length - 1].label
                                : `Completed ${msg.thinkingSteps.length} step${msg.thinkingSteps.length !== 1 ? "s" : ""}`}
                            </span>
                            <span className="chevron">{msg.thinkingCollapsed ? "▸" : "▾"}</span>
                          </button>
                          {!msg.thinkingCollapsed && (
                            <ul className="thinking-steps">
                              {msg.thinkingSteps.map((step, si) => (
                                <li key={si} className={`step ${step.status}`}>
                                  <span className="step-icon">
                                    {step.status === "running"
                                      ? <span className="spinner-sm" />
                                      : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </span>
                                  {step.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      <div className="bubble">
                        {msg.role === "user"
                          ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                          : msg.content
                            ? <div className="md-root"><MarkdownMessage content={msg.content} /></div>
                            : <span className="cursor-blink" aria-label="Generating" />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </main>

          {/* Input */}
          <footer className="chat-footer">
            <div className="input-wrap">
              <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask the AI to manage your tasks… (Enter to send, Shift+Enter for newline)"
                rows={1} className="chat-input" aria-label="Message input" id="chat-input"
              />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="send-btn" aria-label="Send" id="send-btn">
                {isLoading
                  ? <span className="spinner-sm white" />
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>}
              </button>
            </div>
            <p className="disclaimer">AI manages tasks via LangGraph · Todo list syncs after every response</p>
          </footer>
        </section>
      </div>
    </div>
  );
}