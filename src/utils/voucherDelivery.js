/** Product field `voucherDeliveryType` — how the voucher is delivered / fulfilled (not the same label as redemption URL vs store, though they are aligned on save). */

export const VOUCHER_DELIVERY_TYPE = {
  DIGITAL: 'digital',
  PHYSICAL: 'physical',
  BOTH: 'both',
};

export function deliveryToRedemptionType(delivery) {
  const d = String(delivery || '').trim().toLowerCase();
  if (d === VOUCHER_DELIVERY_TYPE.DIGITAL) return 'online';
  if (d === VOUCHER_DELIVERY_TYPE.PHYSICAL) return 'offline';
  if (d === VOUCHER_DELIVERY_TYPE.BOTH) return 'both';
  return 'online';
}

/** Map legacy redemption-only products to delivery radios. */
export function redemptionTypeToDeliveryType(redemption) {
  const r = String(redemption || '').trim().toLowerCase();
  if (r === 'offline') return VOUCHER_DELIVERY_TYPE.PHYSICAL;
  if (r === 'both') return VOUCHER_DELIVERY_TYPE.BOTH;
  return VOUCHER_DELIVERY_TYPE.DIGITAL;
}

export function normalizeVoucherDeliveryTypeFromProduct(p) {
  if (!p) return VOUCHER_DELIVERY_TYPE.DIGITAL;
  const raw = p.voucherDeliveryType ?? p.VoucherDeliveryType ?? '';
  const d = String(raw).trim().toLowerCase();
  if (d === VOUCHER_DELIVERY_TYPE.DIGITAL) return VOUCHER_DELIVERY_TYPE.DIGITAL;
  if (d === VOUCHER_DELIVERY_TYPE.PHYSICAL) return VOUCHER_DELIVERY_TYPE.PHYSICAL;
  if (d === VOUCHER_DELIVERY_TYPE.BOTH) return VOUCHER_DELIVERY_TYPE.BOTH;
  return redemptionTypeToDeliveryType(
    p.redemptionType ?? p.RedemptionType ?? 'online'
  );
}
