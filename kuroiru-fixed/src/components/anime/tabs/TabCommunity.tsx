"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { timeAgo } from "@/lib/format";

interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

const MAX_COMMENTS = 100;

const commentsKey = (animeId: number) => `kuroiru-comments-${animeId}`;

function isValidComment(c: unknown): c is Comment {
  if (!c || typeof c !== "object") return false;
  const obj = c as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.author === "string" &&
    typeof obj.body === "string" &&
    typeof obj.createdAt === "number" &&
    Number.isFinite(obj.createdAt)
  );
}

function readComments(animeId: number): Comment[] {
  try {
    const raw = localStorage.getItem(commentsKey(animeId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidComment) : [];
  } catch {
    return [];
  }
}

function writeComments(animeId: number, list: Comment[]) {
  try {
    localStorage.setItem(commentsKey(animeId), JSON.stringify(list.slice(0, MAX_COMMENTS)));
    return true;
  } catch {
    return false;
  }
}

/** Comments are stored in this browser's localStorage (no server database). */
export default function TabCommunity({ animeId }: { animeId: number }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setAuthor(localStorage.getItem("kuroiru-name") ?? "");
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    setComments(readComments(animeId));
  }, [mounted, animeId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim().slice(0, 1000);
    if (!text) return;
    const name = author.trim().slice(0, 40) || "Anonymous";
    const comment: Comment = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      author: name,
      body: text,
      createdAt: Date.now(),
    };
    const next = [comment, ...readComments(animeId)];
    if (!writeComments(animeId, next)) {
      setError("Couldn't save your comment. Browser storage may be full.");
      return;
    }
    try {
      localStorage.setItem("kuroiru-name", author.trim().slice(0, 40));
    } catch {
      /* ignore */
    }
    setError(null);
    setComments(next.slice(0, MAX_COMMENTS));
    setBody("");
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-2 rounded-lg border border-line bg-panel p-3">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={40}
          placeholder="Display name (optional)"
          aria-label="Display name"
          className="h-9 w-full rounded-md border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none sm:w-60"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Share your thoughts (no spoilers!)…"
          aria-label="Comment"
          className="w-full resize-y rounded-md border border-line bg-bg p-3 text-sm focus:border-accent focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-dim">{body.length}/1000</span>
          <button
            disabled={!body.trim()}
            className="btn btn-shine group flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition active:scale-95 disabled:opacity-40"
          >
            <Send size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /> Post
          </button>
        </div>
        {error && <p className="anim-shake text-xs text-dropped">{error}</p>}
      </form>

      {comments === null ? (
        <div className="space-y-2">
          <div className="skeleton h-16 rounded-lg" />
          <div className="skeleton h-16 rounded-lg" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-muted">
          <MessageSquare className="mx-auto mb-2 text-dim" />
          No comments yet — start the discussion.
        </div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-line bg-panel p-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-accent">{c.author}</span>
                <span className="text-dim">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-line break-words text-sm text-soft">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
