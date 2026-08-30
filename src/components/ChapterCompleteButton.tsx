"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ChapterCompleteButtonProps {
  courseId: string;
  chapterId: string;
  initialCompleted: boolean;
}

/**
 * 章節「標示完成 / 已完成」切換按鈕。
 * 採樂觀更新：點擊立即切換外觀，POST 失敗則回復原狀並提示。
 */
export default function ChapterCompleteButton({
  courseId,
  chapterId,
  initialCompleted,
}: ChapterCompleteButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (loading) return;
    const next = !completed;
    // 樂觀更新：先切換 UI
    setCompleted(next);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, chapterId, completed: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "更新失敗");
      }
    } catch (e) {
      // 失敗回復原狀並提示
      setCompleted(!next);
      setError(e instanceof Error ? e.message : "更新失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={completed}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-60 ${
          completed
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
            : "bg-slate-800 text-gray-200 border border-slate-700 hover:bg-slate-700"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : completed ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
        {completed ? "已完成" : "標示完成"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
