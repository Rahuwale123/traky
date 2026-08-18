import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface SearchableSelectOption {
  id: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableSelectOption[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  error?: string;
  emptyMessage?: string;
}

/**
 * A text-filterable dropdown that only ever resolves to one of `options` —
 * unlike a <datalist>, typing a value with no match simply selects nothing.
 * Used for pick-only catalogs (e.g. designations) where free text isn't allowed.
 */
export function SearchableSelect({
  label,
  placeholder = "Search…",
  options,
  value,
  onChange,
  error,
  emptyMessage = "No matches",
}: SearchableSelectProps) {
  const selected = options.find((o) => o.id === value);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.label ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SearchableSelectOption[]>();
    for (const opt of filtered) {
      const key = opt.group ?? "";
      groups.set(key, [...(groups.get(key) ?? []), opt]);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const commit = (option: SearchableSelectOption | null) => {
    onChange(option?.id);
    setQuery(option?.label ?? "");
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label ? <label className="text-sm font-medium text-ink-soft">{label}</label> : null}
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onBlur={() => {
            // Delay so a click on an option (onMouseDown) registers first.
            setTimeout(() => {
              const stillMatches = options.find((o) => o.id === value)?.label === query;
              if (!stillMatches) commit(null);
              setIsOpen(false);
            }, 120);
          }}
          className={cn(
            "w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
            error && "border-rose-400 focus:border-rose-400 focus:ring-rose-200",
          )}
        />
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();
              commit(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label="Clear"
          >
            ✕
          </button>
        ) : null}

        {isOpen ? (
          <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-2xl border border-black/10 bg-white py-1.5 shadow-panel">
            {grouped.length === 0 ? (
              <p className="px-4 py-2.5 text-sm text-muted">{emptyMessage}</p>
            ) : (
              grouped.map(([group, opts]) => (
                <div key={group || "_"}>
                  {group ? (
                    <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {group}
                    </p>
                  ) : null}
                  {opts.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(opt);
                      }}
                      className={cn(
                        "block w-full px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-black/[0.04]",
                        opt.id === value && "bg-accent/10 font-medium text-accent",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
