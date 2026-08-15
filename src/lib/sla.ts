import { getSettings, SLA_SETTING_KEYS } from "@/lib/settings";

export type SlaPriority = "urgent" | "high" | "normal" | "low";
export type SlaState = "on_track" | "at_risk" | "breached" | "met";

const HOUR_MS = 60 * 60 * 1000;

export type SlaThresholds = {
  ticketResponseHours: Record<SlaPriority, number>;
  ticketResolutionHours: Record<SlaPriority, number>;
  orderFulfillmentHours: Record<SlaPriority, number>;
};

function readHours(settings: Record<string, string>, keys: Record<SlaPriority, string>): Record<SlaPriority, number> {
  return {
    urgent: Number(settings[keys.urgent]) || 0,
    high: Number(settings[keys.high]) || 0,
    normal: Number(settings[keys.normal]) || 0,
    low: Number(settings[keys.low]) || 0,
  };
}

export async function getSlaThresholds(): Promise<SlaThresholds> {
  const settings = await getSettings();
  return {
    ticketResponseHours: readHours(settings, SLA_SETTING_KEYS.ticketResponseHours),
    ticketResolutionHours: readHours(settings, SLA_SETTING_KEYS.ticketResolutionHours),
    orderFulfillmentHours: readHours(settings, SLA_SETTING_KEYS.orderFulfillmentHours),
  };
}

/** Deadline = start + threshold hours. State is "at_risk" inside the last 20% of the window. */
function deadlineState(startedAt: Date, thresholdHours: number, completedAt: Date | null, now: Date): { dueAt: Date; state: SlaState } {
  const dueAt = new Date(startedAt.getTime() + thresholdHours * HOUR_MS);
  if (completedAt) {
    return { dueAt, state: completedAt <= dueAt ? "met" : "breached" };
  }
  if (now > dueAt) return { dueAt, state: "breached" };
  const atRiskFrom = new Date(dueAt.getTime() - thresholdHours * HOUR_MS * 0.2);
  return { dueAt, state: now >= atRiskFrom ? "at_risk" : "on_track" };
}

export type TicketSlaSummary = {
  responseDueAt: Date;
  responseState: SlaState;
  resolutionDueAt: Date;
  resolutionState: SlaState;
};

export function ticketSlaSummary(
  ticket: {
    createdAt: Date;
    priority: string;
    status: string;
    firstResponseAt: Date | null;
    resolvedAt: Date | null;
  },
  thresholds: SlaThresholds,
  now: Date = new Date()
): TicketSlaSummary {
  const priority = (ticket.priority as SlaPriority) in thresholds.ticketResponseHours ? (ticket.priority as SlaPriority) : "normal";
  const response = deadlineState(ticket.createdAt, thresholds.ticketResponseHours[priority], ticket.firstResponseAt, now);
  const resolution = deadlineState(ticket.createdAt, thresholds.ticketResolutionHours[priority], ticket.resolvedAt, now);
  return {
    responseDueAt: response.dueAt,
    responseState: response.state,
    resolutionDueAt: resolution.dueAt,
    resolutionState: resolution.state,
  };
}

export type OrderSlaSummary = {
  fulfillmentDueAt: Date;
  fulfillmentState: SlaState;
};

const FULFILLED_STATUSES = new Set(["shipped", "delivered", "cancelled"]);

export function orderSlaSummary(
  order: { createdAt: Date; priority: string; status: string; shippedAt?: Date | null },
  thresholds: SlaThresholds,
  now: Date = new Date()
): OrderSlaSummary {
  const priority = (order.priority as SlaPriority) in thresholds.orderFulfillmentHours ? (order.priority as SlaPriority) : "normal";
  const completedAt = order.status === "cancelled" ? order.createdAt : (order.shippedAt ?? (FULFILLED_STATUSES.has(order.status) ? now : null));
  const fulfillment = deadlineState(order.createdAt, thresholds.orderFulfillmentHours[priority], completedAt, now);
  return { fulfillmentDueAt: fulfillment.dueAt, fulfillmentState: fulfillment.state };
}

/** Human-readable "2h 15m overdue" / "3h left" style label, for badges. */
export function formatDueLabel(dueAt: Date, state: SlaState, now: Date = new Date()): string {
  if (state === "met") return "Met SLA";
  const diffMs = state === "breached" ? now.getTime() - dueAt.getTime() : dueAt.getTime() - now.getTime();
  const hours = Math.floor(diffMs / HOUR_MS);
  const minutes = Math.floor((diffMs % HOUR_MS) / (60 * 1000));
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return state === "breached" ? `${label} overdue` : `${label} left`;
}

export const SLA_STATE_STYLES: Record<SlaState, string> = {
  on_track: "bg-basil/20 text-basil-dark",
  at_risk: "bg-saffron/20 text-saffron-dark",
  breached: "bg-chili/20 text-chili-dark",
  met: "bg-cream-dark text-ink-soft",
};

/** "3h 20m" / "2d 4h" style label for average-duration KPIs. */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.round(ms / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export const SLA_STATE_LABELS: Record<SlaState, string> = {
  on_track: "On track",
  at_risk: "At risk",
  breached: "Breached",
  met: "Met",
};
