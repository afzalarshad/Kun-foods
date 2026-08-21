"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const typeIcons: Record<string, string> = {
  low_stock: "⚠️",
  new_order: "📦",
  new_ticket: "🎫",
  return_requested: "↩️",
  order_cancelled: "✖️",
  ticket_reply: "💬",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/notifications");
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      } catch {
        // silent -- notification bell is non-critical
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/admin/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/admin/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-lg hover:bg-cream-dark"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-chili hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && <p className="px-4 py-6 text-center text-sm text-ink-soft">No notifications yet.</p>}
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "#"}
              onClick={() => {
                if (!n.read) markRead(n.id);
                setOpen(false);
              }}
              className={`flex gap-2.5 border-b border-ink/5 px-4 py-3 text-sm last:border-0 hover:bg-cream-dark ${
                n.read ? "" : "bg-chili/5"
              }`}
            >
              <span className="shrink-0">{typeIcons[n.type] ?? "🔔"}</span>
              <div className="min-w-0">
                <p className={n.read ? "text-ink-soft" : "font-medium"}>{n.message}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {new Date(n.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
