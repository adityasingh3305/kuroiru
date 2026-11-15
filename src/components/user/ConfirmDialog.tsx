"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => cancelBtnRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = confirmVariant === "danger";

  return (
    <>
      <style>{`
        @keyframes cd-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cd-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .cd-overlay {
          animation: cd-fade-in 0.15s ease both;
        }
        .cd-card {
          animation: cd-slide-up 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className="cd-overlay fixed inset-0 z-[300] flex items-end justify-center sm:items-center"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-desc"
        onClick={(e) => {
          if (e.target === overlayRef.current) onCancel();
        }}
      >
        {/* Card */}
        <div
          className="cd-card w-full sm:max-w-[400px] rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset",
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[3px] w-full"
            style={{
              background: isDanger
                ? "linear-gradient(90deg, #ff7a6d, #ff4444)"
                : "linear-gradient(90deg, #bbdbdf, #7fd1ae)",
            }}
          />

          <div className="px-6 pt-5 pb-6">
            {/* Header */}
            <div className="mb-1">
              <p
                id="cd-title"
                className="text-[15px] font-semibold tracking-tight"
                style={{ color: "#f0f0f0" }}
              >
                {title}
              </p>
            </div>

            {/* Body */}
            <p
              id="cd-desc"
              className="text-[13px] leading-relaxed mt-1"
              style={{ color: "#888" }}
            >
              {message}
            </p>

            {/* Divider */}
            <div
              className="my-5"
              style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
            />

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                ref={cancelBtnRef}
                onClick={onCancel}
                className="flex-1 rounded-xl text-[13px] font-medium transition-all duration-150 active:scale-95"
                style={{
                  height: "40px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#aaa",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#aaa";
                }}
              >
                {cancelLabel}
              </button>

              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95"
                style={{
                  height: "40px",
                  background: isDanger
                    ? "rgba(255,80,70,0.15)"
                    : "rgba(187,219,223,0.12)",
                  border: isDanger
                    ? "1px solid rgba(255,100,90,0.35)"
                    : "1px solid rgba(187,219,223,0.25)",
                  color: isDanger ? "#ff7a6d" : "#bbdbdf",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isDanger
                    ? "rgba(255,80,70,0.25)"
                    : "rgba(187,219,223,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isDanger
                    ? "rgba(255,80,70,0.15)"
                    : "rgba(187,219,223,0.12)";
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
