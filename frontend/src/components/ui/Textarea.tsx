import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, rows = 3, ...rest },
  ref,
) {
  const textareaId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={textareaId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
          error && "border-rose-400 focus:border-rose-400 focus:ring-rose-200",
          className,
        )}
        {...rest}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
});
