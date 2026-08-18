import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...rest },
  ref,
) {
  const selectId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
          error && "border-rose-400 focus:border-rose-400 focus:ring-rose-200",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
});
