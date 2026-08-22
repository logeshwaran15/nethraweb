import { apiGet } from "./api";

export type DeliveryZoneRule = {
  zoneName: string;
  pincodePrefix: string;
  deliveryFee: number;
  freeShippingAbove: number;
  estimatedDays: string;
  active: boolean;
};

type DeliveryZoneRow = {
  ZoneName: string;
  PincodePrefix: string;
  DeliveryFee: string | number;
  FreeShippingAbove: string | number;
  EstimatedDays: string;
  IsActive: string | number;
};

type PaymentSettingsRow = {
  FreeShippingAbove: string | number;
  FlatShippingFee: string | number;
};

export async function fetchDeliveryZones(): Promise<DeliveryZoneRule[]> {
  const rows = await apiGet<DeliveryZoneRow[]>("/api/delivery_zones.php");
  return rows
    .filter((r) => Number(r.IsActive) === 1)
    .map((r) => ({
      zoneName: r.ZoneName,
      pincodePrefix: r.PincodePrefix,
      deliveryFee: Number(r.DeliveryFee),
      freeShippingAbove: Number(r.FreeShippingAbove),
      estimatedDays: r.EstimatedDays,
      active: true,
    }));
}

export async function fetchDefaultShipping(): Promise<{ freeAbove: number; flatFee: number }> {
  const row = await apiGet<PaymentSettingsRow>("/api/payment_settings.php");
  return { freeAbove: Number(row.FreeShippingAbove), flatFee: Number(row.FlatShippingFee) };
}

/** Picks the zone whose PincodePrefix is the longest match for the given pincode. */
export function matchZone(zones: DeliveryZoneRule[], pincode: string): DeliveryZoneRule | null {
  const clean = pincode.trim();
  if (!clean) return null;
  const matches = zones.filter((z) => clean.startsWith(z.pincodePrefix));
  if (matches.length === 0) return null;
  return matches.reduce((best, z) =>
    z.pincodePrefix.length > best.pincodePrefix.length ? z : best,
  );
}

export type DeliveryQuote = {
  zoneName: string | null;
  standardFee: number;
  expressFee: number;
  estimatedDays: string;
};

const EXPRESS_SURCHARGE = 99;
const EXPRESS_DAYS = "1-2 days";

export function calcDeliveryQuote(
  zones: DeliveryZoneRule[],
  pincode: string,
  subtotal: number,
  fallback: { freeAbove: number; flatFee: number },
): DeliveryQuote {
  const zone = matchZone(zones, pincode);

  if (zone) {
    const freeEligible = zone.freeShippingAbove > 0 && subtotal >= zone.freeShippingAbove;
    const standardFee = freeEligible ? 0 : zone.deliveryFee;
    return {
      zoneName: zone.zoneName,
      standardFee,
      expressFee: zone.deliveryFee + EXPRESS_SURCHARGE,
      estimatedDays: zone.estimatedDays,
    };
  }

  const freeEligible = fallback.freeAbove > 0 && subtotal >= fallback.freeAbove;
  return {
    zoneName: null,
    standardFee: freeEligible ? 0 : fallback.flatFee,
    expressFee: fallback.flatFee + EXPRESS_SURCHARGE,
    estimatedDays: "3-5 days",
  };
}

export { EXPRESS_SURCHARGE, EXPRESS_DAYS };
