import { useState } from "react";
import { useSupabaseCollection } from "./lib/useSupabaseCollection";

const CATEGORIES = [
  { id: "prologue", label: "PROLG", emoji: "🏢", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  { id: "study", label: "学習", emoji: "📚", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { id: "newco", label: "NEWCO", emoji: "🚀", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { id: "personal", label: "私生活", emoji: "🏠", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { id: "rezalt", label: "Re:zalt", emoji: "💼", color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
];

const STATUS_CONFIG = {
  todo: { label: "未着手", icon: "○", color: "#6B7280" },
  doing: { label: "進行中", icon: "◉", color: "#F59E0B" },
  done: { label: "完了", icon: "●", color: "#10B981" },
};

const PRIORITY_CONFIG = {
  high: { label: "高", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  mid: { label: "中", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  low: { label: "低", color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().split("T")[0];

/* ─── Compact Modal ─── */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)", animation: "fadeIn .2s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1A1D23", borderRadius: 16, padding: "28px 32px",
          width: "min(480px, 92vw)", maxHeight: "85vh", overflowY: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#F3F4F6", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Input helpers ─── */
const inputStyle = {
  width: "100%", padding: "10px 14px", background: "#12141A",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  color: "#E5E7EB", fontSize: 14, outline: "none", fontFamily: "'Noto Sans JP','Outfit',sans-serif",
  boxSizing: "border-box",
};
const labelStyle = { display: "block", fontSize: 12, color: "#9CA3AF", marginBottom: 6, fontWeight: 500 };
const fieldGap = { marginBottom: 16 };

const SegmentPicker = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 4, background: "#12141A", borderRadius: 10, padding: 3 }}>
    {options.map((o) => (
      <button key={o.value} onClick={() => onChange(o.value)}
        style={{
          flex: 1, padding: "7px 0", border: "none", borderRadius: 8, cursor: "pointer",
          fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans JP',sans-serif",
          background: value === o.value ? (o.activeBg || "rgba(255,255,255,0.1)") : "transparent",
          color: value === o.value ? (o.activeColor || "#F3F4F6") : "#6B7280",
          transition: "all .15s",
        }}
      >{o.label}</button>
    ))}
  </div>
);

/* ─── Task Card ─── */
const TaskCard = ({ task, onUpdate, onDelete }) => {
  const cat = CATEGORIES.find((c) => c.id === task.category) || CATEGORIES[0];
  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.mid;
  const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  const cycleStatus = () => {
    const order = ["todo", "doing", "done"];
    const next = order[(order.indexOf(task.status) + 1) % 3];
    onUpdate({ ...task, status: next });
  };

  return (
    <div style={{
      background: "#1A1D23", borderRadius: 14, padding: "16px 18px",
      border: `1px solid rgba(255,255,255,0.06)`,
      borderLeft: `3px solid ${cat.color}`,
      transition: "transform .15s, box-shadow .15s",
      cursor: "default", position: "relative",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button onClick={cycleStatus} title="ステータス切替"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: st.color, padding: 0, lineHeight: 1 }}>
              {st.icon}
            </button>
            <span style={{
              fontSize: 14, fontWeight: 500, color: task.status === "done" ? "#6B7280" : "#E5E7EB",
              textDecoration: task.status === "done" ? "line-through" : "none",
              fontFamily: "'Noto Sans JP','Outfit',sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{task.title}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: cat.bg, color: cat.color, fontWeight: 600 }}>
              {cat.emoji} {cat.label}
            </span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: pri.bg, color: pri.color, fontWeight: 600 }}>
              {pri.label}
            </span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{st.label}</span>
          </div>
          {task.notes && (
            <p style={{ fontSize: 12, color: "#6B7280", margin: "8px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{task.notes}</p>
          )}
          {task.type === "longterm" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>
                <span>進捗</span><span>{task.progress || 0}%</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${task.progress || 0}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}cc)`, borderRadius: 4, transition: "width .3s" }} />
              </div>
              <input type="range" min={0} max={100} value={task.progress || 0}
                onChange={(e) => onUpdate({ ...task, progress: +e.target.value })}
                style={{ width: "100%", marginTop: 4, accentColor: cat.color, height: 4, cursor: "pointer" }} />
            </div>
          )}
        </div>
        <button onClick={() => onDelete(task.id)}
          style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 6, flexShrink: 0 }}
          title="削除">🗑</button>
      </div>
    </div>
  );
};

/* ─── Idea Card ─── */
const IdeaCard = ({ idea, onDelete }) => {
  const cats = (idea.categories || (idea.category ? [idea.category] : []))
    .map((id) => CATEGORIES.find((c) => c.id === id)).filter(Boolean);
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.06))",
      borderRadius: 12, padding: "14px 16px",
      border: "1px solid rgba(245,158,11,0.12)",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#E5E7EB", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Noto Sans JP',sans-serif" }}>
            💡 {idea.text}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            {cats.map((cat) => (
              <span key={cat.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: cat.bg, color: cat.color, fontWeight: 600 }}>{cat.emoji} {cat.label}</span>
            ))}
            <span style={{ fontSize: 10, color: "#6B7280" }}>{new Date(idea.created_at).toLocaleDateString("ja-JP")}</span>
          </div>
        </div>
        <button onClick={() => onDelete(idea.id)}
          style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}>✕</button>
      </div>
    </div>
  );
};

/* ═══════════════════════ MAIN APP ═══════════════════════ */
export default function TaskFlow() {
  const {
    items: tasks,
    loaded: tasksLoaded,
    add: addTask,
    update: patchTask,
    remove: deleteTaskRow,
  } = useSupabaseCollection("tasks");
  const {
    items: ideas,
    loaded: ideasLoaded,
    add: addIdea,
    remove: deleteIdeaRow,
  } = useSupabaseCollection("ideas");
  const [view, setView] = useState("daily"); // daily | longterm | ideas
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showIdea, setShowIdea] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: "task"|"idea", id }

  // form state
  const [form, setForm] = useState({ title: "", category: "prologue", priority: "mid", type: "daily", status: "todo", notes: "", progress: 0 });
  const [ideaText, setIdeaText] = useState("");
  const [ideaCat, setIdeaCat] = useState([]);

  const loaded = tasksLoaded && ideasLoaded;

  const resetForm = () => setForm({ title: "", category: "prologue", priority: "mid", type: view === "ideas" ? "daily" : view, status: "todo", notes: "", progress: 0 });

  const openAdd = () => { resetForm(); setForm((f) => ({ ...f, type: view === "ideas" ? "daily" : view })); setEditTask(null); setShowAdd(true); };
  const openEdit = (t) => { setForm({ ...t }); setEditTask(t); setShowAdd(true); };

  const saveTask = async () => {
    if (!form.title.trim()) return;
    if (editTask) {
      await patchTask({ ...editTask, ...form, id: editTask.id });
    } else {
      await addTask({ ...form, id: uid(), created_at: new Date().toISOString() });
    }
    setShowAdd(false);
  };

  const deleteTask = (id) => setDeleteConfirm({ type: "task", id });
  const updateTask = async (t) => { await patchTask(t); };

  const saveIdea = async () => {
    if (!ideaText.trim()) return;
    await addIdea({
      id: uid(),
      text: ideaText.trim(),
      categories: ideaCat.length > 0 ? [...ideaCat] : [],
      created_at: new Date().toISOString(),
    });
    setIdeaText("");
    setIdeaCat([]);
    setShowIdea(false);
  };
  const deleteIdea = (id) => setDeleteConfirm({ type: "idea", id });

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "task") {
      await deleteTaskRow(deleteConfirm.id);
    } else {
      await deleteIdeaRow(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  // filtered
  const filteredTasks = tasks.filter((t) => {
    if (t.type !== (view === "ideas" ? null : view)) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    return true;
  });

  const filteredIdeas = ideas.filter((i) => {
    if (catFilter === "all") return true;
    const cats = i.categories || (i.category ? [i.category] : []);
    return cats.includes(catFilter);
  });

  // stats
  const todayTasks = tasks.filter((t) => t.type === "daily");
  const todayDone = todayTasks.filter((t) => t.status === "done").length;
  const longtermTasks = tasks.filter((t) => t.type === "longterm");
  const avgProgress = longtermTasks.length ? Math.round(longtermTasks.reduce((s, t) => s + (t.progress || 0), 0) / longtermTasks.length) : 0;

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6B7280", fontSize: 16, fontFamily: "'Outfit',sans-serif" }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0F1117", color: "#E5E7EB",
      fontFamily: "'Noto Sans JP','Outfit',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform: scale(.97) } to { opacity:1; transform: scale(1) } }
        @keyframes slideUp { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform: translateY(0) } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #F3F4F6; cursor: pointer; margin-top: -5px; }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{
        padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "linear-gradient(180deg, rgba(15,17,23,1) 0%, rgba(15,17,23,0.95) 100%)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 28, fontFamily: "'Outfit',sans-serif", fontWeight: 700,
                background: "linear-gradient(135deg, #F3F4F6, #9CA3AF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}>
                TaskFlow
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>
                {today()} ・ Today {todayDone}/{todayTasks.length} done ・ Projects avg {avgProgress}%
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowIdea(true)} title="アイデア追加"
                style={{
                  width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(245,158,11,0.3)",
                  background: "rgba(245,158,11,0.08)", color: "#F59E0B", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>💡</button>
              <button onClick={openAdd}
                style={{
                  height: 40, padding: "0 20px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> タスク追加
              </button>
            </div>
          </div>

          {/* ─── View Tabs ─── */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {[
              { id: "daily", label: "📋 今日やること", count: todayTasks.length },
              { id: "longterm", label: "🎯 長期プロジェクト", count: longtermTasks.length },
              { id: "ideas", label: "💡 アイデア", count: ideas.length },
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setView(tab.id); setCatFilter("all"); }}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, fontFamily: "'Noto Sans JP','Outfit',sans-serif",
                  background: view === tab.id ? "rgba(255,255,255,0.1)" : "transparent",
                  color: view === tab.id ? "#F3F4F6" : "#6B7280",
                  transition: "all .15s",
                }}>
                {tab.label} <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* ─── Category Filter ─── */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
            <button onClick={() => setCatFilter("all")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                background: catFilter === "all" ? "rgba(255,255,255,0.1)" : "transparent",
                color: catFilter === "all" ? "#F3F4F6" : "#6B7280",
              }}>すべて</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCatFilter(c.id)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  background: catFilter === c.id ? c.bg : "transparent",
                  color: catFilter === c.id ? c.color : "#6B7280",
                }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px 120px" }}>
        {view !== "ideas" ? (
          <>
            {/* Status columns */}
            {["doing", "todo", "done"].map((status) => {
              const statusTasks = filteredTasks.filter((t) => t.status === status);
              if (statusTasks.length === 0 && status === "done" && filteredTasks.length === 0) return null;
              const sc = STATUS_CONFIG[status];
              return (
                <div key={status} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ color: sc.color, fontSize: 14 }}>{sc.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>{sc.label}</span>
                    <span style={{ fontSize: 11, color: "#4B5563", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 6 }}>{statusTasks.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {statusTasks.map((t, i) => (
                      <div key={t.id} style={{ animation: `slideUp .3s ${i * 0.04}s both` }}
                        onDoubleClick={() => openEdit(t)}>
                        <TaskCard task={t} onUpdate={updateTask} onDelete={deleteTask} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#4B5563" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{view === "daily" ? "📋" : "🎯"}</div>
                <p style={{ fontSize: 14 }}>まだタスクがないのじゃ♡</p>
                <button onClick={openAdd}
                  style={{
                    marginTop: 12, padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}>+ 追加する</button>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredIdeas.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredIdeas.map((idea, i) => (
                  <div key={idea.id} style={{ animation: `slideUp .3s ${i * 0.04}s both` }}>
                    <IdeaCard idea={idea} onDelete={deleteIdea} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#4B5563" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
                <p style={{ fontSize: 14 }}>ひらめきを待っておるのじゃ♡</p>
                <button onClick={() => setShowIdea(true)}
                  style={{
                    marginTop: 12, padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)",
                    background: "transparent", color: "#F59E0B", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}>+ アイデアを追加</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Add/Edit Task Modal ─── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editTask ? "タスクを編集" : "タスクを追加"}>
        <div style={fieldGap}>
          <label style={labelStyle}>タイトル</label>
          <input style={inputStyle} placeholder="やることを入力..."
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus />
        </div>
        <div style={fieldGap}>
          <label style={labelStyle}>タイプ</label>
          <SegmentPicker value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={[
              { value: "daily", label: "📋 今日やること" },
              { value: "longterm", label: "🎯 長期プロジェクト" },
            ]} />
        </div>
        <div style={fieldGap}>
          <label style={labelStyle}>カテゴリ</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setForm({ ...form, category: c.id })}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: form.category === c.id ? c.bg : "rgba(255,255,255,0.03)",
                  color: form.category === c.id ? c.color : "#6B7280",
                  border: form.category === c.id ? `1px solid ${c.color}33` : "1px solid transparent",
                }}>{c.emoji} {c.label}</button>
            ))}
          </div>
        </div>
        <div style={fieldGap}>
          <label style={labelStyle}>優先度</label>
          <SegmentPicker value={form.priority}
            onChange={(v) => setForm({ ...form, priority: v })}
            options={[
              { value: "high", label: "🔴 高", activeBg: PRIORITY_CONFIG.high.bg, activeColor: PRIORITY_CONFIG.high.color },
              { value: "mid", label: "🟡 中", activeBg: PRIORITY_CONFIG.mid.bg, activeColor: PRIORITY_CONFIG.mid.color },
              { value: "low", label: "⚪ 低", activeBg: PRIORITY_CONFIG.low.bg, activeColor: PRIORITY_CONFIG.low.color },
            ]} />
        </div>
        <div style={fieldGap}>
          <label style={labelStyle}>ステータス</label>
          <SegmentPicker value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              { value: "todo", label: "○ 未着手", activeBg: "rgba(107,114,128,0.15)", activeColor: "#9CA3AF" },
              { value: "doing", label: "◉ 進行中", activeBg: "rgba(245,158,11,0.15)", activeColor: "#F59E0B" },
              { value: "done", label: "● 完了", activeBg: "rgba(16,185,129,0.15)", activeColor: "#10B981" },
            ]} />
        </div>
        <div style={fieldGap}>
          <label style={labelStyle}>メモ（任意）</label>
          <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
            placeholder="詳細やメモ..."
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        {form.type === "longterm" && (
          <div style={fieldGap}>
            <label style={labelStyle}>進捗 {form.progress}%</label>
            <input type="range" min={0} max={100} value={form.progress}
              onChange={(e) => setForm({ ...form, progress: +e.target.value })}
              style={{ width: "100%", accentColor: "#3B82F6" }} />
          </div>
        )}
        <button onClick={saveTask}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
            marginTop: 4,
          }}>
          {editTask ? "保存する" : "追加する"}
        </button>
      </Modal>

      {/* ─── Idea Modal ─── */}
      <Modal open={showIdea} onClose={() => setShowIdea(false)} title="💡 アイデアをキャプチャ">
        <div style={fieldGap}>
          <label style={labelStyle}>ひらめき</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            placeholder="思いついたことを自由に書く..."
            value={ideaText} onChange={(e) => setIdeaText(e.target.value)}
            autoFocus />
        </div>
        <div style={fieldGap}>
          <label style={labelStyle}>カテゴリ（複数選択可）</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button onClick={() => setIdeaCat([])}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: ideaCat.length === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                color: ideaCat.length === 0 ? "#F3F4F6" : "#6B7280",
              }}>なし</button>
            {CATEGORIES.map((c) => {
              const selected = ideaCat.includes(c.id);
              return (
                <button key={c.id} onClick={() => setIdeaCat((prev) => selected ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                  style={{
                    padding: "7px 14px", borderRadius: 8, border: selected ? `1px solid ${c.color}44` : "1px solid transparent", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    background: selected ? c.bg : "rgba(255,255,255,0.03)",
                    color: selected ? c.color : "#6B7280",
                  }}>{c.emoji} {c.label}</button>
              );
            })}
          </div>
        </div>
        <button onClick={saveIdea}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #F59E0B, #EC4899)", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
            marginTop: 4,
          }}>
          記録する
        </button>
      </Modal>

      {/* ─── Delete Confirm Modal ─── */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="削除の確認">
        <p style={{ fontSize: 14, color: "#D1D5DB", margin: "0 0 20px", lineHeight: 1.6 }}>
          本当に削除しますか？この操作は取り消せません。
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleteConfirm(null)}
            style={{
              flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "#9CA3AF", fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans JP',sans-serif",
            }}>キャンセル</button>
          <button onClick={confirmDelete}
            style={{
              flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans JP',sans-serif",
            }}>削除する</button>
          </div>
      </Modal>
    </div>
  );
}
