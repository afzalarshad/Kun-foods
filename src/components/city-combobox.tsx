"use client";

import { useId, useMemo, useRef, useState } from "react";
import { PAKISTAN_CITIES, type PakistanCity, type PakistanProvince } from "@/lib/pakistan-locations";

const MAX_SUGGESTIONS = 50;

function rankMatches(query: string, pool: PakistanCity[]): PakistanCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool.slice(0, MAX_SUGGESTIONS);
  const starts: PakistanCity[] = [];
  const contains: PakistanCity[] = [];
  for (const city of pool) {
    const name = city.name.toLowerCase();
    if (name.startsWith(q)) starts.push(city);
    else if (name.includes(q)) contains.push(city);
    if (starts.length + contains.length >= MAX_SUGGESTIONS * 3) break;
  }
  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
}

/**
 * Type-to-filter city picker over the full ~3,300-place Pakistan Post reference list — a plain
 * `<select>` with that many options is unusable. The committed value can only ever be an exact,
 * known city name (never arbitrary typed text): selecting a suggestion is the only way to change
 * `value`, so callers get the same "always valid or empty" guarantee a native select gave them.
 *
 * While closed, the input just displays `value` directly (no separate state to keep in sync);
 * `query` only exists as the live typing buffer while the suggestion list is open.
 */
export function CityCombobox({
  value,
  onSelect,
  onClear,
  province,
  placeholder = "Type to search your city…",
  invalid = false,
  inputClassName,
}: {
  value: string;
  onSelect: (city: PakistanCity) => void;
  /** If set, clearing the input to empty and leaving it commits to "" instead of reverting to
   *  the last valid value — for optional-city fields (e.g. POS walk-in/pickup). */
  onClear?: () => void;
  /** Restrict suggestions to one province (e.g. once a separate province field is chosen). */
  province?: PakistanProvince;
  placeholder?: string;
  invalid?: boolean;
  /** Overrides the default input styling entirely (base border/rounding/padding stay if omitted). */
  inputClassName?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const pool = useMemo(
    () => (province ? PAKISTAN_CITIES.filter((c) => c.province === province) : PAKISTAN_CITIES),
    [province]
  );
  const suggestions = useMemo(() => (open ? rankMatches(query, pool) : []), [open, query, pool]);
  const displayValue = open ? query : value;

  function openAt(current: string) {
    setQuery(current);
    setOpen(true);
    setActiveIndex(0);
  }

  function settle() {
    // Called when the field loses focus (click-away, blur, or Escape) without a suggestion being
    // picked. An empty box commits to "" if the caller allows clearing (e.g. POS walk-in);
    // otherwise the committed value must always stay either empty or a real known city, so we
    // just close and fall back to displaying the last valid `value` — never stray typed text.
    if (query.trim() === "" && onClear) onClear();
    setOpen(false);
  }

  function commit(city: PakistanCity) {
    onSelect(city);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (suggestions[activeIndex]) {
        e.preventDefault();
        commit(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      settle();
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) settle();
      }}
    >
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listId}
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => openAt(value)}
        onChange={(e) => openAt(e.target.value)}
        onKeyDown={handleKeyDown}
        className={
          inputClassName ??
          `w-full rounded-2xl border bg-white px-4 py-3 focus:outline-none ${
            invalid ? "border-chili" : "border-ink/20 focus:border-chili"
          }`
        }
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-ink/10 bg-white py-1 shadow-lg"
        >
          {suggestions.map((city, i) => (
            <li key={city.name} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(city)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                  i === activeIndex ? "bg-cream-dark" : "hover:bg-cream-dark/60"
                }`}
              >
                <span>{city.name}</span>
                <span className="text-xs text-ink-soft">{province ? city.postalCode : city.province}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim().length > 0 && suggestions.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink-soft shadow-lg">
          No matching city found.
        </div>
      )}
    </div>
  );
}
