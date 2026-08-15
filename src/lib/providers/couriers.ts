/**
 * Courier provider adapters. Each courier Kun Foods can book with implements the same
 * interface, so swapping in a real API integration later is a matter of filling in one
 * adapter's `createBooking` — no changes needed to the calling code in shipment-actions.ts.
 *
 * None of the couriers below have API credentials configured yet (`configured` is false
 * for all of them), so `createBooking` always throws and staff fall back to entering a
 * tracking number by hand — exactly today's behavior. The adapters exist now so that
 * dropping in real credentials later is additive, not a rewrite.
 */

export type CourierId = "leopards" | "tcs" | "postex" | "manual";

export type CourierBookingRequest = {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  codAmount: number | null; // paisa
  weightGrams: number | null;
};

export type CourierBookingResult = {
  trackingNumber: string;
  labelUrl?: string;
};

export interface CourierAdapter {
  readonly id: CourierId;
  readonly label: string;
  /** True once the required env vars for this courier's API are present. */
  readonly configured: boolean;
  /** Books a shipment with the courier's API. Throws if not configured or the API call fails. */
  createBooking(request: CourierBookingRequest): Promise<CourierBookingResult>;
  /** Public tracking page URL for a tracking number, or null if the courier has none. */
  trackingUrl(trackingNumber: string): string | null;
}

abstract class UnconfiguredCourierAdapter implements CourierAdapter {
  abstract readonly id: CourierId;
  abstract readonly label: string;
  abstract readonly configured: boolean;

  async createBooking(): Promise<CourierBookingResult> {
    throw new Error(
      `${this.label} API credentials aren't configured. Enter the tracking number manually after booking through their portal.`
    );
  }

  trackingUrl(trackingNumber: string): string | null {
    void trackingNumber; // no public tracking page for this courier yet
    return null;
  }
}

class LeopardsAdapter extends UnconfiguredCourierAdapter {
  readonly id = "leopards" as const;
  readonly label = "Leopards Courier";
  readonly configured = Boolean(process.env.LEOPARDS_API_KEY);

  trackingUrl(trackingNumber: string): string {
    return `https://leopardscourier.com/tracking?track_number=${encodeURIComponent(trackingNumber)}`;
  }
}

class TcsAdapter extends UnconfiguredCourierAdapter {
  readonly id = "tcs" as const;
  readonly label = "TCS";
  readonly configured = Boolean(process.env.TCS_API_KEY);

  trackingUrl(trackingNumber: string): string {
    return `https://www.tcsexpress.com/track/${encodeURIComponent(trackingNumber)}`;
  }
}

class PostExAdapter extends UnconfiguredCourierAdapter {
  readonly id = "postex" as const;
  readonly label = "PostEx";
  readonly configured = Boolean(process.env.POSTEX_API_KEY);

  trackingUrl(trackingNumber: string): string {
    return `https://postex.pk/tracking?cn=${encodeURIComponent(trackingNumber)}`;
  }
}

class ManualAdapter extends UnconfiguredCourierAdapter {
  readonly id = "manual" as const;
  readonly label = "Manual / own rider";
  readonly configured = false;
}

const ADAPTERS: Record<CourierId, CourierAdapter> = {
  leopards: new LeopardsAdapter(),
  tcs: new TcsAdapter(),
  postex: new PostExAdapter(),
  manual: new ManualAdapter(),
};

export const COURIERS = Object.values(ADAPTERS);

export const COURIER_LABELS: Record<CourierId, string> = Object.fromEntries(
  COURIERS.map((c) => [c.id, c.label])
) as Record<CourierId, string>;

export function getCourierAdapter(courierId: string): CourierAdapter {
  return ADAPTERS[courierId as CourierId] ?? ADAPTERS.manual;
}
