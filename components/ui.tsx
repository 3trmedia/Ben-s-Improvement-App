"use client";

import { useRef, useState, type ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-5 pt-7 pb-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-1.5 font-display text-[1.7rem] font-medium leading-tight text-ink">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-[13.5px] text-ink-soft">{subtitle}</p>
      )}
    </header>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-5 pb-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  accent = "accent",
  className = "",
}: {
  children: ReactNode;
  accent?: "accent" | "warm" | "none";
  className?: string;
}) {
  const border =
    accent === "accent"
      ? "border-l-[3px] border-l-accent"
      : accent === "warm"
        ? "border-l-[3px] border-l-warm"
        : "";
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-4 ${border} ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warm" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-bg text-ink-soft",
    accent: "bg-accent-soft text-accent",
    warm: "bg-warm-soft text-warm",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-bg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            value === opt.value
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-soft"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        checked
          ? "border-accent bg-accent text-surface"
          : "border-line bg-surface"
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6.2L4.6 8.8L10 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function ProgressBar({
  current,
  target,
  label,
  tone = "accent",
}: {
  current: number;
  target: number;
  label: string;
  tone?: "accent" | "warm";
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const barTone = tone === "accent" ? "bg-accent" : "bg-warm";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
        <span className="text-ink-soft">{label}</span>
        <span className="font-mono tabular-nums text-ink-soft">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full ${barTone} transition-[width]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Ring({
  value,
  target,
  label,
  unit,
  tone,
}: {
  value: number;
  target: number;
  label: string;
  unit: string;
  tone: "accent" | "danger" | "info";
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} stroke="var(--line)" strokeWidth="8" fill="none" />
          <circle
            cx="48"
            cy="48"
            r={r}
            stroke={`var(--${tone})`}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[15px] font-semibold tabular-nums">{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[12.5px] font-medium">{label}</p>
        <p className="font-mono text-[11px] tabular-nums text-ink-soft">
          {value}/{target}
          {unit}
        </p>
      </div>
    </div>
  );
}

export function QuickAdjust({
  label,
  value,
  unit,
  onIncrement,
  onDecrement,
  tone = "accent",
}: {
  label: string;
  value: number;
  unit: string;
  onIncrement: () => void;
  onDecrement: () => void;
  tone?: "accent" | "danger" | "info";
}) {
  const btnTone = tone === "accent" ? "bg-accent" : tone === "danger" ? "bg-danger" : "bg-info";
  return (
    <Card accent="none" className="flex items-center justify-between">
      <div>
        <p className="font-mono text-[18px] font-semibold tabular-nums">
          {value} {unit}
        </p>
        <p className="text-[12px] text-ink-soft">{label}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDecrement}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-[16px] text-ink-soft"
        >
          –
        </button>
        <button
          onClick={onIncrement}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-[16px] font-medium text-surface ${btnTone}`}
        >
          +
        </button>
      </div>
    </Card>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-6"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl border border-line bg-surface p-5"
      >
        <p className="text-[15px] font-medium">{title}</p>
        {message && <p className="mt-1.5 text-[13px] text-ink-soft">{message}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-line py-2 text-[13px] text-ink-soft"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-danger py-2 text-[13px] font-medium text-surface"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const LONG_PRESS_MS = 500;

// Wraps a Card with: a small gray "x" (top-right) that confirms then deletes
// just this item; and a long-press that enters multi-select mode for the
// whole list, after which a plain tap toggles this item's selection instead
// of its normal action (the caller is responsible for neutralizing the
// card's own interactive elements — e.g. a Checkbox's onChange — while
// selectMode is active, so a tap doesn't fire both).
export function SelectableCard({
  children,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
  onDelete,
  deleteTitle = "Delete this?",
  accent = "none",
  className = "",
}: {
  children: ReactNode;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  deleteTitle?: string;
  accent?: "accent" | "warm" | "none";
  className?: string;
}) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const startPress = () => {
    pressTimer.current = setTimeout(onLongPress, LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div
      className="relative"
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onClick={() => {
        if (selectMode) onToggleSelect();
      }}
    >
      <Card accent={accent} className={className}>
        {children}
      </Card>
      {selectMode ? (
        <span
          className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
            selected ? "border-accent bg-accent text-surface" : "border-line bg-surface text-transparent"
          }`}
        >
          ✓
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          aria-label="Delete"
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-ink-soft"
        >
          ✕
        </button>
      )}
      <ConfirmModal
        open={confirmOpen}
        title={deleteTitle}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
      />
    </div>
  );
}

export function SelectionBar({
  count,
  onDelete,
  onCancel,
}: {
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed right-3 top-14 z-50 flex items-center gap-2.5 rounded-full border border-line bg-surface/95 px-3 py-2 backdrop-blur">
      <span className="font-mono text-[11px] tabular-nums text-ink-soft">{count}</span>
      <button onClick={onDelete} aria-label="Delete selected" className="text-danger">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button onClick={onCancel} className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
        Cancel
      </button>
    </div>
  );
}

export function useToggleSet(initial: string[] = []) {
  const [set, setSet] = useState(new Set(initial));
  const toggle = (id: string) =>
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return { set, toggle };
}
