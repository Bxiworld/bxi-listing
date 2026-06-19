import { z } from 'zod';

/** Canonical GST % rates for listing product-info flows (product, voucher, hotel, media). */
export const LISTING_GST_RATE_OPTIONS = ['0', '0.25', '3', '5', '18', '40'];

/** Variant chains: when first variant is non-zero, these are the allowed rates. */
export const LISTING_NON_ZERO_GST_RATE_OPTIONS = ['0.25', '3', '5', '18', '40'];

export const LISTING_GST_RATE_NUMBERS = [0, 0.25, 3, 5, 18, 40];

export const LISTING_GST_VALIDATION_MESSAGE =
  'Select a valid GST rate (0%, 0.25%, 3%, 5%, 18%, or 40%)';

export function formatListingGstPercentLabel(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const s = String(raw).trim().replace(/%+\s*$/g, '').trim();
  return s === '' ? '' : `${s}%`;
}

export function normalizeListingGstRate(value) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim().replace(/%+\s*$/g, '');
  if (LISTING_GST_RATE_OPTIONS.includes(s)) return s;
  const n = Number(s);
  if (!Number.isNaN(n)) {
    const match = LISTING_GST_RATE_OPTIONS.find((opt) => {
      if (opt === '0.25') return Math.abs(Number(opt) - n) < 0.001;
      return Number(opt) === n;
    });
    if (match) return match;
  }
  return s;
}

export function isAllowedListingGstRate(value) {
  const normalized = normalizeListingGstRate(value);
  return LISTING_GST_RATE_OPTIONS.includes(normalized);
}

export function listingGstZodSchema() {
  return z.union([z.string(), z.number()]).refine((val) => isAllowedListingGstRate(val), {
    message: LISTING_GST_VALIDATION_MESSAGE,
  });
}

export function listingGstCoerceNumberZodSchema() {
  return z.coerce.number().refine(
    (n) =>
      LISTING_GST_RATE_OPTIONS.some((opt) => {
        if (opt === '0.25') return Math.abs(n - 0.25) < 0.001;
        return n === Number(opt);
      }),
    { message: LISTING_GST_VALIDATION_MESSAGE }
  );
}
