"use client";

import { useEffect, useState } from "react";

function dday(due) {
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  if (diff < 0) return "마감 지남";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/tasks");
    if (!res.ok)
      throw new Error("과제 목록을 불러오지 못했어요 (DB 연결 확인)");
    setTasks(await res.json());
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks")
      .then(async (res) => {
        if (!res.ok)
          throw new Error("과제 목록을 불러오지 못했어요 (DB 연결 확인)");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message || e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const aiRes = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const ai = await aiRes.json();
      if (!aiRes.ok) throw new Error(ai.error || "AI 분석 실패");

      const saveRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ai),
      });
      if (!saveRes.ok) throw new Error("저장 실패 (DB 연결 확인)");

      setText("");
      await load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function toggleSub(id, index, done) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, done }),
    });
    load().catch((e) => setError(String(e.message || e)));
  }

  async function removeTask(id) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load().catch((e) => setError(String(e.message || e)));
  }

  return (
    <main className="wrap">
      <h1>AI 과제 매니저</h1>
      <p className="sub">과제 공지를 붙여넣으면 일정이 자동으로 만들어져요</p>

      <section className="card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예) 네트워크 보안 분석 보고서 10쪽, 11/30(일) 23:59까지 e-class 제출. 팀 과제 아님."
          rows={5}
        />
        <button onClick={handleAdd} disabled={loading}>
          {loading ? "AI 분석 중..." : "AI로 일정 등록"}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        {tasks.length === 0 && <p className="sub">등록된 과제가 없어요</p>}
        {tasks.map((t) => {
          const doneCount = t.subtasks.filter((s) => s.done).length;
          const pct = t.subtasks.length
            ? Math.round((doneCount / t.subtasks.length) * 100)
            : 0;
          return (
            <div className="card" key={t._id}>
              <div className="row">
                <div>
                  <h2>{t.title}</h2>
                  <p className="sub">
                    {t.type} · 마감 {t.dueDate?.replace("T", " ")}
                    {t.submitMethod ? ` · ${t.submitMethod}` : ""}
                  </p>
                </div>
                <span className="badge">{dday(t.dueDate)}</span>
              </div>

              <div className="bar">
                <div className="fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="sub">진행률 {pct}%</p>

              <ul>
                {t.subtasks.map((s, i) => (
                  <li key={i}>
                    <label>
                      <input
                        type="checkbox"
                        checked={s.done}
                        onChange={(e) => toggleSub(t._id, i, e.target.checked)}
                      />
                      <span className={s.done ? "done" : ""}>
                        {s.dueDate} · {s.title}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <button className="ghost" onClick={() => removeTask(t._id)}>
                삭제
              </button>
            </div>
          );
        })}
      </section>
    </main>
  );
}
