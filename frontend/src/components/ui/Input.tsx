import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted",
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
