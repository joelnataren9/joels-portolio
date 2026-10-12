"use client";

import { useLayoutEffect, useRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

export const inputClass =
  "w-full min-w-0 rounded-md border border-[#e3d8c6] bg-white px-2.5 py-1.5 text-sm text-trip-ink placeholder:text-stone-400 focus:border-trip-teal focus:outline-none focus:ring-1 focus:ring-trip-teal";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 text-xs font-medium text-stone-500 ${className}`}>
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${className}`} />;
}

/** Textarea that grows with its content. */
export function TextArea({ className = "", value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={1} value={value} {...props} className={`${inputClass} resize-none ${className}`} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${className}`} />;
}

export function IconButton({
  label,
  onClick,
  disabled,
  children,
  danger = false,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`rounded p-1.5 text-stone-400 transition hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-30 ${
        danger ? "hover:text-red-600" : "hover:text-stone-800"
      }`}
    >
      {children}
    </button>
  );
}

/** Up / down / delete controls for a row in a list. Missing handlers render disabled. */
export function RowActions({
  what,
  onUp,
  onDown,
  onDelete,
}: {
  what: string;
  onUp?: () => void;
  onDown?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <IconButton label={`Move ${what} up`} onClick={onUp}>
        <ArrowUp className="h-4 w-4" />
      </IconButton>
      <IconButton label={`Move ${what} down`} onClick={onDown}>
        <ArrowDown className="h-4 w-4" />
      </IconButton>
      <IconButton label={`Delete ${what}`} onClick={onDelete} danger>
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:border-trip-teal hover:text-trip-teal"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

/** Collapsible group for secondary fields (photos, links, ...). */
export function Group({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <details className="group rounded-md border border-[#ece2d2] bg-[#fdfaf5]">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-stone-600">
        {title}
        {count !== undefined && <span className="ml-1 font-normal text-stone-400">({count})</span>}
      </summary>
      <div className="space-y-2 border-t border-[#ece2d2] p-3">{children}</div>
    </details>
  );
}

/** "" -> null for optional text fields. */
export function orNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export const MARKDOWN_HINT = "Markdown works: **bold**, [link text](https://…)";
