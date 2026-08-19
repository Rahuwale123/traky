import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { EyeIcon, EyeOffIcon } from "./icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, type, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const isPassword = type === "password";
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && isRevealed ? "text" : type}
          className={cn(
            "w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
            error && "border-rose-400 focus:border-rose-400 focus:ring-rose-200",
            isPassword && "pr-11",
            className,
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsRevealed((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label={isRevealed ? "Hide password" : "Show password"}
          >
            {isRevealed ? <EyeOffIcon width={17} height={17} /> : <EyeIcon width={17} height={17} />}
          </button>
        ) : null}
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
});
